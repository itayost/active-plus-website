import { describe, expect, it } from "vitest";
import { restoreHistory, resumeStep } from "@/lib/funnel/history";
import type { Answers } from "@/lib/funnel/types";

const THROUGH_CHAIR: Answers = {
  training_goals: ["strength"],
  gender: "female",
  age_group: "60_69",
  desired_feeling: "daily_energy",
  memory_forgetfulness: "sometimes",
  chair_rise_capability: "with_handles",
};

describe("resumeStep", () => {
  it("starts at welcome2 when nothing was saved", () => {
    expect(resumeStep(null, {})).toBe("welcome2");
    expect(resumeStep("welcome2", { gender: "male" })).toBe("welcome2");
  });
  it("resumes on the saved step when every earlier answer is present", () => {
    expect(resumeStep("standingComfort", THROUGH_CHAIR)).toBe("standingComfort");
    expect(resumeStep("goalReinforcement", { training_goals: ["cognition"], gender: "male", age_group: "70_79" })).toBe("goalReinforcement");
  });
  it("falls back to the first unanswered question before the saved step", () => {
    expect(resumeStep("frequency", { training_goals: ["strength"], gender: "male" })).toBe("dob");
    expect(resumeStep("frequency", { gender: "male" })).toBe("goals");
  });
  it("follows the branch the answers take, not the saved one", () => {
    const alone = { ...THROUGH_CHAIR, chair_rise_capability: "alone" };
    expect(resumeStep("standingComfort", alone)).toBe("challengeArea");
  });
  it("treats an empty pain list as unanswered", () => {
    const full = { ...THROUGH_CHAIR, standing_stability: "stable", sedentary_lifestyle: "no", training_frequency_choice: "none", pain_areas: [] };
    expect(resumeStep("time", full)).toBe("bodyAreas");
  });
  it("sends a saved otp back to register, where a new code can be requested", () => {
    const all = { ...THROUGH_CHAIR, standing_stability: "seated", sedentary_lifestyle: "yes", training_frequency_choice: "none", pain_areas: ["none"], training_time_of_day: "09:00" };
    expect(resumeStep("otp", all)).toBe("register");
  });
  it("never resumes on payment, which is a page of its own", () => {
    const all = { ...THROUGH_CHAIR, standing_stability: "seated", sedentary_lifestyle: "yes", training_frequency_choice: "none", pain_areas: ["none"], training_time_of_day: "09:00" };
    expect(resumeStep("payment", all)).toBe("register");
  });
});

describe("restoreHistory", () => {
  it("is empty on welcome2 and goals (goals clears history)", () => {
    expect(restoreHistory("welcome2", {})).toEqual([]);
    expect(restoreHistory("goals", {})).toEqual([]);
  });
  it("rebuilds the route walked so far", () => {
    expect(restoreHistory("standingComfort", THROUGH_CHAIR)).toEqual([
      "goals", "gender", "dob", "goalReinforcement", "desiredFeeling", "memoryForgetfulness", "chairRise",
    ]);
  });
  it("leaves the plan-building loader out, so back from time reaches bodyAreas", () => {
    const all = { ...THROUGH_CHAIR, standing_stability: "seated", sedentary_lifestyle: "yes", training_frequency_choice: "none", pain_areas: ["none"] };
    const history = restoreHistory("time", all);
    expect(history).not.toContain("planBuilding");
    expect(history.at(-1)).toBe("bodyAreas");
  });
  it("is empty for a step that is not on the answers' route", () => {
    expect(restoreHistory("challengeArea", THROUGH_CHAIR)).toEqual([]);
  });
});
