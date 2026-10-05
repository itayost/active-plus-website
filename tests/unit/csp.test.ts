import { describe, expect, it } from "vitest";
import { buildCsp, GROW_HOSTED_ORIGINS } from "@/lib/security/csp";

const directive = (csp: string, name: string) => csp.split("; ").find((d) => d === name || d.startsWith(`${name} `)) ?? "";

describe("buildCsp", () => {
  it("allows Supabase by its exact origin only", () => {
    expect(directive(buildCsp("https://abcd.supabase.co/"), "connect-src")).toBe("connect-src 'self' https://abcd.supabase.co");
  });
  it("falls back to self when Supabase is not configured", () => {
    expect(directive(buildCsp(undefined), "connect-src")).toBe("connect-src 'self'");
    expect(directive(buildCsp("not a url"), "connect-src")).toBe("connect-src 'self'");
  });
  it("loads no third-party script or frame: Grow is a full-page redirect", () => {
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
