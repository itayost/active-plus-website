/**
 * The hero video is decoration over a poster that already carries the
 * picture. It is only worth its download when the visitor will actually see
 * it move (no reduced-motion request) and has not asked the browser to save
 * data. `saveData` is undefined where the Network Information API is missing
 * (Safari, Firefox), which counts as "not asked".
 */
export function shouldLoadHeroVideo({
  prefersReducedMotion,
  saveData,
}: {
  prefersReducedMotion: boolean;
  saveData: boolean | undefined;
}): boolean {
  return !prefersReducedMotion && saveData !== true;
}

/** Programmatic scrolls follow the same motion preference as CSS ones. */
export function scrollBehaviorFor(prefersReducedMotion: boolean): ScrollBehavior {
  return prefersReducedMotion ? "auto" : "smooth";
}
