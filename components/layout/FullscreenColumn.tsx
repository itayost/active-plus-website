import type { ReactNode } from "react";
import Logo from "./Logo";

/**
 * The frame of the full-screen pages after the questionnaire (the plans, the
 * checkout and the download screen): no site header or footer (SiteChrome),
 * one column the width of a large phone, centred on desktop, as the
 * questionnaire itself is. Only the wordmark sits on top, as the way home.
 */
export default function FullscreenColumn({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[100dvh] justify-center bg-sunken">
      <div className="flex w-full max-w-[640px] flex-col bg-surface md:shadow-lift-2">
        <div className="flex justify-center px-4 pt-[max(0.5rem,env(safe-area-inset-top))]">
          <Logo />
        </div>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
