import { describe, expect, it } from "vitest";
import {
  ARTICLES_HEADING,
  CTAS,
  FAQ,
  FAQ_HEADING,
  HERO,
  LEAD_HEADING,
  PARTNERS,
  PARTNERS_HEADING,
  PROGRAM_HEADING,
  TESTIMONIALS,
  TESTIMONIALS_HEADING,
  TESTIMONIAL_VIDEOS,
  VIDEOS_HEADING,
  WORLD,
} from "@/content/home";

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
  it("has the bottom-half headings", () => {
    expect(TESTIMONIALS_HEADING).toBe("מה אומרים הלקוחות שלנו");
    expect(VIDEOS_HEADING).toBe("סרטוני ממליצים");
    expect(PARTNERS_HEADING).toBe("שיתופי פעולה");
    expect(LEAD_HEADING).toBe("השאירו פרטים ונחזור אליכם לתיאום:");
    expect(ARTICLES_HEADING).toBe("מאמרים");
    expect(FAQ_HEADING).toBe("שאלות ותשובות");
  });
  it("uses the prototype's text for Aviva's quote", () => {
    const aviva = TESTIMONIALS.find((t) => t.name === "אביבה סטלקול");
    expect(aviva?.quote.endsWith("אפילו ירדתי 2 ק״ג בשבוע.")).toBe(true);
  });
  it("has 14 FAQ items from 'מה זה פעילים+?' to 'איך מתחילים?'", () => {
    expect(FAQ).toHaveLength(14);
    expect(FAQ[0].q).toBe("מה זה פעילים+?");
    expect(FAQ.at(-1)!.q).toBe("איך מתחילים?");
    const questions = FAQ.map((f) => f.q);
    expect(questions).toContain("איך מערכת זיהוי התנועה עובדת?");
    expect(questions).toContain("אפשר להתאמן גם בחו״ל?");
    expect(questions.indexOf("אפשר להתאמן גם בחו״ל?")).toBe(questions.indexOf("אפשר להתאמן מהבית?") + 1);
    expect(questions.indexOf("האם פעילים+ מחליפה פיזיותרפיה או טיפול רפואי?")).toBe(questions.length - 2);
  });
  it("starts with no testimonial videos", () => {
    expect(Array.isArray(TESTIMONIAL_VIDEOS)).toBe(true);
  });
  it("has seven partners, each with a /img/partners/ logo", () => {
    expect(PARTNERS).toHaveLength(7);
    for (const p of PARTNERS) {
      expect(p.src.startsWith("/img/partners/")).toBe(true);
      expect(p.name.length).toBeGreaterThan(0);
    }
  });
  it("contains no RTL control characters left over from the PDF", () => {
    const all = JSON.stringify({ FAQ, TESTIMONIALS, WORLD, HERO });
    expect(all).not.toMatch(/[​‎‏‪-‮]/);
  });
});
