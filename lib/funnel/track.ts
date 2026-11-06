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
 */
export function trackFunnelEvent(sessionId: string, event: FunnelEventName, data?: Record<string, unknown>): void {
  pushTag(tagEventFor(event));
  try {
    const payload = JSON.stringify({ sessionId, step: event, ...(data ? { data } : {}) });
    const blob = new Blob([payload], { type: "application/json" });
    if (typeof navigator.sendBeacon === "function" && navigator.sendBeacon(ENDPOINT, blob)) return;
    void fetch(ENDPOINT, { method: "POST", body: blob, keepalive: true }).catch(() => {});
  } catch {
    // Analytics must never break the funnel.
  }
}
