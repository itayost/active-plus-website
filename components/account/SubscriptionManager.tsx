"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Button from "@/components/ui/Button";
import PhoneNumber from "@/components/ui/PhoneNumber";
import { CONTACT_PHONE, CONTACT_PHONE_TEL } from "@/lib/constants";
import {
  APPLE_MANAGE_URL, cancelWebSubscription, chargeLine, formatIsraelDate, GOOGLE_MANAGE_URL, loadSubscription, manageAction,
  type SubscriptionInfo,
} from "@/lib/payment/account";
import { ACCOUNT_COPY as A } from "@/lib/payment/copy";
import { loadBrowserSupabase } from "@/lib/supabase/lazy";
import PhoneSignIn from "./PhoneSignIn";

type Notice = "cancelled" | "failed" | null;
type View =
  | { kind: "loading" } | { kind: "signedOut" } | { kind: "none" } | { kind: "error" }
  | { kind: "ready"; sub: SubscriptionInfo; confirming: boolean; cancelling: boolean; notice: Notice };

/** Where focus goes after a change the visitor caused: the element that now says what happened. */
const FOCUS = {
  plan: "subscription-plan",
  confirm: "cancel-confirm",
  notice: "subscription-notice",
  none: "subscription-none",
  error: "subscription-error",
} as const;

const TEXT_LINK = "inline-flex min-h-12 items-center font-bold underline underline-offset-4";

function OfficePhone() {
  return (
    <a href={`tel:${CONTACT_PHONE_TEL}`} dir="ltr" className={`${TEXT_LINK} text-green-deep`}>
      <PhoneNumber value={CONTACT_PHONE} />
    </a>
  );
}

export default function SubscriptionManager() {
  const [view, setView] = useState<View>({ kind: "loading" });
  const focusNext = useRef<string | null>(null);
  // False once unmounted: a load or cancel that resolves later must not act.
  const alive = useRef(true);

  const show = useCallback((next: View, focusId: string | null = null) => {
    if (!alive.current) return;
    focusNext.current = focusId;
    setView(next);
  }, []);

  useEffect(() => {
    const id = focusNext.current;
    if (!id) return;
    focusNext.current = null;
    document.getElementById(id)?.focus();
  }, [view]);

  /** `moveFocus`: the visitor asked for this (sign-in, retry), so focus follows the result. The first load leaves focus alone. */
  const load = useCallback(async (moveFocus: boolean) => {
    show({ kind: "loading" });
    const supabase = await loadBrowserSupabase();
    const session = supabase ? (await supabase.auth.getSession()).data.session : null;
    if (!supabase || !session) return show({ kind: "signedOut" });
    const sub = await loadSubscription(supabase);
    const focusIf = (id: string) => (moveFocus ? id : null);
    if (sub === "error") return show({ kind: "error" }, focusIf(FOCUS.error));
    if (!sub) return show({ kind: "none" }, focusIf(FOCUS.none));
    show({ kind: "ready", sub, confirming: false, cancelling: false, notice: null }, focusIf(FOCUS.plan));
  }, [show]);

  useEffect(() => {
    alive.current = true;
    void load(false);
    return () => {
      alive.current = false;
    };
  }, [load]);

  const cancel = async (sub: SubscriptionInfo) => {
    show({ kind: "ready", sub, confirming: true, cancelling: true, notice: null });
    const supabase = await loadBrowserSupabase();
    const result = supabase ? await cancelWebSubscription(supabase) : "error";
    // Expired meanwhile: the page shows what is there now.
    if (result === "not_found") return void load(true);
    const done = result === "cancelled" || result === "already_cancelled";
    show(
      done
        ? { kind: "ready", sub: { ...sub, autoRenew: false }, confirming: false, cancelling: false, notice: "cancelled" }
        : { kind: "ready", sub, confirming: false, cancelling: false, notice: "failed" },
      FOCUS.notice,
    );
  };

  if (view.kind === "loading") return <p role="status" className="text-lead">{A.loading}</p>;
  if (view.kind === "signedOut") {
    return (
      <div>
        <p className="mb-6 text-lead">{A.signedOut}</p>
        <PhoneSignIn onSignedIn={() => void load(true)} />
      </div>
    );
  }
  if (view.kind === "none") {
    return <p id={FOCUS.none} tabIndex={-1} className="text-lead outline-none">{A.none}</p>;
  }
  if (view.kind === "error") {
    return (
      <div role="alert">
        <p id={FOCUS.error} tabIndex={-1} className="text-lead outline-none">{A.error}</p>
        <Button className="mt-4" onClick={() => void load(true)}>{A.retry}</Button>
      </div>
    );
  }

  const { sub, confirming, cancelling, notice } = view;
  const action = manageAction(sub);
  // Access ends on expiresAt; a renewing monthly's line shows the charge day instead.
  const date = formatIsraelDate(sub.expiresAt);
  const line = chargeLine(sub);
  return (
    <div className="grid gap-5">
      <h2 id={FOCUS.plan} tabIndex={-1} className="font-display text-h3 font-bold outline-none">{A.plans[sub.planType] ?? sub.planType}</h2>
      {line.text === "cancelled" && !notice ? (
        <p className="text-lead">{A.cancelled.replace("{date}", date)}</p>
      ) : (
        <p className="text-lead">{(line.text === "nextCharge" ? A.nextCharge : A.activeUntil).replace("{date}", formatIsraelDate(line.date))}</p>
      )}
      {notice === "cancelled" ? (
        <p id={FOCUS.notice} tabIndex={-1} role="status" className="rounded-field bg-green-wash px-4 py-3 text-lead font-medium outline-none">
          {A.cancelled.replace("{date}", date)}
        </p>
      ) : null}
      {notice === "failed" ? (
        <div id={FOCUS.notice} tabIndex={-1} role="alert" className="rounded-field bg-burgundy-wash px-4 py-3 text-lead font-medium text-burgundy outline-none">
          <p>{A.cancelFailed}</p>
          <OfficePhone />
        </div>
      ) : null}
      {action === "annual" ? <p className="text-lead">{A.annualNote}</p> : null}
      {action === "apple" ? (
        <p className="text-lead">
          {A.apple}{" "}
          <a className={`${TEXT_LINK} text-blue-deep`} href={APPLE_MANAGE_URL}>{A.appleLink}</a>
        </p>
      ) : null}
      {action === "google" ? (
        <p className="text-lead">
          {A.google}{" "}
          <a className={`${TEXT_LINK} text-blue-deep`} href={GOOGLE_MANAGE_URL}>{A.googleLink}</a>
        </p>
      ) : null}
      {action === "manual" ? (
        <p className="text-lead">
          {A.manual} <OfficePhone />
        </p>
      ) : null}
      {action === "cancel" && !confirming ? (
        <div>
          <Button variant="outline" size="lg" onClick={() => show({ ...view, confirming: true, notice: null }, FOCUS.confirm)}>
            {A.cancel}
          </Button>
        </div>
      ) : null}
      {action === "cancel" && confirming ? (
        <section aria-labelledby={FOCUS.confirm} aria-busy={cancelling || undefined} className="rounded-card border-2 border-burgundy p-5">
          <h2 id={FOCUS.confirm} tabIndex={-1} className="font-display text-h3 font-bold outline-none">{A.confirmTitle}</h2>
          <p className="mt-2 text-lead">{A.confirmBody.replace("{date}", date)}</p>
          {/* Disabled while the request runs, labels kept: a second tap can never send a second cancel. */}
          <div className="mt-5 flex flex-wrap gap-3">
            <Button size="lg" disabled={cancelling} onClick={() => void cancel(sub)}>{A.confirmYes}</Button>
            <Button variant="outline" size="lg" disabled={cancelling} onClick={() => show({ ...view, confirming: false }, FOCUS.plan)}>
              {A.confirmNo}
            </Button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
