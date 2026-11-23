import { currentAdFields, rememberAdSource } from "@/lib/analytics/ad-source";
import { pushTag, tagEventFor } from "@/lib/analytics/tags";
import type { FunnelEventName } from "./events";

const ENDPOINT = "/api/funnel-event";

/**
 * Fire-and-forget funnel analytics. Never throws and never waits: a failed or
 * blocked beacon must not touch the funnel. `data` must never carry personal
 * details (name, phone, code); the server drops those keys as a second line.
 *
 * The same moment also goes to the GTM dataLayer, as the site's own event
 * (lib/analytics/tags.ts): a screen's number, never its name or `data`.
 *
 * Every event to our own endpoint also carries the ad that brought the visitor
 * (lib/analytics/ad-source.ts), read again from this page's address first, so
 * a visit that lands straight on the questionnaire is tied to its ad.
 */
export function trackFunnelEvent(sessionId: string, event: FunnelEventName, data?: Record<string, unknown>): void {
  pushTag(tagEventFor(event));
  try {
    const merged = { ...adFields(), ...data };
    const payload = JSON.stringify({ sessionId, step: event, ...(Object.keys(merged).length > 0 ? { data: merged } : {}) });
    const blob = new Blob([payload], { type: "application/json" });
    if (typeof navigator.sendBeacon === "function" && navigator.sendBeacon(ENDPOINT, blob)) return;
    void fetch(ENDPOINT, { method: "POST", body: blob, keepalive: true }).catch(() => {});
  } catch {
    // Analytics must never break the funnel.
  }
}

function adFields(): Record<string, unknown> {
  try {
    if (typeof window !== "undefined") rememberAdSource(window.location?.search ?? "");
    return currentAdFields();
  } catch {
    return {};
  }
}
