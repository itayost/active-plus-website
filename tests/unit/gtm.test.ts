// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { gtmId, loadGtm } from "@/lib/analytics/gtm";

type LayerWindow = Window & { dataLayer?: unknown[] };

afterEach(() => {
  document.head.innerHTML = "";
  delete (window as LayerWindow).dataLayer;
});

describe("gtmId", () => {
  it("accepts a container id, trimmed and upper-cased", () => {
    expect(gtmId("GTM-ABC123")).toBe("GTM-ABC123");
    expect(gtmId("  gtm-abc123 ")).toBe("GTM-ABC123");
  });
  it("is null when unset or not a container id: no notice and no tags", () => {
    for (const raw of [undefined, "", "   ", "G-ABC123", "GTM-", "GTM-AB", "GTM-ABC123\"><script>", "UA-1234-1"]) {
      expect(gtmId(raw)).toBeNull();
    }
  });
});

describe("loadGtm", () => {
  it("adds the container script once and starts the dataLayer", () => {
    loadGtm("GTM-ABC123");
    loadGtm("GTM-ABC123");
    const scripts = document.head.querySelectorAll("script");
    expect(scripts).toHaveLength(1);
    expect(scripts[0].src).toBe("https://www.googletagmanager.com/gtm.js?id=GTM-ABC123");
    expect(scripts[0].async).toBe(true);
    const layer = (window as LayerWindow).dataLayer ?? [];
    expect(layer.filter((entry) => (entry as { event?: string }).event === "gtm.js")).toHaveLength(1);
  });
  it("keeps the events pushed before it, for GTM to read when it starts", () => {
    (window as LayerWindow).dataLayer = [{ event: "funnel_step", step_number: 3, step_total: 21 }];
    loadGtm("GTM-ABC123");
    const layer = (window as LayerWindow).dataLayer ?? [];
    expect(layer[0]).toEqual({ event: "funnel_step", step_number: 3, step_total: 21 });
    expect(layer).toHaveLength(2);
  });
  it("never throws", () => {
    const broken = { querySelector: () => { throw new Error("no DOM"); } } as unknown as Document;
    expect(() => loadGtm("GTM-ABC123", { doc: broken, win: window })).not.toThrow();
  });
});
