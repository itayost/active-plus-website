import { describe, expect, it } from "vitest";
import { parsePendingPayment, TTL } from "@/lib/funnel/storage";

const now = Date.UTC(2026, 10, 21, 18);

describe("parsePendingPayment", () => {
  it("keeps a visitor who left the payment page within the session's time", () => {
    const raw = JSON.stringify({ at: now - 3 * 86_400_000, gender: "female", session: "s1", plan: '{"firstName":"רותי"}' });
    expect(parsePendingPayment(raw, now)).toEqual({ at: now - 3 * 86_400_000, gender: "female", session: "s1", plan: '{"firstName":"רותי"}' });
  });
  it("drops an old, missing or broken value", () => {
    expect(parsePendingPayment(JSON.stringify({ at: now - TTL - 1, gender: null, session: null, plan: null }), now)).toBeNull();
    expect(parsePendingPayment(null, now)).toBeNull();
    expect(parsePendingPayment("not json", now)).toBeNull();
    expect(parsePendingPayment(JSON.stringify({ gender: "male" }), now)).toBeNull();
  });
});
