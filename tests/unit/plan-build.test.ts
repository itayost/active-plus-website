import { describe, expect, it } from "vitest";
import { PLAN_BUILD_MS } from "@/lib/funnel/constants";
import { PLAN_BUILD_CURVE, planBuildPercent } from "@/lib/funnel/plan-build";

describe("planBuildPercent (owner, 2026-11-14: slower, uneven)", () => {
  it("starts at 0 and ends at 100 exactly on PLAN_BUILD_MS", () => {
    expect(planBuildPercent(0)).toBe(0);
    expect(planBuildPercent(PLAN_BUILD_MS)).toBe(100);
    expect(planBuildPercent(PLAN_BUILD_MS + 500)).toBe(100);
    expect(PLAN_BUILD_CURVE.at(-1)).toEqual([PLAN_BUILD_MS, 100]);
  });

  it("never goes back", () => {
    let prev = 0;
    for (let t = 0; t <= PLAN_BUILD_MS; t += 20) {
      const p = planBuildPercent(t);
      expect(p).toBeGreaterThanOrEqual(prev);
      prev = p;
    }
  });

  it("is not an even climb: some seconds gain far more than others", () => {
    const gains = Array.from({ length: 9 }, (_, s) => planBuildPercent((s + 1) * 1000) - planBuildPercent(s * 1000));
    expect(Math.max(...gains) - Math.min(...gains)).toBeGreaterThanOrEqual(10);
  });
});
