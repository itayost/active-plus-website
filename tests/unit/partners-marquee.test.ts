// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import Partners from "@/components/home/Partners";
import { PARTNERS } from "@/content/home";

const html = renderToStaticMarkup(createElement(Partners));
const doc = new DOMParser().parseFromString(html, "text/html");
const css = readFileSync("app/globals.css", "utf8");

describe("Partners marquee", () => {
  it("moves unless reduced motion is asked for, when the still swipe row shows instead", () => {
    const marquee = doc.querySelector(".marquee")!;
    expect(marquee.parentElement!.className).toContain("motion-reduce:hidden");
    const swipeRow = doc.querySelector("ul.snap-gutter")!;
    expect(swipeRow.closest(".motion-safe\\:hidden")).not.toBeNull();
  });

  it("announces one set of the seven marks; the repeats are hidden and inert", () => {
    const sets = [...doc.querySelectorAll(".marquee-set")];
    expect(sets).toHaveLength(3);
    const [first, ...copies] = sets;
    expect(first.hasAttribute("aria-hidden")).toBe(false);
    expect(first.hasAttribute("inert")).toBe(false);
    expect([...first.querySelectorAll("img")].map((img) => img.alt)).toEqual(PARTNERS.map((p) => p.name));
    for (const copy of copies) {
      expect(copy.getAttribute("aria-hidden")).toBe("true");
      expect(copy.hasAttribute("inert")).toBe(true);
      expect(copy.querySelectorAll("li")).toHaveLength(PARTNERS.length);
    }
  });

  it("is one Tab stop with a name, so keyboard focus can stop it", () => {
    const marquee = doc.querySelector(".marquee")!;
    expect(marquee.getAttribute("tabindex")).toBe("0");
    expect(marquee.getAttribute("aria-label")).toBe("שיתופי פעולה");
  });

  it("the swipe hint shows only with the still row", () => {
    const hint = [...doc.querySelectorAll("p")].find((p) => p.textContent?.includes("החליקו"))!;
    expect(hint.className).toContain("motion-safe:hidden");
  });

  it("loops by one set's width and pauses on hover, keyboard focus and tap", () => {
    expect(css).toMatch(/@keyframes marquee-rtl\s*{\s*to\s*{\s*transform:\s*translateX\(100%\)/);
    expect(css).toMatch(/\.marquee:focus-visible \.marquee-set,\s*\.marquee\[data-paused\] \.marquee-set\s*{\s*animation-play-state: paused/);
    expect(css).toMatch(/@media \(hover: hover\)\s*{\s*\.marquee:hover \.marquee-set\s*{\s*animation-play-state: paused/);
  });
});
