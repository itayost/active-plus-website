import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import { GROW_APPLE_PAY_SDK_URL } from "../../lib/security/csp";
import { stubSupabase } from "./supabase-stub";

const ASSOCIATION_PATH = "/.well-known/apple-developer-merchantid-domain-association";

test("serves the Apple Pay domain file directly, with no redirect, as text a browser shows", async ({ request }) => {
  const res = await request.get(ASSOCIATION_PATH, { maxRedirects: 0 });
  expect(res.status()).toBe(200);
  // Grow's review opens it in a browser: application/octet-stream (with nosniff) downloads instead.
  expect(res.headers()["content-type"]).toBe("text/plain; charset=utf-8");
  expect(await res.text()).toBe(await readFile(`public${ASSOCIATION_PATH}`, "utf8"));
});

test("/payment has Grow's Apple Pay script in the head, and the CSP lets it run", async ({ page }) => {
  await stubSupabase(page);
  await page.route(GROW_APPLE_PAY_SDK_URL, (route) =>
    route.fulfill({ status: 200, contentType: "application/javascript", body: "window.__growApplePay = true;" }),
  );
  await page.goto("/payment");
  await expect(page.locator(`head script[src="${GROW_APPLE_PAY_SDK_URL}"]`)).toHaveCount(1);
  await expect.poll(() => page.evaluate(() => (window as unknown as { __growApplePay?: boolean }).__growApplePay)).toBe(true);
});
