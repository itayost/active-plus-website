import type { SupabaseClient } from "@supabase/supabase-js";

type Invoker = Pick<SupabaseClient, "functions">;

export type SubscriptionInfo = {
  planType: string;
  expiresAt: string;
  autoRenew: boolean;
  platform: string | null;
  /** A renewing web monthly's next charge day (YYYY-MM-DD, from checkUserSubscription's webMonthly); null otherwise. */
  nextChargeAt: string | null;
};
export type ManageAction = "cancel" | "cancelled" | "annual" | "apple" | "google" | "manual";
export type CancelResult = "cancelled" | "already_cancelled" | "not_found" | "not_cancelable" | "error";

export const APPLE_MANAGE_URL = "https://apps.apple.com/account/subscriptions";
export const GOOGLE_MANAGE_URL = "https://play.google.com/store/account/subscriptions";

/** What the subscription page offers: a web cancel only for a renewing monthly bought on the site. */
export function manageAction(sub: SubscriptionInfo): ManageAction {
  if (sub.platform === "apple") return "apple";
  if (sub.platform === "google") return "google";
  if (sub.platform !== "grow") return "manual";
  if (sub.planType !== "MONTHLY") return "annual";
  return sub.autoRenew ? "cancel" : "cancelled";
}

export type ChargeLine = { text: "nextCharge" | "activeUntil" | "cancelled"; date: string };

/**
 * The line under the plan: a renewing web monthly shows its next charge day;
 * a cancelled one says so with the day access ends; everything else, and a
 * renewing monthly without a readable charge day, shows how long access lasts.
 */
export function chargeLine(sub: SubscriptionInfo): ChargeLine {
  const action = manageAction(sub);
  if (action === "cancelled") return { text: "cancelled", date: sub.expiresAt };
  if (action === "cancel" && sub.nextChargeAt) return { text: "nextCharge", date: sub.nextChargeAt };
  return { text: "activeUntil", date: sub.expiresAt };
}

/** checkUserSubscription's webMonthly: the user's renewing web monthly, whatever row `subscription` shows. */
function readWebMonthly(value: unknown): SubscriptionInfo | null {
  if (!value || typeof value !== "object") return null;
  const w = value as Record<string, unknown>;
  if (w.renewing !== true || typeof w.expiresAt !== "string") return null;
  return {
    planType: "MONTHLY",
    expiresAt: w.expiresAt,
    autoRenew: true,
    platform: "grow",
    nextChargeAt: typeof w.nextChargeAt === "string" ? w.nextChargeAt : null,
  };
}

/**
 * The signed-in user's subscription (checkUserSubscription reads the user
 * from the session). A renewing web monthly comes first: it is the one thing
 * the page can act on, even behind a longer manual or store row, or after
 * access lapsed while Grow still retries the charge.
 */
export async function loadSubscription(supabase: Invoker): Promise<SubscriptionInfo | null | "error"> {
  try {
    const { data, error } = await supabase.functions.invoke("checkUserSubscription", { body: {} });
    if (error) return "error";
    const body = data as { hasAccess?: boolean; subscription?: Record<string, unknown>; webMonthly?: unknown } | null;
    const webMonthly = readWebMonthly(body?.webMonthly);
    if (webMonthly) return webMonthly;
    const s = body?.subscription;
    if (!body?.hasAccess || !s || typeof s.planType !== "string" || typeof s.expiresAt !== "string") return null;
    return {
      planType: s.planType,
      expiresAt: s.expiresAt,
      autoRenew: s.autoRenew === true,
      platform: typeof s.platform === "string" ? s.platform : null,
      nextChargeAt: null,
    };
  } catch {
    return "error";
  }
}

export async function cancelWebSubscription(supabase: Invoker): Promise<CancelResult> {
  try {
    const { data, error } = await supabase.functions.invoke("cancelGrowSubscription", { body: {} });
    if (error) {
      const status = (error as { context?: { status?: unknown } }).context?.status;
      return status === 404 ? "not_found" : status === 409 ? "not_cancelable" : "error";
    }
    const status = (data as { status?: unknown } | null)?.status;
    return status === "cancelled" || status === "already_cancelled" ? status : "error";
  } catch {
    return "error";
  }
}

const dateFormatter = new Intl.DateTimeFormat("he-IL", { timeZone: "Asia/Jerusalem", day: "numeric", month: "long", year: "numeric" });

/** A date as an Israeli reads it: a UTC timestamp, or a YYYY-MM-DD day (read at midnight UTC, which is that same day in Israel). */
export const formatIsraelDate = (iso: string): string => dateFormatter.format(new Date(iso));
