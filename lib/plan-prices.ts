import type { PlanId } from "@/lib/constants";
import { MAX_INSTALLMENTS, type PlanPrices } from "@/lib/pricing";
import { publicSupabaseEnv } from "@/lib/supabase/env";

/**
 * The plan prices, read on the server from Supabase's web_plans: the same
 * rows createGrowPayment charges, so the page and the charge cannot disagree.
 * Server components only (the /payment page); the browser gets the numbers
 * as props.
 *
 * There is deliberately no price in the code to fall back to. When the rows
 * cannot be read (and nothing is cached), the caller shows a "prices
 * unavailable" state instead: a typed price that went stale is how the page
 * once showed one annual total while Grow charged another. /payment renders per request (it reads
 * searchParams), so the build never fetches and never fails on it.
 *
 * Cached for a minute under PLAN_PRICES_TAG. If createGrowPayment answers
 * price_changed inside that minute, refreshPlanPrices (app/payment/actions.ts)
 * drops the tag so the reloaded page shows the new price.
 */
export const PLAN_PRICES_TAG = "web-plans";
const REVALIDATE_SECONDS = 60;
const SELECT = "select=plan_type,total_nis,max_installments";

const PLAN_IDS: Record<string, PlanId> = { ANNUAL: "annual", MONTHLY: "monthly" };

type Row = { plan_type?: unknown; total_nis?: unknown; max_installments?: unknown };

const fail = (reason: string): never => {
  throw new Error(`web_plans: ${reason}`);
};

const isAgorot = (value: number): boolean => Math.abs(value * 100 - Math.round(value * 100)) < 1e-6;

function parseRow(row: unknown): [PlanId, PlanPrices[PlanId]] {
  if (!row || typeof row !== "object") return fail("a row is not an object");
  const { plan_type, total_nis, max_installments } = row as Row;
  const id = typeof plan_type === "string" ? PLAN_IDS[plan_type] : undefined;
  if (!id) return fail(`unknown plan_type ${String(plan_type)}`);
  if (typeof total_nis !== "number" || !Number.isFinite(total_nis) || total_nis <= 0 || !isAgorot(total_nis)) {
    return fail(`${id} total_nis is not a positive amount in agorot`);
  }
  const most = id === "monthly" ? 1 : MAX_INSTALLMENTS;
  if (typeof max_installments !== "number" || !Number.isInteger(max_installments) || max_installments < 1 || max_installments > most) {
    return fail(`${id} max_installments must be an integer 1-${most}`);
  }
  return [id, { total: total_nis, maxInstallments: max_installments }];
}

/** Both plans, each exactly once, with usable numbers; anything else throws. */
export function parsePlanPrices(rows: unknown): PlanPrices {
  if (!Array.isArray(rows)) return fail("the answer is not a list");
  const entries = rows.map(parseRow);
  const ids = entries.map(([id]) => id);
  if (new Set(ids).size !== ids.length) return fail("a plan appears twice");
  const prices = Object.fromEntries(entries) as Partial<PlanPrices>;
  if (!prices.annual || !prices.monthly) return fail("both plans are needed");
  return { annual: prices.annual, monthly: prices.monthly };
}

type Fetcher = (url: string, init: RequestInit & { next?: { revalidate: number; tags: string[] } }) => Promise<Response>;

export type PlanPricesDeps = {
  fetcher?: Fetcher;
  env?: () => { url: string; anonKey: string };
  /** PLAN_PRICES_URL: the e2e build points it at a local stub, since its Supabase host never resolves. */
  overrideUrl?: string;
};

export async function fetchPlanPrices({
  fetcher = fetch,
  env = publicSupabaseEnv,
  overrideUrl = process.env.PLAN_PRICES_URL,
}: PlanPricesDeps = {}): Promise<PlanPrices> {
  const { url, anonKey } = env();
  const res = await fetcher(overrideUrl || `${url.replace(/\/+$/, "")}/rest/v1/web_plans?${SELECT}`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
    next: { revalidate: REVALIDATE_SECONDS, tags: [PLAN_PRICES_TAG] },
  });
  if (!res.ok) fail(`answered ${res.status}`);
  return parsePlanPrices(await res.json());
}

/** The prices, or null when they cannot be read (logged): the page then shows them as unavailable. */
export async function loadPlanPrices(deps: PlanPricesDeps = {}): Promise<PlanPrices | null> {
  try {
    return await fetchPlanPrices(deps);
  } catch (error) {
    console.error("[plan-prices] could not read web_plans", { message: error instanceof Error ? error.message : "unknown" });
    return null;
  }
}
