import type { Metadata } from "next";

import PageHero from "@/components/layout/PageHero";
import { Shell } from "@/components/ui/Section";
import { TERMS_HEADER, TERMS_TITLE, TERMS_UPDATED, priceTokens, termsSections, type TermsBlock } from "@/lib/legal/terms";
import { loadPlanPrices } from "@/lib/plan-prices";

export const metadata: Metadata = {
  title: "תנאי שימוש",
  description: "תקנון ותנאי השימוש באפליקציה ובאתר של פעילים+.",
};

function Block({ block }: { block: TermsBlock }) {
  if (block.kind === "list") {
    return (
      <ul>
        {block.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    );
  }
  return (
    <p>
      {block.lines.map((line, i) => (
        <span key={line}>
          {i > 0 && <br />}
          {line}
        </span>
      ))}
    </p>
  );
}

export default async function TermsPage() {
  // The prices in section 5 come from web_plans, like the checkout's.
  const sections = termsSections(priceTokens(await loadPlanPrices()));
  return (
    <>
      <PageHero title={TERMS_TITLE} lede={`עדכון אחרון: ${TERMS_UPDATED}`} />
      <div className="bg-surface py-[var(--section-y)]">
        <Shell width="narrow">
          <section className="legal-section">
            {TERMS_HEADER.map((line) => (
              <p key={line} className="text-ink-soft">
                {line}
              </p>
            ))}
          </section>
          {sections.map((section) => (
            <section key={section.title} className="legal-section">
              <h2 className="mb-4 font-display text-h3 font-extrabold text-blue">{section.title}</h2>
              <div className="text-ink-soft">
                {section.blocks.map((block, i) => (
                  <Block key={i} block={block} />
                ))}
              </div>
            </section>
          ))}
        </Shell>
      </div>
    </>
  );
}
