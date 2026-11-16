import { expect, test } from "@playwright/test";
import { CHECKOUT_COPY as C } from "../../lib/payment/copy";
import { GROW_URL, openCheckout, pay, SIGN_UP_STUB, signUp, stubFunctions, walletEvent, walletSeen } from "./checkout-helpers";
import { stubSupabase } from "./supabase-stub";

/* Grow's success URL (flag on): the welcome, the invoice by WhatsApp, the next steps; the draft is removed. */

test("success page: gendered welcome, the invoice by WhatsApp, and the next steps once access shows", async ({ page }) => {
  await stubSupabase(page, SIGN_UP_STUB);
  await stubFunctions(page);
  await openCheckout(page);
  await signUp(page);
  await page.evaluate(() => sessionStorage.setItem("ap.funnel.gender", "female"));
  await page.goto("/payment/success?wp=0f8b6c2e9a414d3b8e571c2d3e4f5a6b");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(C.success.title.fem);
  await expect(page.getByText(C.success.received)).toBeVisible();
  await expect(page.getByText(C.success.steps[1].title)).toBeVisible();
});

test("after the wallet's success, the success page says WhatsApp and removes the draft", async ({ page }) => {
  await stubSupabase(page, SIGN_UP_STUB);
  await stubFunctions(page);
  await openCheckout(page);
  await signUp(page);
  await pay(page);
  await expect.poll(() => walletSeen(page)).not.toBeNull();
  await walletEvent(page, "onSuccess", { status: 1 });
  await page.waitForURL("**/payment/success");
  await expect(page.getByText(C.success.received)).toBeVisible();
  expect(await page.evaluate(() => sessionStorage.getItem("ap.checkout.draft"))).toBeNull();
});

test("after Grow's hosted page, the success page says WhatsApp and removes the draft stored before it", async ({ page }) => {
  await stubSupabase(page, SIGN_UP_STUB);
  await stubFunctions(page);
  await openCheckout(page, "monthly");
  await signUp(page);
  await pay(page);
  await page.waitForURL(GROW_URL);
  await page.goto("/payment/success?wp=0f8b6c2e9a414d3b8e571c2d3e4f5a6b");
  await expect(page.getByText(C.success.received)).toBeVisible();
  expect(await page.evaluate(() => sessionStorage.getItem("ap.checkout.draft"))).toBeNull();
});
