import { describe, expect, it } from "vitest";
import { buildCsp, GROW_HOSTED_ORIGINS, GROW_WALLET_SOURCES } from "@/lib/security/csp";

const directive = (csp: string, name: string) => csp.split("; ").find((d) => d === name || d.startsWith(`${name} `)) ?? "";

describe("buildCsp", () => {
  it("allows Supabase by its exact origin only", () => {
    expect(directive(buildCsp("https://abcd.supabase.co/"), "connect-src")).toBe("connect-src 'self' https://abcd.supabase.co");
  });
  it("falls back to self when Supabase is not configured", () => {
    expect(directive(buildCsp(undefined), "connect-src")).toBe("connect-src 'self'");
    expect(directive(buildCsp("not a url"), "connect-src")).toBe("connect-src 'self'");
  });
  it("loads no third-party script or frame outside the checkout", () => {
    const csp = buildCsp("https://abcd.supabase.co");
    expect(directive(csp, "script-src")).toBe("script-src 'self' 'unsafe-inline'");
    expect(directive(csp, "frame-src")).toBe("frame-src 'none'");
    expect(csp).not.toContain("unsafe-eval");
    expect(csp).not.toContain("cdn.meshulam");
  });
  it("cannot be framed, and forms post only to the site or Grow", () => {
    const csp = buildCsp("https://abcd.supabase.co");
    expect(directive(csp, "frame-ancestors")).toBe("frame-ancestors 'none'");
    expect(directive(csp, "form-action")).toBe(["form-action", "'self'", ...GROW_HOSTED_ORIGINS].join(" "));
    expect(directive(csp, "object-src")).toBe("object-src 'none'");
    expect(directive(csp, "base-uri")).toBe("base-uri 'self'");
  });
  it("keeps fonts, media and images first-party", () => {
    const csp = buildCsp("https://abcd.supabase.co");
    expect(directive(csp, "font-src")).toBe("font-src 'self'");
    expect(directive(csp, "media-src")).toBe("media-src 'self'");
    expect(directive(csp, "img-src")).toBe("img-src 'self' data: blob:");
  });
});

describe("buildCsp for the checkout (Grow's wallet SDK)", () => {
  const csp = buildCsp("https://abcd.supabase.co", { growWallet: true });
  it("adds Grow's CDN script, stylesheet and fonts, its API and card frame, and Google Pay", () => {
    expect(directive(csp, "script-src")).toBe(
      "script-src 'self' 'unsafe-inline' https://cdn.meshulam.co.il https://pay.google.com https://meshulam.co.il/_media/js/apple_pay_sdk/sdk.min.js",
    );
    expect(directive(csp, "style-src")).toBe("style-src 'self' 'unsafe-inline' https://cdn.meshulam.co.il");
    expect(directive(csp, "font-src")).toBe("font-src 'self' https://cdn.meshulam.co.il");
    // Google Pay's method manifest is at google.com/pay, which redirects to www.google.com/pay; blocked,
    // the wallet drops Google Pay. pay.sandbox.google.com is Google Pay's TEST environment (Grow's DEV wallet).
    expect(directive(csp, "connect-src")).toBe([
      "connect-src 'self' https://abcd.supabase.co",
      "https://cdn.meshulam.co.il https://sdk.meshulam.co.il https://dev.meshulam.co.il https://ga.meshulam.co.il",
      "https://paybox.grow.security https://devpaybox.grow.security",
      "https://pay.google.com https://pay.sandbox.google.com https://google.com/pay https://www.google.com/pay",
    ].join(" "));
    expect(directive(csp, "frame-src")).toBe([
      "frame-src https://sdk.meshulam.co.il https://dev.meshulam.co.il https://secure.meshulam.co.il https://sandbox.meshulam.co.il",
      "https://pay.google.com https://pay.sandbox.google.com https://*.creditguard.co.il",
    ].join(" "));
    expect(directive(csp, "img-src")).toBe(
      "img-src 'self' data: blob: https://cdn.meshulam.co.il https://www.gstatic.com https://pay.google.com https://pay.sandbox.google.com",
    );
  });
  it("never a wildcard or eval, and the rest stays as on every page", () => {
    // The one wildcard is CreditGuard's card frame, whose host differs between test and production (Hyp documents
    // *.creditguard.co.il). The test above pins every source exactly.
    expect(csp.replace("https://*.creditguard.co.il", "")).not.toContain("*");
    expect(GROW_WALLET_SOURCES.frame).toContain("https://*.creditguard.co.il");
    for (const [key, sources] of Object.entries(GROW_WALLET_SOURCES)) {
      if (key !== "frame") expect(sources.join(" ")).not.toContain("*");
    }
    expect(csp).not.toContain("unsafe-eval");
    for (const name of ["default-src", "media-src", "frame-ancestors", "form-action", "base-uri", "object-src"]) {
      expect(directive(csp, name)).toBe(directive(buildCsp("https://abcd.supabase.co"), name));
    }
  });
});

describe("buildCsp with a GTM container (tags)", () => {
  const base = buildCsp("https://abcd.supabase.co");
  const csp = buildCsp("https://abcd.supabase.co", { tags: true });
  it("allows GTM and its preview mode, GA4, Google Ads and the Meta Pixel", () => {
    expect(directive(csp, "script-src")).toBe(
      "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://tagmanager.google.com https://connect.facebook.net " +
        "https://www.googleadservices.com https://googleads.g.doubleclick.net https://www.google.com",
    );
    expect(directive(csp, "connect-src")).toBe(
      "connect-src 'self' https://abcd.supabase.co https://www.googletagmanager.com https://*.google-analytics.com " +
        "https://*.analytics.google.com https://stats.g.doubleclick.net https://www.facebook.com https://connect.facebook.net " +
        "https://www.googleadservices.com https://googleads.g.doubleclick.net https://www.google.com https://www.google.co.il " +
        "https://pagead2.googlesyndication.com",
    );
    expect(directive(csp, "frame-src")).toBe("frame-src https://www.googletagmanager.com https://td.doubleclick.net https://bid.g.doubleclick.net");
    expect(directive(csp, "img-src")).toContain("https://www.facebook.com");
    expect(directive(csp, "style-src")).toBe("style-src 'self' 'unsafe-inline' https://tagmanager.google.com https://fonts.googleapis.com");
    expect(directive(csp, "font-src")).toBe("font-src 'self' https://fonts.gstatic.com data:");
  });
  it("never eval (GTM's Custom JavaScript variables stay off), and wildcards only for GA4's regional hosts", () => {
    expect(csp).not.toContain("unsafe-eval");
    const wildcards = csp.match(/https:\/\/\*\.[^\s;]+/g) ?? [];
    expect([...new Set(wildcards)].sort()).toEqual(["https://*.analytics.google.com", "https://*.google-analytics.com"]);
  });
  it("leaves the rest of the policy as it is without a container", () => {
    for (const name of ["default-src", "media-src", "frame-ancestors", "form-action", "base-uri", "object-src"]) {
      expect(directive(csp, name)).toBe(directive(base, name));
    }
  });
  it("adds to the checkout's sources on /payment, each host once", () => {
    const checkout = buildCsp("https://abcd.supabase.co", { growWallet: true, tags: true });
    const img = directive(checkout, "img-src").split(" ");
    expect(img.filter((source) => source === "https://www.gstatic.com")).toHaveLength(1);
    for (const host of GROW_WALLET_SOURCES.frame) expect(directive(checkout, "frame-src")).toContain(host);
    expect(directive(checkout, "frame-src")).toContain("https://td.doubleclick.net");
  });
});
