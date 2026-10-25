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
  it("shows the apps' three sections, each restarting after a reinforcement", () => {
    const a: Answers = { chair_rise_capability: "alone" };
    const shown = walk(a).flatMap((s) => {
      const bar = indicator(s, a);
      return bar ? [`${bar.label}:${bar.index}/${bar.total}`] : [];
    });
    expect(shown).toEqual([
      "נעים להכיר:1/3", "נעים להכיר:2/3", "נעים להכיר:3/3",
      "מכירים אתכם טוב יותר:1/4", "מכירים אתכם טוב יותר:2/4", "מכירים אתכם טוב יותר:3/4", "מכירים אתכם טוב יותר:4/4",
      "התאמה אישית:1/3", "התאמה אישית:2/3", "התאמה אישית:3/3",
    ]);
    expect(indicator("goalReinforcement", a)).toBeNull();
    expect(indicator("register", a)).toBeNull();
  });
  it("puts standingComfort last in the second section on the handles branch", () => {
    expect(indicator("standingComfort", { chair_rise_capability: "with_handles" })).toMatchObject({ index: 4, total: 4 });
    expect(indicator("challengeArea", { chair_rise_capability: "with_handles" })).toBeNull();
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
  it("clears history on entering goals (the first question) only", () => {
    expect(clearsHistory("goals")).toBe(true);
    expect(clearsHistory("gender")).toBe(false);
  });
});

describe("edge cases", () => {
  it("sanity: fixture has exactly 5 standard scenarios", () => {
    const standard = fixtures.scenarios.filter((x) => x.registerEvent === "standard");
    expect(standard.length).toBe(5);
  });

  it("nextStep returns null at payment (terminal step)", () => {
    expect(nextStep("payment", {})).toBeNull();
  });

  it("nextStep returns null for unknown steps instead of wrapping", () => {
    expect(nextStep("bogus" as Step, {})).toBeNull();
  });

  it("cleanOffBranch without chair_rise_capability drops standing_stability, keeps mobility_challenge", () => {
    expect(cleanOffBranch({ standing_stability: "seated", mobility_challenge: "stairs" }))
      .toEqual({ mobility_challenge: "stairs" });
  });
});
