import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { CONTACT_PHONE, CONTACT_PHONE_TEL } from "../../lib/constants";
import { OTP_LENGTH, RESEND_SECONDS } from "../../lib/funnel/constants";
import { COPY } from "../../lib/funnel/copy";
import type { Answers } from "../../lib/funnel/types";
import { expectStep, hasAuthCookie, screen, seed, settle, stored, title } from "./funnel-helpers";
import { ACCESS_TOKEN, GOOD_CODE, stubSupabase, type StubOptions } from "./supabase-stub";

/*
  Sign-in against stubbed Supabase only (tests/e2e/supabase-stub.ts): the e2e
  server is built with an unresolvable Supabase host, and every auth and REST
  call is answered by page.route. No SMS is ever sent.
*/

const R = COPY.register;
const O = COPY.otp;

/** Every question answered (female, chair "alone"), plus a stale answer from the other branch. */
const ANSWERED: Answers = {
  gender: "female",
  date_of_birth: "1958-01-01",
  aspiration_goal: "family",
  daily_activity_level: "partially_active",
  chair_rise_capability: "alone",
  mobility_challenge: "walking",
  standing_stability: "seated",
  training_frequency_choice: "three_week",
  pain_areas: ["knees"],
  training_time_of_day: "09:00",
};

const back = (page: Page) => page.getByRole("button", { name: COPY.chrome.back });
const nameInput = (page: Page) => screen(page).getByRole("textbox", { name: R.nameTitle.fem });
const phoneInput = (page: Page) => screen(page).getByLabel(R.phoneLabel, { exact: true });
const codeInput = (page: Page) => screen(page).getByLabel(O.codeLabel.replace("{n}", String(OTP_LENGTH)));

let stub: Awaited<ReturnType<typeof stubSupabase>> | null = null;

async function start(page: Page, options?: StubOptions) {
  stub = await stubSupabase(page, options);
  await seed(page, "register", ANSWERED);
  return stub;
}

// Every sign-in test: nothing may have left for a host other than the app and the stub.
test.afterEach(() => {
  expect(stub?.foreign ?? []).toEqual([]);
  stub = null;
});

async function toPhone(page: Page, name = "רחל כהן") {
  await nameInput(page).fill(name);
  await screen(page).getByRole("button", { name: R.nameCta }).click();
  await expect(page.getByRole("progressbar", { name: R.phoneHeader })).toBeVisible();
}

async function toOtp(page: Page, phone = "050-123-4567") {
  await toPhone(page);
  await phoneInput(page).fill(phone);
  await screen(page).getByRole("button", { name: R.phoneCta }).click();
  await expectStep(page, "otp");
}

test.use({ reducedMotion: "reduce" });

test("the name needs two letters, then the phone screen keeps it", async ({ page }) => {
  await start(page);
  await expect(page.getByRole("progressbar", { name: R.nameHeader })).toHaveAttribute("aria-valuenow", "50");
  await nameInput(page).fill(" א ");
  await screen(page).getByRole("button", { name: R.nameCta }).click();
  await expect(screen(page).getByRole("alert")).toHaveText(R.nameError);
  await expect(nameInput(page)).toHaveAttribute("aria-describedby", "funnel-name-error");

  await toPhone(page, "רחל");
  await expect(page.getByRole("progressbar", { name: R.phoneHeader })).toHaveAttribute("aria-valuenow", "100");
  await expect(title(page)).toBeFocused();
  expect((await stored(page)).answers.full_name).toBe("רחל");

  await back(page).click();
  await expect(nameInput(page)).toHaveValue("רחל");
  await back(page).click();
  await expectStep(page, "time");
});

for (const [kind, phone] of [["a landline", "03-1234567"], ["a short number", "050-12345"]] as const) {
  test(`${kind} is refused before any code is sent`, async ({ page }) => {
    const stub = await start(page);
    await toPhone(page);
    await phoneInput(page).fill(phone);
    await screen(page).getByRole("button", { name: R.phoneCta }).click();

    const alert = screen(page).getByRole("alert");
    await expect(alert).toHaveText(R.phoneError);
    await expect(phoneInput(page)).toHaveAttribute("aria-invalid", "true");
    const describedBy = (await phoneInput(page).getAttribute("aria-describedby")) ?? "";
    expect(describedBy.split(" ")).toContain(await alert.getAttribute("id"));
    await expect(phoneInput(page)).toBeFocused();
    expect(stub.to("/auth/v1/otp")).toHaveLength(0);
  });
}

test("a refused send says so and stays on the phone screen", async ({ page }) => {
  await start(page, { otpStatuses: [500] });
  await toPhone(page);
  await phoneInput(page).fill("0501234567");
  await screen(page).getByRole("button", { name: R.phoneCta }).click();
  await expect(screen(page).getByRole("alert")).toHaveText(R.sendFailed);
  await expectStep(page, "register");
});

test("the code goes to the E.164 number and the otp screen shows it", async ({ page }) => {
  const stub = await start(page);
  await toOtp(page, "+972 50-123-4567");
  expect(stub.to("/auth/v1/otp")[0].body).toMatchObject({ phone: "+972501234567" });
  await expect(screen(page)).toContainText("ל-050-1234567");
  await expect(codeInput(page)).toHaveAttribute("autocomplete", "one-time-code");
  await expect(codeInput(page)).toHaveAttribute("inputmode", "numeric");
});

test("the code verifies by itself at the sixth digit", async ({ page }) => {
  const stub = await start(page);
  await toOtp(page);
  await codeInput(page).pressSequentially(GOOD_CODE.slice(0, OTP_LENGTH - 1));
  expect(stub.to("/auth/v1/verify")).toHaveLength(0);
  await codeInput(page).pressSequentially(GOOD_CODE.slice(-1));
  await expect.poll(() => stub.to("/auth/v1/verify").length).toBe(1);
  expect(stub.to("/auth/v1/verify")[0].body).toMatchObject({ phone: "+972501234567", token: GOOD_CODE, type: "sms" });
});

test("a wrong code is cleared with an error, and nothing is merged", async ({ page }) => {
  const stub = await start(page);
  await toOtp(page);
  await codeInput(page).fill("000000");
  await expect(screen(page).getByRole("alert")).toHaveText(O.wrongCode);
  await expect(codeInput(page)).toHaveValue("");
  await expect(codeInput(page)).toHaveAttribute("aria-invalid", "true");
  await expect(codeInput(page)).toHaveAttribute("aria-describedby", "funnel-otp-error");
  expect(stub.calls.filter((c) => c.path.startsWith("/rest/"))).toEqual([]);
});

test("resend waits out the countdown, then sends again", async ({ page }) => {
  await page.clock.install();
  const stub = await start(page);
  await toOtp(page);
  await expect(screen(page)).toContainText(O.resendIn.replace("{n}", String(RESEND_SECONDS)));
  await expect(screen(page).getByRole("button", { name: O.resend })).toHaveCount(0);

  await page.clock.fastForward(RESEND_SECONDS * 1000);
  await screen(page).getByRole("button", { name: O.resend }).click();
  await expect.poll(() => stub.to("/auth/v1/otp").length).toBe(2);
  await expect(screen(page)).toContainText(O.resendIn.replace("{n}", String(RESEND_SECONDS)));
});

test("'ערוך מספר' goes back to the phone screen with the number filled in", async ({ page }) => {
  await start(page);
  await toOtp(page, "050-1234567");
  await screen(page).getByRole("button", { name: O.editPhone }).click();
  await expectStep(page, "register");
  await expect(phoneInput(page)).toHaveValue("050-1234567");
  await expect(page.getByRole("progressbar", { name: R.phoneHeader })).toBeVisible();
});

test("a new user's answers are merged with the session id, then on to /payment", async ({ page }) => {
  const stub = await start(page);
  const sessionId = await page.evaluate(() => localStorage.getItem("ap.funnel.session_id"));
  await toOtp(page);
  await codeInput(page).fill(GOOD_CODE);
  await expect(page).toHaveURL(/\/payment$/);

  const [merge] = stub.to("/rest/v1/rpc/merge_funnel_session");
  expect(merge.authorization).toBe(`Bearer ${ACCESS_TOKEN}`);
  const expected = Object.fromEntries(Object.entries(ANSWERED).filter(([key]) => key !== "standing_stability"));
  expect(merge.body).toEqual({ p_session_id: sessionId, p_answers: { ...expected, full_name: "רחל כהן" } });
  expect(merge.body).not.toHaveProperty("p_answers.standing_stability");
  expect(stub.to("/rest/v1/rpc/fill_missing_funnel_answers")).toHaveLength(0);

  const after = await page.evaluate(() => ({
    gender: sessionStorage.getItem("ap.funnel.gender"),
    keys: ["ap.funnel.session_id", "ap.funnel.answers", "ap.funnel.step"].map((k) => localStorage.getItem(k)),
  }));
  expect(after).toEqual({ gender: "female", keys: [null, null, null] });
});

test("an existing user only gets missing answers filled, keeps their name, and is welcomed back", async ({ page }) => {
  const stub = await start(page, { profileName: "דוד לוי" });
  await toOtp(page);
  await codeInput(page).fill(GOOD_CODE);

  await expect(title(page)).toHaveText(O.welcomeBack.replace("{name}", "דוד לוי"));
  await expect(title(page)).toBeFocused();
  await expect(screen(page).getByRole("link", { name: O.toPayment })).toHaveAttribute("href", "/payment");
  await expect(back(page)).toBeHidden();
  await expect(page.getByRole("link", { name: COPY.chrome.cancel })).toHaveCount(0);

  const [fill] = stub.to("/rest/v1/rpc/fill_missing_funnel_answers");
  expect(fill.authorization).toBe(`Bearer ${ACCESS_TOKEN}`);
  expect(fill.body).not.toHaveProperty("p_answers.full_name");
  expect(fill.body).toHaveProperty("p_answers.gender", "female");
  expect(stub.to("/rest/v1/rpc/merge_funnel_session")).toHaveLength(0);

  await screen(page).getByRole("link", { name: O.toPayment }).click();
  await expect(page).toHaveURL(/\/payment$/);
});

test("a failed merge offers 'נסו שוב', which retries the merge only", async ({ page }) => {
  const stub = await start(page, { mergeStatuses: [500, 200] });
  await toOtp(page);
  await codeInput(page).fill(GOOD_CODE);

  await expect(title(page)).toHaveText(O.mergeFailed);
  await expect(title(page)).toBeFocused();
  await screen(page).getByRole("button", { name: O.retry }).click();
  await expect(page).toHaveURL(/\/payment$/);
  expect(stub.to("/auth/v1/verify")).toHaveLength(1);
  expect(stub.to("/rest/v1/rpc/merge_funnel_session")).toHaveLength(2);
});

test("a signed-in user with a name but no trainee profile is pointed to the phone, not to a retry", async ({ page }) => {
  const stub = await start(page, {
    profileName: "מאמנת בדיקה",
    fillError: { code: "P0002", message: "no trainee profile for the authenticated user" },
  });
  await toOtp(page);
  await codeInput(page).fill(GOOD_CODE);

  await expect(title(page)).toHaveText(O.noProfile);
  await expect(title(page)).toBeFocused();
  await expect(screen(page).getByRole("link", { name: CONTACT_PHONE })).toHaveAttribute("href", `tel:${CONTACT_PHONE_TEL}`);
  await expect(screen(page).getByRole("button", { name: O.retry })).toHaveCount(0);
  await expect(page).toHaveURL(/\/questionnaire$/);
  expect(stub.to("/rest/v1/rpc/fill_missing_funnel_answers")).toHaveLength(1);
  expect(stub.to("/rest/v1/rpc/merge_funnel_session")).toHaveLength(0);
});

test("the phone screen with an error and the code screen have no serious axe violations", async ({ page }) => {
  await start(page);
  await toPhone(page);
  await phoneInput(page).fill("03-1234567");
  await screen(page).getByRole("button", { name: R.phoneCta }).click();
  await expect(screen(page).getByRole("alert")).toBeVisible();
  const serious = async () =>
    (await new AxeBuilder({ page }).analyze()).violations.filter((v) => ["serious", "critical"].includes(v.impact ?? ""));
  expect(await serious()).toEqual([]);

  await phoneInput(page).fill("0501234567");
  await screen(page).getByRole("button", { name: R.phoneCta }).click();
  await expectStep(page, "otp");
  expect(await serious()).toEqual([]);
});

test("while the code is sent, the button waits with its label and the form is busy", async ({ page }) => {
  const stub = await start(page);
  await toPhone(page);
  await phoneInput(page).fill("0501234567");
  const release = stub.hold("/auth/v1/otp");
  const send = screen(page).getByRole("button", { name: R.phoneCta });
  await send.click();
  await expect(send).toBeDisabled();
  await expect(screen(page).locator("form")).toHaveAttribute("aria-busy", "true");
  await send.click({ force: true });
  release();
  await expectStep(page, "otp");
  expect(stub.to("/auth/v1/otp")).toHaveLength(1);
});

test("while the code is checked, back, 'ערוך מספר' and resend are inert", async ({ page }) => {
  await page.clock.install();
  const stub = await start(page);
  await toOtp(page);
  await page.clock.fastForward(RESEND_SECONDS * 1000);
  const resend = screen(page).getByRole("button", { name: O.resend });
  const edit = screen(page).getByRole("button", { name: O.editPhone });
  await expect(resend).toBeEnabled();

  const release = stub.hold("/auth/v1/verify");
  await codeInput(page).fill(GOOD_CODE);
  await expect.poll(() => stub.to("/auth/v1/verify").length).toBe(1);
  await expect(resend).toBeDisabled();
  await expect(edit).toBeDisabled();
  await expect(back(page)).toBeHidden();
  await edit.click({ force: true });
  await resend.click({ force: true });
  await expectStep(page, "otp");

  release();
  await expect(page).toHaveURL(/\/payment$/);
  expect(stub.to("/auth/v1/otp")).toHaveLength(1);
});

test("a verify that answers after the visitor has left does not merge or move them to /payment", async ({ page }) => {
  const stub = await start(page);
  await toOtp(page);
  const release = stub.hold("/auth/v1/verify");
  await codeInput(page).fill(GOOD_CODE);
  await expect.poll(() => stub.to("/auth/v1/verify").length).toBe(1);
  await page.getByRole("link", { name: COPY.chrome.cancel }).click();
  await expect(page).toHaveURL(/\/$/);

  const answered = page.waitForResponse((r) => r.url().endsWith("/auth/v1/verify"));
  release();
  await answered;
  // The client has read the reply once it stores the session; whatever the funnel would do next starts there.
  await expect.poll(() => hasAuthCookie(page)).toBe(true);
  await settle(page);
  await expect(page).toHaveURL(/\/$/);
  expect(stub.calls.filter((c) => c.path.startsWith("/rest/") || c.path === "/auth/v1/user")).toEqual([]);
});

test("a retry after a merge that committed but failed in the browser still treats the visitor as new", async ({ page }) => {
  const stub = await start(page, { mergeStatuses: [500, 200], profileAfterMerge: "רחל כהן" });
  await toOtp(page);
  await codeInput(page).fill(GOOD_CODE);
  await expect(title(page)).toHaveText(O.mergeFailed);
  await screen(page).getByRole("button", { name: O.retry }).click();
  await expect(page).toHaveURL(/\/payment$/);
  expect(stub.to("/rest/v1/rpc/fill_missing_funnel_answers")).toHaveLength(1);
  expect(await page.evaluate(() => sessionStorage.getItem("ap.funnel.gender"))).toBe("female");
});

test("a refused resend says to wait, without marking the code as wrong", async ({ page }) => {
  await page.clock.install();
  await start(page, { otpStatuses: [200, 429] });
  await toOtp(page);
  await codeInput(page).pressSequentially("12");
  await page.clock.fastForward(RESEND_SECONDS * 1000);
  await screen(page).getByRole("button", { name: O.resend }).click();
  await expect(screen(page).getByRole("alert")).toHaveText(O.rateLimited);
  await expect(codeInput(page)).not.toHaveAttribute("aria-invalid", "true");
  await expect(codeInput(page)).toHaveValue("12");
});

test.describe("pasting", () => {
  test.use({ permissions: ["clipboard-read", "clipboard-write"] });

  test("a pasted '123 456' fills all six digits and verifies", async ({ page }) => {
    const stub = await start(page);
    await toOtp(page);
    await page.evaluate((text) => navigator.clipboard.writeText(text), "123 456");
    await codeInput(page).focus();
    await page.keyboard.press("ControlOrMeta+V");
    await expect.poll(() => stub.to("/auth/v1/verify").length).toBe(1);
    expect(stub.to("/auth/v1/verify")[0].body).toMatchObject({ token: GOOD_CODE });
  });
});
