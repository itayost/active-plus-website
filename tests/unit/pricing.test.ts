import { describe, expect, it } from "vitest";
import { annualSavings, formatShekel, installmentAmount } from "@/lib/pricing";

describe("pricing", () => {
  it("computes the annual saving from the plan prices, not the brief's 600", () => {
    expect(annualSavings()).toBe(480);
  });
  it("splits 708 into installments rounded to agorot", () => {
    expect(installmentAmount(708, 1)).toBe(708);
    expect(installmentAmount(708, 12)).toBe(59);
    expect(installmentAmount(708, 7)).toBe(101.14);
  });
  it("rejects installment counts outside 1-12", () => {
    expect(() => installmentAmount(708, 0)).toThrow(RangeError);
    expect(() => installmentAmount(708, 13)).toThrow(RangeError);
    expect(() => installmentAmount(708, 2.5)).toThrow(RangeError);
  });
  it("formats shekels the Israeli way", () => {
    expect(formatShekel(708)).toBe("708 ₪");
    expect(formatShekel(101.14)).toBe("101.14 ₪");
    expect(formatShekel(1188)).toBe("1,188 ₪");
  });
});
