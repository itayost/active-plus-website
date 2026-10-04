import { expect, test } from "@playwright/test";

test("fit check button is one line and visible", async ({ page }) => {
  await page.goto("/");
  const cta = page.getByRole("banner").getByRole("link", { name: "בדיקת התאמה" });
  await expect(cta).toBeVisible();
  const box = await cta.boundingBox();
  expect(box!.height).toBeLessThan(64); // one line at 52-60px, two lines would be ~90
  await expect(cta).toHaveAttribute("href", "/questionnaire");
});

test("footer links both legal pages", async ({ page }) => {
  await page.goto("/");
  const footer = page.getByRole("contentinfo");
  await expect(footer.getByRole("link", { name: "מחיקת חשבון" })).toHaveAttribute("href", "/delete-account");
  await expect(footer.getByRole("link", { name: "מדיניות פרטיות" })).toHaveAttribute("href", "/privacy-policy");
});

test("no horizontal overflow", async ({ page }) => {
  await page.goto("/");
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
});

test("sitemap lists the delete-account page", async ({ request }) => {
  const xml = await (await request.get("/sitemap.xml")).text();
  expect(xml).toContain("/delete-account");
  expect(xml).toContain("/privacy-policy");
});

for (const size of [
  { width: 320, height: 700 },
  { width: 390, height: 844 },
]) {
  test(`header fits at ${size.width}px`, async ({ page }) => {
    await page.setViewportSize(size);
    await page.goto("/delete-account");
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
    const cta = page.getByRole("banner").getByRole("link", { name: "בדיקת התאמה" });
    await expect(cta).toBeVisible();
    expect(await cta.evaluate((el) => getComputedStyle(el).whiteSpace)).toBe("nowrap");
  });
}
