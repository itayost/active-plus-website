import { describe, expect, it } from "vitest";
import { HOW } from "@/content/how-it-works";

describe("how it works", () => {
  it("has four ordered steps", () => {
    expect(HOW.steps.map((s) => s.title)).toEqual(["עונים על כמה שאלות", "מקבלים תוכנית אישית", "מתאמנים כ־10 דקות ביום", "רואים את ההתקדמות"]);
  });
  it("has the three challenges", () => {
    expect(HOW.challenges.items.map((c) => c.title)).toEqual(["אתגר הגוף החזק", "אתגר שיווי המשקל", "אתגר המוח החד"]);
  });
  it("names both professionals with photos", () => {
    expect(HOW.pros.people.map((p) => [p.name, p.photo])).toEqual([
      ["גדי בן שטרית", "/img/v2/team-gadi.webp"],
      ["דניאל שפיר", "/img/v2/team-daniel.webp"],
    ]);
  });
});
