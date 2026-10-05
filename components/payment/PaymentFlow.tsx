"use client";

import { useEffect, useState, type ReactNode } from "react";
import PlanSelector from "@/components/payment/PlanSelector";
import StoreFallback from "@/components/payment/StoreFallback";
import Section from "@/components/ui/Section";
import type { PlanId } from "@/lib/constants";
import { clearCheckoutDraft, readCheckoutDraft, resumableDraft, type CheckoutDraft } from "@/lib/payment/checkout";
import { WEB_CHECKOUT_ENABLED } from "@/lib/payment/config";
import { CHECKOUT_COPY as C } from "@/lib/payment/copy";
import { CheckoutLoading } from "./CheckoutShell";

type CheckoutForm = (typeof import("./Checkout"))["default"];

type Props = {
  /** The plan an explicit `/payment?plan=` link asks for (validated by the page); undefined without one. */
  linkPlan?: PlanId;
  /** Back from Grow's cancel URL (`/payment?cancelled=1`). */
  cancelled?: boolean;
  /** The page's headings, at the top of the plans section. */
  children?: ReactNode;
};

const PLANS_TOP = "pt-[clamp(2.5rem,5vw,4.5rem)]";

/** Owns the buyer's plan choice and what comes after the plans; the flag decides which path, once. */
export default function PaymentFlow(props: Props) {
  return WEB_CHECKOUT_ENABLED ? <WebCheckoutFlow {...props} /> : <StoreFlow {...props} />;
}

/** Flag off (production until Task 9): the plans, then the store fallback ends the path. */
function StoreFlow({ linkPlan, children }: Props) {
  const [selectedPlan, setSelectedPlan] = useState<PlanId>(linkPlan ?? "annual");
  return (
    <Section id="plans" labelledBy="payment-heading" className={`${PLANS_TOP} pb-0`}>
      {children}
      <PlanSelector selected={selectedPlan} onSelect={setSelectedPlan} />
      <StoreFallback />
    </Section>
  );
}

/**
 * Flag on: "המשך לרכישה" opens the checkout under the plans; a checkout draft
 * in sessionStorage (Otp's remount, Grow's cancel URL) reopens it directly,
 * unless an explicit ?plan= link asks for another plan: the link wins and
 * that draft is discarded. Choosing a plan keeps ?plan= in step, so a reload
 * resumes the checkout the buyer was in.
 * The checkout is its own sunken section under the plans, as in the mockup.
 */
function WebCheckoutFlow({ linkPlan, cancelled = false, children }: Props) {
  const [selectedPlan, setSelectedPlan] = useState<PlanId>(linkPlan ?? "annual");
  const [stage, setStage] = useState<"plans" | "checkout">("plans");
  // The stored draft, read once here and handed to the checkout it reopens.
  const [draft, setDraft] = useState<CheckoutDraft | null>(null);
  // The checkout's code is not in the page's bundle: it is fetched once the page has loaded, and until it is here the
  // checkout shows its own loading shell. A plain import, not next/dynamic: a Suspense fallback holds for at least
  // 300ms, which would delay the checkout's identity load behind it.
  const [CheckoutView, setCheckoutView] = useState<CheckoutForm | null>(null);

  useEffect(() => {
    let alive = true;
    void import("./Checkout").then(
      (m) => alive && setCheckoutView(() => m.default),
      () => undefined,
    );
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
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

  const checkoutOpen = stage === "checkout";

  return (
    <>
      <Section id="plans" labelledBy="payment-heading" className={checkoutOpen ? PLANS_TOP : `${PLANS_TOP} pb-0`}>
        {children}
        {cancelled ? (
          <p role="status" className="mt-6 rounded-field bg-blue-wash px-4 py-3 text-lead font-medium">
            {C.cancelled}
          </p>
        ) : null}
        <PlanSelector selected={selectedPlan} onSelect={selectPlan} onContinue={checkoutOpen ? undefined : () => setStage("checkout")} />
      </Section>
      {checkoutOpen ? (
        CheckoutView ? <CheckoutView plan={selectedPlan} initialDraft={draft} onChangePlan={changePlan} /> : <CheckoutLoading />
      ) : null}
    </>
  );
}
