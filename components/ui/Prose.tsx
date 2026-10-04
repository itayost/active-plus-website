import type { ArticleBlock } from "@/content/articles";

/**
 * Long-form body. Measure is capped for reading, headings get more space
 * above than below, and Hebrew quotation marks keep the source's copy intact.
 */
export default function Prose({
  blocks,
  className = "",
}: {
  blocks: readonly ArticleBlock[];
  className?: string;
}) {
  return (
    <div className={`max-w-measure ${className}`}>
      {blocks.map((block, index) =>
        block.type === "h2" ? (
          <h2
            key={`${block.text}-${index}`}
            className="mb-4 mt-14 text-[clamp(1.5rem,1.25rem+1.2vw,2.25rem)] font-display font-bold first:mt-0"
          >
            {block.text}
          </h2>
        ) : (
          <p
            key={`${block.text}-${index}`}
            className="mt-5 text-ink-soft first:mt-0"
          >
            {block.text}
          </p>
        ),
      )}
    </div>
  );
}
