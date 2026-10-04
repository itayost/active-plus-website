import { describe, expect, it } from "vitest";
import { ABOUT, TEAM } from "@/content/pages";

describe("about", () => {
  it("opens with the personal story", () => {
    expect(ABOUT.title).toBe("הרעיון התחיל מסיפור אישי");
  });
  it("has the three team members with v2 portraits", () => {
    expect(TEAM.map((m) => [m.name, m.photo])).toEqual([
      ["גדי בן שטרית", "/img/v2/team-gadi.webp"],
      ["דניאל שפיר", "/img/v2/team-daniel.webp"],
      ["מידד גולן", "/img/v2/team-meidad.webp"],
    ]);
  });
});
