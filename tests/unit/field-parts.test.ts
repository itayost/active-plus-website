import { describe, expect, it } from "vitest";
import { areaClass, fieldClass } from "@/components/forms/FieldParts";

function luminance(hex: string) {
  const [r, g, b] = [0, 2, 4]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

describe("form field borders", () => {
  it("rest at 3:1 or better on white (WCAG 1.4.11)", () => {
    for (const cls of [fieldClass(false), areaClass(false)]) {
      const hex = /border-\[#([0-9A-Fa-f]{6})\]/.exec(cls)?.[1];
      expect(hex).toBeDefined();
      expect(1.05 / (luminance(hex!) + 0.05)).toBeGreaterThanOrEqual(3);
    }
  });
  it("show a full-strength ring on focus", () => {
    expect(fieldClass(false)).toContain("focus:ring-blue-deep ");
  });
});
