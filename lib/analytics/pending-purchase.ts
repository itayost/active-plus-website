import { PLANS, type PlanId } from "@/lib/constants";

/**
 * The payment the buyer was sent to Grow with, so /payment/success can report
 * the purchase with its value once the subscription is active. Kept in the
 * tab (sessionStorage) and taken once: a reload of the success page finds
 * nothing and reports nothing twice. Nothing personal is stored: the payment
 * id is ours (createGrowPayment), the value is web_plans' total.
 */
export const PENDING_PURCHASE_KEY = "ap.purchase.pending";

export type PendingPurchase = { webPaymentId: string; plan: PlanId; value: number };

type Store = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function tabStore(): Store | undefined {
  try {
    return typeof window === "undefined" ? undefined : window.sessionStorage;
  } catch {
    return undefined;
  }
}

const ID_MAX = 128;

function parse(raw: string | null): PendingPurchase | null {
  try {
    const value: unknown = JSON.parse(raw ?? "null");
    if (!value || typeof value !== "object") return null;
    const { webPaymentId, plan, value: amount } = value as Record<string, unknown>;
    if (typeof webPaymentId !== "string" || webPaymentId === "" || webPaymentId.length > ID_MAX) return null;
    if (!PLANS.some((p) => p.id === plan)) return null;
    if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) return null;
    return { webPaymentId, plan: plan as PlanId, value: amount };
  } catch {
    return null;
  }
}

export function savePendingPurchase(purchase: PendingPurchase, store: Store | undefined = tabStore()): void {
  try {
    store?.setItem(PENDING_PURCHASE_KEY, JSON.stringify(purchase));
  } catch {
    // Blocked storage: the purchase is not reported to the tags, and nothing else changes.
  }
}

/** Reads and removes the pending purchase; null when there is none or it is not one of ours. */
export function takePendingPurchase(store: Store | undefined = tabStore()): PendingPurchase | null {
  try {
    const purchase = parse(store?.getItem(PENDING_PURCHASE_KEY) ?? null);
    store?.removeItem(PENDING_PURCHASE_KEY);
    return purchase;
  } catch {
    return null;
  }
}

/** Back from Grow's cancel URL: nothing was charged, so nothing is pending. */
export function clearPendingPurchase(store: Store | undefined = tabStore()): void {
  try {
    store?.removeItem(PENDING_PURCHASE_KEY);
  } catch {
    // Blocked storage: there is nothing stored to clear.
  }
}
