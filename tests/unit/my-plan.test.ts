import { describe, expect, it } from "vitest";
import { planInputsOf } from "@/lib/funnel/storage";
import { curve, PLAN_LINES, smoothPath } from "@/lib/plan/twenty-eight";

describe("the 28-day plan page", () => {
  it("names the two things it builds, as the owner wrote them", () => {
    expect(PLAN_LINES.map((l) => l.label)).toEqual(["חיזוק שרירים", "שיפור הזיכרון"]);
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
    ).toEqual({ goal: "strength", feeling: "daily_energy", frequency: "three_week", memory: "sometimes", firstName: "רותי" });
  });
});
