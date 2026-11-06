"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import PlanSelector from "@/components/payment/PlanSelector";
import StoreFallback from "@/components/payment/StoreFallback";
import Section from "@/components/ui/Section";
import { clearPendingPurchase } from "@/lib/analytics/pending-purchase";
import type { PlanId } from "@/lib/constants";
import { VIEW_EVENT } from "@/lib/funnel/events";
import { loadSession } from "@/lib/funnel/storage";
import { trackFunnelEvent } from "@/lib/funnel/track";
import { takeResumableDraft, type CheckoutDraft } from "@/lib/payment/checkout";
import { WEB_CHECKOUT_ENABLED } from "@/lib/payment/config";
import { CHECKOUT_COPY as C } from "@/lib/payment/copy";
import type { PlanPrices } from "@/lib/pricing";
import { CheckoutLoading } from "./CheckoutShell";

type CheckoutForm = (typeof import("./Checkout"))["default"];

type Props = {
  /** web_plans, read by the page on the server; null when they could not be read. */
  prices: PlanPrices | null;
  /** The plan an explicit `/payment?plan=` link asks for (validated by the page); undefined without one. */
  linkPlan?: PlanId;
  /** Back from Grow's cancel URL (`/payment?cancelled=1`). */
  cancelled?: boolean;
  /** The page's headings, at the top of the plans section. */
  children?: ReactNode;
};

const PLANS_TOP = "pt-6";

type Priced = Omit<Props, "prices"> & { prices: PlanPrices };

/**
 * Owns the buyer's plan choice and what comes after the plans; the flag decides which path, once.
 * Without prices no plan card or checkout is shown (no figure that did not come from web_plans):
 * a notice and the store fallback instead.
 */
export default function PaymentFlow({ prices, ...props }: Props) {
  usePaymentView(props.cancelled ?? false);
  if (!prices) return <PricesUnavailable {...props} />;
  return WEB_CHECKOUT_ENABLED ? <WebCheckoutFlow {...props} prices={prices} /> : <StoreFlow {...props} prices={prices} />;
}

/**
 * One payment_view per arrival at /payment (begin_checkout in the GTM tags). The funnel reaches this page with a
 * document load, so the questionnaire's own tracking never saw it. A return from Grow's cancel URL is not a new
 * arrival: nothing was charged, so the purchase that was pending is dropped instead. The ref keeps React's dev
 * double run of effects from counting twice.
 */
function usePaymentView(cancelled: boolean) {
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    if (cancelled) {
      clearPendingPurchase();
      return;
    }
    trackFunnelEvent(loadSession().id, VIEW_EVENT.payment);
  }, [cancelled]);
}

const NOTICE = "mt-6 rounded-field bg-blue-wash px-4 py-3 text-lead font-medium";

/** Back from Grow's cancel URL: nothing was charged. Shown whether or not the prices could be read. */
function CancelledNotice({ cancelled }: { cancelled: boolean }) {
  return cancelled ? (
    <p role="status" className={NOTICE}>
      {C.cancelled}
    </p>
  ) : null;
}

/**
 * The prices could not be read: no plan, no checkout. The cancelled notice still shows, and a stale
 * draft is still discarded (a resumable one is kept for when the prices are back).
 */
function PricesUnavailable({ linkPlan, cancelled = false, children }: Omit<Props, "prices">) {
  useEffect(() => {
    takeResumableDraft(linkPlan);
  }, [linkPlan]);
  return (
    <Section id="plans" labelledBy="payment-heading" className={`${PLANS_TOP} pb-0`}>
      {children}
      <CancelledNotice cancelled={cancelled} />
      <p role="status" className={NOTICE}>
        {C.pricesUnavailable}
      </p>
      <StoreFallback />
    </Section>
  );
}

/** Flag off (production until Task 9): the plans, then the store fallback ends the path. */
function StoreFlow({ prices, linkPlan, children }: Priced) {
  // With the flag off the plan buttons only jump to the store fallback; the selection is kept for the shared selector API.
  const [selectedPlan, setSelectedPlan] = useState<PlanId>(linkPlan ?? "annual");
  return (
    <Section id="plans" labelledBy="payment-heading" className={`${PLANS_TOP} pb-0`}>
      {children}
      <PlanSelector prices={prices} selected={selectedPlan} onSelect={setSelectedPlan} />
      <StoreFallback />
    </Section>
  );
}

/**
 * Flag on: a plan's button selects it and opens the checkout under the plans; a checkout draft
 * in sessionStorage (a reload, Grow's cancel URL) reopens it directly,
 * unless an explicit ?plan= link asks for another plan: the link wins and
 * that draft is discarded. Choosing a plan keeps ?plan= in step, so a reload
 * resumes the checkout the buyer was in.
 * The checkout is its own sunken section under the plans, as in the mockup.
 */
function WebCheckoutFlow({ prices, linkPlan, cancelled = false, children }: Priced) {
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
    const resumable = takeResumableDraft(linkPlan);
    if (!resumable) return;
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
    const checked = document.querySelector<HTMLElement>('#plans [aria-pressed="true"]');
    checked?.scrollIntoView({ block: "center" });
    checked?.focus();
  };

  const checkoutOpen = stage === "checkout";

  return (
    <>
      <Section id="plans" labelledBy="payment-heading" className={checkoutOpen ? PLANS_TOP : `${PLANS_TOP} pb-0`}>
        {children}
        <CancelledNotice cancelled={cancelled} />
        <PlanSelector
          prices={prices}
          selected={selectedPlan}
          onSelect={selectPlan}
          onContinue={checkoutOpen ? undefined : () => setStage("checkout")}
          checkoutOpen={checkoutOpen}
        />
      </Section>
      {checkoutOpen ? (
        CheckoutView ? (
          <CheckoutView plan={selectedPlan} prices={prices} initialDraft={draft} onChangePlan={changePlan} />
        ) : (
          <CheckoutLoading />
        )
      ) : null}
    </>
  );
}
