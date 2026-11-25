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
  headingNamed: "{name}, יש לך 7 ימים מתנה",
  headingPlain: "7 ימים מתנה מחכים לך",
  lede: "מורידים את האפליקציה ומתחילים את האימון הראשון, עוד היום. בלי כרטיס אשראי.",
  badge: "מתנה",
  amount: "7 ימים",
  suffix: "חינם",
  terms: "כל האימונים, האתגרים ומשחקי הזיכרון פתוחים לך.",
  noCard: "בלי כרטיס אשראי ובלי התחייבות",
  cta: "לקבלת 7 ימים מתנה",
  claiming: "רגע, מכינים לך את המתנה",
  includesTitle: "מה מחכה לך ב-7 הימים",
  claimed: {
    chip: "7 ימים מתנה",
    title: { fem: "ברוכה הבאה לפעילים+", masc: "ברוך הבא לפעילים+" },
    titleNeutral: "ברוכים הבאים לפעילים+",
    tagline: "7 הימים שלך מתחילים כשנכנסים לאפליקציה",
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
