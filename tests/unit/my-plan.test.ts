import { describe, expect, it } from "vitest";
import { planInputsOf } from "@/lib/funnel/storage";
import { bodyOutcome, curve, memoryOutcome, outcomes, smoothPath, targetDate } from "@/lib/plan/twenty-eight";

describe("the specific results (one body, one memory)", () => {
  it("puts the difficulty they named first", () => {
    expect(bodyOutcome({ mobility: "stairs", chairRise: "with_handles", goal: "strength" })).toBe("לעלות מדרגות בלי להתנשף");
    expect(bodyOutcome({ mobility: "floor_rise" })).toBe("לקום מהרצפה בקלות");
    expect(bodyOutcome({ mobility: "walking" })).toBe("ללכת יותר, בקלות ובביטחון");
  });
  it("then getting up from a chair when they need help", () => {
    expect(bodyOutcome({ mobility: "none", chairRise: "with_support", goal: "strength" })).toBe("לקום מכיסא בלי עזרת הידיים");
    expect(bodyOutcome({ chairRise: "alone", goal: "strength" })).toBe("לסחוב את הקניות בקלות");
  });
  it("then their goal, strength when there is none", () => {
    expect(bodyOutcome({ goal: "weight_loss" })).toBe("יותר אנרגיה מהבוקר עד הערב");
    expect(bodyOutcome({ goal: "flexibility_balance" })).toBe("להתכופף ולהסתובב בחופשיות");
    expect(bodyOutcome(null)).toBe("לסחוב את הקניות בקלות");
  });
  it("reads the memory answer", () => {
    expect(memoryOutcome({ memory: "almost_never" })).toBe("ריכוז חד לאורך כל היום");
    expect(memoryOutcome({ memory: "sometimes" })).toBe("לא לשכוח איפה שמתי דברים");
    expect(memoryOutcome({ memory: "less_sharp" })).toBe("לזכור שמות ורשימות בלי לרשום");
    expect(memoryOutcome(null)).toBe("לזכור שמות ורשימות בלי לרשום");
  });
  it("gives the body result first, then memory, in the chart's colours", () => {
    expect(outcomes(null).map((o) => o.color)).toEqual(["#2E7D32", "#1E6FD9"]);
  });
});

describe("targetDate", () => {
  it("is 28 days on, in Hebrew, in Israel's calendar", () => {
    expect(targetDate(new Date("2026-11-15T10:00:00Z"))).toBe("13 בדצמבר");
    expect(targetDate(new Date("2026-12-20T23:30:00Z"))).toBe("18 בינואר");
    expect(targetDate(new Date("2026-11-15T10:00:00Z"), true)).toBe("13.12");
  });
});

describe("curve (the chart's illustration)", () => {
  it("rises from today to day 28 and stays inside the frame", () => {
    const points = curve(0);
    expect(points).toHaveLength(29);
    expect(points[0].y).toBeCloseTo(0.12);
    expect(points[28].y).toBeCloseTo(0.88);
    expect(points.every((p, i) => i === 0 || p.y >= points[i - 1].y)).toBe(true);
  });
  it("keeps the second line behind and below the first, so their ends never overlap", () => {
    expect(curve(0.05, 0.72)[7].y).toBeLessThan(curve(0)[7].y);
    expect(curve(0.05, 0.72)[28].y).toBeCloseTo(0.72);
  });
});

describe("smoothPath", () => {
  it("starts at the first point and ends at the last, in the box", () => {
    const d = smoothPath([{ x: 0, y: 0 }, { x: 0.5, y: 0.5 }, { x: 1, y: 1 }], 100, 50);
    expect(d.startsWith("M0.0 50.0")).toBe(true);
    expect(d.endsWith("100.0 0.0")).toBe(true);
    expect(d.match(/C/g)).toHaveLength(2);
  });
});

describe("planInputsOf", () => {
  it("keeps only what the plan needs, with the first name", () => {
    expect(
      planInputsOf({ training_goals: ["strength"], desired_feeling: "daily_energy", training_frequency_choice: "three_week", memory_forgetfulness: "sometimes", full_name: "  רותי כהן ", pain_areas: ["knees"] }),
    ).toEqual({ goal: "strength", feeling: "daily_energy", frequency: "three_week", memory: "sometimes", chairRise: undefined, mobility: undefined, firstName: "רותי" });
  });
});
