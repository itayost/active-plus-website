import type { ReactNode } from "react";
import BackLink from "@/components/ui/BackLink";
import { Shell } from "@/components/ui/Section";

/**
 * The handoff prototype's inner-page shell: a blue 800-weight h1, then one
 * column at the reading measure. Plain h2 and p children pick up the section
 * heading (21px/800 blue, the prototype's h3 look) and body styles, so a page
 * only writes semantic markup. h2 rather than h3 keeps the heading order intact.
 */
export default function InnerPage({
  title,
  children,
  back = false,
}: {
  title: string;
  children: ReactNode;
  /** Show the link back to the home page above the title. */
  back?: boolean;
}) {
  return (
    <div className="pb-[var(--section-y)] pt-[clamp(1.5rem,4vw,3.5rem)]">
      <Shell>
        {back ? <BackLink /> : null}
        <h1 className="max-w-measure font-display text-[clamp(1.75rem,1.35rem+1.6vw,3rem)] font-extrabold leading-[1.15] text-blue">
          {title}
        </h1>
        <div
          className={[
            "mt-6 max-w-measure text-base text-ink",
            "[&_h2]:mb-2 [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-[clamp(1.3125rem,1.15rem+0.6vw,1.75rem)] [&_h2]:font-extrabold [&_h2]:leading-tight [&_h2]:text-blue",
            "[&_p]:mb-3",
          ].join(" ")}
        >
          {children}
        </div>
      </Shell>
    </div>
  );
}
