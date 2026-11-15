// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { TAP_MS, tapHaptic } from "@/lib/haptics";

describe("tapHaptic", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("vibrates once, long enough to feel and too short to buzz", () => {
    const vibrate = vi.fn(() => true);
    vi.stubGlobal("navigator", { vibrate });
    tapHaptic();
    expect(vibrate).toHaveBeenCalledWith(TAP_MS);
    expect(TAP_MS).toBeGreaterThanOrEqual(25);
    expect(TAP_MS).toBeLessThanOrEqual(40);
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

describe("tapHaptic on an iPhone (no Vibration API)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("clicks a fresh hidden switch inside the tap and takes it away again", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2030-01-01T12:00:00Z"));
    vi.stubGlobal("navigator", {});
    const clicked: HTMLInputElement[] = [];
    const onClick = (e: Event) => {
      if (e.target instanceof HTMLInputElement) clicked.push(e.target);
    };
    document.addEventListener("click", onClick, true);
    try {
      tapHaptic();
      expect(clicked).toHaveLength(1);
      expect(clicked[0].type).toBe("checkbox");
      expect(clicked[0].hasAttribute("switch")).toBe(true);
      expect(document.querySelector("input[switch]")).toBeNull();

      // A second tap later gets its own switch; one within 60 ms is the same tap.
      tapHaptic();
      expect(clicked).toHaveLength(1);
      vi.setSystemTime(new Date("2030-01-01T12:00:01Z"));
      tapHaptic();
      expect(clicked).toHaveLength(2);
    } finally {
      document.removeEventListener("click", onClick, true);
    }
  });
});
