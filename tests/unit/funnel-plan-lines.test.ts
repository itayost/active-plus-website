import { describe, expect, it } from "vitest";
import { planChecklist } from "@/lib/funnel/plan-lines";

const labels = (areas?: string[]) => planChecklist(areas).map((l) => l.label);

describe("planChecklist", () => {
  it("keeps the owner's three lines when no area hurts", () => {
    expect(labels(["none"])).toEqual(["בודקים את התשובות שלך", "קובעים את התוכנית המדויקת עבורך", "מבצעים דיוקים אחרונים"]);
    expect(labels(undefined)).toHaveLength(3);
  });

  it("names one area in the middle line", () => {
    expect(labels(["knees"])[1]).toBe("מתאימים תרגילים ששומרים על הברך");
  });

  it("joins two or three areas the Hebrew way", () => {
    expect(labels(["knees", "lower_back"])[1]).toBe("מתאימים תרגילים ששומרים על הברך והגב התחתון");
    expect(labels(["neck", "knees", "ankle"])[1]).toBe("מתאימים תרגילים ששומרים על הצוואר, הברך והקרסול");
  });

  it("says 'the areas you marked' past three", () => {
    expect(labels(["neck", "knees", "ankle", "hips"])[1]).toBe("מתאימים תרגילים ששומרים על האזורים שציינת");
  });

  it("keeps the timing marks", () => {
    expect(planChecklist(["knees"]).map((l) => l.at)).toEqual([28, 56, 82]);
  });
});
