import { describe, expect, it } from "vitest";
import { paymentPicture } from "@/components/payment/PaymentIncludes";

describe("paymentPicture", () => {
  it("follows the questionnaire's level, then the gender", () => {
    expect(paymentPicture("chair_only", "male").image).toBe("/img/v2/pay-chair.webp");
    expect(paymentPicture("balance_issues", "female").image).toBe("/img/v2/pay-chair-support.webp");
    expect(paymentPicture("fully_independent", "male").image).toBe("/img/v2/pay-independent-man.webp");
    expect(paymentPicture("fully_independent", "female").image).toBe("/img/v2/pay-independent-woman.webp");
  });
  it("shows the trainer woman to a visitor with no answers", () => {
    expect(paymentPicture(undefined, undefined).image).toBe("/img/v2/pay-independent-woman.webp");
  });
});
