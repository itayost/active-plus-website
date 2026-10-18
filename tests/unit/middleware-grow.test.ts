import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "@/middleware";

const notify = (ip: string) =>
  new NextRequest("https://peilimplus.co.il/api/grow/notify", {
    method: "POST",
    headers: { "x-vercel-forwarded-for": ip, "content-type": "application/json" },
    body: "{}",
  });

describe("middleware on Grow's callback path", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://abc.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon");
    vi.stubEnv("GROW_PROXY_SECRET", "proxy-secret");
  });
  afterEach(() => vi.unstubAllEnvs());

  it("rewrites a call from Grow to growWebhook and adds the proxy secret", async () => {
    const res = await middleware(notify("3.123.194.128"));
    expect(res.headers.get("x-middleware-rewrite")).toBe("https://abc.supabase.co/functions/v1/growWebhook");
    expect(res.headers.get("x-middleware-request-x-grow-proxy-secret")).toBe("proxy-secret");
  });

  it("answers 403 to any other IP and logs it", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const res = await middleware(notify("1.2.3.4"));
    expect(res.status).toBe(403);
    expect(res.headers.get("x-middleware-rewrite")).toBeNull();
    expect(warn).toHaveBeenCalledWith(JSON.stringify({ fn: "growNotify", event: "ip_denied", ip: "1.2.3.4" }));
    warn.mockRestore();
  });

  it("answers 503 while GROW_PROXY_SECRET is unset, so Grow retries", async () => {
    vi.stubEnv("GROW_PROXY_SECRET", "");
    expect((await middleware(notify("3.123.194.128"))).status).toBe(503);
  });
});
