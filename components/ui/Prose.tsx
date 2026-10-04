import { Fragment, type ReactNode } from "react";
import type { ArticleBlock } from "@/content/articles";

/**
 * Long-form body. Measure is capped for reading, headings get more space
 * above than below, the opening paragraph is set as a lead, and Hebrew
 * quotation marks keep the source's copy intact.
 */
export default function Prose({
  blocks,
  className = "",
  figure,
}: {
  blocks: readonly ArticleBlock[];
  className?: string;
  /** Rendered just before the second h2, e.g. the article's inner image. */
  figure?: ReactNode;
}) {
  let h2Count = 0;
  return (
    <div className={`max-w-measure ${className}`}>
      {blocks.map((block, index) => {
        if (block.type === "h2") {
          h2Count += 1;
          return (
            <Fragment key={`${block.text}-${index}`}>
              {h2Count === 2 ? figure : null}
              <h2 className="mb-4 mt-14 text-[clamp(1.5rem,1.25rem+1.2vw,2.25rem)] font-display font-bold first:mt-0">
                {block.text}
              </h2>
            </Fragment>
          );
        }
        return (
          <p
            key={`${block.text}-${index}`}
            className={`mt-5 first:mt-0 ${index === 0 ? "text-lead text-ink" : "text-ink-soft"}`}
          >
            {block.text}
          </p>
        );
      })}
    </div>
  );
}
