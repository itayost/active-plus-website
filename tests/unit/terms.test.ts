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

  it("keeps every section of the approved text, in order", () => {
    expect(termsSections(priceTokens(null)).map((s) => s.title.split(".")[0])).toEqual(
      ["1", "2", "3", "4", "5", "5א", "6", "7", "8", "9", "10", "11", "12", "13", "14"],
    );
  });

  it("states the supply policy and the company's liability, which Grow's review requires", () => {
    const sections = termsSections(priceTokens(null));
    const paragraphs = (prefix: string) =>
      sections.find((s) => s.title.startsWith(prefix))!.blocks.flatMap((b) => (b.kind === "paragraph" ? b.lines : []));
    expect(sections.map((s) => s.title)).toEqual(expect.arrayContaining(["5א. אספקת השירות", "9. אחריות והגבלת אחריות"]));
    expect(paragraphs("5א.").map((line) => line.split(" ")[0])).toEqual(["5א.1.", "5א.2.", "5א.3.", "5א.4."]);
    expect(paragraphs("9.").map((line) => line.split(" ")[0])).toEqual(["9.1.", "9.2.", "9.3.", "9.4.", "9.5.", "9.6."]);
  });
});
