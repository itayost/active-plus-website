import { describe, expect, it } from "vitest";
import { mayResume } from "@/lib/funnel/entry";

describe("mayResume", () => {
  it("starts a new entry at the first page", () => {
    expect(mayResume("navigate", false)).toBe(false);
    expect(mayResume(null, false)).toBe(false);
  });
  it("resumes inside the same visit", () => {
    expect(mayResume("reload", false)).toBe(true);
    expect(mayResume("back_forward", false)).toBe(true);
    expect(mayResume("navigate", true)).toBe(true);
  });
});
