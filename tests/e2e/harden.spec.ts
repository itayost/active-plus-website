import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";

// Read lazily: on a fresh clone .next only exists once the webServer has built.
let buildId: string | undefined;
const getBuildId = () => (buildId ??= readFileSync(".next/BUILD_ID", "utf8").trim());

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
      banner.getByRole("link", { name: "פעילים פלוס — לעמוד הבית" }),
      banner.getByRole("link", { name: "בדיקת התאמה" }),
      banner.getByRole("button", { name: "פתיחת התפריט" }),
    ]) {
      const box = (await control.boundingBox())!;
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(width);
    }
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
    expect(offsets).toEqual([0, 0]);
  });

  test("an exhausted arrow keeps keyboard focus, and previous still works", async ({ page }) => {
    await page.goto("/");
    const next = page.getByRole("button", { name: "הביקורת הבאה" });
    const track = page.locator("ul.snap-gutter").nth(1);
    const settled = () =>
      expect
        .poll(async () => {
          const a = await track.evaluate((t) => t.scrollLeft);
          await page.waitForTimeout(150);
          return a === (await track.evaluate((t) => t.scrollLeft));
        })
        .toBe(true);
    await next.focus();
    // Settle after each press, the way a reader presses: that is when the
    // presses on an already-exhausted arrow used to desync the index.
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press("Enter");
      await settled();
    }
    await expect(next).toHaveAttribute("aria-disabled", "true");
    await expect(next).toBeFocused();
    // Every "previous" press must move the track until it is back at the
    // start. Presses on the exhausted "next" used to advance the index past
    // what was on screen, so the first "previous" presses did nothing.
    const previous = page.getByRole("button", { name: "הביקורת הקודמת" });
    for (let i = 0; i < 6 && (await previous.getAttribute("aria-disabled")) !== "true"; i++) {
      const before = await track.evaluate((t) => t.scrollLeft);
      await previous.click();
      await expect.poll(() => track.evaluate((t) => t.scrollLeft), { timeout: 2000 }).not.toBe(before);
      await page.waitForTimeout(700);
    }
    expect(Math.abs(await track.evaluate((t) => t.scrollLeft))).toBeLessThan(2);
  });

  test("the partner strip is never empty during its loop", async ({ page }) => {
    await page.goto("/");
    const emptyPx = await page.locator(".animate-marquee").evaluate((track) => {
      const strip = track.parentElement!.getBoundingClientRect();
      const animation = track.getAnimations()[0];
      return [0, 0.25, 0.5, 0.75, 0.999].map((fraction) => {
        animation.pause();
        animation.currentTime = Number(animation.effect!.getTiming().duration) * fraction;
        const r = track.getBoundingClientRect();
        return Math.max(0, strip.right - r.right) + Math.max(0, r.left - strip.left);
      });
    });
    expect(emptyPx.every((px) => px < 1)).toBe(true);
  });

  test.describe("reduced motion", () => {
    test.use({ reducedMotion: "reduce" });

    test("every partner is shown, once, inside the band", async ({ page }) => {
      await page.goto("/");
      const shown = await page.locator(".animate-marquee > li").evaluateAll((items) => {
        const strip = items[0].parentElement!.parentElement!.getBoundingClientRect();
        return items
          .filter((li) => getComputedStyle(li).display !== "none")
          .filter((li) => {
            const r = li.getBoundingClientRect();
            return r.left >= strip.left - 1 && r.right <= strip.right + 1;
          }).length;
      });
      expect(shown).toBe(7);
    });

    test("the hero video is not even requested", async ({ page }) => {
      const videoRequests: string[] = [];
      page.on("request", (r) => r.url().includes("/video/") && videoRequests.push(r.url()));
      await page.goto("/");
      // HeroVideo marks its decision once its effect has run.
      await expect(page.locator("[data-hero-video]")).toHaveAttribute("data-hero-video", "off");
      await expect(page.locator("video")).toHaveCount(0);
      expect(videoRequests).toEqual([]);
    });
  });

  test("with motion allowed the hero video mounts and plays muted", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("[data-hero-video]")).toHaveAttribute("data-hero-video", "on");
    const video = page.locator("video");
    await expect(video).toHaveCount(1);
    await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.muted && !v.paused)).toBe(true);
  });
});
