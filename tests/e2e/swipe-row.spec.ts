import { expect, test, type Locator, type Page } from "@playwright/test";

/*
  The home testimonials row (Task 6 builds it as a SwipeRow named below, with
  6 items). Pins the keyboard-only and reduced-motion behaviour of the shared
  swipe row.
*/
const ROW = "מה אומרים הלקוחות שלנו";

// The section named by its heading is the row's only landmark; the list inside
// carries the same name but is not a region.
function row(page: Page): Locator {
  return page.getByRole("region", { name: ROW });
}

test.describe("phone", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("six items, the first fully in view", async ({ page }) => {
    await page.goto("/");
    const items = row(page).getByRole("listitem");
    await expect(items).toHaveCount(6);
    const box = await items.first().boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(390);
  });

  test("Tab reaches every card in order and scrolls it into view", async ({ page }) => {
    await page.goto("/");
    const items = row(page).getByRole("listitem");
    const count = await items.count();
    // The row sets focusableItems, so each list item is a Tab stop.
    await items.first().focus();
    for (let i = 0; i < count; i++) {
      const item = items.nth(i);
      if (i > 0) await page.keyboard.press("Tab");
      await expect(item).toBeFocused();
      await expect
        .poll(async () => {
          const b = await item.boundingBox();
          return b !== null && b.x >= -1 && b.x + b.width <= 391;
        })
        .toBe(true);
    }
  });

  test("the track scrolls smoothly without reduced motion", async ({ page }) => {
    await page.goto("/");
    const behavior = await row(page)
      .getByRole("list")
      .evaluate((el) => getComputedStyle(el).scrollBehavior);
    expect(behavior).toBe("smooth");
  });
});

test.describe("desktop", () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test("arrows: previous disabled at start, next reaches the last card", async ({ page }) => {
    await page.goto("/");
    const region = row(page);
    const prev = region.getByRole("button", { name: "הקודם" });
    const next = region.getByRole("button", { name: "הבא" });
    await expect(prev).toHaveAttribute("aria-disabled", "true");
    for (let i = 0; i < 12; i++) {
      if ((await next.getAttribute("aria-disabled")) === "true") break;
      const before = await region.getByRole("list").evaluate((el) => el.scrollLeft);
      await next.click();
      await expect
        .poll(() => region.getByRole("list").evaluate((el) => el.scrollLeft))
        .not.toBe(before);
      // Let the smooth scroll finish: the arrow turns aria-disabled when the
      // track reaches its end, and clicking mid-scroll races that.
      await expect
        .poll(async () => {
          const a = await region.getByRole("list").evaluate((el) => el.scrollLeft);
          await page.waitForTimeout(150);
          return a === (await region.getByRole("list").evaluate((el) => el.scrollLeft));
        })
        .toBe(true);
    }
    await expect(next).toHaveAttribute("aria-disabled", "true");
    await expect(prev).not.toHaveAttribute("aria-disabled", "true");
    await expect(region.getByRole("listitem").last()).toBeInViewport();
  });
});

test.describe("desktop focus", () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test("an exhausted arrow keeps keyboard focus, and previous still works", async ({ page }) => {
    await page.goto("/");
    const region = row(page);
    const track = region.getByRole("list");
    const next = region.getByRole("button", { name: "הבא" });
    const previous = region.getByRole("button", { name: "הקודם" });
    const settled = () =>
      expect
        .poll(async () => {
          const a = await track.evaluate((t) => t.scrollLeft);
          await page.waitForTimeout(150);
          return a === (await track.evaluate((t) => t.scrollLeft));
        })
        .toBe(true);
    await next.focus();
    // Settle after each press, the way a reader presses: that is when presses
    // on an already-exhausted arrow used to desync the index.
    for (let i = 0; i < 7; i++) {
      await page.keyboard.press("Enter");
      await settled();
    }
    await expect(next).toHaveAttribute("aria-disabled", "true");
    await expect(next).toBeFocused();
    // Every "previous" press must move the track until it is back at the start.
    for (let i = 0; i < 7 && (await previous.getAttribute("aria-disabled")) !== "true"; i++) {
      const before = await track.evaluate((t) => t.scrollLeft);
      await previous.click();
      await expect.poll(() => track.evaluate((t) => t.scrollLeft), { timeout: 2000 }).not.toBe(before);
      await settled();
    }
    await expect(previous).toHaveAttribute("aria-disabled", "true");
    await expect(region.getByRole("listitem").first()).toBeInViewport();
  });
});

test.describe("wide desktop", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("a row that fits whole drops its arrows; one that does not keeps them", async ({ page }) => {
    await page.goto("/");
    const partners = page.getByRole("region", { name: "שיתופי פעולה" });
    // Positive control first: the arrows exist on this page and width.
    await expect(row(page).getByRole("button", { name: "הבא" })).toBeVisible();
    await partners.scrollIntoViewIfNeeded();
    await expect(partners.getByRole("listitem").last()).toBeInViewport();
    await expect(partners.getByRole("button", { name: "הבא" })).toHaveCount(0);
    await expect(partners.getByRole("button", { name: "הקודם" })).toHaveCount(0);
  });
});

test.describe("reduced motion", () => {
  test.use({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });

  test("the track does not scroll smoothly", async ({ page }) => {
    await page.goto("/");
    const behavior = await row(page)
      .getByRole("list")
      .evaluate((el) => getComputedStyle(el).scrollBehavior);
    expect(behavior).toBe("auto");
  });
});
