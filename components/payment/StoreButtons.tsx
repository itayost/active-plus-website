"use client";

import { pushTag, type Store } from "@/lib/analytics/tags";
import { STORE_ANDROID, STORE_IOS } from "@/lib/constants";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  /** Badge height: "sm" 42px (two side by side in a phone's card), "md" 48px, "lg" 56px; all past the 40px floor Apple and Google set. */
  size?: "sm" | "md" | "lg";
};

/**
 * A tap on a store badge is the site's conversion while the purchase runs in
 * the apps (web checkout off): store_click in the GTM tags. The store opens in
 * a new tab, so this page stays and the tags have time to send.
 */
const clicked = (store: Store) => () => pushTag({ event: "store_click", store });

/**
 * The official App Store and Google Play badges (owner, 2026-11-15: the real ones).
 * Files as Apple and Google publish them, in public/badges: Apple's SVG unchanged,
 * Google's PNG with only its transparent margin trimmed, so both stand the same height.
 * English badges, as Apple's Hebrew one could not be fetched and the two should match.
 */
const BADGES = [
  { store: "app_store", href: STORE_IOS, src: "/badges/app-store.svg", alt: "להורדה מ-App Store", ratio: 119.66407 / 40 },
  { store: "google_play", href: STORE_ANDROID, src: "/badges/google-play.png", alt: "להורדה מ-Google Play", ratio: 564 / 168 },
] as const;

const HEIGHT = { sm: 42, md: 48, lg: 56 } as const;

export default function StoreButtons({ className = "mt-4 flex flex-wrap gap-3", size = "md" }: Props) {
  const height = HEIGHT[size];
  return (
    <div className={cn("items-center", className)}>
      {BADGES.map((b) => (
        <a
          key={b.store}
          href={b.href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={clicked(b.store)}
          className="inline-flex rounded-[10px] transition-transform duration-[var(--dur-fast)] hover:-translate-y-0.5 active:scale-[0.97]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- the stores' own badge files, shown as published */}
          <img src={b.src} alt={`${b.alt} (נפתח בחלון חדש)`} width={Math.round(height * b.ratio)} height={height} style={{ height, width: "auto" }} />
        </a>
      ))}
    </div>
  );
}
