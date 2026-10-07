import { describe, expect, it } from "vitest";
import { SITE_URL } from "@/lib/constants";
import { CANONICAL_HOST, GROW_NOTIFY_PATH, HOST_REDIRECTS, LEGACY_HOSTS, buildRewrites } from "@/lib/domains";
import { PROTECTED_PATHS } from "@/lib/redirects";

// The site moved from activeplus.co.il to peilimplus.co.il on 2026-10-07.
describe("domains", () => {
  it("serves the site from the new apex", () => {
    expect(CANONICAL_HOST).toBe("peilimplus.co.il");
    expect(SITE_URL).toBe("https://peilimplus.co.il");
  });

  it("sends the old domain and the www host to the same path on the new apex, permanently", () => {
    expect([...LEGACY_HOSTS].sort()).toEqual(["activeplus.co.il", "www.activeplus.co.il", "www.peilimplus.co.il"]);
    for (const host of LEGACY_HOSTS) {
      expect(HOST_REDIRECTS).toContainEqual({
        source: "/:path*",
        has: [{ type: "host", value: host }],
        destination: "https://peilimplus.co.il/:path*",
        permanent: true,
      });
    }
  });

  it("never redirects the new apex itself (that would loop)", () => {
    expect(HOST_REDIRECTS.map((r): string => r.has[0].value)).not.toContain(CANONICAL_HOST);
  });

  // The store listings link to these on the old domain until they are updated;
  // the redirect must land on the same page, not on the home page.
  it("keeps the store-registered pages reachable through the old domain", () => {
    for (const path of PROTECTED_PATHS) {
      const target = HOST_REDIRECTS[0].destination.replace(":path*", path.slice(1));
      expect(target).toBe(`https://peilimplus.co.il${path}`);
    }
  });

  it("forwards Grow's server callback to the growWebhook function", () => {
    expect(buildRewrites("https://abc.supabase.co/")).toEqual([
      { source: GROW_NOTIFY_PATH, destination: "https://abc.supabase.co/functions/v1/growWebhook" },
    ]);
    expect(GROW_NOTIFY_PATH).toBe("/api/grow/notify");
  });

  it("adds no rewrite when the Supabase URL is missing", () => {
    expect(buildRewrites(undefined)).toEqual([]);
    expect(buildRewrites("")).toEqual([]);
  });
});
