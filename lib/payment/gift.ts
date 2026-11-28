import type { SupabaseClient } from "@supabase/supabase-js";
import { publicSupabaseEnv } from "@/lib/supabase/env";

/**
 * The 7-day gift (owner, 2026-11-25): while the office has it on, the page after the
 * questionnaire offers 7 free days in the app instead of the plans. No price, no card.
 * The server is the switch (app_config gift_trial_enabled, read through gift_trial_enabled()),
 * so turning it off brings the plans back on the next page load, with no deploy.
 */
export const GIFT_DAYS = 7;

export const GIFT_COPY = {
  /** Owner, 2026-11-25: only "מתנה", never "חינם", and no price or payment anywhere. */
  headingLead: "יש לך",
  headingLeadPlain: "מחכים לך",
  headingGift: "7 ימים מתנה",
  lede: "בלי כרטיס אשראי ובלי התחייבות",
  highlights: ["אימון מותאם לך", "משחקי זיכרון", "אתגרים", "10 דקות ביום"],
  cta: "לקבלת 7 ימים מתנה",
  underCta: "הכפתור מוריד את האפליקציה ומתחילים להתאמן",
  claiming: "רגע, מכינים לך את המתנה",
  /** Over the phone and code steps when the sign-in expired; the gift follows by itself. */
  verifyLead: "רגע לפני המתנה: מאמתים את מספר הטלפון",
  claimed: {
    title: "המתנה שלך",
    titleGift: "מחכה באפליקציה",
    lede: "פותחים את האפליקציה ונכנסים ישר לאימון הראשון. בלי טלפון ובלי קוד.",
    open: "פתיחת האפליקציה",
    download: "להורדת האפליקציה",
  },
  errors: {
    signed_out: "צריך לאמת שוב את מספר הטלפון.",
    not_offered: "המתנה לא זמינה כרגע.",
    network: "אין חיבור כרגע. אפשר לנסות שוב.",
  },
} as const;

export type GiftError = keyof typeof GIFT_COPY.errors;

/** Server only: is the gift on now? Off on any failure, so the plans always remain the fallback. */
export async function loadGiftTrialEnabled(fetcher: typeof fetch = fetch): Promise<boolean> {
  try {
    const { url, anonKey } = publicSupabaseEnv();
    const res = await fetcher(`${url}/rest/v1/rpc/gift_trial_enabled`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: anonKey, Authorization: `Bearer ${anonKey}` },
      body: "{}",
      cache: "no-store",
      signal: AbortSignal.timeout(2500),
    });
    if (!res.ok) return false;
    return (await res.json()) === true;
  } catch {
    return false;
  }
}

/**
 * Claims the gift for the signed-in visitor (claim_gift_trial, user from the JWT). The server
 * refuses when the switch is off, and gives one gift per person ever: a second claim answers ok
 * with the same gift, so a reload or a double tap is harmless.
 */
export async function claimGiftTrial(supabase: SupabaseClient): Promise<{ ok: true } | { ok: false; error: GiftError }> {
  try {
    const session = (await supabase.auth.getSession()).data.session;
    if (!session) return { ok: false, error: "signed_out" };
    const { data, error } = await supabase.rpc("claim_gift_trial");
    if (error) return { ok: false, error: "network" };
    const result = data as { ok?: unknown; reason?: unknown } | null;
    if (result?.ok === true) return { ok: true };
    return { ok: false, error: result?.reason === "signed_out" ? "signed_out" : "not_offered" };
  } catch {
    return { ok: false, error: "network" };
  }
}

/**
 * The one tap (owner, 2026-11-25: the gift is tapped once, never twice): claim the 7 days, make
 * the one-time code that opens the app signed in, and go to the download. The page is first
 * replaced by the gift page in history, so coming back to the site (an iPhone after the App
 * Store) lands on its "פתיחת האפליקציה" screen. Returns the error when it could not go on.
 */
export async function claimGiftAndDownload(): Promise<GiftError | null> {
  const [{ loadSupabaseSession }, { createAppSignin, downloadHref }] = await Promise.all([
    import("@/lib/supabase/lazy"),
    import("@/lib/payment/app-signin"),
  ]);
  const supabase = await loadSupabaseSession();
  if (!supabase) return "signed_out";
  const result = await claimGiftTrial(supabase);
  if (!result.ok) return result.error;
  const signin = await createAppSignin(supabase).catch(() => null);
  try {
    window.history.replaceState(null, "", "/payment");
  } catch {
    // The download still goes.
  }
  window.location.assign(downloadHref(signin?.code ?? null));
  return null;
}
