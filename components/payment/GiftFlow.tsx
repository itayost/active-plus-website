"use client";

import { useEffect, useState, type ReactNode } from "react";
import Button from "@/components/ui/Button";
import Section from "@/components/ui/Section";
import { CheckIcon, GiftIcon } from "@/components/ui/icons";
import { PLAN_INCLUDES } from "@/lib/constants";
import { createAppSignin, storedAppSignin } from "@/lib/payment/app-signin";
import { readPaymentGender } from "@/lib/payment/checkout";
import { gendered } from "@/lib/payment/copy";
import { claimGiftTrial, GIFT_COPY as G, type GiftError } from "@/lib/payment/gift";
import { tapHaptic } from "@/lib/haptics";
import { loadSupabaseSession } from "@/lib/supabase/lazy";
import type { Answers } from "@/lib/funnel/types";
import FirstWorkoutSteps from "./FirstWorkoutSteps";

type Props = {
  /** The page's headings (name, the plan picture), above the gift card. */
  children?: ReactNode;
  /** Dev preview only: open straight on the claimed screen. */
  previewClaimed?: boolean;
};

/**
 * The 7-day gift in place of the plans (owner, 2026-11-25): the same page and picture, one gift
 * card instead of two prices, then the same way to the app as after paying, with the one-time
 * code that opens the app signed in. A reload after claiming goes straight back to that screen.
 */
export default function GiftFlow({ children, previewClaimed = false }: Props) {
  const [stage, setStage] = useState<"offer" | "claiming" | "claimed">(previewClaimed ? "claimed" : "offer");
  const [error, setError] = useState<GiftError | null>(null);
  // The dev preview shows the claimed screen as it looks with a code (a dummy one; it opens nothing).
  const [signinCode, setSigninCode] = useState<string | null>(previewClaimed ? "preview-only-code-preview-only-code-0000000" : null);

  useEffect(() => {
    const kept = storedAppSignin();
    if (!kept) return;
    setSigninCode(kept.code);
    setStage("claimed");
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [stage]);

  const claim = async () => {
    tapHaptic();
    setError(null);
    setStage("claiming");
    const supabase = await loadSupabaseSession();
    if (!supabase) {
      setError("signed_out");
      setStage("offer");
      return;
    }
    const result = await claimGiftTrial(supabase);
    if (!result.ok) {
      setError(result.error);
      setStage("offer");
      return;
    }
    const signin = await createAppSignin(supabase).catch(() => null);
    setSigninCode(signin?.code ?? null);
    setStage("claimed");
  };

  if (stage === "claimed") return <GiftClaimed signinCode={signinCode} />;

  return (
    <Section id="plans" labelledBy="payment-heading" className="pt-6 pb-0">
      {children}
      <section
        data-testid="gift-offer"
        aria-labelledby="gift-name"
        className="mt-8 rounded-card border-2 border-green bg-surface p-[clamp(min(1.375rem,6.9vw),3vw,1.75rem)]"
      >
        <h2 id="gift-name" className="sr-only">
          {G.cta}
        </h2>
        <span className="mb-3 inline-flex items-center gap-1.5 rounded-pill bg-cta px-3 py-1 text-[13px] font-extrabold leading-snug text-white">
          <GiftIcon className="h-4 w-4" />
          {G.badge}
        </span>
        <p className="mb-0.5 font-display text-[38px] font-extrabold leading-tight">
          {G.amount} <span className="text-lead font-semibold">{G.suffix}</span>
        </p>
        <p className="text-base leading-normal">{G.terms}</p>
        <Button
          size="lg"
          className="mt-4 w-full"
          onClick={() => void claim()}
          track="pay:claim_gift"
          disabled={stage === "claiming"}
        >
          {stage === "claiming" ? G.claiming : G.cta}
        </Button>
        <p className="mt-3 flex items-center justify-center gap-2 font-bold text-green-lo">
          <CheckIcon className="h-5 w-5 shrink-0" />
          {G.noCard}
        </p>
        {error ? (
          <p role="alert" className="mt-3 rounded-field bg-blue-wash px-4 py-3 text-lead font-medium">
            {G.errors[error]}
          </p>
        ) : null}
      </section>

      <div className="mt-10">
        <h2 className="font-display text-h3 font-bold">{G.includesTitle}</h2>
        <ul className="mt-5 grid gap-4">
          {PLAN_INCLUDES.map((item) => (
            <li key={item} className="flex items-center gap-3 text-lead font-medium">
              <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-deep text-white">
                <CheckIcon className="h-[18px] w-[18px]" />
              </span>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}

/** Claimed: laid out like the purchase-success page, the gift in place of "paid". */
function GiftClaimed({ signinCode }: { signinCode: string | null }) {
  const [gender, setGender] = useState<Answers["gender"]>(undefined);
  useEffect(() => setGender(readPaymentGender()), []);
  const title = gender ? gendered(gender, G.claimed.title) : G.claimed.titleNeutral;
  return (
    <section aria-labelledby="gift-claimed-heading">
      <div className="rounded-b-[2rem] bg-gradient-to-b from-[#2E9E5B] to-green-deep text-white">
        <div className="gutter-x flex min-h-[17rem] flex-col items-center justify-end pb-10 pt-14 text-center">
          <span className="success-pop mb-4 inline-flex items-center gap-2 rounded-pill bg-white px-4 py-1.5 font-display text-[1rem] font-bold text-green-deep shadow-lift-2">
            <GiftIcon className="h-5 w-5" />
            {G.claimed.chip}
          </span>
          <h1 id="gift-claimed-heading" className="font-display text-[clamp(1.9rem,1.4rem+1.7vw,3rem)] font-extrabold leading-[1.1]">
            {title}
          </h1>
          <p className="mt-3 max-w-measure text-[1.15rem] font-medium text-white/90">{G.claimed.tagline}</p>
        </div>
      </div>
      <div className="gutter-x pb-10">
        <FirstWorkoutSteps signinCode={signinCode} />
      </div>
    </section>
  );
}
