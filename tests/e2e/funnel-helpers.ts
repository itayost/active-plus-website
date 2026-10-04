import { expect, type Page } from "@playwright/test";
import { OTP_LENGTH } from "../../lib/funnel/constants";
import { COPY } from "../../lib/funnel/copy";
import type { Answers, Step } from "../../lib/funnel/types";

/*
  Shared by the questionnaire and sign-in specs. Waits are on headings and
  attributes only.
*/

export const title = (page: Page) => page.locator("#funnel-step-title");
export const screen = (page: Page) => page.locator("main section[data-step]");
export const next = (page: Page) => screen(page).getByRole("button", { name: COPY.common.next, exact: true });
export const choose = (page: Page, label: string) =>
  screen(page).getByRole("radiogroup").getByText(label, { exact: true }).click();
export const firstLine = (text: string) => text.split("\n")[0];

/** The funnel marks itself ready once the saved session (if any) has been restored. */
export async function open(page: Page) {
  await page.goto("/questionnaire");
  await expect(page.locator("[data-funnel-root][data-ready]")).toBeAttached();
}

export async function reload(page: Page) {
  await page.reload();
  await expect(page.locator("[data-funnel-root][data-ready]")).toBeAttached();
}

export async function expectStep(page: Page, step: Step, timeout?: number) {
  await expect(screen(page)).toHaveAttribute("data-step", step, { timeout });
}

export async function stored(page: Page): Promise<{ step: string | null; answers: Answers }> {
  return page.evaluate(() => ({
    step: localStorage.getItem("ap.funnel.step"),
    answers: JSON.parse(localStorage.getItem("ap.funnel.answers") ?? "{}"),
  }));
}

/** Resume straight into a step with these answers, as a returning visitor would. */
export async function seed(page: Page, step: Step, answers: Answers) {
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

/** welcome2 -> reinforcement2, on the chair branch the visitor picks. */
export async function walkToReinforcement(
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

/** reinforcement2 -> register's name screen. */
export async function finishFromReinforcement(page: Page, moreAreas: string[] = []) {
  await next(page).click();
  await expectStep(page, "frequency");
  await choose(page, (COPY.frequency.options[0] as { label: string }).label);
  await next(page).click();

  await expectStep(page, "bodyAreas");
  await screen(page).getByRole("button", { name: "ברך" }).click();
  for (const area of moreAreas) await screen(page).getByRole("button", { name: area }).click();
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
  await expect(page.getByRole("progressbar", { name: COPY.register.nameHeader })).toBeVisible();
}


export type Beacon = { sessionId: string; step: string; data?: Record<string, unknown> };

/** Answers /api/funnel-event in the browser (204) and keeps every beacon sent. */
export async function captureEvents(page: Page) {
  const events: Beacon[] = [];
  const raw: string[] = [];
  await page.route("**/api/funnel-event", async (route) => {
    const text = route.request().postData() ?? "";
    raw.push(text);
    try {
      events.push(JSON.parse(text) as Beacon);
    } catch {
      // A malformed beacon fails the assertions below by being absent.
    }
    await route.fulfill({ status: 204 });
  });
  return { events, raw };
}

/** register name -> phone -> otp, with the stubbed send. */
export async function signIn(page: Page, name: string) {
  await screen(page).getByRole("textbox").fill(name);
  await screen(page).getByRole("button", { name: COPY.register.nameCta }).click();
  await screen(page).getByLabel(COPY.register.phoneLabel, { exact: true }).fill("050-123-4567");
  await screen(page).getByRole("button", { name: COPY.register.phoneCta }).click();
  await expectStep(page, "otp");
}

export const codeBox = (page: Page) => screen(page).getByLabel(COPY.otp.codeLabel.replace("{n}", String(OTP_LENGTH)));

/**
 * For asserting that something did NOT happen after a reply the test released:
 * runs two macrotasks in the page, by which time the reply's continuation (a few
 * promise hops) has run. Pair it with a positive anchor wherever one exists.
 */
export const settle = (page: Page) =>
  page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        setTimeout(() => setTimeout(resolve, 0), 0);
      }),
  );

/** The Supabase browser client keeps its session in a cookie, written once it has read a verify reply. */
export const hasAuthCookie = (page: Page) =>
  page.evaluate(() => document.cookie.split("; ").some((c) => /^sb-[^=]+-auth-token(\.\d+)?=/.test(c)));
