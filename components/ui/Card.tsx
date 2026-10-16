import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  as?: "div" | "article" | "section";
  className?: string;
  "aria-labelledby"?: string;
  children: ReactNode;
};

/** White surface with the handoff's hairline border, soft shadow and 22px radius. */
export default function Card({ as: Tag = "div", className, "aria-labelledby": labelledBy, children }: Props) {
  return (
    <Tag aria-labelledby={labelledBy} className={cn("rounded-card border border-hairline bg-surface shadow-card", className)}>
      {children}
    </Tag>
  );
}
