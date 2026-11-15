import { describe, expect, it } from "vitest";
import { planInputsOf } from "@/lib/funnel/storage";
import { buildPlan, curve } from "@/lib/plan/twenty-eight";

describe("buildPlan (the 28-day plan)", () => {
  it("follows the goal, body and mind together", () => {
    const plan = buildPlan({ goal: "flexibility_balance", frequency: "three_week" });
    expect(plan.lines).toEqual(["גמישות ושיווי משקל", "חדות מחשבה"]);
    expect(plan.workoutsPerWeek).toBe(3);
    expect(plan.weeks).toHaveLength(4);
    expect(plan.weeks.every((w) => w.body && w.mind)).toBe(true);
  });
  it("gives cognition the body as its second line", () => {
    expect(buildPlan({ goal: "cognition" }).lines).toEqual(["זיכרון וריכוז", "כוח ויציבות"]);
  });
  it("maps the frequency as the apps do, and starts 'none' at three", () => {
    expect(buildPlan({ frequency: "almost_daily" }).workoutsPerWeek).toBe(6);
    expect(buildPlan({ frequency: "one_two_week" }).workoutsPerWeek).toBe(2);
    expect(buildPlan({ frequency: "none" }).workoutsPerWeek).toBe(3);
    expect(buildPlan(null).workoutsPerWeek).toBe(3);
  });
  it("reads an unknown goal as strength", () => {
    expect(buildPlan({ goal: "x" }).lines[0]).toBe("כוח שרירים");
  });
  it("builds 'why this fits you' from the answers, in the visitor's gender", () => {
    const plan = buildPlan({ goal: "cognition", feeling: "sense_of_progress", memory: "less_sharp" }, "female");
    expect(plan.because.map((r) => r.said)).toEqual(["המטרה: לשפר את הזיכרון והריכוז", "חשוב לך: להרגיש שאני מתקדמת", "הזיכרון פחות חד מבעבר"]);
    expect(buildPlan({ feeling: "sense_of_progress" }, "male").because[0].said).toBe("חשוב לך: להרגיש שאני מתקדם");
    expect(buildPlan(null).because).toEqual([]);
  });
});

describe("curve (the graph's illustration)", () => {
  it("rises from today to day 28 and stays inside the frame", () => {
    const points = curve(0);
    expect(points).toHaveLength(29);
    expect(points[0].y).toBeCloseTo(0.15);
    expect(points[28].y).toBeCloseTo(0.9);
    expect(points.every((p, i) => i === 0 || p.y >= points[i - 1].y)).toBe(true);
  });
  it("keeps the second line behind the first", () => {
    expect(curve(0.08)[7].y).toBeLessThan(curve(0)[7].y);
  });
});

describe("planInputsOf", () => {
  it("keeps only what the plan needs, with the first name", () => {
    expect(
      planInputsOf({ training_goals: ["strength"], desired_feeling: "daily_energy", training_frequency_choice: "three_week", memory_forgetfulness: "sometimes", full_name: "  רותי כהן ", pain_areas: ["knees"] }),
    ).toEqual({ goal: "strength", feeling: "daily_energy", frequency: "three_week", memory: "sometimes", firstName: "רותי" });
  });
});
