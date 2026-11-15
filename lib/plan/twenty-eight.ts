import type { PlanInputs } from "@/lib/funnel/storage";

/**
 * The 28-day plan page (owner, 2026-11-15): the plan is ready, and two specific
 * results to reach by a date 28 days away, one for the body and one for memory,
 * the app being "אימון הגוף וחדות המחשבה". The funnels that sell best show a specific
 * result with a date ("Lose 7 kg by Jun 17"), not a category; ours are things people
 * of 45-80 want in daily life, picked from their own answers.
 */
export const PLAN_DAYS = 28;

export const BODY_COLOR = "#2E7D32";
export const MEMORY_COLOR = "#1E6FD9";

export type Outcome = { text: string; color: string };

/**
 * The body result: the difficulty they named first (stairs, walking, the floor), then
 * getting up from a chair when they need help with it, then their goal.
 */
export function bodyOutcome(inputs: PlanInputs | null): string {
  switch (inputs?.mobility) {
    case "stairs":
      return "לעלות מדרגות בלי להתנשף";
    case "walking":
      return "ללכת יותר, בקלות ובביטחון";
    case "floor_rise":
      return "לקום מהרצפה בקלות";
  }
  if (inputs?.chairRise === "with_support" || inputs?.chairRise === "with_handles") return "לקום מכיסא בלי עזרת הידיים";
  switch (inputs?.goal) {
    case "weight_loss":
      return "יותר אנרגיה מהבוקר עד הערב";
    case "flexibility_balance":
      return "להתכופף ולהסתובב בחופשיות";
    default:
      return "לסחוב את הקניות בקלות";
  }
}

/** The memory result, by how often they said things slip. */
export function memoryOutcome(inputs: PlanInputs | null): string {
  switch (inputs?.memory) {
    case "almost_never":
      return "ריכוז חד לאורך כל היום";
    case "sometimes":
      return "לא לשכוח איפה שמתי דברים";
    default:
      return "לזכור שמות ורשימות בלי לרשום";
  }
}

export function outcomes(inputs: PlanInputs | null): readonly [Outcome, Outcome] {
  return [
    { text: bodyOutcome(inputs), color: BODY_COLOR },
    { text: memoryOutcome(inputs), color: MEMORY_COLOR },
  ];
}

/** The target date, 28 days from `now`, as Israel reads it: "13 בדצמבר", or "13.12" for the chart's axis. */
export function targetDate(now: Date, short = false): string {
  const target = new Date(now.getTime() + PLAN_DAYS * 86_400_000);
  const month = short ? "numeric" : "long";
  return new Intl.DateTimeFormat("he-IL", { day: "numeric", month, timeZone: "Asia/Jerusalem" }).format(target);
}

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
