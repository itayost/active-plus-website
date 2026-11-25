"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import CallMeBack from "@/components/payment/CallMeBack";
import FirstWorkoutSteps from "@/components/payment/FirstWorkoutSteps";
import GiftFlow from "@/components/payment/GiftFlow";
import FullscreenColumn from "@/components/layout/FullscreenColumn";
import PlanSelector from "@/components/payment/PlanSelector";
import StoreFallback from "@/components/payment/StoreFallback";
import { CheckIcon } from "@/components/ui/icons";
import { loadSupabaseSession } from "@/lib/supabase/lazy";
import Section from "@/components/ui/Section";
import { clearPendingPurchase } from "@/lib/analytics/pending-purchase";
import type { PlanId } from "@/lib/constants";
import { VIEW_EVENT } from "@/lib/funnel/events";
import { paymentSessionId } from "@/lib/funnel/storage";
import { trackFunnelEvent } from "@/lib/funnel/track";
import { storedAppSignin } from "@/lib/payment/app-signin";
import { takeResumableDraft, type CheckoutDraft } from "@/lib/payment/checkout";
import { WEB_CHECKOUT_ENABLED } from "@/lib/payment/config";
import { GROW_APPLE_PAY_SDK_URL } from "@/lib/security/csp";
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
  /** The 7-day gift is on (owner, 2026-11-25): one gift card instead of the plans, no price. */
  gift?: boolean;
  /** Dev preview only: the gift's claimed screen. */
  previewGiftClaimed?: boolean;
};

const PLANS_TOP = "pt-6";

/** The history entry the checkout screen pushes, so the back button returns to the plans. */
const CHECKOUT_STATE = "activePlusCheckout";

type Priced = Omit<Props, "prices"> & { prices: PlanPrices };

/**
 * Owns the buyer's plan choice and what comes after the plans; the flag decides which path, once.
 * Without prices no plan card or checkout is shown (no figure that did not come from web_plans):
 * a notice and the store fallback instead.
 */
export default function PaymentFlow({ prices, gift = false, previewGiftClaimed = false, ...props }: Props) {
  usePaymentView(props.cancelled ?? false);
  const subscribed = useActiveSubscription();
  // A paying subscriber never sees the gift (owner, 2026-11-25: one went through the questionnaire and
  // was offered it). A gift already claimed in this tab is access too, so its own screen (with the app's
  // sign-in code) still answers first. The check is async: the gift shows until it says otherwise.
  // A former subscriber or a frontal trainee is never given the gift by the server, so they get the plans
  // (owner, 2026-11-25) instead of a gift button that ends in "not available".
  const giftOffered = useGiftOffered(gift && !previewGiftClaimed);
  const giftClaimedHere = useGiftClaimedHere(previewGiftClaimed);
  if (gift && (giftClaimedHere || (giftOffered && !subscribed))) return <GiftFlow previewClaimed={previewGiftClaimed} />;
  const plans = subscribed ? (
    <AlreadySubscribed />
  ) : !prices ? (
    <PricesUnavailable {...props} />
  ) : WEB_CHECKOUT_ENABLED ? (
    <WebCheckoutFlow {...props} prices={prices} />
  ) : (
    <StoreFlow {...props} prices={prices} />
  );
  // Off the gift page the page's own frame is missing (it renders the gift full-screen), so it is added here.
  if (!gift) return plans;
  return (
    <FullscreenColumn>
      <script src={GROW_APPLE_PAY_SDK_URL} async />
      {plans}
    </FullscreenColumn>
  );
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
    // Never loadSession(): it would mint and store a funnel session right after handOffToPayment cleared it.
    trackFunnelEvent(paymentSessionId(), VIEW_EVENT.payment);
  }, [cancelled]);
}

/** A gift already claimed in this tab (its app sign-in code is kept), read after hydration. */
function useGiftClaimedHere(preview: boolean): boolean {
  const [claimed, setClaimed] = useState(preview);
  useEffect(() => {
    if (storedAppSignin()) setClaimed(true);
  }, []);
  return claimed;
}

/**
 * Whether the server would give this visitor the gift (my_gift_trial_offer, user from the JWT). True
 * until it answers no: signed out, still checking or a failed check keep the gift page, as before.
 */
function useGiftOffered(ask: boolean): boolean {
  const [offered, setOffered] = useState(true);
  useEffect(() => {
    if (!ask) return;
    let alive = true;
    void (async () => {
      try {
        const supabase = await loadSupabaseSession();
        if (!supabase) return;
        const { data, error } = await supabase.rpc("my_gift_trial_offer");
        if (alive && !error && data === false) setOffered(false);
      } catch {
        // No answer: the gift stays.
      }
    })();
    return () => {
      alive = false;
    };
  }, [ask]);
  return offered;
}

const NOTICE = "mt-6 rounded-field bg-blue-wash px-4 py-3 text-lead font-medium";

/**
 * True once the signed-in visitor's subscription is known to be active (checkUserSubscription, as
 * the apps and the success page ask). Signed out, still checking or a failed check: false, the
 * plans as before.
 */
function useActiveSubscription(): boolean {
  const [active, setActive] = useState(false);
  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const supabase = await loadSupabaseSession();
        if (!supabase) return;
        const { data, error } = await supabase.functions.invoke("checkUserSubscription", { body: {} });
        if (alive && !error && (data as { hasAccess?: unknown } | null)?.hasAccess === true) setActive(true);
      } catch {
        // No answer: the plans stay.
      }
    })();
    return () => {
      alive = false;
    };
  }, []);
  return active;
}

/**
 * Already subscribed: nothing to buy and no prices (owner, 2026-11-16), only the app to download.
 * Laid out like the purchase-success page: a green welcome (no photo), then the one action, then the
 * three steps.
 */
function AlreadySubscribed() {
  return (
    <section id="plans" aria-labelledby="payment-subscribed-heading">
      {/* No photo (owner, 2026-11-16): a green welcome only. */}
      <div className="rounded-b-[2rem] bg-gradient-to-b from-[#2E9E5B] to-green-deep text-white">
        <div className="gutter-x flex min-h-[17rem] flex-col items-center justify-end pb-10 pt-14 text-center">
          <span className="success-pop mb-4 inline-flex items-center gap-2 rounded-pill bg-white px-4 py-1.5 font-display text-[1rem] font-bold text-green-deep shadow-lift-2">
            <CheckIcon className="h-5 w-5" aria-hidden="true" />
            {C.subscribed.chip}
          </span>
          <h1 id="payment-subscribed-heading" className="font-display text-[clamp(1.9rem,1.4rem+1.7vw,3rem)] font-extrabold leading-[1.1]">
            {C.subscribed.title}
          </h1>
          <p className="mt-3 max-w-measure text-[1.15rem] font-medium text-white/90">{C.subscribed.tagline}</p>
        </div>
      </div>

      <div className="gutter-x pb-10">
        <FirstWorkoutSteps />
      </div>
    </section>
  );
}

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
      <CallMeBack />
    </Section>
  );
}

/**
 * Flag on: a plan's button selects it and opens the checkout as its own screen, the plans gone
 * (owner, 2026-11-14: a page of its own, never a scroll down). The phone's back button and
 * "החלפת מסלול" return to the plans. A checkout draft in sessionStorage (a reload, Grow's cancel
 * URL) reopens the checkout directly, unless an explicit ?plan= link asks for another plan: the
 * link wins and that draft is discarded. Choosing a plan keeps ?plan= in step, so a reload
 * resumes the checkout the buyer was in.
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

  // The phone's back button on the checkout screen returns to the plans, as a page would.
  useEffect(() => {
    const onPop = () => setStage(window.history.state?.[CHECKOUT_STATE] ? "checkout" : "plans");
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // Each screen opens at its top.
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [stage]);

  const selectPlan = (plan: PlanId) => {
    setSelectedPlan(plan);
    // A link that named a plan now names this one: a reload must not discard the checkout for the old link.
    const url = new URL(window.location.href);
    if (!url.searchParams.has("plan")) return;
    url.searchParams.set("plan", plan);
    window.history.replaceState(window.history.state, "", url);
  };

  const openCheckout = () => {
    window.history.pushState({ ...window.history.state, [CHECKOUT_STATE]: true }, "", window.location.href);
    setStage("checkout");
  };

  const changePlan = () => {
    if (window.history.state?.[CHECKOUT_STATE]) {
      window.history.back();
      return;
    }
    setStage("plans");
  };

  if (stage === "checkout") {
    return (
      <>
        {cancelled ? (
          <div className="gutter-x pt-6">
            <CancelledNotice cancelled />
          </div>
        ) : null}
        {CheckoutView ? (
          <CheckoutView plan={selectedPlan} prices={prices} initialDraft={draft} onChangePlan={changePlan} />
        ) : (
          <CheckoutLoading />
        )}
      </>
    );
  }

  return (
    <Section id="plans" labelledBy="payment-heading" className={`${PLANS_TOP} pb-0`}>
      {children}
      <CancelledNotice cancelled={cancelled} />
      <PlanSelector prices={prices} selected={selectedPlan} onSelect={selectPlan} onContinue={openCheckout} />
      <CallMeBack />
    </Section>
  );
}
