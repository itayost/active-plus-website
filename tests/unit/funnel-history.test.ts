import { describe, expect, it } from "vitest";
import { restoreHistory, resumeStep } from "@/lib/funnel/history";
import type { Answers } from "@/lib/funnel/types";

const THROUGH_MEMORY: Answers = {
  training_goals: ["strength"],
  gender: "female",
  age_group: "60_69",
  desired_feeling: "daily_energy",
  memory_forgetfulness: "sometimes",
};
const THROUGH_LEVEL: Answers = { ...THROUGH_MEMORY, functionality_level: "balance_issues" };

describe("resumeStep", () => {
  it("starts at the goals question when nothing was saved (the entry screen is gone)", () => {
    expect(resumeStep(null, {})).toBe("goals");
    expect(resumeStep("welcome2", { gender: "male" })).toBe("goals");
  });
  it("resumes on the saved step when every earlier answer is present", () => {
    expect(resumeStep("levelPreview", THROUGH_MEMORY)).toBe("levelPreview");
    expect(resumeStep("goalReinforcement", { training_goals: ["cognition"], gender: "male", age_group: "70_79" })).toBe("goalReinforcement");
  });
  it("falls back to the first unanswered question before the saved step", () => {
    expect(resumeStep("frequency", { training_goals: ["strength"], gender: "male" })).toBe("dob");
    expect(resumeStep("frequency", { gender: "male" })).toBe("goals");
  });
  it("sends a visitor saved on a chair question (before 2026-11-25) to the training preference", () => {
    expect(resumeStep("standingComfort", { ...THROUGH_MEMORY, chair_rise_capability: "with_handles" })).toBe("levelPreview");
  });
  it("treats an empty pain list as unanswered", () => {
    const full = { ...THROUGH_LEVEL, sedentary_lifestyle: "no", training_frequency_choice: "none", pain_areas: [] };
    expect(resumeStep("time", full)).toBe("bodyAreas");
  });
  it("sends a saved otp back to register, where a new code can be requested", () => {
    const all = { ...THROUGH_LEVEL, sedentary_lifestyle: "yes", training_frequency_choice: "none", pain_areas: ["none"], training_time_of_day: "09:00" };
    expect(resumeStep("otp", all)).toBe("register");
  });
  it("never resumes on payment, which is a page of its own", () => {
    const all = { ...THROUGH_LEVEL, sedentary_lifestyle: "yes", training_frequency_choice: "none", pain_areas: ["none"], training_time_of_day: "09:00" };
    expect(resumeStep("payment", all)).toBe("register");
  });
});

describe("restoreHistory", () => {
  it("is empty on welcome2 and goals (goals clears history)", () => {
    expect(restoreHistory("welcome2", {})).toEqual([]);
    expect(restoreHistory("goals", {})).toEqual([]);
  });
  it("rebuilds the route walked so far", () => {
    expect(restoreHistory("levelPreview", THROUGH_MEMORY)).toEqual([
      "goals", "gender", "dob", "goalReinforcement", "desiredFeeling", "memoryForgetfulness",
    ]);
  });
  it("leaves the plan-building loader out, so back from time reaches bodyAreas", () => {
    const all = { ...THROUGH_LEVEL, sedentary_lifestyle: "yes", training_frequency_choice: "none", pain_areas: ["none"] };
    const history = restoreHistory("time", all);
    expect(history).not.toContain("planBuilding");
    expect(history.at(-1)).toBe("bodyAreas");
  });
  it("is empty for a step that is not on the answers' route", () => {
    expect(restoreHistory("challengeArea", THROUGH_LEVEL)).toEqual([]);
  });
});
