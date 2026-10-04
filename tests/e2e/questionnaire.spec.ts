import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { PLAN_BUILD_HOLD_MS, PLAN_BUILD_MS } from "../../lib/funnel/constants";
import { COPY } from "../../lib/funnel/copy";
import type { Answers, Step } from "../../lib/funnel/types";
import {
  captureEvents,
  choose,
  codeBox,
  expectStep,
  finishFromReinforcement,
  firstLine,
  next,
  open,
  reload,
  screen,
  seed,
  signIn,
  stored,
  title,
  walkToReinforcement,
} from "./funnel-helpers";
import { GOOD_CODE, stubSupabase } from "./supabase-stub";

/*
  The questionnaire keeps everything in localStorage until sign-in (covered in
  signin.spec.ts), so these tests drive the real page and read the stored
  session back.
*/

const THROUGH_FREQUENCY: Answers = {
  gender: "male",
  date_of_birth: "1961-01-01",
  aspiration_goal: "all",
  daily_activity_level: "mostly_sitting",
  chair_rise_capability: "alone",
  mobility_challenge: "stairs",
  training_frequency_choice: "almost_daily",
};

test.describe("with reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("the with_handles branch walks to sign-in and saves only that branch's answer", async ({ page }) => {
    await walkToReinforcement(page, "male", "with_handles", async () => {
      await expect(screen(page).locator("img")).toHaveAttribute("src", /social-proof-male/);
    });
    await expect(screen(page).locator("img")).toHaveAttribute("src", /reinforcement2-male/);
    await finishFromReinforcement(page);

    const { step, answers } = await stored(page);
    expect(step).toBe("register");
    expect(answers).toMatchObject({
      gender: "male",
      chair_rise_capability: "with_handles",
      standing_stability: "stable",
      pain_areas: ["knees"],
      training_time_of_day: "09:00",
    });
    expect(answers.date_of_birth).toMatch(/^\d{4}-01-01$/);
    expect(answers).not.toHaveProperty("mobility_challenge");
  });

  test("the other branch asks challengeArea, in the feminine, with the female images", async ({ page }) => {
    await walkToReinforcement(page, "female", "alone", async () => {
      await expect(screen(page).locator("img")).toHaveAttribute("src", /social-proof-female/);
      await expect(title(page)).toContainText("אלפי נשים");
    });
    await expect(screen(page).locator("img")).toHaveAttribute("src", /reinforcement2-female/);
    await finishFromReinforcement(page);

    const { answers } = await stored(page);
    expect(answers).toMatchObject({ gender: "female", chair_rise_capability: "alone", mobility_challenge: "stairs" });
    expect(answers).not.toHaveProperty("standing_stability");
  });

  test("continue stays disabled until an answer is chosen", async ({ page }) => {
    await open(page);
    await screen(page).getByRole("button", { name: COPY.welcome2.cta }).click();
    await expectStep(page, "gender");
    await expect(title(page)).toBeFocused();
    await expect(next(page)).toBeDisabled();
    await choose(page, "זכר");
    await expect(screen(page).getByRole("radio", { name: "זכר" })).toBeChecked();
    await expect(next(page)).toBeEnabled();
  });

  test("'no pain' excludes every other body area, both ways", async ({ page }) => {
    await seed(page, "bodyAreas", THROUGH_FREQUENCY);
    const area = (name: string) => screen(page).getByRole("button", { name, exact: true });
    const none = area(COPY.bodyAreas.options[7].label);

    await expect(next(page)).toBeDisabled();
    await area("ברך").click();
    await area("ירך").click();
    await expect(area("ברך")).toHaveAttribute("aria-pressed", "true");
    await expect(next(page)).toBeEnabled();

    await none.click();
    await expect(none).toHaveAttribute("aria-pressed", "true");
    await expect(area("ברך")).toHaveAttribute("aria-pressed", "false");
    await expect(area("ירך")).toHaveAttribute("aria-pressed", "false");

    await area("צוואר").click();
    await expect(none).toHaveAttribute("aria-pressed", "false");
    await expect(area("צוואר")).toHaveAttribute("aria-pressed", "true");
  });

  test("back from time goes to bodyAreas, not the loader", async ({ page }) => {
    await seed(page, "bodyAreas", THROUGH_FREQUENCY);
    await screen(page).getByRole("button", { name: "ברך" }).click();
    await next(page).click();
    await expectStep(page, "planBuilding");
    await next(page).click();
    await expectStep(page, "time");

    await choose(page, "צהריים");
    await next(page).click();
    await expect(title(page)).toContainText(firstLine(COPY.time.hourTitle.midday));
    await page.getByRole("button", { name: COPY.chrome.back }).click();
    await expect(title(page)).toContainText(firstLine(COPY.time.periodTitle));
    await page.getByRole("button", { name: COPY.chrome.back }).click();
    await expectStep(page, "bodyAreas");
    await expect(screen(page).getByRole("button", { name: "ברך" })).toHaveAttribute("aria-pressed", "true");
  });

  test("the other-hour picker saves a 15-minute slot and moves on, as the app does", async ({ page }) => {
    await seed(page, "time", { ...THROUGH_FREQUENCY, pain_areas: ["none"] });
    await choose(page, "אחר הצהריים");
    await next(page).click();
    await screen(page).getByRole("button", { name: COPY.time.otherHour.masc }).click();
    const picker = screen(page).getByLabel(COPY.time.pickerTitle.masc, { exact: true });
    await expect(picker).toBeFocused();
    await picker.selectOption("19:45");
    await screen(page).getByRole("button", { name: COPY.time.pickerConfirm }).click();
    await expectStep(page, "register");
    expect((await stored(page)).answers.training_time_of_day).toBe("19:45");
  });

  test("the custom-time button and picker label speak in the feminine to a woman", async ({ page }) => {
    await seed(page, "time", { ...THROUGH_FREQUENCY, gender: "female", pain_areas: ["none"] });
    await choose(page, "בוקר");
    await next(page).click();
    await screen(page).getByRole("button", { name: "בחרי שעה אחרת שמתאימה לי" }).click();
    await expect(screen(page).getByLabel("בחרי שעה", { exact: true })).toBeFocused();
  });

  test("a reload resumes on the same step with the answers kept", async ({ page }) => {
    await walkToReinforcement(page, "male", "alone");
    await reload(page);
    await expectStep(page, "reinforcement2");
    await expect(title(page)).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.dataset.funnelResume)).toBeUndefined();
    await page.getByRole("button", { name: COPY.chrome.back }).click();
    await expectStep(page, "challengeArea");
    await expect(screen(page).getByRole("radio", { name: COPY.challengeArea.options[0].label })).toBeChecked();
  });

  test("before the page's JavaScript runs, a returning visitor never sees welcome2", async ({ page }) => {
    await seed(page, "chairRise", { gender: "male", date_of_birth: "1961-01-01", aspiration_goal: "all", daily_activity_level: "mostly_sitting" });
    // Block every script file: only the inline resume check can run, as in the moment before hydration.
    await page.route("**/*.js", (route) => route.abort());
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-funnel-resume", "");
    await expect(page.locator('section[data-step="welcome2"]')).toBeHidden();
  });

  test("a first-time visitor sees welcome2 straight from the server", async ({ page }) => {
    await page.route("**/*.js", (route) => route.abort());
    await page.goto("/questionnaire");
    await expect(page.locator("html")).not.toHaveAttribute("data-funnel-resume");
    await expect(page.locator('section[data-step="welcome2"]').getByRole("heading")).toBeVisible();
  });

  test("cancel leaves for the home page and keeps the answers", async ({ page }) => {
    await seed(page, "chairRise", { gender: "male", date_of_birth: "1961-01-01", aspiration_goal: "all", daily_activity_level: "mostly_sitting" });
    await page.getByRole("link", { name: COPY.chrome.cancel }).click();
    await expect(page).toHaveURL(/\/$/);
    expect((await stored(page)).answers.gender).toBe("male");
  });

  test("the plan loader is finished on arrival and waits for continue, without back or cancel", async ({ page }) => {
    await seed(page, "bodyAreas", THROUGH_FREQUENCY);
    await screen(page).getByRole("button", { name: "ברך" }).click();
    await next(page).click();
    await expectStep(page, "planBuilding");
    await expect(screen(page).getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");
    await expect(next(page)).toBeVisible();
    await expect(page.getByRole("button", { name: COPY.chrome.back })).toBeHidden();
    await expect(page.getByRole("link", { name: COPY.chrome.cancel })).toHaveCount(0);
  });

  const AXE_STEPS: { step: Step; answers: Answers }[] = [
    { step: "gender", answers: {} },
    { step: "bodyAreas", answers: THROUGH_FREQUENCY },
    { step: "socialProof", answers: { gender: "female", date_of_birth: "1961-01-01" } },
  ];
  for (const { step, answers } of AXE_STEPS) {
    test(`${step} has no serious axe violations`, async ({ page }) => {
      await seed(page, step, answers);
      const { violations } = await new AxeBuilder({ page }).analyze();
      expect(violations.filter((v) => ["serious", "critical"].includes(v.impact ?? ""))).toEqual([]);
    });
  }
});

test("with motion, the plan loader counts up and moves on to time by itself", async ({ page }) => {
  await seed(page, "bodyAreas", THROUGH_FREQUENCY);
  await screen(page).getByRole("button", { name: "ברך" }).click();
  await next(page).click();
  await expectStep(page, "planBuilding");
  await expect(next(page)).toHaveCount(0);
  await expect.poll(async () => Number(await screen(page).getByRole("progressbar").getAttribute("aria-valuenow"))).toBeGreaterThan(0);
  await expectStep(page, "time", PLAN_BUILD_MS + PLAN_BUILD_HOLD_MS + 5_000);
  await expect(title(page)).toBeFocused();
});

/*
  Walks that end in a real sign-in against stubbed Supabase (tests/e2e/supabase-stub.ts),
  asserting what is sent to merge_funnel_session and to /api/funnel-event. The analytics
  route is answered in the browser (204), so no server insert ever happens here.
*/
const noOverflow = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);

test.describe("a full walk with a stubbed sign-in", () => {
  test.use({ reducedMotion: "reduce" });
  let stub: Awaited<ReturnType<typeof stubSupabase>> | null = null;

  test.afterEach(() => {
    expect(stub?.foreign ?? []).toEqual([]);
    stub = null;
  });

  test("female, chair alone, knees and neck, morning 09:00: merged in the fixed order and on to /payment", async ({ page }) => {
    stub = await stubSupabase(page);
    const beacons = await captureEvents(page);
    await walkToReinforcement(page, "female", "alone");
    await finishFromReinforcement(page, ["צוואר"]);
    await signIn(page, "רחל כהן");
    expect(await noOverflow(page)).toBe(true);
    await codeBox(page).fill(GOOD_CODE);
    await expect(page).toHaveURL(/\/payment$/);

    const [merge] = stub.to("/rest/v1/rpc/merge_funnel_session");
    const answers = (merge.body as { p_answers: Answers }).p_answers;
    expect(answers.pain_areas).toEqual(["neck", "knees"]);
    expect(answers.date_of_birth).toMatch(/-01-01$/);
    expect(answers.training_time_of_day).toBe("09:00");
    expect(answers).not.toHaveProperty("standing_stability");

    // Events carry the app's names, once per visit, in walk order.
    await expect.poll(() => beacons.events.at(-1)?.step).toBe("otp_verified");
    expect(beacons.events.map((e) => e.step)).toEqual([
      "welcome2_view",
      "welcome2_continue",
      "questionnaire_q5_view",
      "dob_view",
      "social_proof_view",
      "social_proof_continue",
      "questionnaire_aspiration_view",
      "activity_level_view",
      "questionnaire_chair_rise_view",
      "challenge_area_view",
      "reinforcement2_view",
      "reinforcement2_continue",
      "training_frequency_view",
      "questionnaire_q6_view",
      "plan_build_view",
      "plan_build_complete",
      "questionnaire_q8_view",
      "register_view",
      "register_name_submit",
      "register_submit",
      "otp_view",
      "otp_verified",
    ]);
    const merged = (merge.body as { p_session_id: string }).p_session_id;
    for (const event of beacons.events.slice(2)) expect(event.sessionId).toBe(merged);

    // No personal details in anything sent: not the name, the phone, or the code.
    const sent = beacons.raw.join("\n");
    for (const secret of ["רחל", "כהן", "0501234567", "501234567", GOOD_CODE]) expect(sent).not.toContain(secret);
  });

  test("with storage blocked, every event after the start and the merge share one session id", async ({ page }) => {
    // As in a browser that refuses site storage: touching localStorage throws.
    await page.addInitScript(() => {
      Object.defineProperty(window, "localStorage", {
        configurable: true,
        get() {
          throw new DOMException("The operation is insecure.", "SecurityError");
        },
      });
    });
    stub = await stubSupabase(page);
    const beacons = await captureEvents(page);
    await walkToReinforcement(page, "male", "alone");
    await finishFromReinforcement(page);
    await signIn(page, "דוד כהן");
    await codeBox(page).fill(GOOD_CODE);
    await expect(page).toHaveURL(/\/payment$/);
    await expect.poll(() => beacons.events.at(-1)?.step).toBe("otp_verified");

    const merged = (stub.to("/rest/v1/rpc/merge_funnel_session")[0].body as { p_session_id: string }).p_session_id;
    const [view, start, ...rest] = beacons.events;
    expect([view.step, start.step]).toEqual(["welcome2_view", "welcome2_continue"]);
    expect(start.sessionId).toBe(view.sessionId);
    expect(rest.length).toBeGreaterThan(10);
    for (const event of rest) expect(event.sessionId, event.step).toBe(merged);
    expect(merged).not.toBe(view.sessionId);
  });

  test("changing the chair answer after standingComfort drops standing_stability and asks challengeArea", async ({ page }) => {
    stub = await stubSupabase(page);
    await seed(page, "chairRise", {
      gender: "male",
      date_of_birth: "1961-01-01",
      aspiration_goal: "all",
      daily_activity_level: "mostly_sitting",
    });
    await choose(page, COPY.chairRise.options[2].masc);
    await next(page).click();
    await expectStep(page, "standingComfort");
    await choose(page, COPY.standingComfort.options[2].masc); // seated
    await page.getByRole("button", { name: COPY.chrome.back }).click();
    await expectStep(page, "chairRise");
    await choose(page, COPY.chairRise.options[1].masc);
    await next(page).click();
    await expectStep(page, "challengeArea");
    await choose(page, COPY.challengeArea.options[0].label);
    await next(page).click();
    await expectStep(page, "reinforcement2");
    await finishFromReinforcement(page);
    await signIn(page, "דוד כהן");
    await codeBox(page).fill(GOOD_CODE);
    await expect(page).toHaveURL(/\/payment$/);

    const answers = (stub.to("/rest/v1/rpc/merge_funnel_session")[0].body as { p_answers: Answers }).p_answers;
    expect(answers).toMatchObject({ chair_rise_capability: "with_support", mobility_challenge: "stairs" });
    expect(answers).not.toHaveProperty("standing_stability");
  });
});

test.describe("resume and layout", () => {
  test.use({ reducedMotion: "reduce" });

  test("a reload at bodyAreas resumes there with the earlier answers intact", async ({ page }) => {
    await seed(page, "bodyAreas", THROUGH_FREQUENCY);
    await reload(page);
    await expectStep(page, "bodyAreas");
    expect((await stored(page)).answers).toEqual(THROUGH_FREQUENCY);
    await page.getByRole("button", { name: COPY.chrome.back }).click();
    await expectStep(page, "frequency");
    await expect(screen(page).getByRole("radio", { name: (COPY.frequency.options[0] as { label: string }).label })).toBeChecked();
  });

  const LAYOUT_STEPS: Step[] = [
    "welcome2", "gender", "dob", "socialProof", "aspiration", "activityLevel", "chairRise",
    "challengeArea", "standingComfort", "reinforcement2", "frequency", "bodyAreas", "time", "register",
  ];
  test("no step overflows the viewport horizontally", async ({ page }) => {
    for (const step of LAYOUT_STEPS) {
      await seed(page, step, { ...THROUGH_FREQUENCY, pain_areas: ["knees"], training_time_of_day: "09:00", chair_rise_capability: step === "standingComfort" ? "with_handles" : "alone" });
      expect(await noOverflow(page), `overflow on ${step}`).toBe(true);
    }
    await seed(page, "bodyAreas", THROUGH_FREQUENCY);
    await screen(page).getByRole("button", { name: "ברך" }).click();
    await next(page).click();
    await expectStep(page, "planBuilding");
    expect(await noOverflow(page), "overflow on planBuilding").toBe(true);
  });
});
