import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string): string => readFileSync(join(process.cwd(), path), "utf8");

describe("design tokens", () => {
  const css = read("app/globals.css");

  it("carries the handoff palette", () => {
    expect(css).toContain("--blue: #1E6FD9");
    expect(css).toContain("--ink: #111");
    expect(css).toContain("--green: #2E9E5B");
    expect(css).toContain("--hairline: #EEF0F3");
    expect(css).toContain("--green-hi: #29864E");
    expect(css).toContain("--green-lo: #217241");
    expect(css).toContain("--danger-deep:");
  });

  it("drops the retired palette", () => {
    for (const gone of ["--purple", "--burgundy", "--yellow", "--emphasis-cyan", "--hero-field"]) {
      expect(css).not.toContain(gone);
    }
  });

  it("loads Heebo only", () => {
    expect(read("app/layout.tsx")).not.toContain("Rubik");
  });
});
