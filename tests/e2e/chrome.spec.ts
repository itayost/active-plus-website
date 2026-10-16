import { expect, test } from "@playwright/test";
import { CONTACT_HOURS, CONTACT_PHONE_TEL } from "../../lib/constants";

const NAV_LABELS = [
  "הכירו את פעילים+",
  "המחקר והגישה המקצועית",
  "הצוות המקצועי",
  "שאלות נפוצות",
  "צור קשר",
];
const NAV_HREFS = ["/about", "/research", "/team", "/#faq", "/contact"];

test.describe("desktop bar", () => {
  test.use({ viewport: { width: 1440, height: 800 } });

  test("fit check pill is one line, visible and links the questionnaire", async ({ page }) => {
    await page.goto("/");
    const cta = page.getByRole("banner").getByRole("link", { name: "בדיקת התאמה", exact: true });
    await expect(cta).toBeVisible();
    expect((await cta.boundingBox())!.height).toBeLessThan(64); // one line, two would be ~90
    await expect(cta).toHaveAttribute("href", "/questionnaire");
  });

  test("the five menu links sit inline in the bar", async ({ page }) => {
    await page.goto("/");
    const nav = page.getByRole("banner").getByRole("navigation", { name: "ניווט ראשי" });
    await expect(nav.getByRole("link")).toHaveText(NAV_LABELS);
    for (const [i, href] of NAV_HREFS.entries()) {
      await expect(nav.getByRole("link").nth(i)).toHaveAttribute("href", href);
    }
  });
});

/* The bar must never wrap. The inline links, the pill and the call button
   need about 1,148px in one row, so below 1200px the bar is the phone's. With
   six links (pricing, since hidden) the row needed about 1,420px and wrapped
   the pill and the call button onto a second row at 1280-1439px (worse on the
   current page, whose link was bold and wider). Every control in the bar shares one row at every width,
   on every page the menu links to. */
const BAR_WIDTHS = [1024, 1100, 1199, 1200, 1280, 1351, 1366, 1440, 1920];
const ROUTES_IN_MENU = ["/", ...NAV_HREFS.filter((h) => !h.includes("#"))];

for (const width of BAR_WIDTHS) {
  test.describe(`header bar at ${width}px`, () => {
    test.use({ viewport: { width, height: 800 } });

    for (const href of ROUTES_IN_MENU) {
      test(`stays one row on ${href}`, async ({ page }) => {
        await page.goto(href);
        const banner = page.getByRole("banner");
        const logo = (await banner.getByRole("link", { name: "פעילים+ – לדף הבית" }).boundingBox())!;
        const controls = [
          banner.getByRole("navigation", { name: "ניווט ראשי" }),
          banner.getByRole("link", { name: "בדיקת התאמה", exact: true }),
          banner.getByRole("button", { name: "פתיחת התפריט" }),
          banner.getByRole("link", { name: "התקשרו אלינו" }),
        ];
        for (const control of controls) {
          if (!(await control.isVisible())) continue;
          const box = (await control.boundingBox())!;
          const mid = box.y + box.height / 2;
          expect(mid).toBeGreaterThan(logo.y - 16);
          expect(mid).toBeLessThan(logo.y + logo.height + 16);
        }
      });
    }
  });
}

/* A 1366px Windows laptop has a classic scrollbar, which leaves the bar about
   1,351px: it must still get the inline links, not the menu button. */
test.describe("1366px laptop with a scrollbar", () => {
  test.use({ viewport: { width: 1351, height: 800 } });

  test("shows the inline links and the pill", async ({ page }) => {
    await page.goto("/research");
    const banner = page.getByRole("banner");
    await expect(banner.getByRole("navigation", { name: "ניווט ראשי" })).toBeVisible();
    await expect(banner.getByRole("link", { name: "בדיקת התאמה", exact: true })).toBeVisible();
    await expect(banner.getByRole("button", { name: "פתיחת התפריט" })).toBeHidden();
  });
});

/* The current link is marked by colour, not weight: bold Hebrew is wider and
   would widen the row on that page alone. */
test.describe("current page link", () => {
  test.use({ viewport: { width: 1440, height: 800 } });

  test("keeps its width when it becomes the current page", async ({ page }) => {
    const nav = page.getByRole("banner").getByRole("navigation", { name: "ניווט ראשי" });
    const link = nav.getByRole("link", { name: "המחקר והגישה המקצועית" });
    await page.goto("/");
    const idle = (await link.boundingBox())!.width;
    await page.goto("/research");
    await expect(link).toHaveAttribute("aria-current", "page");
    expect((await link.boundingBox())!.width).toBeCloseTo(idle, 0);
  });
});

/* 1024-1199px is a laptop, not a phone, but five long links and the pill do
   not fit there: the bar is the phone's (wordmark, menu, call) by design. */
test.describe("laptop band below 1200px", () => {
  test.use({ viewport: { width: 1100, height: 800 } });

  test("no pill or inline links; the menu opens the drawer with the five links", async ({ page }) => {
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

  test("drawer lists the five menu labels in order, then the fit check and the phone", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await page.getByRole("banner").getByRole("button", { name: "פתיחת התפריט" }).click();
    const drawer = page.getByRole("dialog", { name: "תפריט האתר" });
    await expect(drawer.getByRole("navigation", { name: "ניווט האתר" }).getByRole("link")).toHaveText(NAV_LABELS);
    const fit = drawer.getByRole("link", { name: "בדיקת התאמה", exact: true });
    await expect(fit).toHaveAttribute("href", "/questionnaire");
    await expect(drawer.locator("a[href^='tel:']")).toBeVisible();
  });

  test("tapping the FAQ link on the home page closes the drawer and shows the FAQ", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await page.getByRole("banner").getByRole("button", { name: "פתיחת התפריט" }).click();
    const drawer = page.getByRole("dialog", { name: "תפריט האתר" });
    await drawer.getByRole("link", { name: "שאלות נפוצות" }).click();
    // Hash-only navigation does not change the pathname, so the drawer has to
    // close on the activation itself.
    await expect(drawer).toBeHidden();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe("");
    await expect(page.locator("#faq")).toBeInViewport();
  });

  test("tapping the link of the current page closes the drawer", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/about");
    await page.getByRole("banner").getByRole("button", { name: "פתיחת התפריט" }).click();
    const drawer = page.getByRole("dialog", { name: "תפריט האתר" });
    await drawer.getByRole("link", { name: "הכירו את פעילים+" }).click();
    await expect(drawer).toBeHidden();
    await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe("");
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
