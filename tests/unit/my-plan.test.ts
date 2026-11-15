import { describe, expect, it } from "vitest";
import { planInputsOf } from "@/lib/funnel/storage";
import { curve, curveAt, PLAN_LINES, smoothPath, targetDate } from "@/lib/plan/twenty-eight";

describe("the plan's two goals", () => {
  it("are the owner's two boxes, in the chart's colours", () => {
    expect(PLAN_LINES.map((l) => [l.label, l.color])).toEqual([
      ["חיזוק שרירים", "#2E7D32"],
      ["שיפור הזיכרון", "#1E6FD9"],
    ]);
  });
});

describe("targetDate", () => {
  it("is 28 days on, in Hebrew, in Israel's calendar", () => {
    expect(targetDate(new Date("2026-11-15T10:00:00Z"))).toBe("13 בדצמבר");
    expect(targetDate(new Date("2026-12-20T23:30:00Z"))).toBe("18 בינואר");
    expect(targetDate(new Date("2026-11-15T10:00:00Z"), true)).toBe("13.12");
  });
});

describe("curve (the waves)", () => {
  const body = curve(0, 0.86, 0);
  const memory = curve(0.04, 0.7, 1.6);
  it("starts flat at today and ends near its top", () => {
    expect(body[0].y).toBeCloseTo(0.12);
    expect(curveAt(body, 28)).toBeGreaterThan(0.8);
    expect(curveAt(body, 28)).toBeLessThan(0.92);
  });
  it("is not a straight climb: it dips somewhere along the way", () => {
    expect(body.some((p, i) => i > 0 && p.y < body[i - 1].y)).toBe(true);
  });
  it("still rises week on week, and stays inside the frame", () => {
    const weeks = [0, 7, 14, 21, 28].map((d) => curveAt(body, d));
    expect(weeks.every((y, i) => i === 0 || y > weeks[i - 1])).toBe(true);
    expect(body.every((p) => p.y >= 0.1 && p.y <= 1)).toBe(true);
  });
  it("keeps memory below the body line at the end, so their end points never overlap", () => {
    expect(curveAt(memory, 28)).toBeLessThan(curveAt(body, 28) - 0.08);
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
