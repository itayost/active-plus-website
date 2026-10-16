import { expect, test } from "@playwright/test";

test("home has every brief section in order", async ({ page }) => {
  await page.goto("/");
  // The h1 and the two top-half h2s, then the sections still to be rebuilt.
  const ids = await page.locator("main h1, main h2").evaluateAll((els) => els.map((e) => e.id));
  const top = ["hero-heading", "world-heading", "program-heading"].map((id) => ids.indexOf(id));
  expect(top.every((p) => p >= 0)).toBe(true);
  expect([...top].sort((a, b) => a - b)).toEqual(top);

  const headings = await page.locator("main h2").allInnerTexts();
  const order = ["מה אומרים הלקוחות שלנו", "שיתופי פעולה", "השאירו פרטים ונחזור אליכם לתיאום", "שאלות ותשובות", "המסלול שמתאים בדיוק בשבילך"];
  const positions = order.map((h) => headings.findIndex((x) => x.includes(h)));
  expect(positions.every((p) => p >= 0)).toBe(true);
  expect([...positions].sort((a, b) => a - b)).toEqual(positions);
});

test("hero: poster always, CTA to the questionnaire, video once motion is allowed", async ({ page }) => {
  await page.goto("/");
  const hero = page.locator("section[aria-labelledby='hero-heading']");
  await expect(hero.locator("img[src*='hero-poster']")).toHaveCount(1);
  const cta = hero.getByRole("link", { name: "לתוכנית אישית לחצו כאן" });
  await expect(cta).toHaveAttribute("href", "/questionnaire");
  // HeroVideo exposes its decision; wait for it rather than for a timeout.
  await expect(hero.locator("[data-hero-video]")).toHaveAttribute("data-hero-video", "on");
  await expect(hero.locator("video")).toHaveCount(1);
});

test("world cards list the four titles", async ({ page }) => {
  await page.goto("/");
  const titles = await page.locator("section[aria-labelledby='world-heading'] h3").allInnerTexts();
  expect(titles).toEqual(["לחזק את השרירים", "לאמן את המוח", "אתגרים", "התאמה אישית AI"]);
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

test("the fit-check bar under the program cards goes to the questionnaire", async ({ page }) => {
  await page.goto("/");
  const bar = page.getByRole("main").getByRole("link", { name: "לבדיקת התאמה", exact: true }).first();
  await expect(bar).toHaveAttribute("href", "/questionnaire");
});
