import { SESSION_TTL_DAYS } from "./constants";
import { FUNNEL_STEPS } from "./contract.generated";
import type { Answers, Step } from "./types";

const ID = "ap.funnel.session_id";
const ANSWERS = "ap.funnel.answers";
export const STAMP = "ap.funnel.updated_at";
export const STEP = "ap.funnel.step";
export const TTL = SESSION_TTL_DAYS * 86_400_000;

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    // Private mode or blocked storage: behave as if nothing is stored.
    return null;
  }
}

function safeSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Private mode or blocked storage: the funnel keeps working in memory.
  }
}

export function resetSession(): void {
  for (const key of [ID, ANSWERS, STAMP, STEP]) {
    try {
      localStorage.removeItem(key);
    } catch {
      // Private mode or blocked storage: there is nothing persisted to clear.
    }
  }
}

function parseAnswers(raw: string | null): Answers {
  try {
    const parsed: unknown = JSON.parse(raw ?? "{}");
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Answers) : {};
  } catch {
    return {};
  }
}

/** Clears the stored session once it is older than the TTL. */
function expireIfStale(now: number): void {
  const stamp = Number(safeGet(STAMP) ?? 0);
  if (stamp && now - stamp > TTL) resetSession();
}

const VERSION_BYTE = 6;
const VARIANT_BYTE = 8;

/** An RFC 4122 version 4 id from 16 random bytes: version nibble 4, variant bits 10. */
function uuidFromRandomBytes(): string {
  const random = crypto.getRandomValues(new Uint8Array(16));
  const bytes = Array.from(random, (b, i) =>
    i === VERSION_BYTE ? (b & 0x0f) | 0x40 : i === VARIANT_BYTE ? (b & 0x3f) | 0x80 : b,
  );
  const hex = bytes.map((b) => b.toString(16).padStart(2, "0")).join("");
  return [hex.slice(0, 8), hex.slice(8, 12), hex.slice(12, 16), hex.slice(16, 20), hex.slice(20)].join("-");
}

/** crypto.randomUUID is missing before Safari 15.4 (older iPads); getRandomValues is not. */
function newSessionId(): string {
  return typeof crypto.randomUUID === "function" ? crypto.randomUUID().toLowerCase() : uuidFromRandomBytes();
}

export function loadSession(now = Date.now()): { id: string; answers: Answers } {
  expireIfStale(now);
  let id = safeGet(ID);
  if (!id) {
    id = newSessionId();
    safeSet(ID, id);
    safeSet(STAMP, String(now));
  }
  return { id, answers: parseAnswers(safeGet(ANSWERS)) };
}

export function saveAnswers(answers: Answers): void {
  safeSet(ANSWERS, JSON.stringify(answers));
  safeSet(STAMP, String(Date.now()));
}

/** The loader is a transition, not a place: a visitor who left during it resumes on the next step. */
const RESTORE_AS: Partial<Record<Step, Step>> = { planBuilding: "time" };

const isStep = (value: string | null): value is Step =>
  value !== null && (FUNNEL_STEPS as readonly string[]).includes(value);

export function saveStep(step: Step): void {
  safeSet(STEP, step);
  safeSet(STAMP, String(Date.now()));
}

export function loadStep(now = Date.now()): Step | null {
  expireIfStale(now);
  const raw = safeGet(STEP);
  if (!isStep(raw)) return null;
  return RESTORE_AS[raw] ?? raw;
}

/** sessionStorage key the payment page reads for its gendered wording. */
export const GENDER_FOR_PAYMENT = "ap.funnel.gender";

/** sessionStorage key: the funnel session the payment page reports its view under. */
export const SESSION_FOR_PAYMENT = "ap.funnel.payment_session";

function setForPayment(key: string, value: string | undefined): void {
  if (!value) return;
  try {
    sessionStorage.setItem(key, value);
  } catch {
    // Blocked storage: the payment page falls back (neutral wording, its own analytics id).
  }
}

/**
 * After a successful merge: the answers now live on the profile, so the local
 * session is cleared, but the gender is kept for the payment page (the app's
 * paywall lost it to exactly this reset), and so is the session id, so the
 * page's payment_view joins the walk that led to it. Both stay in this tab only.
 */
export function handOffToPayment(gender: Answers["gender"], sessionId?: string, answers?: Answers): void {
  setForPayment(GENDER_FOR_PAYMENT, gender);
  setForPayment(SESSION_FOR_PAYMENT, sessionId);
  if (answers) setForPayment(PLAN_FOR_PAYMENT, JSON.stringify(planInputsOf(answers)));
  resetSession();
  savePendingPayment({
    at: Date.now(),
    gender: gender ?? null,
    session: sessionId ?? null,
    plan: answers ? JSON.stringify(planInputsOf(answers)) : null,
  });
}

/**
 * localStorage key: someone who reached the payment page and left goes back to it on their next
 * visit, wherever they come in (owner, 2026-11-21), with what the payment page needs. Cleared
 * once they pay. Kept as long as a questionnaire session (SESSION_TTL_DAYS).
 */
export const PENDING_PAYMENT = "ap.funnel.pending_payment";

export type PendingPayment = { at: number; gender: string | null; session: string | null; plan: string | null };

function savePendingPayment(pending: PendingPayment): void {
  safeSet(PENDING_PAYMENT, JSON.stringify(pending));
}

/** Pure: a stored value that is still in time, or null. */
export function parsePendingPayment(raw: string | null, now = Date.now()): PendingPayment | null {
  try {
    const p = JSON.parse(raw ?? "null") as Partial<PendingPayment> | null;
    if (!p || typeof p.at !== "number" || now - p.at > TTL || p.at > now + 60_000) return null;
    const str = (v: unknown) => (typeof v === "string" && v ? v : null);
    return { at: p.at, gender: str(p.gender), session: str(p.session), plan: str(p.plan) };
  } catch {
    return null;
  }
}

/**
 * The visitor left the payment page earlier: put back what that page reads in this tab and say
 * so, so the caller sends them there. False when there is nothing pending.
 */
export function restorePendingPayment(now = Date.now()): boolean {
  const pending = parsePendingPayment(safeGet(PENDING_PAYMENT), now);
  if (!pending) return false;
  setForPayment(GENDER_FOR_PAYMENT, pending.gender ?? undefined);
  setForPayment(SESSION_FOR_PAYMENT, pending.session ?? undefined);
  setForPayment(PLAN_FOR_PAYMENT, pending.plan ?? undefined);
  return true;
}

/** Paid: nothing to come back to. */
export function clearPendingPayment(): void {
  try {
    localStorage.removeItem(PENDING_PAYMENT);
  } catch {
    // Blocked storage: nothing was stored.
  }
}

/**
 * sessionStorage key: the few answers the 28-day plan page (/my-plan) is drawn from,
 * kept in this tab after the reset. Its presence also tells /payment that the visitor
 * came from the questionnaire, so its X leads to the taster.
 */
export const PLAN_FOR_PAYMENT = "ap.funnel.plan";

export type PlanInputs = {
  goal?: string;
  feeling?: string;
  frequency?: string;
  memory?: string;
  /** functionality_level: picks the payment page's workout picture (owner, 2026-11-21). */
  level?: string;
  firstName?: string;
};

export function planInputsOf(answers: Answers): PlanInputs {
  const firstName = answers.full_name?.trim().split(/\s+/)[0];
  return {
    goal: answers.training_goals?.[0],
    feeling: answers.desired_feeling,
    frequency: answers.training_frequency_choice,
    memory: answers.memory_forgetfulness,
    level: answers.functionality_level,
    ...(firstName ? { firstName } : {}),
  };
}

/** The plan answers handed over in this tab; null when there are none (not from the questionnaire). */
export function readPlanInputs(): PlanInputs | null {
  try {
    const raw = sessionStorage.getItem(PLAN_FOR_PAYMENT);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    if (typeof parsed !== "object" || parsed === null) return null;
    const pick = (k: string) => {
      const v = (parsed as Record<string, unknown>)[k];
      return typeof v === "string" && v ? v : undefined;
    };
    return { goal: pick("goal"), feeling: pick("feeling"), frequency: pick("frequency"), memory: pick("memory"), level: pick("level"), firstName: pick("firstName") };
  } catch {
    return null;
  }
}

const SESSION_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The questionnaire session handed over to /payment in this tab, or null. Never creates one. */
export function handedOverSessionId(): string | null {
  try {
    const handedOver = sessionStorage.getItem(SESSION_FOR_PAYMENT);
    return handedOver && SESSION_ID.test(handedOver) ? handedOver.toLowerCase() : null;
  } catch {
    return null;
  }
}

/**
 * The id /payment reports payment_view under, read without storing anything:
 * the session handed over in this tab, else a questionnaire session still in
 * progress (a visitor who opened /payment from a link mid-walk), else a fresh
 * id that is never saved. The page must not leave a funnel session behind:
 * handOffToPayment has just cleared it.
 */
export function paymentSessionId(now = Date.now()): string {
  const handedOver = handedOverSessionId();
  if (handedOver) return handedOver;
  expireIfStale(now);
  const inProgress = safeGet(ID);
  if (inProgress && SESSION_ID.test(inProgress)) return inProgress.toLowerCase();
  return newSessionId();
}
