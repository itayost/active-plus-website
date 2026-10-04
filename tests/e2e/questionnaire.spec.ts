import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { PLAN_BUILD_HOLD_MS, PLAN_BUILD_MS } from "../../lib/funnel/constants";
import { COPY } from "../../lib/funnel/copy";
import type { Answers, Step } from "../../lib/funnel/types";

/*
  The questionnaire keeps everything in localStorage (no network writes until
  sign-in, which is not built yet), so these tests drive the real page and
  read the stored session back. Waits are on headings and attributes only.
*/

const title = (page: Page) => page.locator("#funnel-step-title");
const screen = (page: Page) => page.locator("main section[data-step]");
const next = (page: Page) => screen(page).getByRole("button", { name: COPY.common.next, exact: true });
const choose = (page: Page, label: string) => screen(page).getByRole("radiogroup").getByText(label, { exact: true }).click();
const firstLine = (text: string) => text.split("\n")[0];

/** The funnel marks itself ready once the saved session (if any) has been restored. */
async function open(page: Page) {
  await page.goto("/questionnaire");
  await expect(page.locator("[data-funnel-root][data-ready]")).toBeAttached();
}

async function reload(page: Page) {
  await page.reload();
  await expect(page.locator("[data-funnel-root][data-ready]")).toBeAttached();
}

async function expectStep(page: Page, step: Step, timeout?: number) {
  await expect(screen(page)).toHaveAttribute("data-step", step, { timeout });
}

async function stored(page: Page): Promise<{ step: string | null; answers: Answers }> {
  return page.evaluate(() => ({
    step: localStorage.getItem("ap.funnel.step"),
    answers: JSON.parse(localStorage.getItem("ap.funnel.answers") ?? "{}"),
  }));
}

/** Resume straight into a step with these answers, as a returning visitor would. */
async function seed(page: Page, step: Step, answers: Answers) {
  await open(page);
  await page.evaluate(
    ([s, a]) => {
      localStorage.setItem("ap.funnel.step", s);
      localStorage.setItem("ap.funnel.answers", JSON.stringify(a));
    },
    [step, answers] as const,
  );
  await reload(page);
  await expectStep(page, step);
}

const THROUGH_FREQUENCY: Answers = {
  gender: "male",
  date_of_birth: "1961-01-01",
  aspiration_goal: "all",
  daily_activity_level: "mostly_sitting",
  chair_rise_capability: "alone",
  mobility_challenge: "stairs",
  training_frequency_choice: "almost_daily",
};

/** welcome2 -> reinforcement2, on the chair branch the visitor picks. */
async function walkToReinforcement(
  page: Page,
  gender: "male" | "female",
  chair: "alone" | "with_handles",
  onSocialProof: () => Promise<void> = async () => {},
) {
  const fem = gender === "female";
  await open(page);
  await screen(page).getByRole("button", { name: COPY.welcome2.cta }).click();

  await expectStep(page, "gender");
  await choose(page, fem ? "נקבה" : "זכר");
  await next(page).click();

  await expectStep(page, "dob");
  await next(page).click();

  await expectStep(page, "socialProof");
  await onSocialProof();
  await next(page).click();

  await expectStep(page, "aspiration");
  await choose(page, COPY.aspiration.options[3].label);
  await next(page).click();

  await expectStep(page, "activityLevel");
  await choose(page, COPY.activityLevel.options[2].masc);
  await next(page).click();

  await expectStep(page, "chairRise");
  await expect(page.getByRole("img", { name: "שלב 4 מתוך 8" })).toBeVisible();
  const chairOption = COPY.chairRise.options.find((o) => o.value === chair)!;
  await choose(page, fem ? chairOption.fem : chairOption.masc);
  await next(page).click();

  if (chair === "with_handles") {
    await expectStep(page, "standingComfort");
    await expect(title(page)).toHaveText(fem ? COPY.standingComfort.title.fem : COPY.standingComfort.title.masc);
    await choose(page, fem ? COPY.standingComfort.options[0].fem : COPY.standingComfort.options[0].masc);
  } else {
    await expectStep(page, "challengeArea");
    await choose(page, COPY.challengeArea.options[0].label);
  }
  await next(page).click();
  await expectStep(page, "reinforcement2");
}

/** reinforcement2 -> the sign-in stub. */
async function finishFromReinforcement(page: Page) {
  await next(page).click();
  await expectStep(page, "frequency");
  await choose(page, (COPY.frequency.options[0] as { label: string }).label);
  await next(page).click();

  await expectStep(page, "bodyAreas");
  await screen(page).getByRole("button", { name: "ברך" }).click();
  await next(page).click();

  await expectStep(page, "planBuilding");
  await next(page).click(); // reduced motion: the loader waits for a tap

  await expectStep(page, "time");
  await choose(page, "בוקר");
  await next(page).click();
  await expect(title(page)).toContainText(firstLine(COPY.time.hourTitle.morning));
  await choose(page, "09:00");
  await next(page).click();

  await expectStep(page, "register");
  await expect(title(page)).toHaveText(COPY.stub.title);
}

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
