import { expect, test } from "@playwright/test";

test("home has every brief section in order", async ({ page }) => {
  await page.goto("/");
  const ids = await page.locator("main h1, main h2").evaluateAll((els) => els.map((e) => e.id));

  const all = ["hero-heading", "world-heading", "program-heading", "testimonials-heading", "partners-heading", "lead-heading", "articles-heading", "faq-heading"];
  expect(ids.filter((id) => all.includes(id))).toEqual(all);
  // No recommender videos yet: no heading for them, but the CTA stays.
  expect(ids).not.toContain("videos-heading");
  await expect(page.getByRole("heading", { name: "סרטוני ממליצים" })).toHaveCount(0);
  await expect(page.getByRole("main").getByRole("link", { name: "לקבלת תוכנית אישית" })).toHaveAttribute("href", "/questionnaire");
  await expect(page.locator("#faq")).toHaveCount(1);
});

test("hero: the family photo, described, and the CTA to the questionnaire; no video", async ({ page }) => {
  const videoRequests: string[] = [];
  page.on("request", (r) => r.url().includes("/video/") && videoRequests.push(r.url()));
  await page.goto("/");
  const hero = page.locator("section[aria-labelledby='hero-heading']");
  const photo = hero.getByRole("img", { name: "סבא וסבתא רצים בפארק עם שני נכדים" });
  await expect(photo).toBeVisible();
  await expect(photo).toHaveAttribute("src", /hero-family/);
  await expect.poll(() => photo.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
  await expect(hero.getByRole("link", { name: "לתוכנית אישית לחצו כאן" })).toHaveAttribute("href", "/questionnaire");
  await expect(hero.locator("video")).toHaveCount(0);
  expect(videoRequests).toEqual([]);
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

test("the fit-check bar sits between the program cards and the testimonials", async ({ page }) => {
  await page.goto("/");
  const order = await page.evaluate(() => {
    const y = (el: Element | null) => el!.getBoundingClientRect().top + window.scrollY;
    const bar = [...document.querySelectorAll("main a")].find((a) => a.textContent?.trim() === "לבדיקת התאמה");
    return [y(document.getElementById("program-heading")), y(bar!), y(document.getElementById("testimonials-heading"))];
  });
  expect(order[0]).toBeLessThan(order[1]);
  expect(order[1]).toBeLessThan(order[2]);
});

test("the articles heading links to the full list", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("main").getByRole("link", { name: "לכל המאמרים" })).toHaveAttribute("href", "/articles");
});
