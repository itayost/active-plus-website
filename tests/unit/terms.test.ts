import { describe, expect, it } from "vitest";
import terms from "@/content/legal/terms-of-use.he.json";
import { fillPrices, priceTokens, termsSections, toBlocks } from "@/lib/legal/terms";
import type { PlanPrices } from "@/lib/pricing";

const live: PlanPrices = {
  monthly: { total: 109, maxInstallments: 1 },
  annual: { total: 900, maxInstallments: 12 },
};

describe("terms of use", () => {
  it("fills section 5 from the live web_plans prices", () => {
    const text = termsSections(priceTokens(live)).find((s) => s.title.startsWith("5."))!;
    const items = text.blocks.flatMap((b) => (b.kind === "list" ? b.items : []));
    expect(items).toEqual([
      "מנוי חודשי: 109 ₪ לחודש.",
      "מנוי שנתי: 900 ₪ לשנה, הנגבים מראש עבור השנה כולה (75 ₪ לחודש בממוצע).",
    ]);
  });

  it("falls back to the approved text's prices when web_plans cannot be read", () => {
    expect(priceTokens(null)).toEqual(terms.prices);
    expect(fillPrices("{{monthly_total}} ₪", priceTokens(null))).toBe("99 ₪");
  });

  it("leaves no price token unfilled, and refuses an unknown one", () => {
    const all = JSON.stringify(termsSections(priceTokens(live)));
    expect(all).not.toContain("{{");
    expect(() => fillPrices("{{nope}}", priceTokens(live))).toThrow(/Unknown price token/);
  });

  it("splits paragraphs on blank lines and turns bullet lines into a list", () => {
    expect(toBlocks("a\n\nb:\n• one\n• two\n\nc\nd")).toEqual([
      { kind: "paragraph", lines: ["a"] },
      { kind: "paragraph", lines: ["b:"] },
      { kind: "list", items: ["one", "two"] },
      { kind: "paragraph", lines: ["c", "d"] },
    ]);
  });

  it("keeps all 14 sections of the approved text", () => {
    expect(termsSections(priceTokens(null)).map((s) => s.title.split(".")[0])).toEqual(
      Array.from({ length: 14 }, (_, i) => String(i + 1)),
    );
  });
});
