import { describe, expect, it } from "vitest";
import { isFullscreenPath } from "@/lib/fullscreen";

describe("isFullscreenPath", () => {
  it("runs the questionnaire and the purchase after it full screen", () => {
    expect(isFullscreenPath("/questionnaire")).toBe(true);
    expect(isFullscreenPath("/payment")).toBe(true);
    expect(isFullscreenPath("/payment/success")).toBe(true);
    expect(isFullscreenPath("/questionnaire/")).toBe(true);
  });
  it("keeps the site header and footer everywhere else", () => {
    expect(isFullscreenPath("/")).toBe(false);
    expect(isFullscreenPath("/about")).toBe(false);
    expect(isFullscreenPath("/account/subscription")).toBe(false);
    expect(isFullscreenPath("/payments")).toBe(false);
    expect(isFullscreenPath(null)).toBe(false);
  });
});
