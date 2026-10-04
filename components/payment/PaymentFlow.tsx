"use client";

import { useState } from "react";
import PlanSelector from "@/components/payment/PlanSelector";
import StoreFallback from "@/components/payment/StoreFallback";
import type { PlanId } from "@/lib/constants";
import { WEB_CHECKOUT_ENABLED } from "@/lib/payment/config";

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

  function handleContinue() {
    // Plan 3: advance to the checkout steps for `selectedPlan`.
  }

  return (
    <>
      <PlanSelector
        selected={selectedPlan}
        onSelect={setSelectedPlan}
        onContinue={WEB_CHECKOUT_ENABLED ? handleContinue : undefined}
      />
      {WEB_CHECKOUT_ENABLED ? null : <StoreFallback />}
    </>
  );
}
