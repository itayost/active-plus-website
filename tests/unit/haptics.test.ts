import { afterEach, describe, expect, it, vi } from "vitest";
import { TAP_MS, tapHaptic } from "@/lib/haptics";

describe("tapHaptic", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("vibrates once, briefly", () => {
    const vibrate = vi.fn(() => true);
    vi.stubGlobal("navigator", { vibrate });
    tapHaptic();
    expect(vibrate).toHaveBeenCalledWith(TAP_MS);
    expect(TAP_MS).toBeGreaterThanOrEqual(10);
    expect(TAP_MS).toBeLessThanOrEqual(15);
  });

  it("does nothing where there is no Vibration API (iOS Safari)", () => {
    vi.stubGlobal("navigator", {});
    expect(() => tapHaptic()).not.toThrow();
  });

  it("swallows a browser that throws", () => {
    vi.stubGlobal("navigator", { vibrate: () => { throw new Error("blocked"); } });
    expect(() => tapHaptic()).not.toThrow();
  });
});
