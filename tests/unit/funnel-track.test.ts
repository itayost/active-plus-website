import { afterEach, describe, expect, it, vi } from "vitest";
import { trackFunnelEvent } from "@/lib/funnel/track";

const SESSION = "3f2b8c1e-9d4a-4b7e-8a6f-1c2d3e4f5a6b";

afterEach(() => vi.unstubAllGlobals());

describe("trackFunnelEvent", () => {
  it("sends a JSON blob with sendBeacon", async () => {
    const sendBeacon = vi.fn(() => true);
    vi.stubGlobal("navigator", { sendBeacon });
    trackFunnelEvent(SESSION, "otp_view");
    const [url, blob] = sendBeacon.mock.calls[0] as unknown as [string, Blob];
    expect(url).toBe("/api/funnel-event");
    expect(blob.type).toBe("application/json");
    expect(JSON.parse(await blob.text())).toEqual({ sessionId: SESSION, step: "otp_view" });
  });

  it("falls back to a keepalive fetch when sendBeacon is missing or refuses", () => {
    const fetchMock = vi.fn(() => Promise.resolve(new Response(null, { status: 204 })));
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("navigator", { sendBeacon: () => false });
    trackFunnelEvent(SESSION, "register_view", { a: 1 });
    expect(fetchMock).toHaveBeenCalledWith("/api/funnel-event", expect.objectContaining({ method: "POST", keepalive: true }));
  });

  it("never throws", () => {
    vi.stubGlobal("navigator", {
      sendBeacon: () => {
        throw new Error("blocked");
      },
    });
    expect(() => trackFunnelEvent(SESSION, "otp_view")).not.toThrow();
  });
});

describe("trackFunnelEvent and the GTM dataLayer", () => {
  it("pushes the funnel moment as a tag event, without the session or data", () => {
    const win: { dataLayer?: unknown[] } = {};
    vi.stubGlobal("window", win);
    vi.stubGlobal("navigator", { sendBeacon: () => true });
    trackFunnelEvent(SESSION, "payment_view", { plan: "annual" });
    trackFunnelEvent(SESSION, "otp_resend_tap");
    expect(win.dataLayer).toEqual([{ event: "begin_checkout" }]);
    expect(JSON.stringify(win.dataLayer)).not.toContain(SESSION);
  });
});

describe("trackFunnelEvent and the ad that brought the visitor", () => {
  function stubWindow(search: string, stored: Record<string, string> = {}) {
    const data = new Map(Object.entries(stored));
    const win = {
      location: { search },
      localStorage: {
        getItem: (k: string) => data.get(k) ?? null,
        setItem: (k: string, v: string) => void data.set(k, v),
        removeItem: (k: string) => void data.delete(k),
      },
    };
    vi.stubGlobal("window", win);
    return win;
  }

  it("a visit landing from an ad carries its labels on every event, not to the dataLayer", async () => {
    const win = stubWindow("?utm_source=facebook&utm_content=120245551262680678&fbclid=abc") as { dataLayer?: unknown[] };
    const sendBeacon = vi.fn(() => true);
    vi.stubGlobal("navigator", { sendBeacon });
    trackFunnelEvent(SESSION, "payment_view", { plan: "annual" });
    const [, blob] = sendBeacon.mock.calls[0] as unknown as [string, Blob];
    expect(JSON.parse(await blob.text()).data).toEqual({
      utm_source: "facebook",
      utm_content: "120245551262680678",
      from_meta_click: true,
      plan: "annual",
    });
    expect(JSON.stringify(win.dataLayer)).not.toContain("120245551262680678");
  });

  it("a visit with no ad and nothing kept sends no labels", async () => {
    stubWindow("");
    const sendBeacon = vi.fn(() => true);
    vi.stubGlobal("navigator", { sendBeacon });
    trackFunnelEvent(SESSION, "otp_view");
    const [, blob] = sendBeacon.mock.calls[0] as unknown as [string, Blob];
    expect(JSON.parse(await blob.text())).toEqual({ sessionId: SESSION, step: "otp_view" });
  });
});
