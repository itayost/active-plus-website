import { PLANS, type PlanId } from "@/lib/constants";
import { FUNNEL_STEPS } from "@/lib/funnel/contract.generated";
import { VIEW_EVENT, type FunnelEventName } from "@/lib/funnel/events";
import type { LEAD_SOURCES } from "@/lib/lead-form";

/**
 * The events the site pushes into the GTM dataLayer. GTM decides what each one
 * becomes (a GA4 event, a Meta Pixel event, a Google Ads conversion); the
 * table for whoever sets up the container is docs/measurement-gtm.he.md.
 *
 * Nothing here may say anything about the visitor's health or answers: Meta's
 * and Google's ad policies forbid it, and the questionnaire asks about balance,
 * memory, pain and getting up from a chair. So a questionnaire screen goes out
 * as its number only, never its name or the answer, and no event carries a
 * name, phone, email or session id.
 */
export type TagEvent =
  | { event: "funnel_start" }
  | { event: "funnel_step"; step_number: number; step_total: number }
  | { event: "questionnaire_complete" }
  | { event: "sign_up"; method: "phone" }
  | { event: "begin_checkout" }
  | { event: "store_click"; store: Store }
  | { event: "generate_lead"; form_source: (typeof LEAD_SOURCES)[number] }
  | { event: "purchase"; ecommerce: PurchaseEcommerce };

export type Store = "app_store" | "google_play";

type PurchaseEcommerce = {
  transaction_id: string;
  value: number;
  currency: "ILS";
  items: { item_id: PlanId; item_name: string; price: number; quantity: 1 }[];
};

/**
 * The screens counted by funnel_step, in the funnel's fixed order: every step
 * but payment, which is begin_checkout. A screen keeps its number whichever
 * branch the visitor is on, so step 12 always means the same screen; one of
 * 12 and 13 (challengeArea, standingComfort) is skipped by design.
 */
const NUMBERED_STEPS = FUNNEL_STEPS.filter((step) => step !== "payment");
export const FUNNEL_STEP_TOTAL = NUMBERED_STEPS.length;

const STEP_NUMBER_BY_VIEW: ReadonlyMap<string, number> = new Map(
  NUMBERED_STEPS.map((step, index) => [VIEW_EVENT[step], index + 1]),
);

/** The dataLayer event for one funnel analytics event, or null when it has none. */
export function tagEventFor(event: FunnelEventName): TagEvent | null {
  if (event === VIEW_EVENT.payment) return { event: "begin_checkout" };
  const stepNumber = STEP_NUMBER_BY_VIEW.get(event);
  if (stepNumber) return { event: "funnel_step", step_number: stepNumber, step_total: FUNNEL_STEP_TOTAL };
  if (event === "welcome2_continue") return { event: "funnel_start" };
  if (event === "plan_build_complete") return { event: "questionnaire_complete" };
  return null;
}

/** A completed web purchase, in GA4's ecommerce shape (Meta reads value and currency from it in GTM). */
export function purchaseEvent(input: { webPaymentId: string; plan: PlanId; value: number }): TagEvent {
  const name = PLANS.find((p) => p.id === input.plan)?.longName ?? input.plan;
  return {
    event: "purchase",
    ecommerce: {
      transaction_id: input.webPaymentId,
      value: input.value,
      currency: "ILS",
      items: [{ item_id: input.plan, item_name: name, price: input.value, quantity: 1 }],
    },
  };
}

type DataLayerWindow = { dataLayer?: unknown[]; google_tag_manager?: unknown };

/**
 * Pushes one event. The dataLayer exists before GTM does: an event pushed
 * before the visitor accepts the cookie notice waits there, and GTM reads it
 * when it loads (lib/analytics/gtm.ts); without an acceptance nothing ever
 * reads it and nothing leaves the browser. Never throws.
 */
export function pushTag(event: TagEvent | null, win?: DataLayerWindow): void {
  if (!event) return;
  try {
    const target = win ?? (window as DataLayerWindow);
    const layer = (target.dataLayer = target.dataLayer ?? []);
    // GTM merges pushes into one model, so a previous ecommerce object would leak into this one.
    if ("ecommerce" in event) layer.push({ ecommerce: null });
    layer.push(event);
  } catch {
    // Measurement must never break the page.
  }
}

/** The longest a navigation waits for the tags; GTM usually answers within a few hundred ms. */
export const TAG_WAIT_MS = 1000;

/**
 * Pushes one event and then runs `next` (a navigation away from the page),
 * once the tags that event fires have been sent: GTM's eventCallback, with
 * eventTimeout and a timer of our own as backstops. Without GTM on the page
 * (the notice not accepted, or the container blocked) there is nothing to wait
 * for, and `next` runs at once. Either way `next` runs exactly once.
 */
export function pushTagThen(event: TagEvent, next: () => void, win?: DataLayerWindow, waitMs = TAG_WAIT_MS): void {
  let done = false;
  const go = () => {
    if (done) return;
    done = true;
    next();
  };
  let target: DataLayerWindow | undefined;
  try {
    target = win ?? (window as DataLayerWindow);
  } catch {
    target = undefined;
  }
  if (!target || typeof target.google_tag_manager !== "object" || target.google_tag_manager === null) {
    pushTag(event, target);
    return go();
  }
  try {
    const layer = (target.dataLayer = target.dataLayer ?? []);
    layer.push({ ...event, eventCallback: go, eventTimeout: waitMs });
  } catch {
    return go();
  }
  setTimeout(go, waitMs + 200);
}
