import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { PLANS } from "@/lib/constants";

const SOURCE_DIRS = ["app", "components", "lib"];
// Today's and the old annual figures: the price lives only in Supabase's web_plans.
const PRICE_LITERAL = /(^|[^\d.])(69|828|708)(?![\d.])/;

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(ts|tsx)$/.test(name) ? [path] : [];
  });
}

describe("one price source", () => {
  it("no page, component or library file types an annual price", () => {
    const offenders = SOURCE_DIRS.flatMap(sourceFiles).filter((file) => PRICE_LITERAL.test(readFileSync(file, "utf8")));
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
