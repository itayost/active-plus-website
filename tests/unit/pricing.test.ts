import { describe, expect, it } from "vitest";
import {
  annualCardCopy, annualSavings, describePlans, formatShekel, installmentAmount, MAX_INSTALLMENTS, perPayment, priceLabel, priceParts,
} from "@/lib/pricing";

const PRICES = { annual: { total: 828, maxInstallments: 12 }, monthly: { total: 99, maxInstallments: 1 } };
const withAnnual = (total: number, maxInstallments: number) => ({ ...PRICES, annual: { total, maxInstallments } });

describe("pricing", () => {
  it("shows the annual total split over its installment ceiling, and the monthly charge as is", () => {
    expect(perPayment(PRICES, "annual")).toBe(69);
    expect(perPayment(withAnnual(828, 6), "annual")).toBe(138);
    expect(perPayment(withAnnual(828, 1), "annual")).toBe(828);
    expect(perPayment(PRICES, "monthly")).toBe(99);
  });
  it("labels the price: a monthly figure, or one payment when the annual cannot be split", () => {
    expect(priceLabel(PRICES, "annual")).toBe("69 ₪ לחודש");
    expect(priceLabel(withAnnual(828, 6), "annual")).toBe("138 ₪ לחודש");
    expect(priceLabel(withAnnual(828, 1), "annual")).toBe("828 ₪ בתשלום אחד");
    expect(priceLabel(PRICES, "monthly")).toBe("99 ₪ לחודש");
    expect(priceParts(PRICES, "monthly")).toEqual({ amount: "99 ₪", suffix: "לחודש" });
    expect(priceParts(withAnnual(828, 1), "annual")).toEqual({ amount: "828 ₪", suffix: "בתשלום אחד" });
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

describe("the annual card", () => {
  it("today: 69 a month for 12 installments, the 360 saving and its claim", () => {
    expect(annualCardCopy(PRICES)).toEqual({
      amount: "69 ₪",
      suffix: "לחודש",
      terms: "ל-12 תשלומים · מנוי שנתי",
      charge: "חיוב אחד של 828 ₪, אפשר לחלק עד 12 תשלומים",
      saving: "חיסכון של 360 ₪ לעומת המנוי החודשי",
      badge: "מנוי שנתי – החיסכון הגדול",
    });
  });
  it("a ceiling of 6: the monthly figure is the total over 6, next to the same 6", () => {
    const card = annualCardCopy(withAnnual(828, 6));
    expect([card.amount, card.terms, card.charge]).toEqual(["138 ₪", "ל-6 תשלומים · מנוי שנתי", "חיוב אחד של 828 ₪, אפשר לחלק עד 6 תשלומים"]);
  });
  it("a ceiling of 1 says one payment, never 'up to 1 payments'", () => {
    const card = annualCardCopy(withAnnual(828, 1));
    expect([card.amount, card.suffix, card.terms, card.charge]).toEqual(["828 ₪", "בתשלום אחד", "תשלום אחד · מנוי שנתי", "חיוב אחד של 828 ₪"]);
    expect(JSON.stringify(card)).not.toMatch(/1 תשלומים/);
  });
  it("no saving, no saving line and no 'biggest saving' claim", () => {
    for (const total of [1188, 1300]) {
      const card = annualCardCopy(withAnnual(total, 12));
      expect([card.saving, card.badge]).toEqual([null, null]);
    }
  });
});

describe("the /payment description", () => {
  it("is written from the prices", () => {
    expect(describePlans(PRICES)).toBe(
      "מנוי שנתי ב־69 ₪ לחודש (חיוב אחד של 828 ₪, עד 12 תשלומים) או מנוי חודשי ב־99 ₪, ללא התחייבות. שני המסלולים כוללים תוכנית אימון מותאמת אישית.",
    );
  });
  it("a ceiling of 1 reads as one payment", () => {
    expect(describePlans(withAnnual(828, 1))).toBe(
      "מנוי שנתי בתשלום אחד של 828 ₪ או מנוי חודשי ב־99 ₪, ללא התחייבות. שני המסלולים כוללים תוכנית אימון מותאמת אישית.",
    );
  });
  it("without prices names no figure", () => {
    expect(describePlans(null)).not.toMatch(/\d/);
  });
});
