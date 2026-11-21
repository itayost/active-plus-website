"use client";

import { pushTag } from "@/lib/analytics/tags";
import StoreButtons from "./StoreButtons";

/**
 * One button to download the app (owner, 2026-11-21): it goes through the site's one link,
 * /download, which sends an iPhone to the App Store and an Android phone to Google Play (and
 * shows both badges on a computer). The two official badges sit under it for anyone who looks for them.
 */
const ONE_LINK = "/download?utm_source=website&utm_medium=payment_success";

export default function DownloadAppButton({ label = "להורדת האפליקציה" }: { label?: string }) {
  return (
    <div className="grid gap-3">
      <a
        href={ONE_LINK}
        onClick={() => pushTag({ event: "store_click", store: "one_link" })}
        className="group relative flex min-h-[68px] w-full items-center justify-center gap-2.5 overflow-hidden whitespace-nowrap rounded-[34px] bg-gradient-to-b from-[#2E9E5B] to-green-deep px-4 font-display text-[1.25rem] font-extrabold text-white shadow-[0_14px_30px_-12px_rgb(14_94_56/0.75)] transition-transform duration-[var(--dur-fast)] hover:-translate-y-0.5 active:scale-[0.98]"
      >
        <span aria-hidden="true" className="absolute inset-x-6 top-0 h-px bg-white/40" />
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 4v11" />
          <path d="m7 11 5 5 5-5" />
          <path d="M5 20h14" />
        </svg>
        {label}
      </a>
      <StoreButtons className="flex flex-nowrap items-center justify-center gap-2" size="sm" />
    </div>
  );
}
