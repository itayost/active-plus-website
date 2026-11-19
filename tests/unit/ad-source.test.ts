import { describe, expect, it } from "vitest";
import {
  AD_SOURCE_KEY,
  AD_SOURCE_TTL_MS,
  adSourceFromSearch,
  audienceFields,
  currentAdFields,
  rememberAdSource,
} from "@/lib/analytics/ad-source";

const NOW = Date.parse("2026-11-19T10:00:00Z");

function memoryStore(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
    data,
  };
}

// The line pasted into each ad's "URL parameters" in Ads Manager, as Meta fills it in.
const FROM_AD =
  "?utm_source=facebook&utm_medium=paid&utm_campaign=120245551262680001&utm_term=120245551262680002&utm_content=120245551262680678&fbclid=IwZXh0bgNhZW0BMABhZGlkAasd";

describe("adSourceFromSearch", () => {
  it("keeps the ad's labels and only the fact of a Meta click, never the click id itself", () => {
    expect(adSourceFromSearch(FROM_AD, NOW)).toEqual({
      utm_source: "facebook",
      utm_medium: "paid",
      utm_campaign: "120245551262680001",
      utm_term: "120245551262680002",
      utm_content: "120245551262680678",
      from_meta_click: true,
      at: NOW,
    });
    expect(JSON.stringify(adSourceFromSearch(FROM_AD, NOW))).not.toContain("IwZXh0");
  });

  it("a Meta click with no labels still counts as Meta", () => {
    expect(adSourceFromSearch("?fbclid=abc", NOW)).toEqual({ from_meta_click: true, at: NOW });
  });

  it("is null for a visit with no ad labels", () => {
    expect(adSourceFromSearch("", NOW)).toBeNull();
    expect(adSourceFromSearch("?plan=annual", NOW)).toBeNull();
  });

  it("drops placeholders Meta did not fill and trims long values", () => {
    const long = "x".repeat(300);
    expect(adSourceFromSearch(`?utm_content={{ad.id}}&utm_campaign=${long}`, NOW)).toEqual({
      utm_campaign: "x".repeat(100),
      at: NOW,
    });
  });
});

describe("rememberAdSource / currentAdFields", () => {
  it("remembers the ad from the landing and attaches it to later events", () => {
    const store = memoryStore();
    rememberAdSource(FROM_AD, NOW, store);
    expect(currentAdFields(NOW + 60_000, store)).toEqual({
      utm_source: "facebook",
      utm_medium: "paid",
      utm_campaign: "120245551262680001",
      utm_term: "120245551262680002",
      utm_content: "120245551262680678",
      from_meta_click: true,
    });
  });

  it("a later page without labels keeps the ad; a later ad click replaces it", () => {
    const store = memoryStore();
    rememberAdSource(FROM_AD, NOW, store);
    rememberAdSource("", NOW + 1000, store);
    expect(currentAdFields(NOW + 2000, store).utm_content).toBe("120245551262680678");
    rememberAdSource("?utm_source=facebook&utm_content=999", NOW + 3000, store);
    expect(currentAdFields(NOW + 4000, store)).toEqual({ utm_source: "facebook", utm_content: "999" });
  });

  it("forgets the ad after 28 days", () => {
    const store = memoryStore();
    rememberAdSource(FROM_AD, NOW, store);
    expect(currentAdFields(NOW + AD_SOURCE_TTL_MS + 1, store)).toEqual({});
  });

  it("ignores a stored value that is not ours and never throws on blocked storage", () => {
    expect(currentAdFields(NOW, memoryStore({ [AD_SOURCE_KEY]: "not json" }))).toEqual({});
    expect(currentAdFields(NOW, memoryStore({ [AD_SOURCE_KEY]: '{"utm_content":{"a":1},"at":1}' }))).toEqual({});
    const blocked = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
      removeItem: () => {},
    };
    expect(() => rememberAdSource(FROM_AD, NOW, blocked)).not.toThrow();
    expect(currentAdFields(NOW, blocked)).toEqual({});
    expect(currentAdFields(NOW, undefined)).toEqual({});
  });
});

describe("audienceFields", () => {
  it("passes the age group and gender, nothing else from the answers", () => {
    expect(audienceFields({ age_group: "60_69", gender: "female", pain_areas: ["knees"], full_name: "x" })).toEqual({
      age_group: "60_69",
      gender: "female",
    });
  });
  it("leaves out an unknown age group or gender", () => {
    expect(audienceFields({ age_group: "1990-01-01", gender: "other" })).toEqual({});
    expect(audienceFields({})).toEqual({});
  });
});
