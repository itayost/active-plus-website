import { expect, test } from "@playwright/test";

test("home renders an h1", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("h1")).toBeVisible();
});
