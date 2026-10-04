import { expect, test, type Page } from "@playwright/test";

/*
  Large text and short screens: the adapt pass.

  This audience runs phones with the system text enlarged. The root font size
  is set before first paint (as the reader's own setting would be), and every
  route must reflow: nothing past either edge of the screen, and the header's
  controls on screen in a bar that leaves the page most of the screen.
*/

const ROUTES = [
  "/",
  "/about",
  "/how-it-works",
  "/personal-plan",
  "/motion-detection",
  "/progress",
  "/articles",
  "/articles/body-after-50",
  "/payment",
  "/privacy-policy",
  "/delete-account",
];

async function withRootText(page: Page, percent: number) {
  await page.addInitScript((value) => {
    const apply = () => {
      document.documentElement.style.fontSize = `${value}%`;
    };
    if (document.documentElement) apply();
    document.addEventListener("DOMContentLoaded", apply);
  }, percent);
}

/** Elements past either screen edge that no scroller or clip contains. */
function overflowing(width: number) {
  const clipped = (el: Element) => {
    for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
      if (["auto", "scroll", "hidden", "clip"].includes(getComputedStyle(a).overflowX)) return true;
    }
    return false;
  };
  const out: string[] = [];
  for (const el of document.querySelectorAll("body *")) {
    if (el.closest("#site-drawer") || getComputedStyle(el).position === "fixed") continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    if ((r.left < -1 || r.right > width + 1) && !clipped(el)) {
      out.push(`${el.tagName} ${Math.round(r.left)}..${Math.round(r.right)}`);
    }
  }
  return {
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
    offenders: out.slice(0, 5),
  };
}

test.describe("200% text on a 390px phone", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  for (const route of ROUTES) {
    test(`${route} reflows with the header on screen`, async ({ page }) => {
      await withRootText(page, 200);
      await page.goto(route);

      const result = await page.evaluate(overflowing, 390);
      expect(result.offenders).toEqual([]);
      expect(result.innerWidth).toBe(390);
      expect(result.scrollWidth).toBeLessThanOrEqual(390);

      const banner = page.getByRole("banner");
      for (const control of [
        banner.getByRole("link", { name: "פעילים פלוס — לעמוד הבית" }),
        banner.getByRole("button", { name: "פתיחת התפריט" }),
      ]) {
        const box = (await control.boundingBox())!;
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(390);
        expect(Math.min(box.width, box.height)).toBeGreaterThanOrEqual(48);
      }
      // The compact bar: under 15% of the screen, where it was 209px (25%).
      expect((await banner.boundingBox())!.height).toBeLessThanOrEqual(844 * 0.15);
    });
  }

  test("the drawer leads with the fit-check pill the bar has dropped", async ({ page }) => {
    await withRootText(page, 200);
    await page.goto("/");
    const banner = page.getByRole("banner");
    await expect(banner.getByRole("link", { name: "בדיקת התאמה" })).toBeHidden();
    await banner.getByRole("button", { name: "פתיחת התפריט" }).click();
    const drawer = page.getByRole("dialog", { name: "תפריט האתר" });
    const pills = drawer.getByRole("link", { name: "בדיקת התאמה" });
    await expect(pills).toHaveCount(1);
    await expect(drawer.getByRole("link").nth(1)).toHaveAccessibleName("בדיקת התאמה");
    await expect(pills).toBeInViewport();
  });
});

test.describe("a phone held sideways", () => {
  for (const [width, height] of [
    [844, 390],
    [740, 360],
  ] as const) {
    test(`home hero headline and action fit the first screen at ${width}x${height}`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto("/");
      const heading = (await page.locator("#hero-heading").boundingBox())!;
      const action = (await page.getByRole("link", { name: "בואו לראות איך זה עובד" }).boundingBox())!;
      expect(heading.y).toBeGreaterThanOrEqual(0);
      expect(action.y + action.height).toBeLessThanOrEqual(height);
    });
  }

  test("the header scrolls away and the drawer reaches the phone number", async ({ page }) => {
    await page.setViewportSize({ width: 844, height: 390 });
    await page.goto("/");
    const banner = page.getByRole("banner");
    expect(await banner.evaluate((el) => getComputedStyle(el).position)).toBe("relative");

    await banner.getByRole("button", { name: "פתיחת התפריט" }).click();
    const drawer = page.getByRole("dialog", { name: "תפריט האתר" });
    await expect(drawer.getByRole("button", { name: "סגירת התפריט" })).toBeInViewport();
    const phone = drawer.locator("a[href^='tel:']");
    await phone.scrollIntoViewIfNeeded();
    await expect(phone).toBeInViewport();
  });
});
