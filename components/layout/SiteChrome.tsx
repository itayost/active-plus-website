"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { isFullscreenPath } from "@/lib/fullscreen";

/** Renders the site header or footer it wraps, except on the full-screen pages. */
export default function SiteChrome({ children }: { children: ReactNode }) {
  return isFullscreenPath(usePathname()) ? null : <>{children}</>;
}
