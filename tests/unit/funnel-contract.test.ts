import { describe, expect, it } from "vitest";
import { ANSWER_KEYS, FUNNEL_STEPS } from "@/lib/funnel/contract.generated";
import { COPY_KEYS } from "@/lib/funnel/copy";

describe("contract", () => {
  it("the contract still starts at welcome2 and ends at payment", () => {
    expect(FUNNEL_STEPS[0]).toBe("welcome2");
    expect(FUNNEL_STEPS.at(-1)).toBe("payment");
  });

  it("ANSWER_KEYS includes required answer keys", () => {
    const requiredKeys = [
      "gender",
      "date_of_birth",
      "chair_rise_capability",
      "pain_areas",
      "training_time_of_day",
      "full_name",
    ];
    for (const key of requiredKeys) {
      expect(ANSWER_KEYS).toContain(key);
    }
  });

  it("every COPY_KEYS entry is in ANSWER_KEYS", () => {
    for (const key of COPY_KEYS) {
      expect(ANSWER_KEYS).toContain(key);
    }
  });
});
