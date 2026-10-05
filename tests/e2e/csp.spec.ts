import { expect, test } from "@playwright/test";
import { SITE_ROUTES } from "../../lib/routes";
import { watchCsp } from "./csp-helpers";
import { stubSupabase } from "./supabase-stub";

// Task 6 adds "/account/subscription".
const ROUTES = [...SITE_ROUTES, "/payment/success?wp=0f8b6c2e9a414d3b8e571c2d3e4f5a6b"];

for (const route of ROUTES) {
  test(`${route} loads under the enforced CSP with no violation`, async ({ page }) => {
    await stubSupabase(page);
    const violations = await watchCsp(page);
    const res = await page.goto(route);
    expect(res?.status()).toBe(200);
    expect(res?.headers()["content-security-policy"]).toContain("frame-ancestors 'none'");
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForLoadState("networkidle");
    expect(await violations()).toEqual([]);
  });
}
