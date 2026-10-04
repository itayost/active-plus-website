import type { ReactNode } from "react";

/**
 * The rounded dark card that opens the home and how-it-works pages. Not the
 * page shell: the card runs almost the full viewport, inset only by a small
 * margin so the rounded corners read. `background` holds the absolutely
 * positioned media and scrims (use negative z-index inside the card).
 */
export default function DarkHeroCard({
  children,
  background,
  labelledBy,
  className = "",
}: {
  children: ReactNode;
  background?: ReactNode;
  labelledBy: string;
  className?: string;
}) {
  return (
    <section
      aria-labelledby={labelledBy}
      className="on-dark bg-surface pb-[clamp(1.5rem,3vw,2.5rem)] pt-[clamp(1rem,2vw,1.75rem)]"
    >
      {/* hero-inset: the small frame around the card, widened on a notched
          phone held sideways (globals.css). */}
      <div className="hero-inset mx-auto w-full">
        <div className="relative isolate overflow-hidden rounded-[clamp(20px,2.5vw,36px)] bg-hero">
          {background}
          <div className={className}>{children}</div>
        </div>
      </div>
    </section>
  );
}
