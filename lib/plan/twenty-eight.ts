import { COPY, g } from "@/lib/funnel/copy";
import type { PlanInputs } from "@/lib/funnel/storage";
import type { Answers } from "@/lib/funnel/types";

/**
 * The 28-day plan the questionnaire ends on (owner, 2026-11-15): four weeks for the
 * body and the mind together, the app being "אימון הגוף וחדות המחשבה", shaped by the
 * goal chosen in the first question. Written for active adults of 45 to 80, most
 * 53-64: strength, energy and a sharp mind, never frailty.
 */
export type Week = { title: string; body: string; mind: string };

export type Plan = {
  /** The headline promise under "התוכנית שלך מוכנה!". */
  promise: string;
  /** The graph's two lines: the goal's own, then the other half of body-and-mind. */
  lines: readonly [string, string];
  workoutsPerWeek: number;
  weeks: readonly Week[];
  /** "בנינו אותה לפי מה שסיפרת": the visitor's own answers, each with what the plan does about it. */
  because: readonly { said: string; does: string }[];
};

type Goal = "strength" | "weight_loss" | "cognition" | "flexibility_balance";

const BODY_WEEKS: Record<Goal, readonly string[]> = {
  strength: ["תנועות בסיס לחיזוק רגליים, ידיים וגב", "מוסיפים חזרות ועבודה עם משקל הגוף", "חיזוק הליבה והיציבה", "אימונים מלאים, חזקים יותר מהשבוע הראשון"],
  weight_loss: ["תנועה שמעוררת את הגוף ואת חילוף החומרים", "מעלים את הדופק בהדרגה", "אימונים רציפים וארוכים יותר", "יותר אנרגיה ותנועה לאורך כל היום"],
  cognition: ["תנועות פשוטות שמעירות את הגוף", "תנועה עם קשב: צד, קצב וספירה", "שילוב של תנועה ומשימות חשיבה", "אימונים מלאים לגוף ולראש יחד"],
  flexibility_balance: ["מתיחות ותנועתיות למפרקים", "תרגילי שיווי משקל ויציבות", "ביטחון בעמידה, בהליכה ובמדרגות", "תנועה חופשית ובטוחה בכל צעד"],
};

const MIND_WEEKS = [
  "שאלות קלות תוך כדי תרגול",
  "משחקי זיכרון קצרים, כמה דקות ביום",
  "משימות קשב ותגובה מהירה",
  "מרגישים חדים יותר ביום-יום",
] as const;

const WEEK_TITLES = ["שבוע 1: מתחילים", "שבוע 2: בונים הרגל", "שבוע 3: מתחזקים", "שבוע 4: מרגישים את השינוי"] as const;

const PROMISE: Record<Goal, string> = {
  strength: "28 יום לגוף חזק יותר ולראש חד יותר",
  weight_loss: "28 יום ליותר תנועה, יותר אנרגיה וראש חד",
  cognition: "28 יום לזיכרון וריכוז חדים יותר, בגוף בתנועה",
  flexibility_balance: "28 יום ליותר גמישות, יציבות וחדות",
};

/** The goal's own line on the graph; cognition's other line is the body's. */
const GOAL_LINE: Record<Goal, string> = {
  strength: "כוח שרירים",
  weight_loss: "כושר ואנרגיה",
  cognition: "זיכרון וריכוז",
  flexibility_balance: "גמישות ושיווי משקל",
};

/** training_frequency_choice -> workouts a week, as the apps map it (6/3/2/0); none starts at 3. */
const PER_WEEK: Record<string, number> = { almost_daily: 6, three_week: 3, one_two_week: 2, none: 3 };

const isGoal = (v: string | undefined): v is Goal => !!v && v in PROMISE;

export function buildPlan(inputs: PlanInputs | null, gender?: Answers["gender"]): Plan {
  // No goal (or an unknown one) reads as strength: the most chosen, and the plan still names both halves.
  const goal: Goal = isGoal(inputs?.goal) ? inputs.goal : "strength";
  return {
    promise: PROMISE[goal],
    lines: goal === "cognition" ? [GOAL_LINE.cognition, "כוח ויציבות"] : [GOAL_LINE[goal], "חדות מחשבה"],
    workoutsPerWeek: PER_WEEK[inputs?.frequency ?? ""] ?? 3,
    weeks: WEEK_TITLES.map((title, i) => ({ title, body: BODY_WEEKS[goal][i], mind: MIND_WEEKS[i] })),
    because: because(inputs, gender),
  };
}

/**
 * The illustration's curves: day 0..28 -> 0..1, rising quickly at first and then
 * steadily (the quick first wins the games are built on), the second line a little
 * behind. Points for an SVG polyline, x and y in 0..1.
 */
export function curve(lag: number, steps = 28): readonly { x: number; y: number }[] {
  return Array.from({ length: steps + 1 }, (_, d) => {
    const t = d / steps;
    const y = 0.15 + 0.75 * (1 - Math.exp(-3 * Math.max(0, t - lag))) / (1 - Math.exp(-3 * (1 - lag)));
    return { x: t, y: Math.min(0.9, y) };
  });
}

/** The label the questionnaire showed for an answer, in the visitor's gender. */
function labelOf(options: readonly ({ value: string; label: string } | { value: string; fem: string; masc: string })[], value: string | undefined, gender: Answers["gender"]): string | null {
  const option = options.find((o) => o.value === value);
  if (!option) return null;
  return "label" in option ? option.label : g(gender, option.fem, option.masc);
}

const FEELING_DOES: Record<string, string> = {
  body_confidence: "תרגילי יציבות וכוח שבונים ביטחון בכל תנועה",
  daily_energy: "אימונים קצרים שמשאירים אנרגיה לכל היום",
  sense_of_progress: "רמה שעולה איתך, ומדד התקדמות שרואים כל שבוע",
  healthy_habit: "אימון קצר בשעה שבחרת, עם תזכורת קבועה",
};

/** The memory answer in a short line of its own: the option's wording ("מרגיש שהזיכרון שלי...") does not read after a colon. */
const MEMORY_SAID: Record<string, string> = {
  almost_never: "הזיכרון שלך חד",
  sometimes: "לפעמים דברים נשכחים",
  often: "דברים נשכחים לעיתים קרובות",
  less_sharp: "הזיכרון פחות חד מבעבר",
};

const MEMORY_DOES: Record<string, string> = {
  almost_never: "משחקי זיכרון ששומרים על הראש חד",
  sometimes: "משחקי זיכרון וקשב כמה דקות ביום",
  often: "תרגול זיכרון יומי, מהקל אל המאתגר",
  less_sharp: "תרגול זיכרון יומי, מהקל אל המאתגר",
};

function because(inputs: PlanInputs | null, gender: Answers["gender"]): { said: string; does: string }[] {
  const rows: { said: string; does: string }[] = [];
  const goal = labelOf(COPY.goals.options, inputs?.goal, gender);
  if (goal) rows.push({ said: `המטרה: ${goal}`, does: "כל שבוע מתקדם צעד אחד לעברה" });
  const feeling = labelOf(COPY.desiredFeeling.options, inputs?.feeling, gender);
  if (feeling && inputs?.feeling) rows.push({ said: `חשוב לך: ${feeling}`, does: FEELING_DOES[inputs.feeling] });
  const memory = inputs?.memory ? MEMORY_SAID[inputs.memory] : undefined;
  if (memory && inputs?.memory) rows.push({ said: memory, does: MEMORY_DOES[inputs.memory] });
  return rows.filter((r) => r.does);
}
