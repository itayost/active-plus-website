import { describe, expect, it } from "vitest";
import { MOTION_DETECTION, PERSONAL_PLAN, PROGRESS } from "@/content/explainers";

describe("explainers", () => {
  it("titles match the brief", () => {
    expect(PERSONAL_PLAN.title).toBe("תוכנית אישית שמתקדמת יחד איתכם");
    expect(MOTION_DETECTION.title).toBe("המערכת שרואה איך אתם באמת מתאמנים");
    expect(PROGRESS.title).toBe("כשאפשר לראות את ההתקדמות, אפשר להתאמן בצורה חכמה יותר");
  });
  it("each ends with the fit-check action", () => {
    for (const page of [PERSONAL_PLAN, MOTION_DETECTION, PROGRESS]) {
      expect(page.cta).toBe("בדקו איזו תוכנית מתאימה לכם");
    }
  });
  it("the body/mind pairs are both present", () => {
    expect(PERSONAL_PLAN.pair.map((p) => p.label)).toEqual(["בגוף", "במוח"]);
    expect(PROGRESS.pair.map((p) => p.label)).toEqual(["בתנועה", "בחשיבה"]);
  });
});
