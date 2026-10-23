import terms from "@/content/legal/terms-of-use.he.json";
import type { PlanPrices } from "@/lib/pricing";

/**
 * The Terms of Use. content/legal/terms-of-use.he.json is a byte-identical
 * copy of FitnessForSeniorsApp's shared/legal/terms-of-use.he.json, the one
 * source both apps are generated from; copy it across when it changes.
 *
 * The text names prices only as {{tokens}}. The site fills them from the live
 * web_plans prices, so the terms can never disagree with checkout; the apps
 * bake in the JSON's `prices` instead.
 */

export type PriceTokens = Record<string, number>;

/** One block of a section: a paragraph of lines, or a bulleted list. */
export type TermsBlock = { kind: "paragraph"; lines: string[] } | { kind: "list"; items: string[] };

export interface TermsSection {
  title: string;
  blocks: TermsBlock[];
}

export const TERMS_TITLE: string = terms.title;
export const TERMS_UPDATED: string = terms.updated;
export const TERMS_HEADER: readonly string[] = terms.header;

const BULLET = "• ";

/** The token values: the live prices when they could be read, otherwise the approved text's own. */
export function priceTokens(prices: PlanPrices | null): PriceTokens {
  if (!prices) return terms.prices;
  return {
    monthly_total: prices.monthly.total,
    annual_total: prices.annual.total,
    annual_per_month: Math.round((prices.annual.total / 12) * 100) / 100,
  };
}

const numberFormat = new Intl.NumberFormat("he-IL", { maximumFractionDigits: 2 });

export function fillPrices(text: string, tokens: PriceTokens): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const value = tokens[key];
    if (value === undefined) throw new Error(`Unknown price token {{${key}}} in the terms`);
    return numberFormat.format(value);
  });
}

/** Splits a section's text into paragraphs (blank-line separated) and bullet lists ("• " lines). */
export function toBlocks(content: string): TermsBlock[] {
  return content.split("\n\n").flatMap((chunk) => {
    const blocks: TermsBlock[] = [];
    for (const line of chunk.split("\n")) {
      const last = blocks[blocks.length - 1];
      if (line.startsWith(BULLET)) {
        const item = line.slice(BULLET.length);
        if (last?.kind === "list") blocks[blocks.length - 1] = { kind: "list", items: [...last.items, item] };
        else blocks.push({ kind: "list", items: [item] });
      } else if (last?.kind === "paragraph") {
        blocks[blocks.length - 1] = { kind: "paragraph", lines: [...last.lines, line] };
      } else {
        blocks.push({ kind: "paragraph", lines: [line] });
      }
    }
    return blocks;
  });
}

export function termsSections(tokens: PriceTokens): TermsSection[] {
  return terms.sections.map((s) => ({ title: s.title, blocks: toBlocks(fillPrices(s.content, tokens)) }));
}
