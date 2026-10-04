import { describe, expect, it } from "vitest";
import { FEATURE_CARDS, FIT_CHECK, NAV } from "@/lib/constants";
import { SITE_ROUTES } from "@/lib/routes";
import { ARTICLES } from "@/content/articles";

describe("routes", () => {
  it("contains the six brief pages, three explainers and both legal pages", () => {
    expect(SITE_ROUTES).toEqual(expect.arrayContaining([
      "/", "/about", "/how-it-works", "/questionnaire", "/payment", "/articles",
      "/personal-plan", "/motion-detection", "/progress",
      "/delete-account", "/privacy-policy",
    ]));
  });
  it("every nav link, card link and the fit check point at real routes", () => {
    const targets = [...NAV.map((n) => n.href), ...FEATURE_CARDS.map((c) => c.href), FIT_CHECK.href];
    for (const href of targets) expect(SITE_ROUTES).toContain(href);
  });
  it("article slugs are unique", () => {
    const slugs = ARTICLES.map((a) => a.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
  it("every card image is a v2 client photo", () => {
    for (const card of FEATURE_CARDS) expect(card.image).toMatch(/^\/img\/v2\//);
  });
});
