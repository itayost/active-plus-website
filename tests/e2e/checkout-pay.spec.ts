import { expect, test } from "@playwright/test";
import { COPY } from "../../lib/funnel/copy";
import { CHECKOUT_COPY as C } from "../../lib/payment/copy";
import { GROW_URL, openCheckout, signUp, SIGN_UP_STUB, stubFunctions, walletEvent, walletSeen } from "./checkout-helpers";
import { watchCsp } from "./csp-helpers";
import { stubSupabase } from "./supabase-stub";

/* The summary and the hand-off to Grow (flag on): annual opens Grow's wallet SDK, monthly goes to its hosted page; what is sent, and every answer createGrowPayment can give. */

test("signed out, annual in 6 installments: verifies the phone, opens Grow's wallet, and on success goes to the success page", async ({ page }) => {
  await stubSupabase(page, SIGN_UP_STUB);
  const sent = await stubFunctions(page);
  const violations = await watchCsp(page);
  await openCheckout(page);
  await signUp(page);
  await page.getByLabel(C.rows.installments).selectOption("6");
  await expect(page.getByText("כל תשלום: 138 ₪")).toBeVisible();
  await page.getByRole("button", { name: C.pay }).click();
  await expect(page.getByRole("button", { name: C.openingWallet })).toBeDisabled();
  await expect.poll(() => walletSeen(page)).toEqual(["DEV", 1, ["e2e-auth-code"]]);
  expect(sent).toEqual([{ plan: "ANNUAL", installments: 6, fullName: "רחל כהן", email: "r@example.com" }]);
  // The SDK is served from Grow's CDN address: the checkout's CSP lets it load.
  expect(await violations()).toEqual([]);
  await walletEvent(page, "onSuccess", { status: 1 });
  await page.waitForURL("**/payment/success");
});

test("annual: closing the wallet without paying returns to the summary, with no error", async ({ page }) => {
  await stubSupabase(page, SIGN_UP_STUB);
  await stubFunctions(page);
  await openCheckout(page);
  await signUp(page);
  await page.getByRole("button", { name: C.pay }).click();
  await expect.poll(() => walletSeen(page)).not.toBeNull();
  await walletEvent(page, "onWalletChange", "close");
  await expect(page.getByRole("button", { name: C.pay })).toBeEnabled();
  await expect(page.getByRole("alert").filter({ hasText: /./ })).toHaveCount(0);
  await expect(page).toHaveURL(/\/payment/);
});

test("annual: a declined payment is reported once the buyer closes the wallet", async ({ page }) => {
  await stubSupabase(page, SIGN_UP_STUB);
  await stubFunctions(page);
  await openCheckout(page);
  await signUp(page);
  await page.getByRole("button", { name: C.pay }).click();
  await expect.poll(() => walletSeen(page)).not.toBeNull();
  await walletEvent(page, "onFailure", { status: 0, message: "declined" });
  await walletEvent(page, "onWalletChange", "close");
  await expect(page.getByRole("alert").filter({ hasText: C.errors.payment_failed })).toBeVisible();
  await expect(page.getByRole("button", { name: C.pay })).toBeEnabled();
});

test("annual: Grow's SDK not loading is reported, and nothing else happens", async ({ page }) => {
  await stubSupabase(page, SIGN_UP_STUB);
  await stubFunctions(page);
  await page.route("https://cdn.meshulam.co.il/**", (route) => route.abort());
  await openCheckout(page);
  await signUp(page);
  await page.getByRole("button", { name: C.pay }).click();
  await expect(page.getByRole("alert").filter({ hasText: C.errors.processor_error })).toBeVisible();
  await expect(page).toHaveURL(/\/payment/);
});

test("no card-token consent is offered: the checkout never asks Grow to keep the card", async ({ page }) => {
  await stubSupabase(page, SIGN_UP_STUB);
  await stubFunctions(page);
  await openCheckout(page);
  await signUp(page);
  await expect(page.getByRole("checkbox")).toHaveCount(0);
});

test("monthly: no installments, standing-order terms, hands off to Grow's hosted page", async ({ page }) => {
  await stubSupabase(page, SIGN_UP_STUB);
  const sent = await stubFunctions(page);
  await openCheckout(page, "monthly");
  await signUp(page);
  await expect(page.getByLabel(C.rows.installments)).toHaveCount(0);
  await expect(page.getByText("חיוב חודשי של 99 ₪ בהוראת קבע")).toBeVisible();
  await page.getByRole("button", { name: C.pay }).click();
  await page.waitForURL(GROW_URL);
  expect(sent).toEqual([{ plan: "MONTHLY", installments: 1, fullName: "רחל כהן", email: "r@example.com" }]);
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
