import { describe, expect, it } from "vitest";
import { mayResume, mayJumpToPayment } from "@/lib/funnel/entry";

describe("mayResume", () => {
  it("starts a new entry at the first page", () => {
    expect(mayResume("navigate", false)).toBe(false);
    expect(mayResume(null, false)).toBe(false);
  });
  it("resumes inside the same visit", () => {
    expect(mayResume("reload", false)).toBe(true);
    expect(mayResume("back_forward", false)).toBe(true);
    expect(mayResume("navigate", true)).toBe(true);
  });
});

describe("mayJumpToPayment", () => {
  it("never sends a visitor back to the payment page on the browser's back", () => {
    expect(mayJumpToPayment("back_forward", null, 1_000_000)).toBe(false);
  });
  it("sends a fresh entry on, once in 30 seconds per tab", () => {
    expect(mayJumpToPayment("navigate", null, 1_000_000)).toBe(true);
    expect(mayJumpToPayment("navigate", 1_000_000 - 5_000, 1_000_000)).toBe(false);
    expect(mayJumpToPayment("reload", 1_000_000 - 60_000, 1_000_000)).toBe(true);
  });
});
