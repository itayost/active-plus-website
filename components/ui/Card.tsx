import type { MouseEventHandler, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  as?: "div" | "article" | "section";
  className?: string;
  "aria-labelledby"?: string;
  /** For a card whose whole surface stands in for a button inside it (that button stays the keyboard way). */
  onClick?: MouseEventHandler<HTMLElement>;
  children: ReactNode;
};

/** White surface with the handoff's hairline border, soft shadow and 22px radius. */
export default function Card({ as: Tag = "div", className, "aria-labelledby": labelledBy, onClick, children }: Props) {
  return (
    <Tag aria-labelledby={labelledBy} onClick={onClick} className={cn("rounded-card border border-hairline bg-surface shadow-card", className)}>
      {children}
    </Tag>
  );
}
