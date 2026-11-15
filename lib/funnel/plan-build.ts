/**
 * How full the plan-building ring is over time (owner, 2026-11-14): slower, and
 * never at an even pace, so it feels like a plan is being put together. Bursts,
 * each eased, with short holds between them, ending at 100% on PLAN_BUILD_MS.
 * Each pair is [ms since the start, percent]; equal percents are a hold.
 */
export const PLAN_BUILD_CURVE: readonly (readonly [number, number])[] = [
  [0, 0],
  [900, 11],
  [1500, 13],
  [2500, 29],
  [3200, 34],
  [3900, 35],
  [5000, 54],
  [5800, 66],
  [6600, 68],
  [7500, 84],
  [8300, 93],
  [8700, 96],
  [9000, 100],
];

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

/** The whole percent shown `elapsed` ms after the ring started. */
export function planBuildPercent(elapsed: number): number {
  const curve = PLAN_BUILD_CURVE;
  if (elapsed <= 0) return 0;
  const last = curve[curve.length - 1];
  if (elapsed >= last[0]) return last[1];
  for (let i = 1; i < curve.length; i++) {
    const [t1, p1] = curve[i];
    if (elapsed <= t1) {
      const [t0, p0] = curve[i - 1];
      return Math.round(p0 + (p1 - p0) * easeInOut((elapsed - t0) / (t1 - t0)));
    }
  }
  return last[1];
}
