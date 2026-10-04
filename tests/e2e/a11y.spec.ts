import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const ROUTES = ["/", "/about", "/how-it-works", "/payment", "/articles", "/articles/body-after-50", "/personal-plan", "/delete-account"];

// Reveal entrances fade content in; axe would measure contrast mid-fade.
test.use({ reducedMotion: "reduce" });

for (const route of ROUTES) {
  test(`${route} has no serious axe violations`, async ({ page }) => {
    await page.goto(route);
    const { violations } = await new AxeBuilder({ page }).analyze();
    expect(violations.filter((v) => ["serious", "critical"].includes(v.impact ?? ""))).toEqual([]);
  });
}
