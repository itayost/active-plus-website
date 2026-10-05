"use client";

import { useEffect, useState, type ReactNode } from "react";
import Checkout from "@/components/payment/Checkout";
import PlanSelector from "@/components/payment/PlanSelector";
import StoreFallback from "@/components/payment/StoreFallback";
import Section from "@/components/ui/Section";
import type { PlanId } from "@/lib/constants";
import { clearCheckoutDraft, readCheckoutDraft, resumableDraft, type CheckoutDraft } from "@/lib/payment/checkout";
import { WEB_CHECKOUT_ENABLED } from "@/lib/payment/config";
import { CHECKOUT_COPY as C } from "@/lib/payment/copy";
import { cn } from "@/lib/utils";

type Props = {
  /** The plan an explicit `/payment?plan=` link asks for (validated by the page); undefined without one. */
  linkPlan?: PlanId;
  /** Back from Grow's cancel URL (`/payment?cancelled=1`). */
  cancelled?: boolean;
  /** The page's headings, at the top of the plans section. */
  children?: ReactNode;
};

/**
 * Owns the buyer's plan choice and what comes after the plans. Flag off
 * (production until Task 9): the store fallback ends the path. Flag on:
 * "המשך לרכישה" opens the checkout under the plans; a checkout draft in
 * sessionStorage (Otp's remount, Grow's cancel URL) reopens it directly,
 * unless an explicit ?plan= link asks for another plan: the link wins and
 * that draft is discarded. Choosing a plan keeps ?plan= in step, so a reload
 * resumes the checkout the buyer was in.
 * The checkout is its own sunken section under the plans, as in the mockup.
 */
export default function PaymentFlow({ linkPlan, cancelled = false, children }: Props) {
  const [selectedPlan, setSelectedPlan] = useState<PlanId>(linkPlan ?? "annual");
  const [stage, setStage] = useState<"plans" | "checkout">("plans");
  // The stored draft, read once here and handed to the checkout it reopens.
  const [draft, setDraft] = useState<CheckoutDraft | null>(null);

  useEffect(() => {
    if (!WEB_CHECKOUT_ENABLED) return;
    const stored = readCheckoutDraft();
    const resumable = resumableDraft(stored, linkPlan);
    if (!resumable) {
      if (stored) clearCheckoutDraft();
      return;
    }
    setDraft(resumable);
    setSelectedPlan(resumable.plan);
    setStage("checkout");
  }, [linkPlan]);

  const selectPlan = (plan: PlanId) => {
    setSelectedPlan(plan);
    // A link that named a plan now names this one: a reload must not discard the checkout for the old link.
    // Flag off there is no checkout or draft, so the live page keeps its URL exactly as before.
    if (!WEB_CHECKOUT_ENABLED) return;
    const url = new URL(window.location.href);
    if (!url.searchParams.has("plan")) return;
    url.searchParams.set("plan", plan);
    window.history.replaceState(null, "", url);
  };

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
          onSelect={selectPlan}
          onContinue={WEB_CHECKOUT_ENABLED && stage === "plans" ? () => setStage("checkout") : undefined}
        />
        {WEB_CHECKOUT_ENABLED ? null : <StoreFallback />}
      </Section>
      {checkoutOpen ? <Checkout plan={selectedPlan} initialDraft={draft} onChangePlan={changePlan} /> : null}
    </>
  );
}
