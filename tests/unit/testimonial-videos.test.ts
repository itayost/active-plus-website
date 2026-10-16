import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import TestimonialVideos from "@/components/home/TestimonialVideos";

const ONE = [{ src: "/video/a.mp4", poster: "/img/a.webp", name: "דנה", caption: "סרטון ממליץ 1" }];

describe("TestimonialVideos", () => {
  it("renders nothing, heading included, when the list is empty", () => {
    expect(renderToStaticMarkup(createElement(TestimonialVideos, { videos: [] }))).toBe("");
  });

  it("renders a playable video with controls, playsinline and metadata preload for one entry", () => {
    const html = renderToStaticMarkup(createElement(TestimonialVideos, { videos: ONE }));
    expect(html).toContain("סרטוני ממליצים");
    expect(html).toMatch(/<video[^>]*\bcontrols\b/);
    expect(html).toMatch(/<video[^>]*playsinline/i);
    expect(html).toMatch(/<video[^>]*preload="metadata"/);
    expect(html).toContain('poster="/img/a.webp"');
    expect(html).toContain('src="/video/a.mp4"');
  });
});
