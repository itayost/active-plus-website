"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import JourneySteps from "@/components/funnel/JourneySteps";
import Button from "@/components/ui/Button";
import { CheckIcon, ClockIcon, GiftIcon, MindIcon, MovementIcon, StrengthIcon } from "@/components/ui/icons";
import { readPlanInputs } from "@/lib/funnel/storage";
import { tapHaptic } from "@/lib/haptics";
import { downloadHref, openAppHref, storedAppSignin } from "@/lib/payment/app-signin";
import { readPaymentGender } from "@/lib/payment/checkout";
import { claimGiftAndDownload, GIFT_COPY as G, type GiftError } from "@/lib/payment/gift";
import { paymentPicture } from "./PaymentIncludes";

type Props = {
  /** Dev preview only: open on the screen a visitor sees on coming back from the store. */
  previewClaimed?: boolean;
};

const HIGHLIGHTS = [
  { icon: MovementIcon, text: G.highlights[0] },
  { icon: MindIcon, text: G.highlights[1] },
  { icon: StrengthIcon, text: G.highlights[2] },
  { icon: ClockIcon, text: G.highlights[3] },
] as const;

/**
 * The 7-day gift (owner, 2026-11-25): one premium screen that fits a phone, no price and no
 * payment anywhere. The gift button claims the 7 days and goes straight to the app's download,
 * carrying the one-time code that opens the app signed in. Back on the site later (an iPhone
 * after the App Store), the same screen offers to open the app.
 */
export default function GiftFlow({ previewClaimed = false }: Props) {
  const [stage, setStage] = useState<"offer" | "claiming" | "claimed">(previewClaimed ? "claimed" : "offer");
  const [error, setError] = useState<GiftError | null>(null);
  // The dev preview shows the back-from-store screen as it looks with a code (a dummy one; it opens nothing).
  const [signinCode, setSigninCode] = useState<string | null>(previewClaimed ? "preview-only-code-preview-only-code-0000000" : null);
  const [name, setName] = useState<string | null>(null);
  const [picture, setPicture] = useState(paymentPicture(undefined, undefined));

  useEffect(() => {
    const inputs = readPlanInputs();
    setName(inputs?.firstName ?? null);
    setPicture(paymentPicture(inputs?.level, readPaymentGender()));
    const kept = storedAppSignin();
    if (kept) {
      setSigninCode(kept.code);
      setStage("claimed");
    }
  }, []);

  const claim = async () => {
    tapHaptic();
    setError(null);
    setStage("claiming");
    const failed = await claimGiftAndDownload();
    if (failed) {
      setError(failed);
      setStage("offer");
    }
  };

  // The same page as the plan before it (owner, 2026-11-25: one brand from page to page): the mint
  // wash, the steps, the heading's green name, white pills, tinted tiles and the same big button.
  return (
    <div
      dir="rtl"
      className="flex min-h-[100dvh] justify-center"
      style={{ background: "linear-gradient(180deg, #E4F4EA 0%, #EEF6F8 38%, #F7F9FC 100%)" }}
    >
      <div className="gutter-x flex w-full max-w-[560px] flex-col pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(2rem,env(safe-area-inset-top))] md:shadow-lift-2">
        <JourneySteps current={stage === "claimed" ? 2 : 1} className="mb-5" gift />
        {stage === "claimed" ? (
          <Claimed signinCode={signinCode} />
        ) : (
          <>
            <h1 id="payment-heading" className="text-center font-display text-[clamp(1.875rem,1.5rem+1.4vw,2.375rem)] font-extrabold leading-[1.15] tracking-[-0.02em] text-ink">
              {name ? <span className="text-[#1F6B3D]">{name},</span> : null} {name ? G.headingLead : G.headingLeadPlain}{" "}
              <span className="whitespace-nowrap">{G.headingGift}</span>
            </h1>

            <p className="mx-auto mt-4 inline-flex w-fit items-center gap-2 whitespace-nowrap rounded-full bg-white/80 px-3.5 py-2 text-[0.9375rem] font-bold text-ink-soft shadow-[0_2px_10px_rgb(31_107_61/0.08)]">
              <GiftIcon className="h-5 w-5 text-[#C98A12]" />
              {G.lede}
            </p>

            <div className="mx-auto mt-4 w-[min(100%,236px)] overflow-hidden rounded-2xl shadow-[0_6px_18px_rgb(0_0_0/0.08)]">
              <div className="relative aspect-[27/22] w-full">
                <Image src={picture.image} alt={picture.alt} fill priority sizes="236px" className="object-cover" />
              </div>
            </div>

            {/* One quiet colour for what is inside (owner, 2026-11-25: too many colours made it hard to see
                what to tap): the gold button is the only colour that calls. */}
            <ul className="mx-auto mt-5 grid w-fit grid-cols-2 gap-x-6 gap-y-3">
              {HIGHLIGHTS.map(({ text }) => (
                <li key={text} className="flex items-center gap-2 whitespace-nowrap text-[1.0625rem] font-bold text-ink">
                  <CheckIcon className="h-5 w-5 shrink-0 text-[#1F6B3D]" />
                  {text}
                </li>
              ))}
            </ul>

            <div className="mt-auto pt-5">
              {/* Gold on the one decisive tap (owner, 2026-11-25): the gift stands out from the green
                  of the pages around it, with the same shape and size as their button. */}
              <button
                type="button"
                onClick={() => void claim()}
                disabled={stage === "claiming"}
                data-track="pay:claim_gift"
                className="gift-cta relative flex min-h-[72px] w-full items-center justify-center gap-3 overflow-hidden rounded-[36px] bg-[linear-gradient(180deg,#F8D46A_0%,#E9AE2E_100%)] px-5 font-display text-[1.5rem] font-extrabold text-[#173F27] shadow-[0_14px_30px_rgb(201_138_18/0.45),inset_0_1px_0_rgb(255_255_255/0.6)] ring-4 ring-[#F8D46A]/35 transition-transform duration-[var(--dur-fast)] hover:-translate-y-0.5 active:scale-[0.97] disabled:opacity-60"
              >
                <GiftIcon className="h-7 w-7 shrink-0" />
                {stage === "claiming" ? G.claiming : G.cta}
              </button>
              <p className="mt-3 text-center text-[0.9375rem] font-bold text-ink-soft">{G.underCta}</p>
              {error ? (
                <p role="alert" className="mt-3 rounded-2xl bg-white/80 px-4 py-3 text-center text-[1rem] font-medium">
                  {G.errors[error]}
                </p>
              ) : null}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/** Back from the store (or after the tap): open the app, signed in, straight to the workout. */
function Claimed({ signinCode }: { signinCode: string | null }) {
  return (
    <div className="flex flex-1 flex-col">
      <h1 className="font-display text-[clamp(1.875rem,1.5rem+1.4vw,2.375rem)] font-extrabold leading-[1.15] tracking-[-0.02em] text-ink">
        {G.claimed.title} <span className="text-[#1F6B3D]">{G.claimed.titleGift}</span>
      </h1>
      <p className="mx-auto mt-4 inline-flex w-fit items-center gap-2 rounded-full bg-white/80 px-3.5 py-2 text-[0.9375rem] font-bold text-ink-soft shadow-[0_2px_10px_rgb(31_107_61/0.08)]">
        <GiftIcon className="h-5 w-5 shrink-0 text-[#C98A12]" />
        {G.claimed.lede}
      </p>
      <div className="mt-auto pt-6">
        {signinCode ? (
          <Button href={openAppHref(signinCode)} fullPageLoad size="lg" className="min-h-[64px] w-full rounded-[32px] text-[1.25rem]" track="pay:open_app_gift">
            {G.claimed.open}
          </Button>
        ) : null}
        <a
          href={downloadHref(signinCode)}
          className="mt-3 flex min-h-[60px] w-full items-center justify-center rounded-[32px] border-2 border-green-deep bg-white/70 px-5 font-display text-[1.125rem] font-bold text-green-deep"
        >
          {G.claimed.download}
        </a>
      </div>
    </div>
  );
}
