import { describe, expect, it } from "vitest";
import { FUNNEL_STEPS } from "@/lib/funnel/contract.generated";
import { ACTION_EVENTS, FUNNEL_EVENT_NAMES, MAX_DATA_BYTES, VIEW_EVENT, parseFunnelEvent } from "@/lib/funnel/events";

const SESSION = "3f2b8c1e-9d4a-4b7e-8a6f-1c2d3e4f5a6b";
const body = (over: Record<string, unknown> = {}) => ({ sessionId: SESSION, step: "welcome2_view", ...over });

describe("event names", () => {
  it("names every funnel step once, as the app's FunnelEventTracker does", () => {
    expect(Object.keys(VIEW_EVENT).sort()).toEqual([...FUNNEL_STEPS].sort());
    expect(VIEW_EVENT).toMatchObject({
      welcome2: "welcome2_view",
      gender: "questionnaire_q5_view",
      socialProof: "social_proof_view",
      aspiration: "questionnaire_aspiration_view",
      activityLevel: "activity_level_view",
      chairRise: "questionnaire_chair_rise_view",
      challengeArea: "challenge_area_view",
      standingComfort: "standing_comfort_view",
      reinforcement2: "reinforcement2_view",
      frequency: "training_frequency_view",
      bodyAreas: "questionnaire_q6_view",
      planBuilding: "plan_build_view",
      time: "questionnaire_q8_view",
      register: "register_view",
      otp: "otp_view",
    });
  });

  it("falls back to <snake_case_step>_view for steps the app does not name", () => {
    expect(VIEW_EVENT.dob).toBe("dob_view");
    expect(VIEW_EVENT.payment).toBe("payment_view");
  });

  it("allows exactly the view events plus the action events", () => {
    expect([...FUNNEL_EVENT_NAMES].sort()).toEqual([...Object.values(VIEW_EVENT), ...ACTION_EVENTS].sort());
    expect(ACTION_EVENTS).toContain("otp_verified");
    expect(ACTION_EVENTS).toContain("register_name_submit");
  });
});

describe("parseFunnelEvent", () => {
  it("accepts a valid body and defaults data to an empty object", () => {
    expect(parseFunnelEvent(body())).toEqual({ sessionId: SESSION, step: "welcome2_view", data: {} });
  });

  it("keeps harmless data", () => {
    expect(parseFunnelEvent(body({ data: { gender: "female", n: 2 } }))?.data).toEqual({ gender: "female", n: 2 });
  });

  it.each([
    ["a bad uuid", body({ sessionId: "not-a-uuid" })],
    ["a missing session id", { step: "welcome2_view" }],
    ["an unknown event", body({ step: "drop_table" })],
    ["a step name instead of an event name", body({ step: "welcome2" })],
    ["a non-object body", "welcome2_view"],
    ["null", null],
    ["an array body", []],
    ["array data", body({ data: [1] })],
    ["string data", body({ data: "x" })],
    ["null data", body({ data: null })],
  ])("rejects %s", (_label, input) => {
    expect(parseFunnelEvent(input)).toBeNull();
  });

  it("drops phone, full_name and name at the top level, case-insensitively", () => {
    const parsed = parseFunnelEvent(
      body({ data: { phone: "0501234567", full_name: "x", name: "y", Name: "z", PHONE: "1", ok: 1 } }),
    );
    expect(parsed?.data).toEqual({ ok: 1 });
  });

  it("rejects data over the byte cap and accepts data at it", () => {
    expect(parseFunnelEvent(body({ data: { blob: "a".repeat(MAX_DATA_BYTES) } }))).toBeNull();
    const fits = MAX_DATA_BYTES - JSON.stringify({ b: "" }).length;
    expect(parseFunnelEvent(body({ data: { b: "a".repeat(fits) } }))).not.toBeNull();
  });

  it("measures bytes, not characters: Hebrew is two bytes per letter", () => {
    const letters = Math.ceil(MAX_DATA_BYTES / 2); // fewer than the cap in characters, over it in bytes
    expect(letters).toBeLessThan(MAX_DATA_BYTES);
    expect(parseFunnelEvent(body({ data: { note: "א".repeat(letters) } }))).toBeNull();
  });
});
