import type { ReactNode } from "react";
import BackLink from "@/components/ui/BackLink";
import { Shell } from "@/components/ui/Section";

/*
  Plain h2 and p children of the body pick up the section heading (21px/800
  blue, the prototype's h3 look) and body styles, so a page only writes
  semantic markup. h2 rather than h3 keeps the heading order intact. These are
  descendant selectors: anything nested inside the body (a form's note, a
  card's title) gets them too, so a reused component that must look different
  sets its own margin and colour.

  From lg the body's first heading sits flush with the title it now stands
  beside, instead of 32px under it.
*/
const BODY =
  "max-w-measure text-base text-ink " +
  "[&_h2]:mb-2 [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-[clamp(1.3125rem,1.15rem+0.6vw,1.75rem)] [&_h2]:font-extrabold [&_h2]:leading-tight [&_h2]:text-blue " +
  "[&_p]:mb-3 " +
  "lg:[&>:first-child]:mt-0 lg:[&>:first-child>h2:first-child]:mt-0";

const TITLE =
  "max-w-measure font-display text-[clamp(1.75rem,1.35rem+1.6vw,3rem)] font-extrabold leading-[1.15] text-blue " +
  "lg:text-[clamp(2.5rem,1.2rem+2.4vw,3.75rem)] lg:leading-[1.08]";

/**
 * The handoff prototype's inner-page shell: a blue 800-weight h1, then one
 * column at the reading measure. That is the whole layout on a phone, as in
 * the prototype.
 *
 * From lg the page becomes an editorial spread instead of a phone column
 * against the right edge: the title (and the page's `intro`, such as the
 * about photo or the contact details) holds a sticky rail at the start, the
 * body runs beside it at the reading measure. A `wide` page (the team grid)
 * keeps the title on top and gives its body the whole shell.
 */
export default function InnerPage({
  title,
  children,
  intro,
  back = false,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  /** Under the title: in the start rail from lg, before the body on a phone. */
  intro?: ReactNode;
  /** Show the link back to the home page above the title. */
  back?: boolean;
  /** Title on top and a full-width body, for grids. */
  wide?: boolean;
}) {
  const head = (
    <>
      {back ? <BackLink /> : null}
      <h1 className={TITLE}>{title}</h1>
      {intro ? <div className="mt-6 text-base text-ink">{intro}</div> : null}
    </>
  );

  if (wide) {
    return (
      <div className="pb-[var(--section-y)] pt-[clamp(1.5rem,4vw,3.5rem)]">
        <Shell>
          {head}
          <div className="mt-6 text-base text-ink lg:mt-12">{children}</div>
        </Shell>
      </div>
    );
  }

  return (
    <div className="pb-[var(--section-y)] pt-[clamp(1.5rem,4vw,3.5rem)]">
      <Shell className="lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start lg:gap-x-16 xl:gap-x-24">
        {/* top-28 clears the sticky header with room to breathe. */}
        <div className="lg:sticky lg:top-28">{head}</div>
        <div className={`${intro ? "" : "mt-6"} ${BODY} lg:mt-0`}>{children}</div>
      </Shell>
    </div>
  );
}
