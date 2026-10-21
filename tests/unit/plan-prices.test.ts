import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchPlanPrices, loadPlanPrices, parsePlanPrices } from "@/lib/plan-prices";

const ROWS = [
  { plan_type: "ANNUAL", total_nis: 828, max_installments: 12 },
  { plan_type: "MONTHLY", total_nis: 99, max_installments: 1 },
];
const PRICES = { annual: { total: 828, maxInstallments: 12 }, monthly: { total: 99, maxInstallments: 1 } };
const ENV = () => ({ url: "https://abcd.supabase.co", anonKey: "anon" });
const ok = (body: unknown) => vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status: 200 }));

afterEach(() => vi.restoreAllMocks());

describe("parsePlanPrices", () => {
  it("keys web_plans rows by the site's plan ids", () => {
    expect(parsePlanPrices(ROWS)).toEqual(PRICES);
    expect(parsePlanPrices([...ROWS].reverse())).toEqual(PRICES);
  });

  it.each([
    ["not a list", { plan_type: "ANNUAL" }],
    ["no rows", []],
    ["a missing plan", [ROWS[0]]],
    ["a duplicate plan", [...ROWS, ROWS[1]]],
    ["an unknown plan", [...ROWS, { plan_type: "WEEKLY", total_nis: 30, max_installments: 1 }]],
    ["a zero total", [{ ...ROWS[0], total_nis: 0 }, ROWS[1]]],
    ["a negative total", [{ ...ROWS[0], total_nis: -828 }, ROWS[1]]],
    ["a total as text", [{ ...ROWS[0], total_nis: "828" }, ROWS[1]]],
    ["a total past agorot", [{ ...ROWS[0], total_nis: 828.005 }, ROWS[1]]],
    ["an infinite total", [{ ...ROWS[0], total_nis: Number.POSITIVE_INFINITY }, ROWS[1]]],
    ["zero installments", [{ ...ROWS[0], max_installments: 0 }, ROWS[1]]],
    ["13 installments", [{ ...ROWS[0], max_installments: 13 }, ROWS[1]]],
    ["fractional installments", [{ ...ROWS[0], max_installments: 2.5 }, ROWS[1]]],
    ["a monthly plan in installments", [ROWS[0], { ...ROWS[1], max_installments: 2 }]],
    ["a null row", [ROWS[0], null]],
  ])("refuses %s", (_name, rows) => {
    expect(() => parsePlanPrices(rows)).toThrow(/web_plans/);
  });
});

describe("fetchPlanPrices", () => {
  it("reads web_plans with the anon key, fresh on every request (never from Next's data cache)", async () => {
    const fetcher = ok(ROWS);
    expect(await fetchPlanPrices({ fetcher, env: ENV })).toEqual(PRICES);
    expect(fetcher).toHaveBeenCalledWith(
      "https://abcd.supabase.co/rest/v1/web_plans?select=plan_type,total_nis,max_installments",
      {
        headers: { apikey: "anon", Authorization: "Bearer anon" },
        cache: "no-store",
      },
    );
  });

  it("uses PLAN_PRICES_URL when set (the e2e stub), with the same headers", async () => {
    const fetcher = ok(ROWS);
    await fetchPlanPrices({ fetcher, env: ENV, overrideUrl: "http://127.0.0.1:3199/web_plans" });
    expect(fetcher.mock.calls[0][0]).toBe("http://127.0.0.1:3199/web_plans");
  });

  it("fails on an error status, a network failure or unusable rows", async () => {
    const status = vi.fn().mockResolvedValue(new Response("{}", { status: 503 }));
    await expect(fetchPlanPrices({ fetcher: status, env: ENV })).rejects.toThrow(/503/);
    const offline = vi.fn().mockRejectedValue(new TypeError("fetch failed"));
    await expect(fetchPlanPrices({ fetcher: offline, env: ENV })).rejects.toThrow("fetch failed");
    await expect(fetchPlanPrices({ fetcher: ok([ROWS[0]]), env: ENV })).rejects.toThrow(/web_plans/);
  });
});

describe("loadPlanPrices", () => {
  it("returns the prices, or null (logged) when they cannot be read", async () => {
    expect(await loadPlanPrices({ fetcher: ok(ROWS), env: ENV })).toEqual(PRICES);
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(await loadPlanPrices({ fetcher: ok([]), env: ENV })).toBeNull();
    expect(log).toHaveBeenCalledOnce();
  });
});
