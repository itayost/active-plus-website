import { describe, expect, it } from "vitest";
import { scrollBehaviorFor, shouldLoadHeroVideo } from "@/lib/media";

describe("shouldLoadHeroVideo", () => {
  it("loads the video when motion is allowed and data saving is off", () => {
    expect(shouldLoadHeroVideo({ prefersReducedMotion: false, saveData: false })).toBe(true);
  });
  it("loads the video when the browser does not report save-data at all", () => {
    expect(shouldLoadHeroVideo({ prefersReducedMotion: false, saveData: undefined })).toBe(true);
  });
  it("keeps the poster only for reduced-motion visitors", () => {
    expect(shouldLoadHeroVideo({ prefersReducedMotion: true, saveData: false })).toBe(false);
  });
  it("keeps the poster only for visitors saving data", () => {
    expect(shouldLoadHeroVideo({ prefersReducedMotion: false, saveData: true })).toBe(false);
  });
});

describe("scrollBehaviorFor", () => {
  it("animates the scroll when motion is allowed", () => {
    expect(scrollBehaviorFor(false)).toBe("smooth");
  });
  it("jumps instantly under reduced motion", () => {
    expect(scrollBehaviorFor(true)).toBe("auto");
  });
});
