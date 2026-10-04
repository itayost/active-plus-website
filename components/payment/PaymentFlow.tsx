"use client";

import { useState } from "react";
import PlanSelector from "@/components/payment/PlanSelector";
import StoreFallback from "@/components/payment/StoreFallback";
import type { PlanId } from "@/lib/constants";
import { WEB_CHECKOUT_ENABLED } from "@/lib/payment/config";

/** Flip when the plan-3 checkout component exists and is rendered by this flow. */
const HAS_CHECKOUT_COMPONENT = false;

type Props = {
  /** Plan preselected from `/payment?plan=`; validated by the page. */
  initialPlan?: PlanId;
};

/**
 * Owns the buyer's plan choice and what comes after the plans.
 *
 * Phase 1 (WEB_CHECKOUT_ENABLED false): no continue button. StoreFallback is
 * the single end of the path, directly under the plan selector, because the
 * purchase happens in the app stores.
 *
 * Plan 3: when the flag is on, render the checkout steps in place of the
 * fallback and pass `onContinue` to PlanSelector so "המשך לרכישה" returns
 * (PlanSelector already renders it whenever `onContinue` is provided). Keep
 * the state here, not in PlanSelector, so the checkout can read `selectedPlan`.
 */
export default function PaymentFlow({ initialPlan = "annual" }: Props) {
  const [selectedPlan, setSelectedPlan] = useState<PlanId>(initialPlan);

  /*
   * Extension point (plan 3): set to true only once a checkout component is
   * rendered below. Until then the store fallback always shows, even if
   * NEXT_PUBLIC_WEB_CHECKOUT is on, so a buyer never reaches a dead end.
   */
  const checkoutReady = WEB_CHECKOUT_ENABLED && HAS_CHECKOUT_COMPONENT;

  function handleContinue() {
    // Plan 3: advance to the checkout steps for `selectedPlan`.
  }

  return (
    <>
      <PlanSelector
        selected={selectedPlan}
        onSelect={setSelectedPlan}
        onContinue={checkoutReady ? handleContinue : undefined}
      />
      {checkoutReady ? null : <StoreFallback />}
    </>
  );
}
