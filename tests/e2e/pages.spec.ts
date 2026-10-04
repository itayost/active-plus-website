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
