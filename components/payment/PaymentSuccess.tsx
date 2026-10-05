"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import { CheckIcon } from "@/components/ui/icons";
import { STORE_ANDROID, STORE_IOS } from "@/lib/constants";
import type { Answers } from "@/lib/funnel/types";
import { clearCheckoutDraft, readCheckoutEmail, readPaymentGender, waitForAccess } from "@/lib/payment/checkout";
import { WEB_CHECKOUT_ENABLED } from "@/lib/payment/config";
import { CHECKOUT_COPY, gendered } from "@/lib/payment/copy";
import { loadBrowserSupabase } from "@/lib/supabase/lazy";

const S = CHECKOUT_COPY.success;

type State = "checking" | "active" | "pending";

/** Grow's success URL lands here. The webhook activates the subscription; this page only waits to see it. */
export default function PaymentSuccess() {
  const [state, setState] = useState<State>("checking");
  const [email, setEmail] = useState<string | null>(null);
  const [gender, setGender] = useState<Answers["gender"]>(undefined);

  useEffect(() => {
    let alive = true;
    setEmail(readCheckoutEmail());
    setGender(readPaymentGender());
    clearCheckoutDraft();
    void (async () => {
      const supabase = await loadBrowserSupabase();
      const session = supabase ? (await supabase.auth.getSession()).data.session : null;
      if (!supabase || !session) {
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
      if (alive) setState(result === "active" ? "active" : "pending");
    })();
    return () => {
      alive = false;
    };
  }, []);

  const title = gender ? gendered(gender, S.title) : S.titleNeutral;

  return (
    <div className="mx-auto max-w-[56.25rem] rounded-card bg-surface p-[clamp(1.25rem,3.5vw,2.5rem)] text-center shadow-lift-2">
      <span aria-hidden="true" className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-pill bg-green-deep text-white">
        <CheckIcon className="h-10 w-10" />
      </span>
      <h1 id="payment-success-heading" className="font-display text-[clamp(1.6rem,1.1rem+1.7vw,3.2rem)] font-black leading-[1.1]">{title}</h1>
      <p role="status" className="mx-auto mt-4 max-w-measure text-lead">
        <Message state={state} email={email} />
      </p>
      <ol className="mt-8 grid gap-4 text-start">
        {S.steps.map((step, i) => (
          <li key={step.title} className="grid grid-cols-[2.75rem_minmax(0,1fr)] items-start gap-4 rounded-tile bg-sunken p-5">
            <span aria-hidden="true" className="flex h-11 w-11 items-center justify-center rounded-pill bg-blue-deep font-display text-[1.25rem] font-black text-white">{i + 1}</span>
            <div>
              <strong className="block font-display text-[1.25rem] font-bold">{step.title}</strong>
              <p className="mt-1 text-ink-soft">{step.body}</p>
              {i === 0 ? (
                <div className="mt-4 flex flex-wrap gap-3">
                  <Button href={STORE_IOS} variant="outline">App Store</Button>
                  <Button href={STORE_ANDROID} variant="outline">Google Play</Button>
                </div>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
      {WEB_CHECKOUT_ENABLED ? (
        // Not prefetched: the account page is per-session, so a prefetch only costs a request.
        <Link href="/account/subscription" prefetch={false} className="mt-6 inline-flex min-h-12 items-center rounded-[10px] px-2 font-bold text-blue-deep underline underline-offset-4 hover:bg-blue-wash">
          {S.manage}
        </Link>
      ) : null}
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
