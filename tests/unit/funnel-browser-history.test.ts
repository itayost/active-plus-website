import { describe, expect, it } from "vitest";
import { backDepth, planPop, pushesEntry, readEntry, withEntry } from "@/lib/funnel/browser-history";
import { advance, codeSent, initialState, restore, showHours, showPhone, type FunnelState } from "@/lib/funnel/machine";
import type { Answers } from "@/lib/funnel/types";

const ALL: Answers = {
  gender: "female",
  date_of_birth: "1958-01-01",
  aspiration_goal: "family",
  daily_activity_level: "partially_active",
  chair_rise_capability: "alone",
  mobility_challenge: "walking",
  training_frequency_choice: "three_week",
  pain_areas: ["knees"],
  training_time_of_day: "09:00",
};

/** Every screen of a full forward walk, welcome2 to otp, with the moves the funnel makes. */
function walk(): FunnelState[] {
  const states: FunnelState[] = [initialState()];
  let s = initialState();
  const push = (next: FunnelState) => {
    s = next;
    states.push(next);
  };
  while (s.step !== "register") {
    if (s.step === "time" && s.time.sub === "A") push(showHours(s, "morning"));
    else push(advance({ ...s, answers: ALL }));
  }
  push(showPhone(s));
  push(codeSent(s, "0501234567"));
  return states;
}

describe("history entries", () => {
  it("reads the funnel's entry and nothing else", () => {
    expect(readEntry({ apFunnel: { idx: 2, base: 0 }, __NA: true })).toEqual({ idx: 2, base: 0 });
    expect(readEntry(null)).toBeNull();
    expect(readEntry({ __NA: true })).toBeNull();
    expect(readEntry({ apFunnel: { idx: "2", base: 0 } })).toBeNull();
    expect(readEntry({ apFunnel: { idx: 1.5, base: 0 } })).toBeNull();
    expect(readEntry({ apFunnel: { idx: 0, base: 1 } })).toBeNull();
  });

  it("adds the entry to the current state, keeping the router's keys and the original intact", () => {
    const current = { __NA: true, __PRIVATE_NEXTJS_INTERNALS_TREE: ["", {}] };
    const next = withEntry(current, { idx: 3, base: 1 });
    expect(next).toEqual({ ...current, apFunnel: { idx: 3, base: 1 } });
    expect(current).not.toHaveProperty("apFunnel");
    expect(withEntry(null, { idx: 0, base: 0 })).toEqual({ apFunnel: { idx: 0, base: 0 } });
  });
});

describe("backDepth", () => {
  it("counts the backs left: none on welcome2 and gender", () => {
    expect(backDepth(initialState())).toBe(0);
    expect(backDepth(advance(initialState()))).toBe(0);
  });

  it("counts sub-screens: time B, register's phone, and otp's way back through it", () => {
    const states = walk();
    const depth = (pick: (s: FunnelState) => boolean) => backDepth(states.find(pick)!);
    const timeA = depth((s) => s.step === "time" && s.time.sub === "A");
    expect(depth((s) => s.step === "time" && s.time.sub === "B")).toBe(timeA + 1);
    expect(depth((s) => s.step === "register" && s.register.sub === "name")).toBe(timeA + 2);
    expect(depth((s) => s.step === "register" && s.register.sub === "phone")).toBe(timeA + 3);
    expect(depth((s) => s.step === "otp")).toBe(timeA + 4);
  });

  it("matches a restored visitor's back stack", () => {
    expect(backDepth(restore("chairRise", ALL))).toBe(5); // gender, dob, socialProof, aspiration, activityLevel
  });
});

describe("pushesEntry", () => {
  it("adds one entry per forward move, none for welcome2 -> gender or the loader -> time", () => {
    const states = walk();
    const kept: string[] = [];
    for (let i = 1; i < states.length; i++) {
      const grew = backDepth(states[i]) - backDepth(states[i - 1]);
      expect([0, 1]).toContain(grew);
      expect(pushesEntry(states[i - 1], states[i])).toBe(grew === 1);
      if (grew === 0) kept.push(`${states[i - 1].step}->${states[i].step}`);
    }
    expect(kept).toEqual(["welcome2->gender", "planBuilding->time"]);
  });
});

describe("planPop", () => {
  const here = { idx: 3, base: 0 };
  const chair = restore("chairRise", ALL);

  it("ignores entries that are not the funnel's, and the entry it is on", () => {
    expect(planPop(here, null, chair, false)).toEqual({ kind: "none" });
    expect(planPop(here, { idx: 3, base: 0 }, chair, false)).toEqual({ kind: "none" });
  });

  it("undoes a forward move: the funnel cannot redo a screen", () => {
    expect(planPop(here, { idx: 4, base: 0 }, chair, false)).toEqual({ kind: "undo", delta: -1 });
  });

  it("holds while back is not allowed, pushing the entry straight back", () => {
    expect(planPop(here, { idx: 2, base: 0 }, chair, true)).toEqual({ kind: "hold", entry: { idx: 3, base: 0 } });
  });

  it("goes back one screen per entry", () => {
    const plan = planPop(here, { idx: 2, base: 0 }, chair, false);
    expect(plan).toMatchObject({ kind: "back", entry: { idx: 2, base: 0 } });
    expect(plan.kind === "back" && plan.state.step).toBe("activityLevel");
    const two = planPop(here, { idx: 1, base: 0 }, chair, false);
    expect(two.kind === "back" && two.state.step).toBe("aspiration");
  });

  it("leaves to the page before the funnel when there is nothing left to go back to", () => {
    const gender = advance(initialState());
    expect(planPop({ idx: 4, base: 1 }, { idx: 3, base: 1 }, gender, false)).toEqual({ kind: "leave", delta: -3 });
  });
});
