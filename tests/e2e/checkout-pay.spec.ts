import { expect, test } from "@playwright/test";
import { COPY } from "../../lib/funnel/copy";
import { CHECKOUT_COPY as C } from "../../lib/payment/copy";
import { GROW_URL, openCheckout, signUp, SIGN_UP_STUB, stubFunctions } from "./checkout-helpers";
import { watchCsp } from "./csp-helpers";
import { stubSupabase } from "./supabase-stub";

/* The summary and the hand-off to Grow (flag on): what is sent, and every answer createGrowPayment can give. */

test("signed out, annual in 6 installments: verifies the phone, then hands off to Grow without a token", async ({ page }) => {
  await stubSupabase(page, SIGN_UP_STUB);
  const sent = await stubFunctions(page);
  const violations = await watchCsp(page);
  await openCheckout(page);
  await signUp(page);
  await page.getByLabel(C.rows.installments).selectOption("6");
  await expect(page.getByText("כל תשלום: 118 ₪")).toBeVisible();
  await expect(page.getByLabel(C.consentLabel)).not.toBeChecked();
  expect(await violations()).toEqual([]);
  await page.getByRole("button", { name: C.pay }).click();
  await page.waitForURL(GROW_URL);
  expect(sent).toEqual([{ plan: "ANNUAL", installments: 6, fullName: "רחל כהן", email: "r@example.com", tokenConsent: false }]);
});

test("annual with consent ticked asks for the token", async ({ page }) => {
  await stubSupabase(page, SIGN_UP_STUB);
  const sent = await stubFunctions(page);
  await openCheckout(page);
  await signUp(page);
  await page.getByLabel(C.consentLabel).check();
  await page.getByRole("button", { name: C.pay }).click();
  await page.waitForURL(GROW_URL);
  expect(sent).toEqual([{ plan: "ANNUAL", installments: 1, fullName: "רחל כהן", email: "r@example.com", tokenConsent: true }]);
});

test("monthly: no installments, no token consent, standing-order terms", async ({ page }) => {
  await stubSupabase(page, SIGN_UP_STUB);
  const sent = await stubFunctions(page);
  await openCheckout(page, "monthly");
  await signUp(page);
  await expect(page.getByLabel(C.rows.installments)).toHaveCount(0);
  await expect(page.getByLabel(C.consentLabel)).toHaveCount(0);
  await expect(page.getByText("חיוב חודשי של 99 ₪ בהוראת קבע")).toBeVisible();
  await page.getByRole("button", { name: C.pay }).click();
  await page.waitForURL(GROW_URL);
  expect(sent).toEqual([{ plan: "MONTHLY", installments: 1, fullName: "רחל כהן", email: "r@example.com", tokenConsent: false }]);
});

test("already subscribed: explains, offers the apps, stays on the site", async ({ page }) => {
  await stubSupabase(page, SIGN_UP_STUB);
  await stubFunctions(page, { status: 409, body: { code: "already_subscribed" } });
  await openCheckout(page);
  await signUp(page);
  await page.getByRole("button", { name: C.pay }).click();
  await expect(page.getByRole("alert").filter({ hasText: C.errors.already_subscribed })).toBeVisible();
  await expect(page.getByRole("link", { name: "App Store" }).first()).toBeVisible();
  await expect(page).toHaveURL(/\/payment/);
});

test("keys not set yet: the dormant answer sends buyers to the apps", async ({ page }) => {
  await stubSupabase(page, SIGN_UP_STUB);
  await stubFunctions(page, { status: 503, body: { code: "not_configured" } });
  await openCheckout(page);
  await signUp(page);
  await page.getByRole("button", { name: C.pay }).click();
  await expect(page.getByRole("alert").filter({ hasText: C.errors.not_configured })).toBeVisible();
});

test("back from Grow's cancel page: told nothing was charged, the summary is restored", async ({ page }) => {
  await stubSupabase(page, SIGN_UP_STUB);
  await stubFunctions(page);
  await openCheckout(page);
  await signUp(page);
  await page.goto("/payment?cancelled=1");
  await expect(page.getByRole("status").filter({ hasText: C.cancelled })).toBeVisible();
  await expect(page.getByRole("heading", { name: C.summaryTitle })).toBeVisible();
});

test("a session without a usable phone is sent back to verify it (400 on the phone field)", async ({ page }) => {
  await stubSupabase(page, SIGN_UP_STUB);
  await stubFunctions(page, { status: 400, body: { code: "invalid_input", field: "phone" } });
  await openCheckout(page);
  await signUp(page);
  await page.getByRole("button", { name: C.pay }).click();
  await expect(page.getByLabel(COPY.register.phoneLabel, { exact: true })).toBeVisible();
  await expect(page).toHaveURL(/\/payment/);
});

test("the consent row is one label at least 48px tall, and its text toggles the box", async ({ page }) => {
  await stubSupabase(page, SIGN_UP_STUB);
  await stubFunctions(page);
  await openCheckout(page);
  await signUp(page);
  const box = page.getByRole("checkbox", { name: C.consentLabel });
  const row = page.locator("label", { has: box });
  expect((await row.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(48);
  await row.getByText(C.consentLabel).click();
  await expect(box).toBeChecked();
});
