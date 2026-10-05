import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page, type Route } from "@playwright/test";
import { OTP_LENGTH } from "../../lib/funnel/constants";
import { COPY } from "../../lib/funnel/copy";
import { ACCOUNT_COPY as A, CHECKOUT_COPY as C } from "../../lib/payment/copy";
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
  // The checkout creates the account for a new number (only the account page signs in existing ones).
  expect(supabase.to("/auth/v1/otp")[0].body).toMatchObject({ create_user: true });
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
const planRadio = (page: Page, plan: "annual" | "monthly") => page.locator(`input[name="plan"][value="${plan}"]`);

test("a ?plan= link for another plan wins over a stored draft, and the draft is discarded", async ({ page }) => {
  await stubSupabase(page, SIGN_UP_STUB);
  await stubFunctions(page);
  await openCheckout(page, "annual");
  await page.getByLabel(C.nameTitle).fill("רחל כהן");
  await expect.poll(() => draft(page)).toContain('"plan":"annual"');
  await page.goto("/payment?plan=monthly");
  await expect(planRadio(page, "monthly")).toBeChecked();
  await expect(page.getByRole("button", { name: "המשך לרכישה" })).toBeVisible();
  await expect(page.getByRole("heading", { name: C.heading })).toHaveCount(0);
  await expect.poll(() => draft(page)).toBeNull();
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
    await expect(planRadio(page, "monthly")).toBeChecked();
  }
});

test("choosing another plan keeps the link in step, so a reload resumes the checkout", async ({ page }) => {
  await stubSupabase(page, SIGN_UP_STUB);
  await stubFunctions(page);
  await page.goto("/payment?plan=annual");
  await page.locator('label:has(input[value="monthly"])').click();
  await expect(page).toHaveURL(/plan=monthly/);
  await page.getByRole("button", { name: "המשך לרכישה" }).click();
  await page.getByLabel(C.nameTitle).fill("רחל כהן");
  await expect.poll(() => draft(page)).toContain('"plan":"monthly"');
  await page.reload();
  await expect(page.getByRole("heading", { name: C.heading })).toBeVisible();
  await expect(planRadio(page, "monthly")).toBeChecked();
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

test("the success page reads the invoice email once and removes it", async ({ page }) => {
  await stubSupabase(page, SIGN_UP_STUB);
  await stubFunctions(page);
  await openCheckout(page);
  await signUp(page);
  await page.evaluate(() => sessionStorage.setItem("ap.checkout.email", "r@example.com"));
  await page.goto("/payment/success?wp=0f8b6c2e9a414d3b8e571c2d3e4f5a6b");
  await expect(page.getByText("r@example.com")).toBeVisible();
  expect(await page.evaluate(() => sessionStorage.getItem("ap.checkout.email"))).toBeNull();
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
    await page.getByRole("button", { name: "המשך לרכישה" }).click();
    await expect(page.getByLabel(C.emailTitle)).toBeVisible();
    await expect.poll(() => serious(page)).toEqual([]);
    await page.evaluate(() => sessionStorage.setItem("ap.checkout.email", "r@example.com"));
    await page.goto("/payment/success?wp=0f8b6c2e9a414d3b8e571c2d3e4f5a6b");
    await expect(page.getByText(C.success.steps[1].title)).toBeVisible();
    await expect.poll(() => serious(page)).toEqual([]);
  });
});

test("subscription page: a monthly web subscriber signs in and cancels after confirming", async ({ page }) => {
  await stubSupabase(page, { profileName: "רחל כהן" });
  await stubFunctions(page, OK, {
    status: 200,
    body: { hasAccess: true, subscription: { id: "s1", planType: "MONTHLY", expiresAt: "2026-11-07T10:00:00.000Z", autoRenew: true, platform: "grow" } },
  });
  let cancels = 0;
  await page.route(/\/functions\/v1\/cancelGrowSubscription$/, (route) => {
    if (route.request().method() === "POST") cancels += 1;
    return fulfil(route, { status: 200, body: { status: "cancelled", expiresAt: "2026-11-07T10:00:00.000Z" } });
  });
  await page.goto("/account/subscription");
  await page.getByLabel(COPY.register.phoneLabel, { exact: true }).fill("0501234567");
  await page.getByRole("button", { name: COPY.register.phoneCta }).click();
  await page.getByLabel("הקוד שקיבלת ב־SMS").fill(GOOD_CODE);
  await page.getByRole("button", { name: "אימות" }).click();
  await page.getByRole("button", { name: "ביטול המנוי" }).click();
  await expect(page.getByRole("heading", { name: "לבטל את המנוי החודשי?" })).toBeVisible();
  expect(cancels).toBe(0);
  await page.getByRole("button", { name: "כן, לבטל" }).click();
  await expect(page.getByRole("status").filter({ hasText: "המנוי בוטל" })).toBeVisible();
  expect(cancels).toBe(1);
});

/* ---- /account/subscription (Task 6) ---- */

const EXPIRES = "2026-11-07T10:00:00.000Z";
const EXPIRES_HE = "7 בנובמבר 2026";
/** webMonthly.nextChargeAt: the standing order's next charge day, an Israeli date. */
const NEXT_CHARGE = "2026-11-05";
const NEXT_CHARGE_HE = "5 בנובמבר 2026";
/**
 * checkUserSubscription's answer: the subscription row, and webMonthly when
 * that row is a renewing web monthly. `nextChargeAt` overrides webMonthly's day.
 */
const subscription = (overrides: Record<string, unknown> = {}): Reply => {
  const { nextChargeAt, ...rest } = overrides;
  const sub = { id: "s1", planType: "MONTHLY", expiresAt: EXPIRES, autoRenew: true, platform: "grow", ...rest };
  const renewing = sub.platform === "grow" && sub.planType === "MONTHLY" && sub.autoRenew === true;
  const day = "nextChargeAt" in overrides ? nextChargeAt ?? null : NEXT_CHARGE;
  return {
    status: 200,
    body: { hasAccess: true, subscription: sub, webMonthly: renewing ? { renewing: true, nextChargeAt: day, expiresAt: EXPIRES } : null },
  };
};

/** Answers cancelGrowSubscription; returns the number of POSTs it saw. */
async function stubCancel(page: Page, reply: Reply = { status: 200, body: { status: "cancelled", expiresAt: EXPIRES } }) {
  const count = { posts: 0 };
  await page.route(/\/functions\/v1\/cancelGrowSubscription$/, (route) => {
    if (route.request().method() === "POST") count.posts += 1;
    return fulfil(route, reply);
  });
  return count;
}

async function signInToAccount(page: Page) {
  await page.goto("/account/subscription");
  await page.getByLabel(COPY.register.phoneLabel, { exact: true }).fill("0501234567");
  await page.getByRole("button", { name: COPY.register.phoneCta }).click();
  await page.getByLabel(A.codeLabel).fill(GOOD_CODE);
  await page.getByRole("button", { name: A.verify }).click();
}

test.describe("subscription page", () => {
  test("signing in never merges questionnaire answers into a profile", async ({ page }) => {
    const supabase = await stubSupabase(page, { profileName: "רחל כהן" });
    await stubFunctions(page, OK, subscription());
    await signInToAccount(page);
    await expect(page.getByRole("heading", { name: A.plans.MONTHLY })).toBeVisible();
    expect(supabase.to("/rest/v1/rpc/merge_funnel_session")).toHaveLength(0);
    expect(supabase.to("/rest/v1/rpc/fill_missing_funnel_answers")).toHaveLength(0);
    expect(supabase.foreign).toEqual([]);
  });

  test("focus follows each step: code field, plan, confirmation, then the result", async ({ page }) => {
    await stubSupabase(page, { profileName: "רחל כהן" });
    await stubFunctions(page, OK, subscription());
    await stubCancel(page);
    await page.goto("/account/subscription");
    await page.getByLabel(COPY.register.phoneLabel, { exact: true }).fill("0501234567");
    await page.getByRole("button", { name: COPY.register.phoneCta }).click();
    await expect(page.getByLabel(A.codeLabel)).toBeFocused();
    await page.getByLabel(A.codeLabel).fill(GOOD_CODE);
    await page.getByRole("button", { name: A.verify }).click();
    await expect(page.getByRole("heading", { name: A.plans.MONTHLY })).toBeFocused();
    await expect(page.getByText(A.nextCharge.replace("{date}", NEXT_CHARGE_HE))).toBeVisible();
    await page.getByRole("button", { name: A.cancel }).click();
    await expect(page.getByRole("heading", { name: A.confirmTitle })).toBeFocused();
    await expect(page.getByText(A.confirmBody.replace("{date}", EXPIRES_HE))).toBeVisible();
    await page.getByRole("button", { name: A.confirmYes }).click();
    const done = page.getByRole("status").filter({ hasText: A.cancelled.replace("{date}", EXPIRES_HE) });
    await expect(done).toBeFocused();
    await expect(page.getByRole("button", { name: A.cancel })).toHaveCount(0);
    await expect(page.getByText(A.activeUntil.replace("{date}", EXPIRES_HE))).toBeVisible();
  });

  test("keeping the subscription sends nothing and returns focus to the plan", async ({ page }) => {
    await stubSupabase(page, { profileName: "רחל כהן" });
    await stubFunctions(page, OK, subscription());
    const cancel = await stubCancel(page);
    await signInToAccount(page);
    await page.getByRole("button", { name: A.cancel }).click();
    await page.getByRole("button", { name: A.confirmNo }).click();
    await expect(page.getByRole("heading", { name: A.confirmTitle })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: A.plans.MONTHLY })).toBeFocused();
    await expect(page.getByRole("button", { name: A.cancel })).toBeVisible();
    expect(cancel.posts).toBe(0);
  });

  test("Grow refuses: the subscription stays as it was, with a retry and the office phone", async ({ page }) => {
    await stubSupabase(page, { profileName: "רחל כהן" });
    await stubFunctions(page, OK, subscription());
    const cancel = await stubCancel(page, { status: 502, body: { code: "processor_error" } });
    await signInToAccount(page);
    await page.getByRole("button", { name: A.cancel }).click();
    await page.getByRole("button", { name: A.confirmYes }).click();
    const alert = page.getByRole("alert").filter({ hasText: A.cancelFailed });
    await expect(alert).toBeFocused();
    await expect(alert.getByRole("link")).toHaveAttribute("href", "tel:+972737296699");
    await expect(page.getByText(A.nextCharge.replace("{date}", NEXT_CHARGE_HE))).toBeVisible();
    await expect(page.getByRole("button", { name: A.cancel })).toBeVisible();
    expect(cancel.posts).toBe(1);
  });

  test("an already cancelled subscription says so and offers no second cancel", async ({ page }) => {
    await stubSupabase(page, { profileName: "רחל כהן" });
    await stubFunctions(page, OK, subscription({ autoRenew: false }));
    await signInToAccount(page);
    await expect(page.getByText(A.cancelled.replace("{date}", EXPIRES_HE))).toBeVisible();
    await expect(page.getByRole("button", { name: A.cancel })).toHaveCount(0);
  });

  test("store and office subscriptions point to where they are cancelled", async ({ page }) => {
    await stubSupabase(page, { profileName: "רחל כהן" });
    let reply = subscription({ platform: "apple" });
    await stubFunctions(page, OK, { status: 200, body: {} });
    await page.route(/\/functions\/v1\/checkUserSubscription$/, (route) => fulfil(route, reply));
    await signInToAccount(page);
    await expect(page.getByText(A.apple)).toBeVisible();
    await expect(page.getByRole("link", { name: A.appleLink })).toHaveAttribute("href", "https://apps.apple.com/account/subscriptions");
    await expect(page.getByText(A.activeUntil.replace("{date}", EXPIRES_HE))).toBeVisible();
    await expect(page.getByRole("button", { name: A.cancel })).toHaveCount(0);

    reply = subscription({ platform: "google", planType: "ANNUAL" });
    await page.reload();
    await expect(page.getByRole("link", { name: A.googleLink })).toHaveAttribute("href", "https://play.google.com/store/account/subscriptions");
    await expect(page.getByRole("heading", { name: A.plans.ANNUAL })).toBeVisible();

    reply = subscription({ platform: null });
    await page.reload();
    await expect(page.getByText(A.manual)).toBeVisible();
    await expect(page.locator("#subscription").getByRole("link", { name: "073-729-66-99" })).toHaveAttribute("href", "tel:+972737296699");
  });

  test("the next charge is the standing order's day; access, the confirmation and the cancel notice keep the end date", async ({ page }) => {
    await stubSupabase(page, { profileName: "רחל כהן" });
    await stubFunctions(page, OK, subscription());
    await stubCancel(page);
    await signInToAccount(page);
    await expect(page.getByText(A.nextCharge.replace("{date}", NEXT_CHARGE_HE))).toBeVisible();
    await expect(page.getByText(EXPIRES_HE)).toHaveCount(0);
    await page.getByRole("button", { name: A.cancel }).click();
    await expect(page.getByText(A.confirmBody.replace("{date}", EXPIRES_HE))).toBeVisible();
    await page.getByRole("button", { name: A.confirmYes }).click();
    await expect(page.getByRole("status").filter({ hasText: A.cancelled.replace("{date}", EXPIRES_HE) })).toBeVisible();
    await expect(page.getByText(NEXT_CHARGE_HE)).toHaveCount(0);
  });

  test("a renewing web monthly without a readable charge day shows how long access lasts, and still offers the cancel", async ({ page }) => {
    await stubSupabase(page, { profileName: "רחל כהן" });
    await stubFunctions(page, OK, subscription({ nextChargeAt: undefined }));
    await signInToAccount(page);
    await expect(page.getByText(A.activeUntil.replace("{date}", EXPIRES_HE))).toBeVisible();
    await expect(page.getByRole("button", { name: A.cancel })).toBeVisible();
  });

  // /code-review: the page must not reveal whether a number has an account.
  test("a number with no account gets the same code screen as one with an account, and no account is created", async ({ page }) => {
    const screens: string[] = [];
    for (const known of [true, false]) {
      const supabase = await stubSupabase(page, known ? { profileName: "רחל כהן" } : { otpStatuses: [422], otpErrorCode: "otp_disabled" });
      await stubFunctions(page, OK, subscription());
      await page.goto("/account/subscription");
      await page.getByLabel(COPY.register.phoneLabel, { exact: true }).fill("0501234567");
      await page.getByRole("button", { name: COPY.register.phoneCta }).click();
      const code = page.getByLabel(A.codeLabel);
      await expect(code).toBeFocused();
      await expect(code).toHaveAccessibleDescription(A.codeHint);
      await code.fill("000000");
      await page.getByRole("button", { name: A.verify }).click();
      await expect(page.getByRole("alert").filter({ hasText: COPY.otp.wrongCode })).toBeVisible();
      screens.push((await page.locator("#subscription").innerText()).replace(/\s+/g, " "));
      expect(supabase.to("/auth/v1/otp").map((c) => (c.body as { create_user?: unknown }).create_user)).toEqual([false]);
      await page.unrouteAll({ behavior: "ignoreErrors" });
    }
    expect(screens[1]).toBe(screens[0]);
  });

  // /code-review: the response's subscription is the latest-expiring row; a longer one hid the web monthly's cancel.
  test("a renewing web monthly behind a longer office subscription is shown with its next charge and cancel", async ({ page }) => {
    await stubSupabase(page, { profileName: "רחל כהן" });
    const longer = { id: "m1", planType: "ANNUAL", expiresAt: "2027-06-01T10:00:00.000Z", autoRenew: false, platform: null };
    await stubFunctions(page, OK, {
      status: 200, body: { hasAccess: true, subscription: longer, webMonthly: { renewing: true, nextChargeAt: NEXT_CHARGE, expiresAt: EXPIRES } },
    });
    await signInToAccount(page);
    await expect(page.getByRole("heading", { name: A.plans.MONTHLY })).toBeVisible();
    await expect(page.getByText(A.nextCharge.replace("{date}", NEXT_CHARGE_HE))).toBeVisible();
    await expect(page.getByRole("button", { name: A.cancel })).toBeVisible();
  });

  test("a web monthly whose access lapsed while Grow still retries can be cancelled", async ({ page }) => {
    await stubSupabase(page, { profileName: "רחל כהן" });
    await stubFunctions(page, OK, {
      status: 200, body: { hasAccess: false, requiresPayment: true, webMonthly: { renewing: true, nextChargeAt: NEXT_CHARGE, expiresAt: EXPIRES } },
    });
    await signInToAccount(page);
    await expect(page.getByRole("button", { name: A.cancel })).toBeVisible();
  });

  test("an annual web subscription explains it does not renew", async ({ page }) => {
    await stubSupabase(page, { profileName: "רחל כהן" });
    await stubFunctions(page, OK, subscription({ planType: "ANNUAL", autoRenew: false }));
    await signInToAccount(page);
    await expect(page.getByText(A.annualNote)).toBeVisible();
    await expect(page.getByRole("button", { name: A.cancel })).toHaveCount(0);
  });

  test("no active subscription is said plainly, and focused", async ({ page }) => {
    await stubSupabase(page, { profileName: "רחל כהן" });
    await stubFunctions(page, OK, { status: 200, body: { hasAccess: false, requiresPayment: true } });
    await signInToAccount(page);
    await expect(page.getByText(A.none)).toBeFocused();
  });

  test("a failed load offers a retry that recovers", async ({ page }) => {
    await stubSupabase(page, { profileName: "רחל כהן" });
    let reply: Reply = { status: 500, body: { error: "x" } };
    await stubFunctions(page, OK, { status: 200, body: {} });
    await page.route(/\/functions\/v1\/checkUserSubscription$/, (route) => fulfil(route, reply));
    await signInToAccount(page);
    await expect(page.getByText(A.error)).toBeFocused();
    reply = subscription();
    await page.getByRole("button", { name: A.retry }).click();
    await expect(page.getByRole("heading", { name: A.plans.MONTHLY })).toBeFocused();
  });

  test("a wrong code is explained and the field keeps focus", async ({ page }) => {
    await stubSupabase(page, { profileName: "רחל כהן" });
    await stubFunctions(page, OK, subscription());
    await page.goto("/account/subscription");
    await page.getByLabel(COPY.register.phoneLabel, { exact: true }).fill("0501234567");
    await page.getByRole("button", { name: COPY.register.phoneCta }).click();
    await page.getByLabel(A.codeLabel).fill("000000");
    await page.getByRole("button", { name: A.verify }).click();
    await expect(page.getByRole("alert").filter({ hasText: COPY.otp.wrongCode })).toBeVisible();
    await expect(page.getByLabel(A.codeLabel)).toBeFocused();
    await page.getByRole("button", { name: COPY.otp.editPhone }).click();
    await expect(page.getByLabel(COPY.register.phoneLabel, { exact: true })).toHaveValue("0501234567");
  });

  test("the phone placeholder follows the gender saved by the questionnaire", async ({ page }) => {
    await stubSupabase(page);
    await page.goto("/");
    await page.evaluate(() => sessionStorage.setItem("ap.funnel.gender", "female"));
    await page.goto("/account/subscription");
    await expect(page.getByLabel(COPY.register.phoneLabel, { exact: true })).toHaveAttribute("placeholder", COPY.register.phonePlaceholder.fem);
  });

  test("not indexed, linked from the footer next to the legal pages, and reloads signed in", async ({ page }) => {
    await stubSupabase(page, { profileName: "רחל כהן" });
    await stubFunctions(page, OK, subscription());
    await page.goto("/");
    const footer = page.getByRole("contentinfo");
    await expect(footer.getByRole("link", { name: "מחיקת חשבון" })).toHaveAttribute("href", "/delete-account");
    await footer.getByRole("link", { name: A.title }).click();
    await expect(page).toHaveURL(/\/account\/subscription$/);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    await page.getByLabel(COPY.register.phoneLabel, { exact: true }).fill("0501234567");
    await page.getByRole("button", { name: COPY.register.phoneCta }).click();
    await page.getByLabel(A.codeLabel).fill(GOOD_CODE);
    await page.getByRole("button", { name: A.verify }).click();
    await expect(page.getByRole("heading", { name: A.plans.MONTHLY })).toBeVisible();
    await page.reload();
    await expect(page.getByRole("heading", { name: A.plans.MONTHLY })).toBeVisible();
    await expect(page.getByLabel(COPY.register.phoneLabel, { exact: true })).toHaveCount(0);
  });

  test("every state has no serious axe violations and no CSP violation", async ({ page }) => {
    // Reveal entrances fade content in; axe would measure contrast mid-fade.
    await page.emulateMedia({ reducedMotion: "reduce" });
    await stubSupabase(page, { profileName: "רחל כהן" });
    await stubFunctions(page, OK, subscription());
    await stubCancel(page);
    const violations = await watchCsp(page);
    const serious = async () => {
      const { violations: found } = await new AxeBuilder({ page }).analyze();
      return found.filter((v) => ["serious", "critical"].includes(v.impact ?? "")).map((v) => v.id);
    };
    await page.goto("/account/subscription");
    await expect(page.getByLabel(COPY.register.phoneLabel, { exact: true })).toBeVisible();
    expect(await serious()).toEqual([]);
    await page.getByLabel(COPY.register.phoneLabel, { exact: true }).fill("0501234567");
    await page.getByRole("button", { name: COPY.register.phoneCta }).click();
    await expect(page.getByLabel(A.codeLabel)).toBeVisible();
    expect(await serious()).toEqual([]);
    await page.getByLabel(A.codeLabel).fill(GOOD_CODE);
    await page.getByRole("button", { name: A.verify }).click();
    await expect(page.getByRole("button", { name: A.cancel })).toBeVisible();
    expect(await serious()).toEqual([]);
    await page.getByRole("button", { name: A.cancel }).click();
    expect(await serious()).toEqual([]);
    await page.getByRole("button", { name: A.confirmYes }).click();
    await expect(page.getByRole("status").filter({ hasText: "המנוי בוטל" })).toBeVisible();
    expect(await serious()).toEqual([]);
    expect(await violations()).toEqual([]);
  });

  test("every button and link on the page is at least 48px tall", async ({ page }) => {
    await stubSupabase(page, { profileName: "רחל כהן" });
    await stubFunctions(page, OK, subscription({ platform: null }));
    await signInToAccount(page);
    await expect(page.getByText(A.manual)).toBeVisible();
    const heights = await page.locator("#subscription a, #subscription button").evaluateAll((els) =>
      els.map((el) => Math.round(el.getBoundingClientRect().height)));
    expect(heights.length).toBeGreaterThan(0);
    for (const h of heights) expect(h).toBeGreaterThanOrEqual(48);
  });
});
