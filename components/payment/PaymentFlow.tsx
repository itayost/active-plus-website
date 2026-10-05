"use client";

import { useEffect, useState, type ReactNode } from "react";
import Checkout from "@/components/payment/Checkout";
import PlanSelector from "@/components/payment/PlanSelector";
import StoreFallback from "@/components/payment/StoreFallback";
import Section from "@/components/ui/Section";
import type { PlanId } from "@/lib/constants";
import { readCheckoutDraft } from "@/lib/payment/checkout";
import { WEB_CHECKOUT_ENABLED } from "@/lib/payment/config";
import { CHECKOUT_COPY as C } from "@/lib/payment/copy";
import { cn } from "@/lib/utils";

type Props = {
  /** Plan preselected from `/payment?plan=`; validated by the page. */
  initialPlan?: PlanId;
  /** Back from Grow's cancel URL (`/payment?cancelled=1`). */
  cancelled?: boolean;
  /** The page's headings, at the top of the plans section. */
  children?: ReactNode;
};

/**
 * Owns the buyer's plan choice and what comes after the plans. Flag off
 * (production until Task 9): the store fallback ends the path. Flag on:
 * "המשך לרכישה" opens the checkout under the plans; a checkout draft in
 * sessionStorage (Otp's remount, Grow's cancel URL) reopens it directly.
 * The checkout is its own sunken section under the plans, as in the mockup.
 */
export default function PaymentFlow({ initialPlan = "annual", cancelled = false, children }: Props) {
  const [selectedPlan, setSelectedPlan] = useState<PlanId>(initialPlan);
  const [stage, setStage] = useState<"plans" | "checkout">("plans");

  useEffect(() => {
    if (!WEB_CHECKOUT_ENABLED) return;
    const draft = readCheckoutDraft();
    if (!draft) return;
    setSelectedPlan(draft.plan);
    setStage("checkout");
  }, []);

  const changePlan = () => {
    const checked = document.querySelector<HTMLInputElement>('input[name="plan"]:checked');
    checked?.scrollIntoView({ block: "center" });
    checked?.focus();
  };

  const checkoutOpen = WEB_CHECKOUT_ENABLED && stage === "checkout";

  return (
    <>
      <Section
        id="plans"
        labelledBy="payment-heading"
        className={cn("pt-[clamp(2.5rem,5vw,4.5rem)]", checkoutOpen ? "" : "pb-0")}
      >
        {children}
        {WEB_CHECKOUT_ENABLED && cancelled ? (
          <p role="status" className="mt-6 rounded-field bg-blue-wash px-4 py-3 text-lead font-medium">
            {C.cancelled}
          </p>
        ) : null}
        <PlanSelector
          selected={selectedPlan}
          onSelect={setSelectedPlan}
          onContinue={WEB_CHECKOUT_ENABLED && stage === "plans" ? () => setStage("checkout") : undefined}
        />
        {WEB_CHECKOUT_ENABLED ? null : <StoreFallback />}
      </Section>
      {checkoutOpen ? <Checkout plan={selectedPlan} onChangePlan={changePlan} /> : null}
    </>
  );
}
