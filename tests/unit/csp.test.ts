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
    expect(directive(csp, "script-src")).toBe("script-src 'self' 'unsafe-inline' https://cdn.meshulam.co.il https://pay.google.com");
    expect(directive(csp, "style-src")).toBe("style-src 'self' 'unsafe-inline' https://cdn.meshulam.co.il");
    expect(directive(csp, "font-src")).toBe("font-src 'self' https://cdn.meshulam.co.il");
    // Google Pay's pay.js checks readiness at google.com/pay; blocked, the wallet drops Google Pay.
    expect(GROW_WALLET_SOURCES.connect).toContain("https://google.com/pay");
    expect(directive(csp, "connect-src")).toBe(["connect-src", "'self'", "https://abcd.supabase.co", ...GROW_WALLET_SOURCES.connect].join(" "));
    expect(directive(csp, "frame-src")).toBe(["frame-src", ...GROW_WALLET_SOURCES.frame].join(" "));
  });
  it("only https origins, never a wildcard or eval, and the rest stays as on every page", () => {
    for (const sources of Object.values(GROW_WALLET_SOURCES)) {
      for (const source of sources) expect(source).toMatch(/^https:\/\/[a-z0-9.-]+(\/[a-z0-9-]+)*$/);
    }
    expect(csp).not.toContain("*");
    expect(csp).not.toContain("unsafe-eval");
    for (const name of ["default-src", "media-src", "frame-ancestors", "form-action", "base-uri", "object-src"]) {
      expect(directive(csp, name)).toBe(directive(buildCsp("https://abcd.supabase.co"), name));
    }
  });
});
