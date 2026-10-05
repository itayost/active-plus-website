import { expect, test } from "@playwright/test";
import { COPY } from "../../lib/funnel/copy";
import { ACCOUNT_COPY as A } from "../../lib/payment/copy";
import { stubSupabase } from "./supabase-stub";

// The default build has the web checkout off (production today): the page
// still works for anyone who reaches it, but the footer does not offer it.

test("the subscription page works with the web checkout off, unindexed and unlinked", async ({ page }) => {
  await stubSupabase(page);
  const res = await page.goto("/account/subscription");
  expect(res?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1, name: A.title })).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await expect(page.getByText(A.signedOut)).toBeVisible();
  await expect(page.getByLabel(COPY.register.phoneLabel, { exact: true })).toBeVisible();
  const footer = page.getByRole("contentinfo");
  await expect(footer.getByRole("link", { name: A.title })).toHaveCount(0);
  await expect(footer.getByRole("link", { name: "מחיקת חשבון" })).toHaveAttribute("href", "/delete-account");
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
});
