/**
 * Which ad brought the visitor, for the dashboard's per-ad report of פעילים+
 * (/reports/meta-ads). Each פעילים+ ad carries URL parameters that Meta fills
 * with its own ids (utm_content = the ad, utm_term = the ad set, utm_campaign =
 * the campaign); the landing page keeps them on the phone for 28 days, and
 * every funnel event (our own /api/funnel-event, never GTM) carries them.
 *
 * Meta's click id (fbclid) is never kept: only the fact that the visit came
 * from a Meta click. Nothing here is personal.
 */

export const AD_SOURCE_KEY = "ap.ad_source";
export const AD_SOURCE_TTL_MS = 28 * 86_400_000;

const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"] as const;
type UtmKey = (typeof UTM_KEYS)[number];
const MAX_VALUE = 100;

export type AdFields = Partial<Record<UtmKey, string>> & { from_meta_click?: true };
export type AdSource = AdFields & { at: number };

type Store = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function cleanValue(raw: string | null): string | null {
  const value = (raw ?? "").replace(/[\u0000-\u001f\u007f]/g, "").trim();
  // An unfilled Meta macro ({{ad.id}}) is no label at all.
  if (!value || value.startsWith("{{")) return null;
  return value.slice(0, MAX_VALUE);
}

/** The ad labels in a query string; null when the visit carries none. */
export function adSourceFromSearch(search: string, now: number): AdSource | null {
  const params = new URLSearchParams(search);
  const fields: AdFields = {};
  for (const key of UTM_KEYS) {
    const value = cleanValue(params.get(key));
    if (value) fields[key] = value;
  }
  if (params.get("fbclid")) fields.from_meta_click = true;
  return Object.keys(fields).length > 0 ? { ...fields, at: now } : null;
}

function localStore(): Store | undefined {
  try {
    return typeof window === "undefined" ? undefined : window.localStorage;
  } catch {
    return undefined;
  }
}

/** On every page load: a visit from an ad replaces the one kept; any other visit keeps it. Never throws. */
export function rememberAdSource(search: string, now: number = Date.now(), store: Store | undefined = localStore()): void {
  const source = adSourceFromSearch(search, now);
  if (!source) return;
  try {
    store?.setItem(AD_SOURCE_KEY, JSON.stringify(source));
  } catch {
    // Blocked storage: this visit is simply not tied to its ad.
  }
}

/** The kept ad's labels for an event; empty when there is none, it is stale, or it is not ours. */
export function currentAdFields(now: number = Date.now(), store: Store | undefined = localStore()): AdFields {
  try {
    const parsed: unknown = JSON.parse(store?.getItem(AD_SOURCE_KEY) ?? "null");
    if (!parsed || typeof parsed !== "object") return {};
    const record = parsed as Record<string, unknown>;
    if (typeof record.at !== "number" || now - record.at > AD_SOURCE_TTL_MS) return {};
    const fields: AdFields = {};
    for (const key of UTM_KEYS) {
      const value = record[key];
      if (value === undefined) continue;
      if (typeof value !== "string") return {};
      const cleaned = cleanValue(value);
      if (cleaned) fields[key] = cleaned;
    }
    if (record.from_meta_click === true) fields.from_meta_click = true;
    return fields;
  } catch {
    return {};
  }
}

const AGE_GROUPS = new Set(["40_49", "50_59", "60_69", "70_79", "80_plus"]);
const GENDERS = new Set(["male", "female"]);

/**
 * The age group and gender once answered, for the per-ad report by age. Only
 * these two answers, and only to our own database: never to GTM or Meta.
 */
export function audienceFields(answers: Readonly<Record<string, unknown>>): { age_group?: string; gender?: string } {
  return {
    ...(typeof answers.age_group === "string" && AGE_GROUPS.has(answers.age_group) ? { age_group: answers.age_group } : {}),
    ...(typeof answers.gender === "string" && GENDERS.has(answers.gender) ? { gender: answers.gender } : {}),
  };
}
