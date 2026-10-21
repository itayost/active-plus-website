import { describe, expect, it } from "vitest";
import { annualSavings, formatShekel, installmentAmount, MAX_INSTALLMENTS, pricePerMonth } from "@/lib/pricing";

const PRICES = { annual: { total: 828, maxInstallments: 12 }, monthly: { total: 99, maxInstallments: 1 } };

describe("pricing", () => {
  it("shows the annual total spread over its 12 months, and the monthly as is", () => {
    expect(pricePerMonth(PRICES, "annual")).toBe(69);
    expect(pricePerMonth(PRICES, "monthly")).toBe(99);
    expect(pricePerMonth({ ...PRICES, annual: { total: 900, maxInstallments: 12 } }, "annual")).toBe(75);
  });
  it("computes the annual saving from the plan prices, not a printed figure", () => {
    expect(annualSavings(PRICES)).toBe(360);
    expect(annualSavings({ ...PRICES, monthly: { total: 109, maxInstallments: 1 } })).toBe(480);
  });
  it("splits 828 into installments rounded to agorot", () => {
    expect(installmentAmount(828, 1)).toBe(828);
    expect(installmentAmount(828, 12)).toBe(69);
    expect(installmentAmount(828, 7)).toBe(118.29);
  });
  it("rejects installment counts outside 1-12", () => {
    expect(MAX_INSTALLMENTS).toBe(12);
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
