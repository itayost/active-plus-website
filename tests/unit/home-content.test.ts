import { describe, expect, it } from "vitest";
import { FAQ, TESTIMONIALS, WHAT_MATTERS } from "@/content/home";

describe("home content", () => {
  it("has the brief's three 'what matters' items", () => {
    expect(WHAT_MATTERS.map((w) => w.title)).toEqual([
      "שתמשיכו לעשות את מה שאתם אוהבים",
      "שתשמרו על חדות המחשבה",
      "לחיות טוב יותר, בכל יום",
    ]);
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
    const all = JSON.stringify({ FAQ, TESTIMONIALS, WHAT_MATTERS });
    expect(all).not.toMatch(/[​‎‏‪-‮]/);
  });
});
