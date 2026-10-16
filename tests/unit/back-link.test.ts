import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync("components/ui/BackLink.tsx", "utf8");

describe("BackLink", () => {
  it("uses blue-deep: plain blue is 4.42:1 on the top of the hero wash", () => {
    expect(source).toContain("text-blue-deep");
    expect(source).not.toMatch(/text-blue(?![-\w])/);
  });
  it("keeps a 48px touch target", () => {
    expect(source).toContain("min-h-[48px]");
  });
});
