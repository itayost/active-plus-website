import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  children: ReactNode;
  id?: string;
  className?: string;
  tone?: "surface" | "sunken";
  labelledBy?: string;
  label?: string;
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
  const max = width === "narrow" ? "max-w-narrow" : "max-w-shell";
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
  label,
  width = "shell",
}: Props) {
  const bg = tone === "sunken" ? "bg-sunken" : "bg-surface";
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      aria-label={label}
      // cn, so a page can replace the section rhythm (py-*) outright instead
      // of overriding it with !important.
      className={cn(bg, "py-[var(--section-y)]", className)}
    >
      <Shell width={width}>{children}</Shell>
    </section>
  );
}
