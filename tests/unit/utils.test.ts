import { describe, expect, it } from "vitest";
import config from "../../tailwind.config";
import { cn } from "@/lib/utils";

const customSizes = Object.keys(config.theme?.extend?.fontSize ?? {});

describe("cn", () => {
  it("keeps a custom font size beside a text colour", () => {
    expect(cn("text-lead text-ink-soft")).toBe("text-lead text-ink-soft");
  });
  it("knows every custom size in the Tailwind config", () => {
    expect(customSizes.length).toBeGreaterThan(0);
    for (const size of customSizes) {
      expect(cn(`text-${size} text-ink`)).toBe(`text-${size} text-ink`);
    }
  });
  it("still lets a later size replace an earlier one", () => {
    expect(cn("text-lead text-h3")).toBe("text-h3");
    expect(cn("text-base text-card-title")).toBe("text-card-title");
  });
});
