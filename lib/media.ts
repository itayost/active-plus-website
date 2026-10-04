/**
 * Effective connection types (Network Information API) too slow to spend
 * 1.4 MB of decoration on. "3g" is what Chrome reports for anything slower
 * than about 270 ms RTT / 700 kbps, which includes DevTools' "Slow 4G".
 */
const SLOW_CONNECTIONS: ReadonlySet<string> = new Set(["slow-2g", "2g", "3g"]);

/**
 * The hero video is decoration over a poster that already carries the
 * picture. It is only worth its download when the visitor will actually see
 * it move (no reduced-motion request), has not asked the browser to save
 * data, and is not on a connection where 1.4 MB costs seconds of everything
 * else on the page. `saveData` and `effectiveType` are undefined where the
 * Network Information API is missing (Safari, Firefox), which counts as "not
 * asked" and "not known to be slow".
 */
export function shouldLoadHeroVideo({
  prefersReducedMotion,
  saveData,
  effectiveType,
}: {
  prefersReducedMotion: boolean;
  saveData: boolean | undefined;
  effectiveType?: string | undefined;
}): boolean {
  if (prefersReducedMotion || saveData === true) return false;
  return effectiveType === undefined || !SLOW_CONNECTIONS.has(effectiveType);
}

/** Programmatic scrolls follow the same motion preference as CSS ones. */
export function scrollBehaviorFor(prefersReducedMotion: boolean): ScrollBehavior {
  return prefersReducedMotion ? "auto" : "smooth";
}
