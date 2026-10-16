import type { ReactNode } from "react";

type Props = {
  id: string;
  title: string;
  /** Shows the "swipe for more" line under the title, below lg only. */
  swipeHint?: boolean;
  /** Trailing control beside the title (a link or the carousel arrows). */
  action?: ReactNode;
};

/**
 * Section title for the home sections. The hint is instruction text, so it is
 * ordinary content for screen readers; CSS hides it at lg+, where rows are
 * grids or have arrows instead of a swipe.
 */
export default function SectionHeading({ id, title, swipeHint = false, action }: Props) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
      <div>
        <h2 id={id} className="text-[27px] font-bold leading-tight text-ink lg:text-[40px]">
          {title}
        </h2>
        {swipeHint ? (
          <p className="mt-2 text-sm font-medium text-blue lg:hidden">החליקו הצידה לעוד ←</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
