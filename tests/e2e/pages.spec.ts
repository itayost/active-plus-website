import { expect, test } from "@playwright/test";
import { SITE_ROUTES } from "../../lib/routes";

for (const route of SITE_ROUTES) {
  test(`${route} renders without overflow`, async ({ page }) => {
    const res = await page.goto(route);
    expect(res?.status()).toBe(200);
    await expect(page.locator("h1")).toHaveCount(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  });
}

test("/contact has the lead form with a topic select", async ({ page }) => {
  await page.goto("/contact");
  await expect(page.locator("form select[name=\"topic\"]")).toHaveCount(1);
});
