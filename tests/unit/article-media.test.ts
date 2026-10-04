import { describe, expect, it } from "vitest";
import { ARTICLES } from "@/content/articles";
import { ARTICLE_MEDIA } from "@/content/article-media";

describe("article media", () => {
  it("every article has a v2 cover and nothing else is mapped", () => {
    expect(Object.keys(ARTICLE_MEDIA).sort()).toEqual(ARTICLES.map((a) => a.slug).sort());
    for (const m of Object.values(ARTICLE_MEDIA)) expect(m.cover).toMatch(/^\/img\/v2\//);
  });
});
