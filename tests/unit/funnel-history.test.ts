import { describe, expect, it } from "vitest";
import { restoreHistory, resumeStep } from "@/lib/funnel/history";
import type { Answers } from "@/lib/funnel/types";

const THROUGH_CHAIR: Answers = {
  gender: "female",
  date_of_birth: "1960-01-01",
  aspiration_goal: "all",
  daily_activity_level: "very_active",
  chair_rise_capability: "with_handles",
};

describe("resumeStep", () => {
  it("starts at welcome2 when nothing was saved", () => {
    expect(resumeStep(null, {})).toBe("welcome2");
    expect(resumeStep("welcome2", { gender: "male" })).toBe("welcome2");
  });
  it("resumes on the saved step when every earlier answer is present", () => {
    expect(resumeStep("standingComfort", THROUGH_CHAIR)).toBe("standingComfort");
    expect(resumeStep("socialProof", { gender: "male", date_of_birth: "1958-01-01" })).toBe("socialProof");
  });
  it("falls back to the first unanswered question before the saved step", () => {
    expect(resumeStep("frequency", { gender: "male" })).toBe("dob");
  });
  it("follows the branch the answers take, not the saved one", () => {
    const alone = { ...THROUGH_CHAIR, chair_rise_capability: "alone" };
    expect(resumeStep("standingComfort", alone)).toBe("challengeArea");
  });
  it("treats an empty pain list as unanswered", () => {
    const full = { ...THROUGH_CHAIR, standing_stability: "stable", training_frequency_choice: "none", pain_areas: [] };
    expect(resumeStep("time", full)).toBe("bodyAreas");
  });
  it("sends a saved otp back to register, where a new code can be requested", () => {
    const all = { ...THROUGH_CHAIR, standing_stability: "seated", training_frequency_choice: "none", pain_areas: ["none"], training_time_of_day: "09:00" };
    expect(resumeStep("otp", all)).toBe("register");
  });
  it("never resumes on payment, which is a page of its own", () => {
    const all = { ...THROUGH_CHAIR, standing_stability: "seated", training_frequency_choice: "none", pain_areas: ["none"], training_time_of_day: "09:00" };
    expect(resumeStep("payment", all)).toBe("register");
  });
});

describe("restoreHistory", () => {
  it("is empty on welcome2 and gender (gender clears history)", () => {
    expect(restoreHistory("welcome2", {})).toEqual([]);
    expect(restoreHistory("gender", {})).toEqual([]);
  });
  it("rebuilds the route walked so far", () => {
    expect(restoreHistory("standingComfort", THROUGH_CHAIR)).toEqual([
      "gender", "dob", "socialProof", "aspiration", "activityLevel", "chairRise",
    ]);
  });
  it("leaves the plan-building loader out, so back from time reaches bodyAreas", () => {
    const all = { ...THROUGH_CHAIR, standing_stability: "seated", training_frequency_choice: "none", pain_areas: ["none"] };
    const history = restoreHistory("time", all);
    expect(history).not.toContain("planBuilding");
    expect(history.at(-1)).toBe("bodyAreas");
  });
  it("is empty for a step that is not on the answers' route", () => {
    expect(restoreHistory("challengeArea", THROUGH_CHAIR)).toEqual([]);
  });
});
