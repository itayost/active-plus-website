/**
 * The 28-day plan page (owner, 2026-11-15): the plan is ready, and the expected
 * progress toward its two goals, muscle strength and memory (the app being "אימון
 * הגוף וחדות המחשבה"), by a date 28 days away: the funnels that sell best end their
 * prediction on a date. The progress is drawn as waves, not a straight climb.
 */
export const PLAN_DAYS = 28;

export const BODY_COLOR = "#2E7D32";
export const MEMORY_COLOR = "#1E6FD9";

/** The two boxes, also the chart's legend (owner, 2026-11-15: the general areas read better than specific results). */
export const PLAN_LINES = [
  { label: "חיזוק שרירים", color: BODY_COLOR },
  { label: "שיפור הזיכרון", color: MEMORY_COLOR },
] as const;

/** The target date, 28 days from `now`, as Israel reads it: "13 בדצמבר", or "13.12" for the chart's axis. */
export function targetDate(now: Date, short = false): string {
  const target = new Date(now.getTime() + PLAN_DAYS * 86_400_000);
  const month = short ? "numeric" : "long";
  return new Intl.DateTimeFormat("he-IL", { day: "numeric", month, timeZone: "Asia/Jerusalem" }).format(target);
}

/**
 * The illustration (owner's pick, 2026-11-15: "waves"): a rising trend with small
 * ups and downs, as real progress goes, never a straight line. `lag` delays a line a
 * little, `top` is where its trend ends (so two lines stay apart) and `phase` shifts
 * its waves. No numbers are shown with it: it is an illustration, not a promise.
 */
export function curve(lag: number, top = 0.86, phase = 0, steps = 112): readonly { x: number; y: number }[] {
  return Array.from({ length: steps + 1 }, (_, d) => {
    const t = d / steps;
    const trend = 0.12 + (top - 0.12) * ((1 - Math.exp(-2.4 * Math.max(0, t - lag))) / (1 - Math.exp(-2.4 * (1 - lag))));
    // The waves grow in over the first days, so the line starts flat at "today".
    const wave = 0.035 * Math.sin(t * Math.PI * 7 + phase) * Math.min(1, t * 4);
    return { x: t, y: Math.max(0.1, trend + wave) };
  });
}

/** The value of a line at a day, for the weekly dots. */
export function curveAt(points: readonly { x: number; y: number }[], day: number): number {
  const i = Math.round((day / PLAN_DAYS) * (points.length - 1));
  return points[Math.min(points.length - 1, Math.max(0, i))].y;
}

/**
 * A smooth SVG path through the points (Catmull-Rom as cubic Béziers), in a box of
 * `width` x `height`, y measured up from the bottom.
 */
export function smoothPath(points: readonly { x: number; y: number }[], width: number, height: number): string {
  const p = points.map(({ x, y }) => ({ x: x * width, y: (1 - y) * height }));
  const f = (n: number) => n.toFixed(1);
  let d = `M${f(p[0].x)} ${f(p[0].y)}`;
  for (let i = 0; i < p.length - 1; i++) {
    const a = p[i - 1] ?? p[i];
    const b = p[i];
    const c = p[i + 1];
    const e = p[i + 2] ?? c;
    d += ` C${f(b.x + (c.x - a.x) / 6)} ${f(b.y + (c.y - a.y) / 6)} ${f(c.x - (e.x - b.x) / 6)} ${f(c.y - (e.y - b.y) / 6)} ${f(c.x)} ${f(c.y)}`;
  }
  return d;
}
