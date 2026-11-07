import { describe, expect, it } from "vitest";
import {
  CONSENT_KEY,
  CONSENT_SCRIPT,
  CONSENT_TTL_MS,
  DECLINE_KEY,
  hasConsent,
  hasDeclined,
  saveConsent,
  saveDecline,
} from "@/lib/consent";

const NOW = Date.UTC(2026, 10, 6, 10);

function memoryStore(initial: Record<string, string> = {}) {
  const data = { ...initial };
  return {
    data,
    getItem: (key: string) => data[key] ?? null,
    setItem: (key: string, value: string) => {
      data[key] = value;
    },
  };
}

const blocked = {
  getItem: () => {
    throw new Error("blocked");
  },
  setItem: () => {
    throw new Error("blocked");
  },
};

describe("hasConsent / saveConsent", () => {
  it("is false until the notice is accepted, then true", () => {
    const store = memoryStore();
    expect(hasConsent(NOW, store)).toBe(false);
    saveConsent(NOW, store);
    expect(store.data[CONSENT_KEY]).toBe(String(NOW));
    expect(hasConsent(NOW + 1000, store)).toBe(true);
  });
  it("lasts a year, then the notice shows again", () => {
    const store = memoryStore({ [CONSENT_KEY]: String(NOW) });
    expect(hasConsent(NOW + CONSENT_TTL_MS - 1, store)).toBe(true);
    expect(hasConsent(NOW + CONSENT_TTL_MS, store)).toBe(false);
  });
  it("ignores a value that is not a past time", () => {
    expect(hasConsent(NOW, memoryStore({ [CONSENT_KEY]: "yes" }))).toBe(false);
    expect(hasConsent(NOW, memoryStore({ [CONSENT_KEY]: "0" }))).toBe(false);
    expect(hasConsent(NOW, memoryStore({ [CONSENT_KEY]: String(NOW + 60_000) }))).toBe(false);
  });
  it("reads blocked storage as not accepted and never throws", () => {
    expect(hasConsent(NOW, blocked)).toBe(false);
    expect(() => saveConsent(NOW, blocked)).not.toThrow();
    expect(hasConsent(NOW, undefined)).toBe(false);
  });
});

/** Runs the inline script against a fake storage and <html>, returning the flag it leaves. */
function run(stored: Record<string, string>, now = NOW, throws = false): string | undefined {
  const dataset: Record<string, string> = {};
  const localStorage = {
    getItem: (key: string) => {
      if (throws) throw new Error("blocked");
      return stored[key] ?? null;
    },
  };
  const document = { documentElement: { dataset } };
  new Function("localStorage", "document", "Date", CONSENT_SCRIPT)(localStorage, document, { now: () => now });
  return dataset.consent;
}

describe("hasDeclined / saveDecline", () => {
  it("records a decline for a year without counting as consent", () => {
    const store = memoryStore();
    expect(hasDeclined(NOW, store)).toBe(false);
    saveDecline(NOW, store);
    expect(store.data[DECLINE_KEY]).toBe(String(NOW));
    expect(hasDeclined(NOW + 1000, store)).toBe(true);
    expect(hasConsent(NOW + 1000, store)).toBe(false);
    expect(hasDeclined(NOW + CONSENT_TTL_MS, store)).toBe(false);
  });
  it("never throws on blocked storage", () => {
    expect(hasDeclined(NOW, blocked)).toBe(false);
    expect(() => saveDecline(NOW, blocked)).not.toThrow();
  });
});

describe("consent script", () => {
  it("flags a visitor who accepted within the year, so CSS hides the notice before the first paint", () => {
    expect(run({ [CONSENT_KEY]: String(NOW - 1000) })).toBe("accepted");
  });
  it("leaves a first visit, an expired acceptance and a bad value unflagged", () => {
    expect(run({})).toBeUndefined();
    expect(run({ [CONSENT_KEY]: String(NOW - CONSENT_TTL_MS) })).toBeUndefined();
    expect(run({ [CONSENT_KEY]: "accepted" })).toBeUndefined();
  });
  it("agrees with hasConsent at the edges", () => {
    for (const at of [NOW - 1, NOW - CONSENT_TTL_MS + 1, NOW - CONSENT_TTL_MS, NOW + 1]) {
      const stored = { [CONSENT_KEY]: String(at) };
      expect(run(stored) === "accepted").toBe(hasConsent(NOW, memoryStore(stored)));
    }
  });
  it("flags a visitor who declined within the year as declined", () => {
    expect(run({ [DECLINE_KEY]: String(NOW - 1000) })).toBe("declined");
    expect(run({ [DECLINE_KEY]: String(NOW - CONSENT_TTL_MS) })).toBeUndefined();
  });
  it("lets an acceptance win over a decline", () => {
    expect(run({ [CONSENT_KEY]: String(NOW - 1000), [DECLINE_KEY]: String(NOW - 500) })).toBe("accepted");
  });
  it("survives blocked storage", () => {
    expect(run({ [CONSENT_KEY]: String(NOW) }, NOW, true)).toBeUndefined();
  });
  it("writes no stored value into the page", () => {
    expect(CONSENT_SCRIPT).not.toContain("innerHTML");
    expect(CONSENT_SCRIPT).not.toContain("write(");
  });
});
