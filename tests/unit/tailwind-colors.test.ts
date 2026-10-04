import postcss from "postcss";
import tailwindcss from "tailwindcss";
import { describe, expect, it } from "vitest";
import config from "../../tailwind.config";

async function compile(classes: string): Promise<string> {
  const result = await postcss([
    tailwindcss({
      ...config,
      content: [{ raw: `<div class="${classes}">`, extension: "html" }],
    }),
  ]).process("@tailwind utilities", { from: undefined });
  return result.css;
}

describe("themed colour utilities", () => {
  it("emits the bare variable for unmodified utilities", async () => {
    const css = await compile("bg-ink text-green-deep border-hairline");

    expect(css).toMatch(/\.bg-ink\s*\{[^}]*background-color:\s*var\(--ink\)/);
    expect(css).toMatch(/\.text-green-deep\s*\{[^}]*color:\s*var\(--green-deep\)/);
    expect(css).not.toContain("color-mix");
  });

  it("uses color-mix only for an explicit opacity modifier", async () => {
    const css = await compile("bg-ink/85 border-ink/15");

    expect(css).toContain("color-mix(in srgb, var(--ink) calc(0.85 * 100%), transparent)");
    expect(css).toContain("color-mix(in srgb, var(--ink) calc(0.15 * 100%), transparent)");
  });
});
