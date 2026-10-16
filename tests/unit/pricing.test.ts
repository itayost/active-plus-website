import { describe, expect, it } from "vitest";
import { annualSavings, formatShekel, installmentAmount } from "@/lib/pricing";

describe("pricing", () => {
  it("computes the annual saving from the plan prices, not a printed figure", () => {
    expect(annualSavings()).toBe(360);
  });
  it("splits 828 into installments rounded to agorot", () => {
    expect(installmentAmount(828, 1)).toBe(828);
    expect(installmentAmount(828, 12)).toBe(69);
    expect(installmentAmount(828, 7)).toBe(118.29);
  });
  it("rejects installment counts outside 1-12", () => {
    expect(() => installmentAmount(828, 0)).toThrow(RangeError);
    expect(() => installmentAmount(828, 13)).toThrow(RangeError);
    expect(() => installmentAmount(828, 2.5)).toThrow(RangeError);
  });
  it("formats shekels the Israeli way", () => {
    expect(formatShekel(828)).toBe("828 ₪");
    expect(formatShekel(101.14)).toBe("101.14 ₪");
    expect(formatShekel(1188)).toBe("1,188 ₪");
  });
});
