import { expect, test } from "@playwright/test";
import { CHECKOUT_COPY as C } from "../../lib/payment/copy";
import { GROW_URL, openCheckout, signUp, SIGN_UP_STUB, stubFunctions } from "./checkout-helpers";
import { stubSupabase } from "./supabase-stub";

/* Grow's success URL (flag on): the welcome, the invoice email from the draft, the next steps. */

test("success page: gendered welcome, the invoice email, and the next steps once access shows", async ({ page }) => {
  await stubSupabase(page, SIGN_UP_STUB);
  await stubFunctions(page);
  await openCheckout(page);
  await signUp(page);
  await page.evaluate(() => sessionStorage.setItem("ap.funnel.gender", "female"));
  await page.goto("/payment/success?wp=0f8b6c2e9a414d3b8e571c2d3e4f5a6b");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(C.success.title.fem);
  await expect(page.getByText("r@example.com")).toBeVisible();
  await expect(page.getByText(C.success.steps[1].title)).toBeVisible();
});

test("the success page reads the invoice email once from the draft stored before Grow, and removes it", async ({ page }) => {
  await stubSupabase(page, SIGN_UP_STUB);
  await stubFunctions(page);
  await openCheckout(page);
  await signUp(page, "רחל כהן", "rachel@example.com");
  await page.getByRole("button", { name: C.pay }).click();
  await page.waitForURL(GROW_URL);
  // Only the draft carries the address now: seeing it on the success page shows it was stored before the redirect.
  await page.goto("/payment/success?wp=0f8b6c2e9a414d3b8e571c2d3e4f5a6b");
  await expect(page.getByText("rachel@example.com")).toBeVisible();
  expect(await page.evaluate(() => sessionStorage.getItem("ap.checkout.draft"))).toBeNull();
});
