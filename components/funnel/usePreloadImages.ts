"use client";

import { getImageProps } from "next/image";
import { useEffect } from "react";
import { upcomingImages } from "@/lib/funnel/images";
import type { Answers, Step } from "@/lib/funnel/types";

/** Files already asked for in this page's life: each is fetched once. */
const warmed = new Set<string>();

type IdleWindow = Window & { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number; cancelIdleCallback?: (id: number) => void };

/**
 * Fetches (and decodes) the next screens' photos while the visitor reads the
 * current one, so the next screen opens with its photo already there.
 *
 * The URL comes from next/image's own getImageProps with the screen's `sizes`,
 * and a detached <img> with that srcset picks the same candidate the screen's
 * <img> will, so the screen hits the browser cache. Runs when the browser is
 * idle, after the current screen's own photos have had their turn; Save-Data
 * visitors are left alone.
 */
export function usePreloadImages(step: Step, answers: Answers, enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    if (connection?.saveData) return;

    const w = window as IdleWindow;
    const run = () => {
      for (const { src, sizes } of upcomingImages(step, answers)) {
        if (warmed.has(src)) continue;
        warmed.add(src);
        const { props } = getImageProps({ src, alt: "", fill: true, sizes });
        const img = new window.Image();
        img.decoding = "async";
        if (props.sizes) img.sizes = props.sizes;
        if (props.srcSet) img.srcset = props.srcSet;
        img.src = props.src;
        // Decoding ahead too, so the swap to the next screen paints the photo in the same frame.
        img.decode().catch(() => warmed.delete(src));
      }
    };
    if (w.requestIdleCallback) {
      const id = w.requestIdleCallback(run, { timeout: 600 });
      return () => w.cancelIdleCallback?.(id);
    }
    const id = window.setTimeout(run, 200);
    return () => window.clearTimeout(id);
  }, [step, answers, enabled]);
}
