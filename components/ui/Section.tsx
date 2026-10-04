import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  id?: string;
  className?: string;
  tone?: "surface" | "sunken";
  labelledBy?: string;
  width?: "shell" | "narrow";
};

export function Shell({
  children,
  className = "",
  width = "shell",
}: {
  children: ReactNode;
  className?: string;
  width?: "shell" | "narrow";
}) {
  const max = width === "narrow" ? "max-w-[820px]" : "max-w-shell";
  return (
    <div className={`mx-auto w-full ${max} gutter-x ${className}`}>
      {children}
    </div>
  );
}

export default function Section({
  children,
  id,
  className = "",
  tone = "surface",
  labelledBy,
  width = "shell",
}: Props) {
  const bg = tone === "sunken" ? "bg-sunken" : "bg-surface";
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={`${bg} py-[var(--section-y)] ${className}`}
    >
      <Shell width={width}>{children}</Shell>
    </section>
  );
}

/**
 * Section heading. Deliberately has no eyebrow slot — the heading
 * carries its own weight.
 */
export function SectionHeading({
  id,
  children,
  lede,
  align = "start",
  className = "",
}: {
  id?: string;
  children: ReactNode;
  lede?: ReactNode;
  align?: "start" | "center";
  className?: string;
}) {
  const alignment =
    align === "center" ? "text-center mx-auto items-center" : "text-start";
  return (
    <div className={`flex flex-col ${alignment} ${className}`}>
      <h2 id={id} className="text-h2 font-display font-black text-ink">
        {children}
      </h2>
      {lede ? (
        <p
          className={`mt-5 max-w-measure text-lead text-ink-soft ${
            align === "center" ? "mx-auto" : ""
          }`}
        >
          {lede}
        </p>
      ) : null}
    </div>
  );
}
