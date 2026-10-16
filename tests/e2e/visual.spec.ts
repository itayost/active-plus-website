import { expect, test, type Page } from "@playwright/test";

/*
  The cross-page visual pass. Every route at five widths: the page answers 200,
  nothing spills past either edge, and a full-page screenshot lands in
  test-results/visual/<route>-<width>.png for a person to review. The pictures
  are artefacts, not snapshot assertions: the layout is judged by eye against
  the handoff prototype (phones) and the spec's desktop notes.

  Reduced motion is emulated so the scroll-reveal sections are already shown
  (a full-page capture never scrolls them into view) and the hero keeps its
  poster instead of a video frame that differs from run to run.
*/

const ROUTES = [
  "/",
  "/about",
  "/research",
  "/team",
  "/contact",
  "/payment",
  "/articles/body-after-50",
  "/personal-plan",
];

const WIDTHS = [320, 390, 768, 1024, 1440];

/** "/" -> "home", "/articles/body-after-50" -> "articles-body-after-50". */
function slug(route: string) {
  return route === "/" ? "home" : route.slice(1).replace(/\//g, "-");
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
      out.push(`${el.tagName}.${el.className} ${Math.round(r.left)}..${Math.round(r.right)}`);
    }
  }
  return { scrollWidth: document.documentElement.scrollWidth, offenders: out.slice(0, 5) };
}

/** Lazy images below the fold only load once near the viewport; walk the page so the capture has them. */
async function loadLazyImages(page: Page) {
  await page.evaluate(async () => {
    const step = Math.max(200, window.innerHeight - 100);
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 60)));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForFunction(() =>
    Array.from(document.images).every((img) => img.complete),
  );
}

test.describe("visual pass", () => {
  for (const route of ROUTES) {
    for (const width of WIDTHS) {
      test(`${route} at ${width}px`, async ({ page }) => {
        // One browser is enough for the artefacts; the width is set here.
        test.skip(test.info().project.name !== "desktop", "desktop project only");
        await page.emulateMedia({ reducedMotion: "reduce" });
        await page.setViewportSize({ width, height: 900 });
        const res = await page.goto(route);
        expect(res?.status()).toBe(200);
        await page.evaluate(() => document.fonts.ready);

        const result = await page.evaluate(overflowing, width);
        expect(result.offenders).toEqual([]);
        expect(result.scrollWidth).toBeLessThanOrEqual(width);

        await loadLazyImages(page);
        await page.screenshot({
          path: `test-results/visual/${slug(route)}-${width}.png`,
          fullPage: true,
        });
      });
    }
  }
});
