import { expect, test, type Locator, type Page } from "@playwright/test";
import { CHECKOUT_COPY as C } from "../../lib/payment/copy";
import { PLAN_CTA, signUp, SIGN_UP_STUB, stubFunctions } from "./checkout-helpers";
import { stubSupabase } from "./supabase-stub";

/* /payment with the checkout on, at 200% text on a 320px phone: nothing overflows and every control is on screen. */

const WIDTH = 320;

async function expectOnScreen(control: Locator) {
  await control.scrollIntoViewIfNeeded();
  const box = (await control.boundingBox())!;
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(WIDTH);
  expect(box.height).toBeGreaterThanOrEqual(48);
}

const noOverflow = async (page: Page) =>
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(WIDTH);

test("the plans and the checkout summary reflow at 200% text on 320px", async ({ page }) => {
  await page.setViewportSize({ width: WIDTH, height: 640 });
  await page.addInitScript(() => {
    const apply = () => {
      document.documentElement.style.fontSize = "200%";
    };
    if (document.documentElement) apply();
    document.addEventListener("DOMContentLoaded", apply);
  });
  await stubSupabase(page, SIGN_UP_STUB);
  await stubFunctions(page);
  await page.goto("/payment");
  await noOverflow(page);
  await expectOnScreen(page.getByRole("button", { name: PLAN_CTA.annual, exact: true }));
  await expectOnScreen(page.getByRole("button", { name: PLAN_CTA.monthly, exact: true }));

  await page.getByRole("button", { name: PLAN_CTA.annual, exact: true }).click();
  await signUp(page);
  await noOverflow(page);
  await expectOnScreen(page.getByLabel(C.rows.installments));
  await expectOnScreen(page.getByRole("button", { name: C.pay }));
});
