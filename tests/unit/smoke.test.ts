import { describe, expect, it } from "vitest";
import { SITE_URL } from "@/lib/constants";

describe("tooling", () => {
  it("resolves the @ alias", () => {
    expect(SITE_URL).toBe("https://activeplus.co.il");
  });
});
