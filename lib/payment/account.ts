import type { SupabaseClient } from "@supabase/supabase-js";

type Invoker = Pick<SupabaseClient, "functions">;

export type SubscriptionInfo = { planType: string; expiresAt: string; autoRenew: boolean; platform: string | null };
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

/** The signed-in user's active subscription (checkUserSubscription reads the user from the session). */
export async function loadSubscription(supabase: Invoker): Promise<SubscriptionInfo | null | "error"> {
  try {
    const { data, error } = await supabase.functions.invoke("checkUserSubscription", { body: {} });
    if (error) return "error";
    const body = data as { hasAccess?: boolean; subscription?: Record<string, unknown> } | null;
    const s = body?.subscription;
    if (!body?.hasAccess || !s || typeof s.planType !== "string" || typeof s.expiresAt !== "string") return null;
    return {
      planType: s.planType,
      expiresAt: s.expiresAt,
      autoRenew: s.autoRenew === true,
      platform: typeof s.platform === "string" ? s.platform : null,
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

/** The day access ends, as an Israeli reads it (the server stores UTC). */
export const formatIsraelDate = (iso: string): string => dateFormatter.format(new Date(iso));
