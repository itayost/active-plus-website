import { describe, expect, it } from "vitest";
import { clientIp } from "@/lib/request-ip";

const h = (init: Record<string, string>) => new Headers(init);

describe("clientIp", () => {
  it("prefers the platform-set x-vercel-forwarded-for", () => {
    expect(
      clientIp(h({ "x-vercel-forwarded-for": "1.1.1.1", "x-real-ip": "2.2.2.2", "x-forwarded-for": "3.3.3.3" })),
    ).toBe("1.1.1.1");
  });
  it("falls back to x-real-ip", () => {
    expect(clientIp(h({ "x-real-ip": "2.2.2.2", "x-forwarded-for": "3.3.3.3" }))).toBe("2.2.2.2");
  });
  it("uses the rightmost x-forwarded-for entry when it is the only header", () => {
    expect(clientIp(h({ "x-forwarded-for": "9.9.9.9, 8.8.8.8, 4.4.4.4" }))).toBe("4.4.4.4");
  });
  it("ignores a spoofed leftmost x-forwarded-for value", () => {
    expect(clientIp(h({ "x-forwarded-for": "6.6.6.6, 5.5.5.5" }))).toBe("5.5.5.5");
  });
  it("returns unknown when no header is present", () => {
    expect(clientIp(h({}))).toBe("unknown");
  });
});
