import { describe, expect, it } from "vitest";
import { GROW_IPS, PROXY_SECRET_HEADER, growNotifyDecision } from "@/lib/grow-notify";

const GROW_IP = "3.123.194.128";
const ENV = { supabaseUrl: "https://abc.supabase.co/", proxySecret: "proxy-secret" };
const h = (init: Record<string, string>) => new Headers(init);

describe("growNotifyDecision", () => {
  it("forwards a call from Grow's IP to growWebhook with the proxy secret", () => {
    const incoming = h({ "x-vercel-forwarded-for": GROW_IP, "content-type": "application/json" });
    const decision = growNotifyDecision(incoming, ENV);
    expect(decision.kind).toBe("forward");
    if (decision.kind !== "forward") return;
    expect(decision.destination).toBe("https://abc.supabase.co/functions/v1/growWebhook");
    expect(decision.headers.get(PROXY_SECRET_HEADER)).toBe("proxy-secret");
    expect(decision.headers.get("content-type")).toBe("application/json");
    // The caller's headers are copied, never changed.
    expect(incoming.get(PROXY_SECRET_HEADER)).toBeNull();
  });

  it("reads x-real-ip when the Vercel header is absent", () => {
    expect(growNotifyDecision(h({ "x-real-ip": GROW_IP }), ENV).kind).toBe("forward");
  });

  it("denies any other IP", () => {
    expect(growNotifyDecision(h({ "x-vercel-forwarded-for": "1.2.3.4" }), ENV)).toEqual({ kind: "denied", ip: "1.2.3.4" });
  });

  it("never trusts x-forwarded-for, which the caller controls", () => {
    expect(growNotifyDecision(h({ "x-forwarded-for": `${GROW_IP}, ${GROW_IP}` }), ENV)).toEqual({ kind: "denied", ip: "unknown" });
  });

  it("a caller's own proxy secret header is replaced, not passed on", () => {
    const decision = growNotifyDecision(h({ "x-vercel-forwarded-for": GROW_IP, [PROXY_SECRET_HEADER]: "forged" }), ENV);
    expect(decision.kind === "forward" && decision.headers.get(PROXY_SECRET_HEADER)).toBe("proxy-secret");
  });

  it("is unconfigured without the Supabase URL or the secret, whatever the IP", () => {
    const fromGrow = h({ "x-vercel-forwarded-for": GROW_IP });
    expect(growNotifyDecision(fromGrow, { ...ENV, proxySecret: undefined }).kind).toBe("unconfigured");
    expect(growNotifyDecision(fromGrow, { ...ENV, proxySecret: " " }).kind).toBe("unconfigured");
    expect(growNotifyDecision(fromGrow, { ...ENV, supabaseUrl: "" }).kind).toBe("unconfigured");
  });
});

describe("GROW_IPS", () => {
  it("holds Grow's 29 published addresses, all IPv4", () => {
    expect(GROW_IPS.size).toBe(29);
    for (const ip of GROW_IPS) expect(ip).toMatch(/^\d{1,3}(\.\d{1,3}){3}$/);
  });
});
