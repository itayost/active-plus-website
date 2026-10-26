import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { OTP_LENGTH } from "../../lib/funnel/constants";
import { COPY } from "../../lib/funnel/copy";
import { CHECKOUT_COPY as C } from "../../lib/payment/copy";
import { openCheckout, PLAN_CTA, signUp, SIGN_UP_STUB, stubFunctions } from "./checkout-helpers";
import { stubSupabase } from "./supabase-stub";

/* The checkout steps (flag on): identity, invoice email, phone, the stored draft and ?plan= links, focus, axe. */

test("a signed-in buyer with a full profile name only gives the email", async ({ page }) => {
  await stubSupabase(page, SIGN_UP_STUB);
  await stubFunctions(page);
  await openCheckout(page);
  await signUp(page);
  await page.evaluate(() => sessionStorage.removeItem("ap.checkout.draft"));
  await page.goto("/payment");
  await planButton(page, "annual").click();
  await expect(page.getByText("שלב 1 מתוך 2")).toBeVisible();
  await expect(page.getByLabel(C.emailTitle)).toBeVisible();
  await expect(page.getByText("050-1234567")).toBeVisible();
});

test("a one-word name is refused before anything is sent", async ({ page }) => {
  await stubSupabase(page, SIGN_UP_STUB);
  await stubFunctions(page);
  await openCheckout(page);
  await page.getByLabel(C.nameTitle).fill("רחל");
  await page.getByRole("button", { name: C.next }).click();
  await expect(page.getByRole("alert").filter({ hasText: C.nameError })).toBeVisible();
});

test("editing the email from the summary after verifying returns to the summary without a new code", async ({ page }) => {
  const supabase = await stubSupabase(page, SIGN_UP_STUB);
  await stubFunctions(page);
  await openCheckout(page);
  await signUp(page);
  await page.getByRole("button", { name: `${C.edit} ${C.rows.email}` }).click();
  await page.getByLabel(C.emailTitle).fill("rachel@example.com");
  await page.getByRole("button", { name: C.next }).click();
  await expect(page.getByRole("heading", { name: C.summaryTitle })).toBeVisible();
  await expect(page.getByText("rachel@example.com")).toBeVisible();
  expect(supabase.to("/auth/v1/otp")).toHaveLength(1);
  // The checkout creates the account for a new number (only the account page signs in existing ones).
  expect(supabase.to("/auth/v1/otp")[0].body).toMatchObject({ create_user: true });
});

test("opening the checkout and every step move focus to its heading, in view under the sticky header", async ({ page }) => {
  await stubSupabase(page, SIGN_UP_STUB);
  await stubFunctions(page);
  await openCheckout(page);
  const heading = page.getByRole("heading", { name: C.heading });
  await expect(heading).toBeFocused();
  await expect(heading).toBeInViewport();
  await page.getByLabel(C.nameTitle).fill("רחל כהן");
  await page.getByRole("button", { name: C.next }).click();
  await expect(page.getByLabel(C.emailTitle)).toBeVisible();
  await expect(heading).toBeFocused();
  await expect(heading).toBeInViewport();
  await expect(page.getByLabel(C.emailTitle)).toBeInViewport();
});

/* ---- /code-review: an explicit ?plan= link and a stored draft ---- */

const draft = (page: Page) => page.evaluate(() => sessionStorage.getItem("ap.checkout.draft"));
const planButton = (page: Page, plan: "annual" | "monthly") => page.getByRole("button", { name: PLAN_CTA[plan], exact: true });

test("a ?plan= link for another plan wins over a stored draft, and the draft is discarded", async ({ page }) => {
  await stubSupabase(page, SIGN_UP_STUB);
  await stubFunctions(page);
  await openCheckout(page, "annual");
  await page.getByLabel(C.nameTitle).fill("רחל כהן");
  await expect.poll(() => draft(page)).toContain('"plan":"annual"');
  await page.goto("/payment?plan=monthly");
  await expect(planButton(page, "monthly")).toBeVisible();
  // The link wins: the annual checkout is not resumed, and its draft is gone.
  await expect(page.getByRole("heading", { name: C.heading })).toHaveCount(0);
  await expect.poll(() => draft(page)).toBeNull();
  // Choosing the monthly plan opens the checkout for monthly, not annual.
  await planButton(page, "monthly").click();
  await expect(page.getByRole("heading", { name: C.heading })).toBeVisible();
  await expect(page.getByText(`${C.chosenPlan} מנוי חודשי`)).toBeVisible();
  await expect(planButton(page, "monthly")).toHaveAttribute("aria-pressed", "true");
  await expect(planButton(page, "annual")).toHaveAttribute("aria-pressed", "false");
  await page.getByLabel(C.nameTitle).fill("רחל כהן");
  await expect.poll(() => draft(page)).toContain('"plan":"monthly"');
});

test("a ?plan= link for the draft's own plan, or no plan in the link, resumes the checkout", async ({ page }) => {
  await stubSupabase(page, SIGN_UP_STUB);
  await stubFunctions(page);
  await openCheckout(page, "monthly");
  await page.getByLabel(C.nameTitle).fill("רחל כהן");
  await expect.poll(() => draft(page)).toContain('"plan":"monthly"');
  for (const url of ["/payment?plan=monthly", "/payment"]) {
    await page.goto(url);
    await expect(page.getByRole("heading", { name: C.heading })).toBeVisible();
    await expect(planButton(page, "monthly")).toHaveAttribute("aria-pressed", "true");
  }
});

test("choosing another plan keeps the link in step, so a reload resumes the checkout", async ({ page }) => {
  await stubSupabase(page, SIGN_UP_STUB);
  await stubFunctions(page);
  await page.goto("/payment?plan=annual");
  await planButton(page, "monthly").click();
  await expect(page).toHaveURL(/plan=monthly/);
  await page.getByLabel(C.nameTitle).fill("רחל כהן");
  await expect.poll(() => draft(page)).toContain('"plan":"monthly"');
  await page.reload();
  await expect(page.getByRole("heading", { name: C.heading })).toBeVisible();
  await expect(planButton(page, "monthly")).toHaveAttribute("aria-pressed", "true");
});

test("opening the checkout stores nothing; typing starts the draft", async ({ page }) => {
  await stubSupabase(page, SIGN_UP_STUB);
  await stubFunctions(page);
  await openCheckout(page);
  await expect(page.getByLabel(C.nameTitle)).toBeVisible();
  expect(await page.evaluate(() => sessionStorage.getItem("ap.checkout.draft"))).toBeNull();
  await page.getByLabel(C.nameTitle).fill("רחל כהן");
  await expect.poll(() => page.evaluate(() => sessionStorage.getItem("ap.checkout.draft"))).toContain("רחל כהן");
});

test("the phone number step goes back to the email; the code step does not offer back", async ({ page }) => {
  await stubSupabase(page, SIGN_UP_STUB);
  await stubFunctions(page);
  await openCheckout(page);
  await page.getByLabel(C.nameTitle).fill("רחל כהן");
  await page.getByRole("button", { name: C.next }).click();
  await page.getByLabel(C.emailTitle).fill("r@example.com");
  await page.getByRole("button", { name: C.next }).click();
  await page.getByRole("button", { name: C.back }).click();
  await expect(page.getByLabel(C.emailTitle)).toHaveValue("r@example.com");
  await page.getByRole("button", { name: C.next }).click();
  await page.getByLabel(COPY.register.phoneLabel, { exact: true }).fill("0501234567");
  await page.getByRole("button", { name: COPY.register.phoneCta }).click();
  await expect(page.getByLabel(COPY.otp.codeLabel.replace("{n}", String(OTP_LENGTH)))).toBeVisible();
  await expect(page.getByRole("button", { name: C.back })).toHaveCount(0);
});

test.describe("accessibility", () => {
  // Reveal entrances fade content in; axe would measure contrast mid-fade.
  test.use({ reducedMotion: "reduce" });

  const serious = async (page: Page) => {
    const { violations } = await new AxeBuilder({ page }).analyze();
    return violations.filter((v) => ["serious", "critical"].includes(v.impact ?? "")).map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
  };

  test("every checkout step, the error and the success page have no serious axe violations", async ({ page }) => {
    // Polled: after Otp's router.push("/payment") Next drops and re-adds <title> while the navigation commits,
    // and a single axe run can land in that gap (document-title). A lasting violation still fails at the timeout.
    await stubSupabase(page, SIGN_UP_STUB);
    await stubFunctions(page, { status: 409, body: { code: "already_subscribed" } });
    await openCheckout(page);
    await expect.poll(() => serious(page)).toEqual([]);
    await page.getByRole("button", { name: C.next }).click();
    await expect.poll(() => serious(page)).toEqual([]);
    await signUp(page);
    await expect.poll(() => serious(page)).toEqual([]);
    await page.getByRole("button", { name: C.pay }).click();
    await expect(page.getByRole("alert").filter({ hasText: C.errors.already_subscribed })).toBeVisible();
    await expect.poll(() => serious(page)).toEqual([]);
    await page.evaluate(() => sessionStorage.removeItem("ap.checkout.draft"));
    await page.goto("/payment");
    await planButton(page, "annual").click();
    await expect(page.getByLabel(C.emailTitle)).toBeVisible();
    await expect.poll(() => serious(page)).toEqual([]);
    await page.getByLabel(C.emailTitle).fill("r@example.com");
    await expect.poll(() => page.evaluate(() => sessionStorage.getItem("ap.checkout.draft"))).toContain("r@example.com");
    await page.goto("/payment/success?wp=0f8b6c2e9a414d3b8e571c2d3e4f5a6b");
    await expect(page.getByText(C.success.steps[1].title)).toBeVisible();
    await expect.poll(() => serious(page)).toEqual([]);
  });
});

test("the annual card shows the price, the saving and its own button; the monthly row is a real button", async ({ page }) => {
  await page.goto("/payment");
  await expect(page.getByRole("heading", { level: 1, name: "התוכנית האישית שלך מוכנה" })).toBeVisible();
  const annual = page.getByTestId("plan-annual");
  await expect(annual).toContainText("69 ₪");
  await expect(annual).toContainText("חיסכון של 360 ₪");
  await expect(annual).toContainText("ל-12 תשלומים · מנוי שנתי");
  const monthly = planButton(page, "monthly");
  await expect(page.getByTestId("plan-monthly")).toContainText("99 ₪");
  expect((await monthly.boundingBox())!.height).toBeGreaterThanOrEqual(48);
  await monthly.focus();
  await expect(monthly).toBeFocused();
});
