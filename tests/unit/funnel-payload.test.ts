import { describe, expect, it } from "vitest";
import { buildMergePayload, dobFromYear, normalizePainAreas, toggleBodyArea } from "@/lib/funnel/payload";

describe("payload", () => {
  it("stores DOB as Jan 1 of the year", () => {
    expect(dobFromYear(1958)).toBe("1958-01-01");
  });
  it("orders pain areas the way the app stores them", () => {
    expect(normalizePainAreas(["knees", "neck", "lower_back"])).toEqual(["neck", "lower_back", "knees"]);
  });
  it("makes 'none' exclusive in both directions", () => {
    expect(toggleBodyArea(["knees", "neck"], "none")).toEqual(["none"]);
    expect(toggleBodyArea(["none"], "knees")).toEqual(["knees"]);
    expect(toggleBodyArea(["knees"], "knees")).toEqual([]);
  });
  it("builds a merge payload with only answered keys and no off-branch follow-up", () => {
    const p = buildMergePayload({
      gender: "female", chair_rise_capability: "alone", standing_stability: "seated",
      mobility_challenge: "stairs", pain_areas: ["knees", "neck"], full_name: "  רחל כהן ",
    });
    expect(p).toEqual({ gender: "female", chair_rise_capability: "alone", mobility_challenge: "stairs", pain_areas: ["neck", "knees"], full_name: "רחל כהן" });
  });
  it("does not mutate its inputs", () => {
    const answers = { pain_areas: ["knees", "neck"], full_name: " a " };
    const snapshot = structuredClone(answers);
    buildMergePayload(answers);
    expect(answers).toEqual(snapshot);
    const current = ["knees"];
    toggleBodyArea(current, "neck");
    expect(current).toEqual(["knees"]);
  });
  it("drops empty values", () => {
    expect(buildMergePayload({ gender: "male", full_name: "", pain_areas: [] })).toEqual({ gender: "male" });
  });
});
