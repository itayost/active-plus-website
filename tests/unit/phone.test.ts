import { describe, expect, it } from "vitest";
import { formatLocal, isIsraeliMobile, toE164 } from "@/lib/phone";

describe("phone", () => {
  it.each(["050-1234567", "0501234567", "+972501234567", "972 50 123 4567"])("accepts %s", (n) => {
    expect(isIsraeliMobile(n)).toBe(true);
  });
  it.each(["04-8123456", "12345", "05012345678", ""])("rejects %s", (n) => {
    expect(isIsraeliMobile(n)).toBe(false);
  });
  it("converts to E.164", () => {
    expect(toE164("050-1234567")).toBe("+972501234567");
    expect(toE164("+972501234567")).toBe("+972501234567");
  });
  it("throws for a landline", () => {
    expect(() => toE164("03-1234567")).toThrow();
  });
  it("formats for display", () => {
    expect(formatLocal("+972501234567")).toBe("050-1234567");
  });
});
