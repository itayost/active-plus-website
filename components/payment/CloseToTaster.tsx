"use client";

import { useEffect, useState } from "react";
import { CloseIcon } from "@/components/ui/icons";
import { TASTER_PATH } from "@/lib/funnel/constants";
import { readPlanInputs } from "@/lib/funnel/storage";

/**
 * The plans' X (owner, 2026-11-15): someone who came from the questionnaire and is not
 * ready to pay goes on to the free first workout, and from it back to the offer.
 * Shown only in that tab (the plan answers handed over); a visitor from a link gets none.
 */
export default function CloseToTaster() {
  const [fromFunnel, setFromFunnel] = useState(false);
  useEffect(() => setFromFunnel(readPlanInputs() !== null), []);
  if (!fromFunnel) return null;
  return (
    <a
      href={TASTER_PATH}
      aria-label="סגירה"
      className="absolute left-2 top-[max(0.25rem,env(safe-area-inset-top))] flex h-[60px] w-[60px] items-center justify-center rounded-full text-ink-soft"
    >
      <CloseIcon className="h-7 w-7" />
    </a>
  );
}
