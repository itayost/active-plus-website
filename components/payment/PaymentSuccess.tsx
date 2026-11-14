"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { LINKISH } from "@/components/ui/linkish";
import { CheckIcon } from "@/components/ui/icons";
import { takePendingPurchase } from "@/lib/analytics/pending-purchase";
import { purchaseEvent, pushTag } from "@/lib/analytics/tags";
import type { Answers } from "@/lib/funnel/types";
import { clearCheckoutDraft, readCheckoutDraft, readPaymentGender, waitForAccess } from "@/lib/payment/checkout";
import { PROGRAM_CARDS } from "@/lib/constants";
import { WEB_CHECKOUT_ENABLED } from "@/lib/payment/config";
import { CHECKOUT_COPY, gendered } from "@/lib/payment/copy";
import { loadSupabaseSession } from "@/lib/supabase/lazy";
import StoreButtons from "./StoreButtons";

const S = CHECKOUT_COPY.success;

type State = "checking" | "active" | "pending";

/** Grow's success URL lands here. The webhook activates the subscription; this page only waits to see it. */
export default function PaymentSuccess() {
  const [state, setState] = useState<State>("checking");
  const [email, setEmail] = useState<string | null>(null);
  const [gender, setGender] = useState<Answers["gender"]>(undefined);

  useEffect(() => {
    let alive = true;
    // The invoice email comes from the checkout draft, read once and then removed: nothing personal stays
    // in the tab (a second effect run finds nothing and keeps the first read).
    const saved = readCheckoutDraft()?.email;
    if (saved) setEmail(saved);
    setGender(readPaymentGender());
    clearCheckoutDraft();
    void (async () => {
      const supabase = await loadSupabaseSession();
      if (!supabase) {
        if (alive) setState("pending");
        return;
      }
      const result = await waitForAccess(
        async () => {
          const { data, error } = await supabase.functions.invoke("checkUserSubscription", { body: {} });
          return !error && (data as { hasAccess?: unknown } | null)?.hasAccess === true;
        },
        { stopped: () => !alive },
      );
      if (!alive) return;
      if (result === "active") {
        // Reported only once the server has the subscription active, and taken once: a reload reports nothing.
        // Still pending, it stays stored, so a reload that then finds the subscription active reports it.
        const purchase = takePendingPurchase();
        if (purchase) pushTag(purchaseEvent(purchase));
      }
      setState(result === "active" ? "active" : "pending");
    })();
    return () => {
      alive = false;
    };
  }, []);

  const title = gender ? gendered(gender, S.title) : S.titleNeutral;
  const hero = gender === "male" ? "/img/funnel/app/goal-male.webp" : "/img/funnel/app/goal-female-walk.webp";

  return (
    <div>
      {/* A welcome that fills the screen (owner, 2026-11-14): a photo of someone training, the greeting over it. */}
      <div className="relative isolate overflow-hidden rounded-b-[2rem] bg-green-deep text-white">
        <Image src={hero} alt="" fill priority sizes="(max-width: 560px) 100vw, 560px" className="-z-10 object-cover object-top opacity-60" />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-b from-black/10 via-green-deep/50 to-green-deep" />
        <div className="gutter-x flex min-h-[23rem] flex-col items-center justify-end pb-8 pt-16 text-center">
          <span aria-hidden="true" className="success-pop mb-5 flex h-20 w-20 items-center justify-center rounded-pill bg-white text-green-deep shadow-lift-2">
            <CheckIcon className="h-10 w-10" />
          </span>
          <h1 id="payment-success-heading" className="font-display text-[clamp(1.9rem,1.4rem+1.7vw,3.2rem)] font-extrabold leading-[1.1]">{title}</h1>
          <p className="mt-3 font-display text-[1.35rem] font-bold">{S.tagline}</p>
          <p role="status" className="mx-auto mt-3 max-w-measure text-[1.05rem] text-white/90">
            <Message state={state} email={email} />
          </p>
        </div>
      </div>

      <div className="gutter-x pb-10">
        <div className="-mt-6 rounded-tile bg-surface p-5 shadow-lift-2">
          <p className="font-display text-[1.3rem] font-extrabold">{S.nowTitle}</p>
          <p className="mt-1 text-ink-soft">{S.nowBody}</p>
          {/* The one action left: download the app (the plan is already on the account). */}
          <StoreButtons className="mt-4 grid gap-3" variant="primary" size="lg" />
        </div>

        <ol className="mt-6 grid gap-3 text-start">
          {S.steps.map((step, i) => (
            <li key={step.title} className="grid grid-cols-[2.75rem_minmax(0,1fr)] items-start gap-4 rounded-tile bg-sunken p-4">
              <span aria-hidden="true" className="flex h-11 w-11 items-center justify-center rounded-pill bg-blue-deep font-display text-[1.25rem] font-extrabold text-white">{i + 1}</span>
              <div>
                <strong className="block font-display text-[1.2rem] font-bold">{step.title}</strong>
                <p className="mt-1 text-ink-soft">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <h2 className="mt-10 font-display text-[1.5rem] font-extrabold">{S.insideTitle}</h2>
        <div className="mt-4 grid gap-4">
          {PROGRAM_CARDS.map((card) => (
            <div key={card.id} className="overflow-hidden rounded-tile bg-surface shadow-card">
              <div className="relative h-40">
                <Image src={card.image} alt={card.alt} fill sizes="(max-width: 560px) 100vw, 560px" className="object-cover" style={{ objectPosition: card.focus }} />
              </div>
              <div className="p-4">
                <strong className="block font-display text-[1.2rem] font-bold">{card.title}</strong>
                <p className="mt-1 text-ink-soft">{card.body}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-tile bg-green-wash p-5 text-center">
          <p className="font-display text-[1.25rem] font-extrabold text-green-deep">{S.closing}</p>
          <StoreButtons className="mt-4 grid gap-3" variant="primary" size="lg" />
        </div>

        {WEB_CHECKOUT_ENABLED ? (
          // Not prefetched: the account page is per-session, so a prefetch only costs a request.
          <div className="mt-6 text-center">
            <Link href="/account/subscription" prefetch={false} className={LINKISH}>
              {S.manage}
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}

/** The status line; the invoice address is isolated left to right inside the Hebrew sentence. */
function Message({ state, email }: { state: State; email: string | null }) {
  if (state === "checking") return <>{S.checking}</>;
  if (state === "pending") return <>{S.pending}</>;
  if (!email) return <>{S.receivedNoEmail}</>;
  const [before, after] = S.received.split("{email}");
  return (
    <>
      {before}
      <bdi dir="ltr">{email}</bdi>
      {after}
    </>
  );
}
