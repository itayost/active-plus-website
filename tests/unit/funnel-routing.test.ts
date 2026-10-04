import { describe, expect, it } from "vitest";
import fixtures from "../fixtures/orchestrator.fixtures.json";
import { cleanOffBranch, clearsHistory, firstStep, indicator, nextStep } from "@/lib/funnel/routing";
import type { Answers, Step } from "@/lib/funnel/types";

/** Walk the funnel the way the app's fixture contract does. Web has no Apple path. */
function walk(answers: Answers): Step[] {
  const seq: Step[] = [firstStep()];
  let step: Step | null = firstStep();
  while ((step = nextStep(step, answers))) seq.push(step);
  return seq;
}

describe("routing parity with the app's orchestrator fixtures", () => {
  for (const s of fixtures.scenarios.filter((x) => x.registerEvent === "standard")) {
    it(s.name, () => {
      expect(walk(s.initialAnswers as Answers)).toEqual(s.expectedSequence);
    });
  }
});

describe("indicator", () => {
  it("shows 8 dots on the 8 question steps and nothing elsewhere", () => {
    const a: Answers = { chair_rise_capability: "alone" };
    const shown = walk(a).filter((s) => indicator(s, a)).map((s) => indicator(s, a)!.index);
    expect(shown).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(indicator("socialProof", a)).toBeNull();
    expect(indicator("register", a)).toBeNull();
  });
  it("puts standingComfort at dot 5 on the handles branch", () => {
    expect(indicator("standingComfort", { chair_rise_capability: "with_handles" })).toEqual({ index: 5, total: 8 });
  });
});

describe("branch hygiene", () => {
  it("drops standing_stability when the chair answer is not with_handles", () => {
    expect(cleanOffBranch({ chair_rise_capability: "alone", standing_stability: "seated" })).toEqual({ chair_rise_capability: "alone" });
  });
  it("drops mobility_challenge on the with_handles branch", () => {
    expect(cleanOffBranch({ chair_rise_capability: "with_handles", mobility_challenge: "stairs", standing_stability: "stable" }))
      .toEqual({ chair_rise_capability: "with_handles", standing_stability: "stable" });
  });
  it("does not mutate its input", () => {
    const a: Answers = { chair_rise_capability: "alone", standing_stability: "seated" };
    cleanOffBranch(a);
    expect(a.standing_stability).toBe("seated");
  });
  it("clears history on entering gender only", () => {
    expect(clearsHistory("gender")).toBe(true);
    expect(clearsHistory("dob")).toBe(false);
  });
});
