import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ABOUT, CONTACT, RESEARCH, TEAM } from "@/content/pages";

describe("about", () => {
  it("is Midad's letter", () => {
    expect(ABOUT.title).toBe("הגוף והמוח שלך עובדים יחד");
    expect(ABOUT.heading).toBe("למה הקמתי את פעילים+");
    expect(ABOUT.closer).toBe("פעילים+ נולדה כדי להיות שם קודם.");
    expect(ABOUT.photo).toBe("/img/about.webp");
    expect(ABOUT.paragraphs).toHaveLength(16);
    expect(ABOUT.paragraphs[0]).toMatch(/^קוראים לי מידד גולן/);
    expect(ABOUT.paragraphs).not.toContain(ABOUT.closer);
  });
});

describe("research", () => {
  it("has two sections and a closer", () => {
    expect(RESEARCH.title).toBe("המחקר והגישה המקצועית");
    expect(RESEARCH.sections[0].heading).toBe("הגוף והמוח עובדים יחד — וכך גם נכון לאמן אותם");
    expect(RESEARCH.sections.map((s) => s.paragraphs.length)).toEqual([3, 4]);
    expect(RESEARCH.closer).toBe("פעילים+ נבנתה כדי לאמן בדיוק את החיבור הזה.");
  });
});

describe("team", () => {
  it("lists the five members in the phone order with portraits that exist", () => {
    expect(TEAM.map((m) => m.name)).toEqual(["מידד גולן", "ד״ר ענת קרן", "גדי בן שטרית", "דניאל שפיר", "איתי אוסטרייך"]);
    expect(TEAM.map((m) => m.role)).toEqual([
      "מייסד ומנכ״ל פעילים +",
      "ריפוי בעיסוק | תפקוד וקוגניציה",
      "פיזיותרפיסט מוסמך – כוח ושיווי משקל",
      "שיקום נוירולוגי | מאמן כושר ובריאות מוסמך",
      "CTO | מנהל הטכנולוגיה הראשי",
    ]);
    for (const m of TEAM) expect(existsSync(join(process.cwd(), "public", m.photo))).toBe(true);
  });

  it("puts Meidad in the middle of the desktop top row, Itay and Daniel below", () => {
    const desktop = [...TEAM].sort((a, b) => a.desktopOrder - b.desktopOrder).map((m) => m.name);
    expect(desktop).toEqual(["גדי בן שטרית", "מידד גולן", "ד״ר ענת קרן", "איתי אוסטרייך", "דניאל שפיר"]);
  });
});

describe("contact", () => {
  it("has the prototype title and lede", () => {
    expect(CONTACT).toEqual({ title: "רוצה לדבר איתנו?", lede: "נשמח לשמוע ממך." });
  });
});
