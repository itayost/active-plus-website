import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page, type Route } from "@playwright/test";
import { OTP_LENGTH } from "../../lib/funnel/constants";
import { COPY } from "../../lib/funnel/copy";
import { CHECKOUT_COPY as C } from "../../lib/payment/copy";
import { watchCsp } from "./csp-helpers";
import { GOOD_CODE, stubSupabase } from "./supabase-stub";

/*
  The checkout against stubbed Supabase and a stubbed Grow page: no request
  leaves the machine and nothing is charged. createGrowPayment and
  checkUserSubscription are answered here; the redirect to Grow lands on a
  local stub page. Alerts are matched by text: Next's route announcer is a
  second, empty role="alert" on every page.
*/

const GROW_URL = "https://sandbox.meshulam.co.il/s/e2e-hosted-page";
const WP = "0f8b6c2e-9a41-4d3b-8e57-1c2d3e4f5a6b";
const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "*",
  "access-control-allow-methods": "POST, OPTIONS",
};

type Reply = { status: number; body: unknown };
const OK: Reply = { status: 200, body: { url: GROW_URL, webPaymentId: WP } };

const fulfil = (route: Route, reply: Reply) =>
  route.request().method() === "OPTIONS"
    ? route.fulfill({ status: 204, headers: CORS })
    : route.fulfill({ status: reply.status, headers: CORS, contentType: "application/json", body: JSON.stringify(reply.body) });

/** Registered after stubSupabase, so these run first. Returns the createGrowPayment bodies sent. */
async function stubFunctions(page: Page, create: Reply = OK, access: Reply = { status: 200, body: { hasAccess: true } }) {
  const sent: unknown[] = [];
  await page.route(/\/functions\/v1\/createGrowPayment$/, (route) => {
    if (route.request().method() === "POST") sent.push(route.request().postDataJSON());
    return fulfil(route, create);
  });
  await page.route(/\/functions\/v1\/checkUserSubscription$/, (route) => fulfil(route, access));
  await page.route(`${new URL(GROW_URL).origin}/**`, (route) =>
    route.fulfill({ status: 200, contentType: "text/html", body: "<!doctype html><title>Grow</title><h1>Grow</h1>" }));
  return sent;
}

async function openCheckout(page: Page, plan: "annual" | "monthly" = "annual") {
  await page.goto(`/payment?plan=${plan}`);
  await page.getByRole("button", { name: "המשך לרכישה" }).click();
  await expect(page.getByRole("heading", { name: C.heading })).toBeVisible();
}

async function signUp(page: Page, name = "רחל כהן", email = "r@example.com") {
  await page.getByLabel(C.nameTitle).fill(name);
  await page.getByRole("button", { name: C.next }).click();
  await page.getByLabel(C.emailTitle).fill(email);
  await page.getByRole("button", { name: C.next }).click();
  await page.getByLabel(COPY.register.phoneLabel, { exact: true }).fill("0501234567");
  await page.getByRole("button", { name: COPY.register.phoneCta }).click();
  await page.getByLabel(COPY.otp.codeLabel.replace("{n}", String(OTP_LENGTH))).fill(GOOD_CODE);
  await expect(page.getByRole("heading", { name: C.summaryTitle })).toBeVisible();
}

const SIGN_UP_STUB = { profileName: null, profileAfterMerge: "רחל כהן" };

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

test("a signed-in buyer with a full profile name only gives the email", async ({ page }) => {
  await stubSupabase(page, SIGN_UP_STUB);
  await stubFunctions(page);
  await openCheckout(page);
  await signUp(page);
  await page.evaluate(() => sessionStorage.removeItem("ap.checkout.draft"));
  await page.goto("/payment");
  await page.getByRole("button", { name: "המשך לרכישה" }).click();
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

test("success page: gendered welcome, the invoice email, and the next steps once access shows", async ({ page }) => {
  await stubSupabase(page, SIGN_UP_STUB);
  await stubFunctions(page);
  await openCheckout(page);
  await signUp(page);
  await page.evaluate(() => {
    sessionStorage.setItem("ap.funnel.gender", "female");
    sessionStorage.setItem("ap.checkout.email", "r@example.com");
  });
  await page.goto("/payment/success?wp=0f8b6c2e9a414d3b8e571c2d3e4f5a6b");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(C.success.title.fem);
  await expect(page.getByText("r@example.com")).toBeVisible();
  await expect(page.getByText(C.success.steps[1].title)).toBeVisible();
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

test.describe("accessibility", () => {
  // Reveal entrances fade content in; axe would measure contrast mid-fade.
  test.use({ reducedMotion: "reduce" });

  const serious = async (page: Page) => {
    const { violations } = await new AxeBuilder({ page }).analyze();
    return violations.filter((v) => ["serious", "critical"].includes(v.impact ?? "")).map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
  };

  test("every checkout step, the error and the success page have no serious axe violations", async ({ page }) => {
    await stubSupabase(page, SIGN_UP_STUB);
    await stubFunctions(page, { status: 409, body: { code: "already_subscribed" } });
    await openCheckout(page);
    expect(await serious(page)).toEqual([]);
    await page.getByRole("button", { name: C.next }).click();
    expect(await serious(page)).toEqual([]);
    await signUp(page);
    expect(await serious(page)).toEqual([]);
    await page.getByRole("button", { name: C.pay }).click();
    await expect(page.getByRole("alert").filter({ hasText: C.errors.already_subscribed })).toBeVisible();
    expect(await serious(page)).toEqual([]);
    await page.evaluate(() => sessionStorage.removeItem("ap.checkout.draft"));
    await page.goto("/payment");
    await page.getByRole("button", { name: "המשך לרכישה" }).click();
    await expect(page.getByLabel(C.emailTitle)).toBeVisible();
    expect(await serious(page)).toEqual([]);
    await page.evaluate(() => sessionStorage.setItem("ap.checkout.email", "r@example.com"));
    await page.goto("/payment/success?wp=0f8b6c2e9a414d3b8e571c2d3e4f5a6b");
    await expect(page.getByText(C.success.steps[1].title)).toBeVisible();
    expect(await serious(page)).toEqual([]);
  });
});
