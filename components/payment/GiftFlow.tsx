"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ClockIcon, GiftIcon, MindIcon, MovementIcon, StrengthIcon } from "@/components/ui/icons";
import { readPlanInputs } from "@/lib/funnel/storage";
import { tapHaptic } from "@/lib/haptics";
import { createAppSignin, downloadHref, openAppHref, storedAppSignin } from "@/lib/payment/app-signin";
import { readPaymentGender } from "@/lib/payment/checkout";
import { claimGiftTrial, GIFT_COPY as G, type GiftError } from "@/lib/payment/gift";
import { loadSupabaseSession } from "@/lib/supabase/lazy";
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
    // Straight to the download: the store opens, and the code rides along to the app.
    window.location.assign(downloadHref(signin?.code ?? null));
  };

  return (
    <main className="flex min-h-[100dvh] justify-center bg-[#06281a] text-white">
      <div className="relative flex min-h-[100dvh] w-full max-w-[560px] flex-col overflow-hidden bg-[radial-gradient(120%_60%_at_50%_0%,#17643f_0%,#0b3a25_45%,#06281a_100%)] px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-[max(0.5rem,env(safe-area-inset-top))]">
        <span aria-hidden="true" className="pointer-events-none absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-[#E7B23A]/20 blur-3xl" />

        <Link href="/" aria-label="פעילים+ – לדף הבית" className="relative mx-auto inline-flex min-h-[48px] items-center">
          <span className="font-display text-[min(1.5rem,28px)] font-extrabold leading-none tracking-tight">
            פעילים<span className="text-[#F2C14E]">+</span>
          </span>
        </Link>

        {stage === "claimed" ? (
          <Claimed signinCode={signinCode} />
        ) : (
          <>
            <div className="relative mt-1 flex flex-col items-center text-center">
              <h1 id="payment-heading" className="font-display text-[1.625rem] font-extrabold leading-[1.15]">
                {name ? `${name}, ${G.headingLead}` : G.headingLeadPlain}
                <span className="mt-1 flex items-center justify-center gap-2.5 text-[2.125rem] text-[#F2C14E]">
                  <GiftBadge />
                  {G.headingGift}
                </span>
              </h1>
              <p className="mt-1 text-[1.0625rem] text-white/85">{G.lede}</p>
            </div>

            <div className="relative mx-auto mt-3 w-[min(100%,300px)] overflow-hidden rounded-[22px] shadow-[0_18px_40px_-18px_rgb(0_0_0/0.7)] ring-1 ring-white/15">
              <div className="relative aspect-[27/22] w-full">
                <Image src={picture.image} alt={picture.alt} fill priority sizes="300px" className="object-cover" />
              </div>
            </div>

            <ul className="relative mt-3 grid grid-cols-2 gap-2">
              {HIGHLIGHTS.map(({ icon: Icon, text }) => (
                <li key={text} className="flex min-h-[46px] items-center gap-2 rounded-[14px] border border-white/12 bg-white/[0.07] px-2.5 text-[0.875rem] font-bold leading-tight">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F2C14E]/15 text-[#F2C14E]">
                    <Icon className="h-[18px] w-[18px]" />
                  </span>
                  {text}
                </li>
              ))}
            </ul>

            <div className="relative mt-auto pt-4">
              <button
                type="button"
                onClick={() => void claim()}
                disabled={stage === "claiming"}
                data-track="pay:claim_gift"
                className="flex min-h-[68px] w-full items-center justify-center gap-3 rounded-full bg-[linear-gradient(180deg,#F6CF62_0%,#E2A932_100%)] px-5 font-display text-[1.375rem] font-extrabold text-[#0b3a25] shadow-[0_14px_30px_-10px_rgb(226_169_50/0.7),inset_0_1px_0_rgb(255_255_255/0.6)] transition-transform duration-[var(--dur-fast)] active:scale-[0.98] disabled:opacity-70"
              >
                <GiftIcon className="h-7 w-7 shrink-0" />
                {stage === "claiming" ? G.claiming : G.cta}
              </button>
              <p className="mt-2.5 text-center text-[0.9375rem] font-medium text-white/75">{G.underCta}</p>
              {error ? (
                <p role="alert" className="mt-3 rounded-[14px] bg-white/10 px-4 py-3 text-center text-[1rem] font-medium">
                  {G.errors[error]}
                </p>
              ) : null}
            </div>
          </>
        )}
      </div>
    </main>
  );
}

/** The gift box in a gold medallion, the screen's mark. */
function GiftBadge({ large = false }: { large?: boolean }) {
  const size = large ? "h-24 w-24" : "h-11 w-11";
  const icon = large ? "h-12 w-12" : "h-6 w-6";
  return (
    <span className={`flex ${size} items-center justify-center rounded-full bg-[linear-gradient(160deg,#F8D777_0%,#D99A23_100%)] text-[#0b3a25] shadow-[0_0_0_5px_rgb(242_193_78/0.15),0_10px_24px_-8px_rgb(226_169_50/0.6)]`}>
      <GiftIcon className={icon} />
    </span>
  );
}

/** Back from the store (or after the tap): open the app, signed in, straight to the workout. */
function Claimed({ signinCode }: { signinCode: string | null }) {
  return (
    <div className="relative flex flex-1 flex-col items-center pt-8 text-center">
      <GiftBadge large />
      <h1 className="mt-5 font-display text-[2rem] font-extrabold leading-[1.15]">
        {G.claimed.title}
        <span className="block text-[#F2C14E]">{G.claimed.titleGift}</span>
      </h1>
      <p className="mt-2 max-w-[22rem] text-[1.0625rem] text-white/85">{G.claimed.lede}</p>
      <div className="mt-auto w-full pt-8">
        {signinCode ? (
          <a
            href={openAppHref(signinCode)}
            className="flex min-h-[68px] w-full items-center justify-center rounded-full bg-[linear-gradient(180deg,#F6CF62_0%,#E2A932_100%)] px-5 font-display text-[1.375rem] font-extrabold text-[#0b3a25] shadow-[0_14px_30px_-10px_rgb(226_169_50/0.7)]"
          >
            {G.claimed.open}
          </a>
        ) : null}
        <a
          href={downloadHref(signinCode)}
          className="mt-3 flex min-h-[60px] w-full items-center justify-center rounded-full border-2 border-white/40 px-5 font-display text-[1.125rem] font-bold text-white"
        >
          {G.claimed.download}
        </a>
      </div>
    </div>
  );
}
