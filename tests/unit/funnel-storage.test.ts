// @vitest-environment jsdom
import { webcrypto } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GENDER_FOR_PAYMENT, handOffToPayment, loadSession, loadStep, resetSession, saveAnswers, saveStep } from "@/lib/funnel/storage";

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
    vi.stubGlobal("sessionStorage", memoryStorage());
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

  describe("session id without crypto.randomUUID (Safari before 15.4)", () => {
    const V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

    it("builds an RFC 4122 v4 id from getRandomValues", () => {
      const getRandomValues = vi.fn(<T extends ArrayBufferView>(array: T) => webcrypto.getRandomValues(array as never) as T);
      vi.stubGlobal("crypto", { getRandomValues });
      const { id } = loadSession();
      expect(id).toMatch(V4);
      expect(id[14]).toBe("4"); // version nibble
      expect("89ab").toContain(id[19]); // variant nibble
      expect(getRandomValues).toHaveBeenCalledTimes(1);
      expect(loadSession().id).toBe(id);
    });

    it("sets the version and variant bits whatever the random bytes are", () => {
      for (const fill of [0x00, 0xff]) {
        resetSession();
        vi.stubGlobal("crypto", { getRandomValues: <T extends ArrayBufferView>(array: T) => (new Uint8Array(array.buffer).fill(fill), array) });
        expect(loadSession().id).toMatch(V4);
      }
    });
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

  describe("hand-off to payment", () => {
    it("keeps the gender for the payment page and clears the local session", () => {
      const { id } = loadSession();
      saveAnswers({ gender: "female", full_name: "רחל" });
      saveStep("otp");
      handOffToPayment("female");
      expect(sessionStorage.getItem(GENDER_FOR_PAYMENT)).toBe("female");
      expect(loadStep()).toBeNull();
      expect(loadSession().answers).toEqual({});
      expect(loadSession().id).not.toBe(id);
    });
    it("stores nothing for an unknown gender", () => {
      handOffToPayment(undefined);
      expect(sessionStorage.getItem(GENDER_FOR_PAYMENT)).toBeNull();
    });
    it("still clears the session when sessionStorage is blocked", () => {
      vi.spyOn(sessionStorage, "setItem").mockImplementation(() => { throw new Error("blocked"); });
      saveStep("otp");
      expect(() => handOffToPayment("male")).not.toThrow();
      expect(loadStep()).toBeNull();
    });
  });
});
