import { describe, expect, it } from "vitest";
import { MEDIA_CACHE_CONTROL, MEDIA_CACHE_RULES } from "@/lib/cache-headers";

describe("media cache headers", () => {
  it("covers the public image and video folders", () => {
    expect(MEDIA_CACHE_RULES.map((r) => r.source)).toEqual(["/img/:path*", "/video/:path*"]);
  });

  it("caches for a day and serves stale for a week while revalidating", () => {
    expect(MEDIA_CACHE_CONTROL).toBe("public, max-age=86400, stale-while-revalidate=604800");
  });

  it("never marks the un-hashed files immutable", () => {
    expect(MEDIA_CACHE_CONTROL).not.toContain("immutable");
  });

  it("sends the same Cache-Control on every rule", () => {
    for (const rule of MEDIA_CACHE_RULES) {
      expect(rule.headers).toEqual([{ key: "Cache-Control", value: MEDIA_CACHE_CONTROL }]);
    }
  });
});
