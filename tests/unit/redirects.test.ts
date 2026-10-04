import { describe, expect, it } from "vitest";
import { LEGACY_REDIRECTS, PROTECTED_PATHS } from "@/lib/redirects";

describe("legacy redirects", () => {
  it("never redirects a store-listed legal page", () => {
    const sources = LEGACY_REDIRECTS.map((r) => r.source);
    for (const path of PROTECTED_PATHS) expect(sources).not.toContain(path);
  });

  it("protects exactly the two legal pages", () => {
    expect(PROTECTED_PATHS).toEqual(["/delete-account", "/privacy-policy"]);
  });

  it("covers every removed v1 page and old article slug", () => {
    const sources = LEGACY_REDIRECTS.map((r) => r.source);
    expect(sources).toEqual(
      expect.arrayContaining([
        "/dual-tasking", "/research", "/team", "/faq", "/contact", "/pricing",
        "/articles/improve-memory-after-50", "/articles/balance-after-50",
        "/articles/brain-plasticity-dual-tasking",
      ]),
    );
  });

  it("has no chains: no destination is itself a source", () => {
    const sources = new Set(LEGACY_REDIRECTS.map((r) => r.source));
    for (const r of LEGACY_REDIRECTS) expect(sources.has(r.destination.split("#")[0])).toBe(false);
  });
});
