import type { SupabaseClient } from "@supabase/supabase-js";
import { PLANS, type PlanId } from "@/lib/constants";
import { GENDER_FOR_PAYMENT } from "@/lib/funnel/storage";
import type { Answers } from "@/lib/funnel/types";

export type WebPlan = "ANNUAL" | "MONTHLY";
export type CheckoutStep = "name" | "email" | "phone" | "summary";

export const toWebPlan = (plan: PlanId): WebPlan => (plan === "annual" ? "ANNUAL" : "MONTHLY");

/** Signed out: everything. Signed in: the phone is the account; the name only when the profile lacks a full one. */
export function checkoutSteps(signedIn: boolean, hasFullName: boolean): CheckoutStep[] {
  if (!signedIn) return ["name", "email", "phone", "summary"];
  return hasFullName ? ["email", "summary"] : ["name", "email", "summary"];
}

/** Mirrors the edge function (D6): two words once only letters, digits and spaces remain. */
export function isFullName(value: string): boolean {
  const safe = value
    .normalize("NFC")
    .replace(/\p{M}/gu, "")
    .replace(/['"`׳״]/g, "")
    .replace(/[^\p{L}\p{N} ]+/gu, " ");
  return safe.split(/\s+/).filter((word) => /\p{L}/u.test(word)).length >= 2;
}

const EMAIL_MAX = 254;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const isEmail = (value: string): boolean => value.trim().length <= EMAIL_MAX && EMAIL_RE.test(value.trim());

const GROW_HOST_RE = /^(?:[a-z0-9-]+\.)*meshulam\.co\.il$/;

/** The page we send the buyer to must be Grow's, over https (checked again here, after the server). */
export function isGrowHostedUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && GROW_HOST_RE.test(url.hostname);
  } catch {
    return false;
  }
}

export type StartInput = { plan: WebPlan; installments: number; fullName: string; email: string; tokenConsent: boolean };
export type StartError =
  | "already_subscribed" | "invalid_input" | "signed_out" | "rate_limited" | "not_configured" | "processor_error" | "network";
export type StartResult = { url: string; webPaymentId: string } | { error: StartError };

const STATUS_ERROR: Record<number, StartError> = {
  400: "invalid_input",
  401: "signed_out",
  409: "already_subscribed",
  429: "rate_limited",
  // internal_error: the function failed after reaching it, so it is not the buyer's connection.
  500: "processor_error",
  502: "processor_error",
  503: "not_configured",
};

type ErrorContext = { status?: unknown; json?: () => Promise<unknown> };

/** The field a 400 names ({ code: "invalid_input", field }), or null when the body is unreadable. */
async function invalidField(context: ErrorContext | undefined): Promise<unknown> {
  try {
    const body = await context?.json?.();
    return body && typeof body === "object" ? (body as { field?: unknown }).field ?? null : null;
  } catch {
    return null;
  }
}

async function errorFor(error: unknown): Promise<StartError> {
  const context = (error as { context?: ErrorContext }).context;
  const status = context?.status;
  if (typeof status !== "number") return "network";
  // The phone comes from the session (the JWT), not the form: re-verifying it is the only fix.
  if (status === 400 && (await invalidField(context)) === "phone") return "signed_out";
  return STATUS_ERROR[status] ?? "network";
}

export async function startPayment(supabase: Pick<SupabaseClient, "functions">, input: StartInput): Promise<StartResult> {
  try {
    const { data, error } = await supabase.functions.invoke("createGrowPayment", { body: input });
    if (error) return { error: await errorFor(error) };
    const { url, webPaymentId } = (data ?? {}) as { url?: unknown; webPaymentId?: unknown };
    if (typeof url !== "string" || !isGrowHostedUrl(url) || typeof webPaymentId !== "string") return { error: "processor_error" };
    return { url, webPaymentId };
  } catch {
    return { error: "network" };
  }
}

type WaitOptions = {
  intervalMs?: number;
  timeoutMs?: number;
  sleep?: (ms: number) => Promise<void>;
  now?: () => number;
  stopped?: () => boolean;
};

const POLL_MS = 2_000;
const POLL_WINDOW_MS = 30_000;

/** Polls until access is granted or the window closes. The webhook, not this page, activates the subscription. */
export async function waitForAccess(check: () => Promise<boolean>, options: WaitOptions = {}): Promise<"active" | "timeout"> {
  const {
    intervalMs = POLL_MS,
    timeoutMs = POLL_WINDOW_MS,
    sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)),
    now = () => Date.now(),
    stopped = () => false,
  } = options;
  const deadline = now() + timeoutMs;
  for (;;) {
    if (stopped()) return "timeout";
    if (await check().catch(() => false)) return "active";
    if (now() + intervalMs > deadline) return "timeout";
    await sleep(intervalMs);
  }
}

type Store = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function browserSession(): Store | undefined {
  try {
    return typeof window === "undefined" ? undefined : window.sessionStorage;
  } catch {
    return undefined;
  }
}

function safeRead(storage: Store | undefined, key: string): string | null {
  try {
    return storage?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

function safeWrite(storage: Store | undefined, key: string, value: string | null): void {
  try {
    if (value === null) storage?.removeItem(key);
    else storage?.setItem(key, value);
  } catch {
    // Blocked storage: the checkout keeps working in memory.
  }
}

export function readPaymentGender(storage: Store | undefined = browserSession()): Answers["gender"] {
  const value = safeRead(storage, GENDER_FOR_PAYMENT);
  return value === "female" || value === "male" ? value : undefined;
}

const DRAFT_KEY = "ap.checkout.draft";
const MAX_INSTALLMENTS = Math.max(...PLANS.map((p) => p.maxInstallments));
const EMAIL_KEY = "ap.checkout.email";

export type CheckoutDraft = { plan: PlanId; name: string; email: string; installments: number };

export function saveCheckoutDraft(draft: CheckoutDraft, storage: Store | undefined = browserSession()): void {
  safeWrite(storage, DRAFT_KEY, JSON.stringify(draft));
}

export function readCheckoutDraft(storage: Store | undefined = browserSession()): CheckoutDraft | null {
  try {
    const parsed: unknown = JSON.parse(safeRead(storage, DRAFT_KEY) ?? "null");
    if (!parsed || typeof parsed !== "object") return null;
    const d = parsed as Record<string, unknown>;
    if (d.plan !== "annual" && d.plan !== "monthly") return null;
    if (typeof d.name !== "string" || typeof d.email !== "string") return null;
    const installments = d.installments;
    if (typeof installments !== "number" || !Number.isInteger(installments) || installments < 1 || installments > MAX_INSTALLMENTS) return null;
    return { plan: d.plan, name: d.name, email: d.email, installments };
  } catch {
    return null;
  }
}

/**
 * The draft to reopen the checkout with. An explicit ?plan= link wins: a
 * draft for another plan is not resumed (the caller discards it). Without a
 * plan in the link (Otp's remount, Grow's cancel URL) the draft resumes.
 */
export function resumableDraft(draft: CheckoutDraft | null, linkPlan: PlanId | undefined): CheckoutDraft | null {
  return draft && (!linkPlan || draft.plan === linkPlan) ? draft : null;
}

export function clearCheckoutDraft(storage: Store | undefined = browserSession()): void {
  safeWrite(storage, DRAFT_KEY, null);
}

export function rememberCheckoutEmail(email: string, storage: Store | undefined = browserSession()): void {
  safeWrite(storage, EMAIL_KEY, email);
}

export function readCheckoutEmail(storage: Store | undefined = browserSession()): string | null {
  return safeRead(storage, EMAIL_KEY);
}

/** The success page reads the address once, then removes it: nothing personal stays in the tab. */
export function clearCheckoutEmail(storage: Store | undefined = browserSession()): void {
  safeWrite(storage, EMAIL_KEY, null);
}

type Listenable = Pick<EventTarget, "addEventListener" | "removeEventListener">;

/**
 * Back from Grow, the browser may restore this page from its back/forward
 * cache with the old state (a disabled "redirecting" button). Calls back on
 * that restore only; returns the unsubscribe.
 */
export function onRestoredFromCache(callback: () => void, target: Listenable = window): () => void {
  const listener = (event: Event) => {
    if ((event as PageTransitionEvent).persisted) callback();
  };
  target.addEventListener("pageshow", listener);
  return () => target.removeEventListener("pageshow", listener);
}
