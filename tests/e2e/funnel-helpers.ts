import { expect, type Page } from "@playwright/test";
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
