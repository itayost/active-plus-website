/**
 * The 28-day plan page (owner, 2026-11-15): the plan is ready, and the expected
 * progress over 28 days in muscle strength and in memory, the app being
 * "אימון הגוף וחדות המחשבה". The page says nothing more; the owner cut the rest.
 */
export const PLAN_LINES = [
  { label: "חיזוק שרירים", color: "#2E7D32" },
  { label: "שיפור הזיכרון", color: "#1E6FD9" },
] as const;

export const PLAN_DAYS = 28;

/**
 * The illustration's curve: day 0..28 -> 0..1, a quick first rise and then a steady
 * climb (the quick first wins the games are built on); `lag` delays a line a little
 * and `top` is where it ends, so two lines stay apart.
 * No numbers are shown with it: it is an illustration, not a promise.
 */
export function curve(lag: number, top = 0.88, steps = PLAN_DAYS): readonly { x: number; y: number }[] {
  return Array.from({ length: steps + 1 }, (_, d) => {
    const t = d / steps;
    const rise = (1 - Math.exp(-2.6 * Math.max(0, t - lag))) / (1 - Math.exp(-2.6 * (1 - lag)));
    return { x: t, y: 0.12 + (top - 0.12) * rise };
  });
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
