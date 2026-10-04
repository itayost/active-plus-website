import { expect, test, type Page } from "@playwright/test";
import { COPY } from "../../lib/funnel/copy";
import type { Answers } from "../../lib/funnel/types";
import { choose, codeBox, expectStep, next, open, reload, screen, seed, signIn, title } from "./funnel-helpers";
import { GOOD_CODE, stubSupabase } from "./supabase-stub";

/*
  The phone's back button or gesture walks the questionnaire back one screen
  at a time, the same as the funnel's own back arrow, and the two never
  disagree about where back leads. Where the funnel's back is hidden (gender,
  the loader, a code being checked) the gesture behaves to match.
*/

const TO_ACTIVITY: Answers = { gender: "male", date_of_birth: "1961-01-01", aspiration_goal: "all" };

const THROUGH_TIME: Answers = {
  gender: "female",
  date_of_birth: "1958-01-01",
  aspiration_goal: "family",
  daily_activity_level: "partially_active",
  chair_rise_capability: "alone",
  mobility_challenge: "walking",
  training_frequency_choice: "three_week",
  pain_areas: ["knees"],
  training_time_of_day: "09:00",
};

const chromeBack = (page: Page) => page.getByRole("button", { name: COPY.chrome.back });
const funnelEntry = (page: Page) => page.evaluate(() => (history.state as { apFunnel?: { idx: number } } | null)?.apFunnel?.idx);

test.use({ reducedMotion: "reduce" });

test("the phone's back from chairRise returns to activityLevel with its answer kept", async ({ page }) => {
  await seed(page, "activityLevel", TO_ACTIVITY);
  await choose(page, COPY.activityLevel.options[2].masc);
  await next(page).click();
  await expectStep(page, "chairRise");

  await page.goBack();
  await expectStep(page, "activityLevel");
  await expect(page).toHaveURL(/\/questionnaire$/);
  await expect(title(page)).toBeFocused();
  await expect(screen(page).getByRole("radio", { name: COPY.activityLevel.options[2].masc })).toBeChecked();
});

test("the back arrow and the phone's back stay in step, and forward cannot redo a screen", async ({ page }) => {
  await seed(page, "activityLevel", TO_ACTIVITY);
  await choose(page, COPY.activityLevel.options[2].masc);
  await next(page).click();
  await choose(page, COPY.chairRise.options[0].masc);
  await next(page).click();
  await expectStep(page, "challengeArea");

  await chromeBack(page).click();
  await expectStep(page, "chairRise");
  await page.goBack();
  await expectStep(page, "activityLevel");

  await page.goForward();
  await expect.poll(() => funnelEntry(page)).toBe(0);
  await expectStep(page, "activityLevel");
  await next(page).click();
  await expectStep(page, "chairRise");
  await page.goBack();
  await expectStep(page, "activityLevel");
});

test("the phone's back on gender leaves the questionnaire, as the hidden back arrow says", async ({ page }) => {
  await page.goto("/");
  await open(page);
  await screen(page).getByRole("button", { name: COPY.welcome2.cta }).click();
  await expectStep(page, "gender");
  await expect(chromeBack(page)).toBeHidden();

  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
});

test("after the session starts over, back from gender skips the old walk's screens", async ({ page }) => {
  await page.goto("/");
  await open(page);
  await screen(page).getByRole("button", { name: COPY.welcome2.cta }).click();
  await choose(page, "זכר");
  await next(page).click();
  await expectStep(page, "dob");
  await next(page).click();
  await expectStep(page, "socialProof");

  // A fresh session on the same history entry (the hand-off to /payment or an expired session).
  await page.evaluate(() => localStorage.clear());
  await reload(page);
  await expectStep(page, "welcome2");
  await screen(page).getByRole("button", { name: COPY.welcome2.cta }).click();
  await expectStep(page, "gender");

  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
});

test("the loader holds the back gesture, and back from time skips the loader to bodyAreas", async ({ page }) => {
  await seed(page, "bodyAreas", THROUGH_TIME);
  await next(page).click();
  await expectStep(page, "planBuilding");

  await page.goBack();
  await expectStep(page, "planBuilding");
  await next(page).click();
  await expectStep(page, "time");

  await page.goBack();
  await expectStep(page, "bodyAreas");
});

test.describe("sign-in", () => {
  let stub: Awaited<ReturnType<typeof stubSupabase>> | null = null;

  test.afterEach(() => {
    expect(stub?.foreign ?? []).toEqual([]);
    stub = null;
  });

  test("the phone's back while the code is checked stays on otp, then the sign-in finishes", async ({ page }) => {
    stub = await stubSupabase(page);
    await page.goto("/");
    await seed(page, "register", THROUGH_TIME);
    await signIn(page, "רחל כהן");

    const release = stub.hold("/auth/v1/verify");
    await codeBox(page).fill(GOOD_CODE);
    await expect.poll(() => stub?.to("/auth/v1/verify").length).toBe(1);
    await page.goBack();
    await expectStep(page, "otp");
    await expect(page).toHaveURL(/\/questionnaire$/);

    release();
    await expect(page).toHaveURL(/\/payment$/);
  });

  test("a two-entry jump back while the code is checked returns to otp and keeps every entry", async ({ page }) => {
    stub = await stubSupabase(page);
    await seed(page, "register", THROUGH_TIME);
    await signIn(page, "רחל כהן");
    const entries = await page.evaluate(() => history.length);

    const release = stub.hold("/auth/v1/verify");
    await codeBox(page).fill(GOOD_CODE);
    await expect.poll(() => stub?.to("/auth/v1/verify").length).toBe(1);
    await page.evaluate(() => history.go(-2)); // a long press on back, picking two screens back
    await expect.poll(() => funnelEntry(page)).toBe(2);
    await expectStep(page, "otp");
    expect(await page.evaluate(() => history.length)).toBe(entries);

    release();
    await expect(page).toHaveURL(/\/payment$/);
  });

  test("opened straight on /questionnaire in a new tab, every back press does something and gender's leaves", async ({ page }) => {
    // A link opened in a new tab (a Meta ad, an in-app browser): /questionnaire is the tab's first entry.
    await page.goto("/");
    await page.evaluate((answers) => {
      localStorage.setItem("ap.funnel.step", "register");
      localStorage.setItem("ap.funnel.answers", JSON.stringify(answers));
    }, THROUGH_TIME);
    const [tab] = await Promise.all([page.waitForEvent("popup"), page.evaluate(() => void window.open("/questionnaire"))]);
    stub = await stubSupabase(tab);
    await expect(tab.locator("[data-funnel-root][data-ready]")).toBeAttached();
    await expectStep(tab, "register");
    expect(await tab.evaluate(() => history.length)).toBe(1);

    await signIn(tab, "רחל כהן");
    await codeBox(tab).fill(GOOD_CODE);
    await expect(tab).toHaveURL(/\/payment$/);

    await tab.goBack();
    await expect(tab).toHaveURL(/\/questionnaire$/);
    await expect(tab.locator("[data-funnel-root][data-ready]")).toBeAttached();
    await expectStep(tab, "welcome2"); // the hand-off cleared the session
    await screen(tab).getByRole("button", { name: COPY.welcome2.cta }).click();
    await expectStep(tab, "gender");

    await tab.goBack();
    await expect(tab).toHaveURL(/\/$/);
  });

  test("'ערוך מספר' takes the otp screen off the back history", async ({ page }) => {
    stub = await stubSupabase(page);
    await seed(page, "register", THROUGH_TIME);
    await signIn(page, "רחל כהן");
    await screen(page).getByRole("button", { name: COPY.otp.editPhone }).click();
    await expect(page.getByRole("progressbar", { name: COPY.register.phoneHeader })).toBeVisible();

    await page.goBack();
    await expect(page.getByRole("progressbar", { name: COPY.register.nameHeader })).toBeVisible();
    await expectStep(page, "register");
  });
});
