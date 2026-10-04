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
