import { describe, expect, it } from "vitest";
import { scrollBehaviorFor } from "@/lib/media";

describe("scrollBehaviorFor", () => {
  it("animates the scroll when motion is allowed", () => {
    expect(scrollBehaviorFor(false)).toBe("smooth");
  });
  it("jumps instantly under reduced motion", () => {
    expect(scrollBehaviorFor(true)).toBe("auto");
  });
});
