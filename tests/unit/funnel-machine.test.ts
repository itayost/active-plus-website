import { describe, expect, it } from "vitest";
import { advance, back, initialState, restore, showHours, type FunnelState } from "@/lib/funnel/machine";
import type { Answers } from "@/lib/funnel/types";

const ALL: Answers = {
  gender: "male",
  date_of_birth: "1961-01-01",
  aspiration_goal: "all",
  daily_activity_level: "very_active",
  chair_rise_capability: "alone",
  mobility_challenge: "stairs",
  training_frequency_choice: "none",
  pain_areas: ["knees"],
  training_time_of_day: "17:15",
};

const at = (step: FunnelState["step"], history: FunnelState["step"][], answers: Answers = ALL): FunnelState => ({
  ...initialState(),
  step,
  history,
  answers,
});

describe("funnel machine", () => {
  it("starts on welcome2 with nothing behind it", () => {
    expect(initialState()).toMatchObject({ step: "welcome2", history: [], answers: {} });
  });

  it("entering gender clears the back history", () => {
    const next = advance(at("welcome2", ["frequency"], {}));
    expect(next.step).toBe("gender");
    expect(next.history).toEqual([]);
  });

  it("pushes the step it leaves and follows the chair branch", () => {
    const next = advance(at("chairRise", ["gender"], { chair_rise_capability: "with_handles" }));
    expect(next.step).toBe("standingComfort");
    expect(next.history).toEqual(["gender", "chairRise"]);
  });

  it("uses the answers it is given, not the stale ones on the state", () => {
    const next = advance(at("chairRise", [], {}), { chair_rise_capability: "with_handles" });
    expect(next.step).toBe("standingComfort");
    expect(next.answers).toEqual({ chair_rise_capability: "with_handles" });
  });

  it("drops the draft when it moves", () => {
    const next = advance({ ...at("frequency", []), draft: { training_frequency_choice: "none" } });
    expect(next.draft).toEqual({});
  });

  it("does not keep the loader in history, and enters time on the segment screen", () => {
    const loader = advance(at("bodyAreas", ["frequency"]));
    expect(loader.step).toBe("planBuilding");
    const time = advance(loader);
    expect(time.step).toBe("time");
    expect(time.history).toEqual(["frequency", "bodyAreas"]);
    expect(time.time).toEqual({ sub: "A", segment: "afternoon" });
  });

  it("back from the time segment screen goes to bodyAreas, never the loader", () => {
    const prev = back({ ...at("time", ["frequency", "bodyAreas", "planBuilding"]), time: { sub: "A", segment: null } });
    expect(prev.step).toBe("bodyAreas");
    expect(prev.history).toEqual(["frequency"]);
  });

  it("back from the hour screen returns to the segment screen on the same step", () => {
    const hours = showHours(at("time", ["bodyAreas"]), "morning");
    expect(hours.time).toEqual({ sub: "B", segment: "morning" });
    const prev = back(hours);
    expect(prev.step).toBe("time");
    expect(prev.time).toEqual({ sub: "A", segment: "morning" });
    expect(prev.history).toEqual(["bodyAreas"]);
  });

  it("back into time lands on the hour screen of the saved time", () => {
    const prev = back(at("register", ["bodyAreas", "time"]));
    expect(prev.step).toBe("time");
    expect(prev.time).toEqual({ sub: "B", segment: "afternoon" });
  });

  it("back with no history stays put", () => {
    const state = at("gender", []);
    expect(back(state)).toBe(state);
  });

  it("does nothing past the last step", () => {
    const state = at("payment", []);
    expect(advance(state).step).toBe("payment");
  });

  it("restores the saved step with the route behind it", () => {
    const state = restore("frequency", ALL);
    expect(state.step).toBe("frequency");
    expect(state.history.at(-1)).toBe("reinforcement2");
    expect(state.answers).toBe(ALL);
  });

  it("restores time on its segment screen", () => {
    expect(restore("time", ALL).time).toEqual({ sub: "A", segment: "afternoon" });
  });
});
