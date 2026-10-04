import { expect, test } from "@playwright/test";

test("home has every brief section in order", async ({ page }) => {
  await page.goto("/");
  const headings = await page.locator("main h2").allInnerTexts();
  const order = ["מה חשוב לנו?", "מעטפת מקצועית במיוחד בשבילכם", "מה אומרים הלקוחות שלנו", "שיתופי פעולה", "השאירו פרטים ונחזור אליכם לתיאום", "שאלות ותשובות", "המסלול שמתאים בדיוק בשבילך"];
  const positions = order.map((h) => headings.findIndex((x) => x.includes(h)));
  expect(positions.every((p) => p >= 0)).toBe(true);
  expect([...positions].sort((a, b) => a - b)).toEqual(positions);
});

test("lead form asks for name and phone only", async ({ page }) => {
  await page.goto("/");
  const form = page.locator("#lead form");
  await expect(form.locator('input[name="fullName"]')).toBeVisible();
  await expect(form.locator('input[name="phone"]')).toBeVisible();
  await expect(form.locator('input[name="email"]')).toHaveCount(0);
});

test("each card opens its explainer", async ({ page }) => {
  await page.goto("/");
  const hrefs = await page.getByRole("link", { name: "תראו לי עוד" }).evaluateAll((els) => els.map((e) => e.getAttribute("href")));
  expect(hrefs).toEqual(["/personal-plan", "/motion-detection", "/progress"]);
});
