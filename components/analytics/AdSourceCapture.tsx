"use client";

import { useEffect } from "react";
import { rememberAdSource } from "@/lib/analytics/ad-source";

/**
 * Keeps the ad that brought the visitor (lib/analytics/ad-source.ts) from the
 * first page they land on, so a visit that starts on the home page and walks
 * to the questionnaire is still tied to its ad. Renders nothing.
 */
export default function AdSourceCapture() {
  useEffect(() => {
    rememberAdSource(window.location.search);
  }, []);
  return null;
}
