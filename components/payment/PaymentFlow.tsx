"use client";

import { useRef, useState } from "react";
import PlanSelector from "@/components/payment/PlanSelector";
import StoreFallback from "@/components/payment/StoreFallback";
import type { PlanId } from "@/lib/constants";
import { WEB_CHECKOUT_ENABLED } from "@/lib/payment/config";

/**
 * Owns the buyer's plan choice and what "המשך לרכישה" does.
 *
 * Phase 1 (WEB_CHECKOUT_ENABLED false): scroll to and focus StoreFallback.
 * Plan 3 extends this file: when the flag is on, `selectedPlan` feeds the
 * checkout steps that replace the fallback. Keep the state here, not in
 * PlanSelector, so the checkout can read it.
 */
export default function PaymentFlow() {
  const [selectedPlan, setSelectedPlan] = useState<PlanId>("annual");
  const fallbackRef = useRef<HTMLElement>(null);

  function handleContinue() {
    const node = fallbackRef.current;
    if (!node) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    node.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    node.focus({ preventScroll: true });
  }

  return (
    <>
      <PlanSelector selected={selectedPlan} onSelect={setSelectedPlan} onContinue={handleContinue} />
      {WEB_CHECKOUT_ENABLED ? null : <StoreFallback sectionRef={fallbackRef} />}
    </>
  );
}
