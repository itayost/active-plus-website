import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { PLANS } from "@/lib/constants";

const SOURCE_DIRS = ["app", "components", "lib", "content"];

/**
 * A price someone typed: a number beside ₪ or ש"ח (either side), or in Hebrew
 * price copy ("99 לחודש", "חיסכון של 360", "חיוב אחד של 828"). Bare numbers
 * (Tailwind sizes, delays, phone numbers) are not prices.
 */
const PRICE_PATTERNS = [
  /\d[\d,.]*\s*(₪|ש["״]ח|שקל)/,
  /₪\s*\d/,
  /\d[\d,.]*\s*לחודש/,
  /(חיסכון|חיוב אחד|תשלום אחד|תשלום) של\s*\d/,
  /ב[־-]\d[\d,.]*\s*(₪|לחודש)/,
];
const typesAPrice = (text: string): boolean => PRICE_PATTERNS.some((pattern) => pattern.test(text));

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(ts|tsx|md|mdx|json)$/.test(name) ? [path] : [];
  });
}

describe("one price source", () => {
  it("catches a typed price, and lets sizes, delays and the phone number pass", () => {
    for (const typed of ["99 ₪", "360 ₪", "₪828", "828 ש\"ח", "69 לחודש", "חיסכון של 360", "חיוב אחד של 828", "ב־99 ₪"]) {
      expect(typesAPrice(typed), typed).toBe(true);
    }
    for (const fine of ["w-[69px]", "delay-[828ms]", "duration-708", "073-729-66-99", "`${formatter.format(amount)} ₪`", "{amount} לחודש"]) {
      expect(typesAPrice(fine), fine).toBe(false);
    }
  });
  it("no page, component, library or content file types a price", () => {
    const offenders = SOURCE_DIRS.flatMap(sourceFiles).filter((file) => typesAPrice(readFileSync(file, "utf8")));
    expect(offenders).toEqual([]);
  });
  it("the plans carry copy, not prices", () => {
    for (const plan of PLANS) {
      expect(plan).not.toHaveProperty("price");
      expect(plan).not.toHaveProperty("total");
      expect(plan).not.toHaveProperty("maxInstallments");
    }
  });
});
