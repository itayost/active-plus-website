import { expect, test, type Page } from "@playwright/test";
import { getBuildId } from "./build-id";

/** Answer every POST locally: no request in this file may reach a server action. */
async function stubActions(page: Page, result: unknown) {
  const posts: string[] = [];
  await page.route("**/*", (route) => {
    if (route.request().method() !== "POST") return route.continue();
    posts.push(route.request().headers()["next-action"] ?? "");
    return route.fulfill({
      status: 200,
      contentType: "text/x-component",
      body: `0:${JSON.stringify({ a: "$@1", f: "", b: getBuildId() })}\n1:${JSON.stringify(result)}\n`,
    });
  });
  return posts;
}

test.describe("mobile drawer", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("closed drawer has no tab stops and no dialog in the accessibility tree", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press("Tab");
      expect(await page.evaluate(() => Boolean(document.activeElement?.closest("#site-drawer")))).toBe(false);
    }
  });

  test("open drawer traps focus and Escape returns it to the toggle", async ({ page }) => {
    await page.goto("/");
    const toggle = page.getByRole("button", { name: "פתיחת התפריט" });
    await toggle.click();
    await expect(page.getByRole("dialog", { name: "תפריט האתר" })).toBeVisible();
    // The toggle is also named "סגירת התפריט" while open, so address the
    // drawer's own close button by position.
    await expect(page.locator("#site-drawer button").first()).toBeFocused();
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press("Tab");
      expect(await page.evaluate(() => Boolean(document.activeElement?.closest("#site-drawer")))).toBe(true);
    }
    await page.keyboard.press("Escape");
    await expect(page.locator("button[aria-controls=site-drawer]")).toBeFocused();
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });
});

for (const [width, scale] of [
  [320, "100%"],
  [320, "200%"],
  [360, "130%"],
  [390, "150%"],
  [390, "200%"],
] as const) {
  test(`header controls stay on screen at ${scale} text on ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    // A page whose body reflows cleanly at 200%, so a phone's layout viewport
    // stays at device width and this measures the header alone.
    await page.goto("/privacy-policy");
    await page.evaluate((s) => (document.documentElement.style.fontSize = s), scale);
    const banner = page.getByRole("banner");
    for (const control of [
      banner.getByRole("link", { name: "פעילים+ – לדף הבית" }),
      banner.getByRole("link", { name: "התקשרו אלינו" }),
      banner.getByRole("button", { name: "פתיחת התפריט" }),
    ]) {
      const box = (await control.boundingBox())!;
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(width);
    }
    // The bar carries no fit-check pill below the desktop width; the drawer does.
    await expect(banner.getByRole("link", { name: "בדיקת התאמה", exact: true })).toBeHidden();
    await banner.getByRole("button", { name: "פתיחת התפריט" }).click();
    const drawer = page.getByRole("dialog", { name: "תפריט האתר" });
    await expect(drawer.getByRole("link", { name: "בדיקת התאמה", exact: true })).toHaveCount(1);
  });
}

test.describe("delete-account form", () => {
  test("a rejected request is announced and focus goes to the field to fix", async ({ page }) => {
    await page.goto("/delete-account");
    const posts = await stubActions(page, { success: false, message: 'נא להקליד "מחיקת חשבון" בשדה האישור' });
    await page.locator('input[name="email"]').fill("test@example.com");
    await page.locator('input[name="confirmation"]').fill("מחיקה");
    await page.getByRole("button", { name: "שליחת בקשת מחיקה" }).click();

    const region = page.locator("#delete-account-error");
    await expect(region).toHaveAttribute("aria-live", "polite");
    await expect(region).toHaveText('נא להקליד "מחיקת חשבון" בשדה האישור');
    const confirmation = page.locator('input[name="confirmation"]');
    await expect(confirmation).toBeFocused();
    await expect(confirmation).toHaveAttribute("aria-invalid", "true");
    await expect(confirmation).toHaveAttribute("aria-describedby", "delete-account-error confirmation-hint");
    expect(posts).toHaveLength(1);
  });

  test("the empty live region adds no gap above the form", async ({ page }) => {
    await page.goto("/delete-account");
    // The first label must sit right on the card's padding edge: an empty
    // region inside the form's space-y flow pushed it down by one gap.
    const offset = await page.locator('label[for="email"]').evaluate((label) => {
      const card = label.closest("form")!.parentElement!;
      const top = card.getBoundingClientRect().top + parseFloat(getComputedStyle(card).paddingTop);
      return Math.round(label.getBoundingClientRect().top - top);
    });
    expect(offset).toBe(0);
  });

  test("fields carry hints and the email field identifies its purpose", async ({ page }) => {
    await page.goto("/delete-account");
    const email = page.locator('input[name="email"]');
    await expect(email).toHaveAttribute("autocomplete", "email");
    await expect(email).toHaveAttribute("inputmode", "email");
    await expect(email).toHaveAccessibleDescription("הכניסו את כתובת האימייל שאיתה נרשמתם לאפליקציה");
    await expect(page.locator('input[name="confirmation"]')).toHaveAccessibleDescription('הקלידו "מחיקת חשבון" לאישור');
  });

  test("the confirmation takes focus when it replaces the form", async ({ page }) => {
    await page.goto("/delete-account");
    await stubActions(page, { success: true, message: "בקשתך התקבלה בהצלחה." });
    await page.locator('input[name="email"]').fill("test@example.com");
    await page.locator('input[name="confirmation"]').fill("מחיקת חשבון");
    await page.getByRole("button", { name: "שליחת בקשת מחיקה" }).click();
    await expect(page.getByRole("status")).toBeFocused();
  });
});

test.describe("home carousels and partners", () => {
  test("snap tracks rest at their gutter instead of scrolling on load", async ({ page }) => {
    await page.goto("/");
    const offsets = await page.locator("ul.snap-gutter").evaluateAll((tracks) => tracks.map((t) => t.scrollLeft));
    expect(offsets.length).toBeGreaterThanOrEqual(4);
    expect(offsets.every((x) => x === 0)).toBe(true);
  });

  test("all seven partner logos are rendered, with names", async ({ page }) => {
    await page.goto("/");
    const logos = page.getByRole("region", { name: "שיתופי פעולה" }).getByRole("img");
    await expect(logos).toHaveCount(7);
    for (const alt of await logos.evaluateAll((els) => els.map((e) => e.getAttribute("alt")))) {
      expect(alt && alt.length).toBeTruthy();
    }
  });

  test("the partner marks move on their own and stop under the mouse", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    const strip = page.getByRole("group", { name: "שיתופי פעולה" });
    await strip.scrollIntoViewIfNeeded();
    const set = strip.getByRole("list");
    const x = () => set.evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).m41);
    const start = await x();
    await expect.poll(x).toBeGreaterThan(start + 10);
    await strip.hover();
    const held = await x();
    await page.waitForTimeout(500);
    expect(await x()).toBeCloseTo(held, 0);
  });

  test("with reduced motion the partner marks are the still swipe row", async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: "reduce" });
    const page = await context.newPage();
    await page.goto("/");
    const region = page.getByRole("region", { name: "שיתופי פעולה" });
    await expect(region.getByRole("group", { name: "שיתופי פעולה" })).toBeHidden();
    await expect(region.getByRole("list", { name: "שיתופי פעולה" })).toBeVisible();
    await context.close();
  });

  test("the hero is a still photo: no video is mounted or requested", async ({ page }) => {
    const videoRequests: string[] = [];
    page.on("request", (r) => r.url().includes("/video/") && videoRequests.push(r.url()));
    await page.goto("/");
    await page.waitForLoadState("load");
    await expect(page.locator("video")).toHaveCount(0);
    expect(videoRequests).toEqual([]);
  });
});
