import { describe, expect, it } from "vitest";
import { clearPendingPurchase, PENDING_PURCHASE_KEY, savePendingPurchase, takePendingPurchase } from "@/lib/analytics/pending-purchase";

function memoryStore(initial: Record<string, string> = {}) {
  const data: Record<string, string> = { ...initial };
  return {
    data,
    getItem: (key: string) => data[key] ?? null,
    setItem: (key: string, value: string) => {
      data[key] = value;
    },
    removeItem: (key: string) => {
      delete data[key];
    },
  };
}

describe("pending purchase", () => {
  it("is taken once: a reload of the success page finds nothing", () => {
    const store = memoryStore();
    savePendingPurchase({ webPaymentId: "wp_1", plan: "annual", value: 709 }, store);
    expect(takePendingPurchase(store)).toEqual({ webPaymentId: "wp_1", plan: "annual", value: 709 });
    expect(takePendingPurchase(store)).toBeNull();
  });
  it("rejects what is not one of ours, and removes it", () => {
    const bad = [
      "not json",
      JSON.stringify({ webPaymentId: "", plan: "annual", value: 709 }),
      JSON.stringify({ webPaymentId: "wp_1", plan: "weekly", value: 709 }),
      JSON.stringify({ webPaymentId: "wp_1", plan: "annual", value: 0 }),
      JSON.stringify({ webPaymentId: "wp_1", plan: "annual", value: "709" }),
      JSON.stringify({ webPaymentId: "x".repeat(129), plan: "annual", value: 709 }),
    ];
    for (const raw of bad) {
      const store = memoryStore({ [PENDING_PURCHASE_KEY]: raw });
      expect(takePendingPurchase(store)).toBeNull();
      expect(store.data[PENDING_PURCHASE_KEY]).toBeUndefined();
    }
  });
  it("is dropped on a return from Grow's cancel URL", () => {
    const store = memoryStore();
    savePendingPurchase({ webPaymentId: "wp_1", plan: "monthly", value: 59.9 }, store);
    clearPendingPurchase(store);
    expect(takePendingPurchase(store)).toBeNull();
  });
  it("never throws on blocked storage", () => {
    const blocked = {
      getItem: () => { throw new Error("blocked"); },
      setItem: () => { throw new Error("blocked"); },
      removeItem: () => { throw new Error("blocked"); },
    };
    expect(() => savePendingPurchase({ webPaymentId: "wp_1", plan: "annual", value: 709 }, blocked)).not.toThrow();
    expect(takePendingPurchase(blocked)).toBeNull();
    expect(() => clearPendingPurchase(blocked)).not.toThrow();
    expect(takePendingPurchase(undefined)).toBeNull();
  });
});
