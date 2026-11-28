import { describe, expect, it } from "vitest";
import { GOALS_VARIANT_KEY, assignGoalsVariant, pickGoalsVariant } from "@/lib/funnel/goals-variant";

function memoryStore(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
    data,
  };
}

describe("pickGoalsVariant", () => {
  it("splits visitors half and half", () => {
    expect(pickGoalsVariant(0.1)).toBe("photo");
    expect(pickGoalsVariant(0.49)).toBe("photo");
    expect(pickGoalsVariant(0.5)).toBe("list");
    expect(pickGoalsVariant(0.99)).toBe("list");
  });
});

describe("assignGoalsVariant", () => {
  it("draws once and keeps the answer on the phone", () => {
    const store = memoryStore();
    expect(assignGoalsVariant(store, () => 0.2)).toBe("photo");
    expect(store.data.get(GOALS_VARIANT_KEY)).toBe("photo");
    expect(assignGoalsVariant(store, () => 0.9)).toBe("photo");
  });

  it("keeps a visitor's earlier version", () => {
    const store = memoryStore({ [GOALS_VARIANT_KEY]: "list" });
    expect(assignGoalsVariant(store, () => 0.1)).toBe("list");
  });

  it("draws again over a value that is not ours", () => {
    const store = memoryStore({ [GOALS_VARIANT_KEY]: "other" });
    expect(assignGoalsVariant(store, () => 0.9)).toBe("list");
  });

  it("works with no storage at all", () => {
    expect(assignGoalsVariant(undefined, () => 0.1)).toBe("photo");
  });
});
