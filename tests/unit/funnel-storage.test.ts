// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loadSession, loadStep, resetSession, saveAnswers, saveStep } from "@/lib/funnel/storage";

const DAY = 86_400_000;

/** Node 25+ ships its own `localStorage` global that shadows jsdom's and is unusable without a file flag. */
function memoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() { return map.size; },
    clear: () => map.clear(),
    getItem: (k) => map.get(k) ?? null,
    key: (i) => [...map.keys()][i] ?? null,
    removeItem: (k) => { map.delete(k); },
    setItem: (k, v) => { map.set(k, String(v)); },
  };
}

describe("funnel storage", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", memoryStorage());
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("creates one stable session id", () => {
    expect(loadSession().id).toBe(loadSession().id);
  });
  it("persists answers across reloads", () => {
    saveAnswers({ gender: "male" });
    expect(loadSession().answers).toEqual({ gender: "male" });
  });
  it("expires after 30 days", () => {
    saveAnswers({ gender: "male" });
    expect(loadSession(Date.now() + 31 * DAY).answers).toEqual({});
  });
  it("reset clears id and answers", () => {
    const { id } = loadSession();
    saveAnswers({ gender: "male" });
    resetSession();
    const after = loadSession();
    expect(after.id).not.toBe(id);
    expect(after.answers).toEqual({});
  });
  it("survives corrupted storage", () => {
    localStorage.setItem("ap.funnel.answers", "{not json");
    expect(loadSession().answers).toEqual({});
  });
  it("returns a fresh session when storage throws", () => {
    vi.spyOn(localStorage, "getItem").mockImplementation(() => { throw new Error("blocked"); });
    vi.spyOn(localStorage, "setItem").mockImplementation(() => { throw new Error("blocked"); });
    vi.spyOn(localStorage, "removeItem").mockImplementation(() => { throw new Error("blocked"); });
    const s = loadSession();
    expect(s.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(s.answers).toEqual({});
    expect(() => saveAnswers({ gender: "male" })).not.toThrow();
    expect(() => resetSession()).not.toThrow();
  });

  describe("current step", () => {
    it("round-trips a saved step", () => {
      saveStep("chairRise");
      expect(loadStep()).toBe("chairRise");
    });
    it("is null when nothing is stored", () => {
      expect(loadStep()).toBeNull();
    });
    it("ignores a value that is not a funnel step", () => {
      localStorage.setItem("ap.funnel.step", "nonsense");
      expect(loadStep()).toBeNull();
    });
    it("never restores into planBuilding: it lands on time", () => {
      saveStep("planBuilding");
      expect(loadStep()).toBe("time");
    });
    it("expires with the session after 30 days", () => {
      saveStep("frequency");
      expect(loadStep(Date.now() + 31 * DAY)).toBeNull();
    });
    it("is cleared by resetSession", () => {
      saveStep("frequency");
      resetSession();
      expect(loadStep()).toBeNull();
    });
    it("survives blocked storage", () => {
      vi.spyOn(localStorage, "getItem").mockImplementation(() => { throw new Error("blocked"); });
      vi.spyOn(localStorage, "setItem").mockImplementation(() => { throw new Error("blocked"); });
      expect(() => saveStep("gender")).not.toThrow();
      expect(loadStep()).toBeNull();
    });
  });
});
