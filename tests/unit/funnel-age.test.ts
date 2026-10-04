import { describe, expect, it } from "vitest";
import { ageBand, birthYears, defaultBirthYear, yearOf } from "@/lib/funnel/age";

describe("birth year", () => {
  it("offers ages 30 to 100, newest first", () => {
    const years = birthYears(2026);
    expect(years[0]).toBe(1996);
    expect(years.at(-1)).toBe(1926);
    expect(years).toHaveLength(71);
  });
  it("defaults to age 65", () => {
    expect(defaultBirthYear(2026)).toBe(1961);
  });
  it("reads the year from a stored date of birth", () => {
    expect(yearOf("1961-01-01")).toBe(1961);
    expect(yearOf(undefined)).toBeNull();
    expect(yearOf("not a date")).toBeNull();
  });
});

describe("age band", () => {
  it("floors the age to a multiple of five", () => {
    expect(ageBand("1961-01-01", 2026)).toBe(65);
    expect(ageBand("1957-01-01", 2026)).toBe(65);
    expect(ageBand("1956-01-01", 2026)).toBe(70);
  });
  it("falls back to 50 without a date of birth", () => {
    expect(ageBand(undefined, 2026)).toBe(50);
  });
});
