import { describe, expect, it } from "vitest";
import { RESUME_SCRIPT } from "@/lib/funnel/resume-script";

const DAY = 86_400_000;

/** Runs the inline script against a fake storage and <html>, returning the flag it leaves. */
function run(stored: Record<string, string>, now = Date.now(), throws = false): string | undefined {
  const dataset: Record<string, string> = {};
  const localStorage = {
    getItem: (key: string) => {
      if (throws) throw new Error("blocked");
      return stored[key] ?? null;
    },
  };
  const document = { documentElement: { dataset } };
  const FakeDate = { now: () => now };
  new Function("localStorage", "document", "Date", RESUME_SCRIPT)(localStorage, document, FakeDate);
  return dataset.funnelResume;
}

describe("resume script", () => {
  it("flags a returning visitor with a saved step", () => {
    expect(run({ "ap.funnel.step": "chairRise", "ap.funnel.updated_at": String(Date.now()) })).toBe("");
  });
  it("does not flag a first visit, welcome2 or a value that is not a step", () => {
    expect(run({})).toBeUndefined();
    expect(run({ "ap.funnel.step": "welcome2" })).toBeUndefined();
    expect(run({ "ap.funnel.step": "nonsense" })).toBeUndefined();
  });
  it("does not flag a session past the TTL", () => {
    const stamp = Date.now();
    expect(run({ "ap.funnel.step": "frequency", "ap.funnel.updated_at": String(stamp) }, stamp + 31 * DAY)).toBeUndefined();
  });
  it("survives blocked storage", () => {
    expect(run({ "ap.funnel.step": "gender" }, Date.now(), true)).toBeUndefined();
  });
});
