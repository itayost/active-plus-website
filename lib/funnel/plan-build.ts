/**
 * How full the plan-building ring is over time (owner, 2026-11-14: slower and
 * uneven; 2026-11-15: "תחושה שבונים בשבילי תוכנית ומקדישים מחשבה"). One phase
 * per checklist line (28, 56, 82): a quick start, a slow crawl, a pause just
 * short of the line as if weighing it, then a step past it as the line turns
 * green. A last pause near the top, then 100% on PLAN_BUILD_MS.
 * Each pair is [ms since the start, percent]; close percents are a pause.
 */
export const PLAN_BUILD_CURVE: readonly (readonly [number, number])[] = [
  [0, 0],
  // Reading the answers.
  [1200, 17],
  [2600, 24],
  [3400, 25],
  [3800, 30],
  // Choosing the exercises.
  [5000, 43],
  [6500, 51],
  [7300, 52],
  [7700, 58],
  // The last adjustments.
  [8900, 70],
  [10000, 77],
  [10800, 78],
  [11200, 84],
  // Putting it together.
  [12000, 95],
  [12500, 97],
  [12800, 100],
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
