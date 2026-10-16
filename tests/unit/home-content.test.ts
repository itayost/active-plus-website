import { describe, expect, it } from "vitest";
import { CTAS, FAQ, HERO, PROGRAM_HEADING, TESTIMONIALS, WORLD } from "@/content/home";

describe("home content", () => {
  it("has the prototype's four world cards under the 'whole world' heading", () => {
    expect(WORLD.heading).toBe("עולם שלם בחיבור אחד");
    expect(WORLD.cards.map((c) => c.title)).toEqual([
      "לחזק את השרירים",
      "לאמן את המוח",
      "אתגרים",
      "התאמה אישית AI",
    ]);
    for (const c of WORLD.cards) expect(c.body.length).toBeGreaterThan(10);
  });
  it("has the hero copy, the program heading and both CTA labels", () => {
    expect(HERO.titleLead).toBe("תוכנית אישית");
    expect(HERO.titleAccent).toBe("לאימון וחיזוק הגוף וחדות המחשבה");
    expect(HERO.sub).toBe("רק 10 דקות ביום מהבית ובקצב שלך");
    expect(HERO.cta).toBe("לתוכנית אישית לחצו כאן");
    expect(PROGRAM_HEADING).toBe("מעטפת מקצועית במיוחד בשבילכם");
    expect(CTAS).toEqual({ fit: "לבדיקת התאמה", plan: "לקבלת תוכנית אישית" });
  });
  it("has six testimonials, each from google or facebook, none empty", () => {
    expect(TESTIMONIALS).toHaveLength(6);
    for (const t of TESTIMONIALS) {
      expect(["google", "facebook"]).toContain(t.source);
      expect(t.quote.length).toBeGreaterThan(40);
    }
  });
  it("has 13 FAQ items starting with 'מה זה פעילים+?' and ending with 'איך מתחילים?'", () => {
    expect(FAQ).toHaveLength(13);
    expect(FAQ[0].q).toBe("מה זה פעילים+?");
    expect(FAQ.at(-1)!.q).toBe("איך מתחילים?");
  });
  it("contains no RTL control characters left over from the PDF", () => {
    const all = JSON.stringify({ FAQ, TESTIMONIALS, WORLD, HERO });
    expect(all).not.toMatch(/[​‎‏‪-‮]/);
  });
});
