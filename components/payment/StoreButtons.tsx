"use client";

import type { ComponentProps } from "react";
import Button from "@/components/ui/Button";
import { pushTag, type Store } from "@/lib/analytics/tags";
import { STORE_ANDROID, STORE_IOS } from "@/lib/constants";

type ButtonProps = ComponentProps<typeof Button>;

type Props = {
  className?: string;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
};

/**
 * A tap on a store button is the site's conversion while the purchase runs in
 * the apps (web checkout off): store_click in the GTM tags. The store opens in
 * a new tab, so this page stays and the tags have time to send.
 */
const clicked = (store: Store) => () => pushTag({ event: "store_click", store });

/** The App Store and Google Play buttons, side by side (wrapping on a narrow screen). */
export default function StoreButtons({ className = "mt-4 flex flex-wrap gap-3", variant = "outline", size }: Props) {
  return (
    <div className={className}>
      <Button href={STORE_IOS} variant={variant} size={size} onClick={clicked("app_store")}>
        App Store
      </Button>
      <Button href={STORE_ANDROID} variant={variant} size={size} onClick={clicked("google_play")}>
        Google Play
      </Button>
    </div>
  );
}
