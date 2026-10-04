import { describe, expect, it } from "vitest";
import { defaultSlot, segmentOf, slotsFor } from "@/lib/funnel/time";

describe("training time", () => {
  it("finds the segment a stored time belongs to", () => {
    expect(segmentOf("08:00")).toBe("morning");
    expect(segmentOf("05:15")).toBe("morning");
    expect(segmentOf("10:45")).toBe("morning");
    expect(segmentOf("13:00")).toBe("midday");
    expect(segmentOf("21:45")).toBe("afternoon");
  });
  it("returns null for no time or a time outside every segment", () => {
    expect(segmentOf(undefined)).toBeNull();
    expect(segmentOf("")).toBeNull();
    expect(segmentOf("03:00")).toBeNull();
    expect(segmentOf("garbage")).toBeNull();
  });
  it("lists 15-minute slots across the segment's whole hours", () => {
    const morning = slotsFor("morning");
    expect(morning[0]).toBe("05:00");
    expect(morning[1]).toBe("05:15");
    expect(morning.at(-1)).toBe("10:45");
    expect(morning).toHaveLength(24);
    expect(slotsFor("midday")[0]).toBe("11:00");
    expect(slotsFor("afternoon").at(-1)).toBe("21:45");
  });
  it("seeds the picker with the middle preset", () => {
    expect(defaultSlot("morning")).toBe("09:00");
    expect(defaultSlot("midday")).toBe("12:00");
    expect(defaultSlot("afternoon")).toBe("17:00");
  });
});
