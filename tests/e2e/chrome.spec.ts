import { expect, test } from "@playwright/test";
import { CONTACT_HOURS, CONTACT_PHONE_TEL } from "../../lib/constants";

const NAV_LABELS = [
  "הכירו את פעילים+",
  "המחקר והגישה המקצועית",
  "הצוות המקצועי",
  "שאלות נפוצות",
  "מסלולים ומחירים",
  "צור קשר",
];
const NAV_HREFS = ["/about", "/research", "/team", "/#faq", "/payment", "/contact"];

test.describe("desktop bar", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("fit check pill is one line, visible and links the questionnaire", async ({ page }) => {
    await page.goto("/");
    const cta = page.getByRole("banner").getByRole("link", { name: "בדיקת התאמה", exact: true });
    await expect(cta).toBeVisible();
    expect((await cta.boundingBox())!.height).toBeLessThan(64); // one line, two would be ~90
    await expect(cta).toHaveAttribute("href", "/questionnaire");
  });

  test("the six menu links sit inline in the bar", async ({ page }) => {
    await page.goto("/");
    const nav = page.getByRole("banner").getByRole("navigation", { name: "ניווט ראשי" });
    await expect(nav.getByRole("link")).toHaveText(NAV_LABELS);
    for (const [i, href] of NAV_HREFS.entries()) {
      await expect(nav.getByRole("link").nth(i)).toHaveAttribute("href", href);
    }
  });
});

/* 1024-1279px is a laptop, not a phone, but six long links and the pill do
   not fit there: the bar is the phone's (wordmark, menu, call) by design. */
test.describe("laptop band between lg and xl", () => {
  test.use({ viewport: { width: 1100, height: 800 } });

  test("no pill or inline links; the menu opens the drawer with the six links", async ({ page }) => {
    await page.goto("/");
    const banner = page.getByRole("banner");
    await expect(banner.getByRole("link", { name: "בדיקת התאמה", exact: true })).toBeHidden();
    await expect(banner.getByRole("navigation", { name: "ניווט ראשי" })).toBeHidden();
    const toggle = banner.getByRole("button", { name: "פתיחת התפריט" });
    await expect(toggle).toBeVisible();
    await toggle.click();
    const drawer = page.getByRole("dialog", { name: "תפריט האתר" });
    const links = drawer.getByRole("navigation", { name: "ניווט האתר" }).getByRole("link");
    await expect(links).toHaveText(NAV_LABELS);
    for (const [i, href] of NAV_HREFS.entries()) {
      await expect(links.nth(i)).toHaveAttribute("href", href);
    }
  });
});

test.describe("phone bar", () => {
  test("wordmark, menu and call buttons; no fit pill", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    const banner = page.getByRole("banner");
    await expect(banner.getByRole("link", { name: "פעילים+ – לדף הבית" })).toHaveAttribute("href", "/");
    await expect(banner.getByRole("button", { name: "פתיחת התפריט" })).toBeVisible();
    const call = banner.getByRole("link", { name: "התקשרו אלינו" });
    await expect(call).toHaveAttribute("href", `tel:${CONTACT_PHONE_TEL}`);
    for (const control of [call, banner.getByRole("button", { name: "פתיחת התפריט" })]) {
      const box = (await control.boundingBox())!;
      expect(Math.min(box.width, box.height)).toBeGreaterThanOrEqual(48);
    }
    await expect(banner.getByRole("link", { name: "בדיקת התאמה", exact: true })).toBeHidden();
  });

  test("drawer lists the six menu labels in order, then the fit check and the phone", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await page.getByRole("banner").getByRole("button", { name: "פתיחת התפריט" }).click();
    const drawer = page.getByRole("dialog", { name: "תפריט האתר" });
    await expect(drawer.getByRole("navigation", { name: "ניווט האתר" }).getByRole("link")).toHaveText(NAV_LABELS);
    const fit = drawer.getByRole("link", { name: "בדיקת התאמה", exact: true });
    await expect(fit).toHaveAttribute("href", "/questionnaire");
    await expect(drawer.locator("a[href^='tel:']")).toBeVisible();
  });
});

test("footer links both legal pages", async ({ page }) => {
  await page.goto("/");
  const footer = page.getByRole("contentinfo");
  await expect(footer.getByRole("link", { name: "מחיקת חשבון" })).toHaveAttribute("href", "/delete-account");
  await expect(footer.getByRole("link", { name: "מדיניות פרטיות" })).toHaveAttribute("href", "/privacy-policy");
  await expect(footer.locator('a[href="https://wa.me/972506316060"]')).toBeVisible();
  await expect(footer.getByText(CONTACT_HOURS)).toBeVisible();
  await expect(footer.getByRole("navigation", { name: "ניווט תחתון" }).getByRole("link")).toHaveText(NAV_LABELS);
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
  { width: 360, height: 780 },
  { width: 390, height: 844 },
]) {
  test(`header fits at ${size.width}px`, async ({ page }) => {
    await page.setViewportSize(size);
    await page.goto("/delete-account");
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
    const banner = page.getByRole("banner");
    await expect(banner.getByRole("link", { name: "פעילים+ – לדף הבית" })).toBeVisible();
    const call = (await banner.getByRole("link", { name: "התקשרו אלינו" }).boundingBox())!;
    const toggle = (await banner.getByRole("button", { name: "פתיחת התפריט" }).boundingBox())!;
    for (const box of [call, toggle]) {
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(size.width);
    }
  });
}
