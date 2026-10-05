"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import { fieldClass, LINKISH } from "@/components/funnel/parts";
import { ChevronIcon, LockIcon } from "@/components/ui/icons";
import { PLANS, type PlanId } from "@/lib/constants";
import type { Answers } from "@/lib/funnel/types";
import { onRestoredFromCache, rememberCheckoutEmail, startPayment, toWebPlan, type CheckoutStep, type StartError } from "@/lib/payment/checkout";
import { CHECKOUT_COPY as C, gendered } from "@/lib/payment/copy";
import { formatLocal } from "@/lib/phone";
import { formatShekel, installmentAmount } from "@/lib/pricing";
import { loadBrowserSupabase } from "@/lib/supabase/lazy";
import { cn } from "@/lib/utils";
import { STEP_QUESTION } from "./CheckoutFields";
import StoreButtons from "./StoreButtons";

const INSTALLMENTS_ID = "checkout-installments";
const CONSENT_ID = "checkout-consent";
const CONSENT_LABEL_ID = "checkout-consent-label";
const CONSENT_HELP_ID = "checkout-consent-help";

type Props = {
  plan: PlanId;
  name: string;
  email: string;
  phone: string | null;
  gender: Answers["gender"];
  installments: number;
  onInstallments: (count: number) => void;
  onEdit: (step: CheckoutStep) => void;
  onSignedOut: () => void;
};

type Row = { label: string; value: string; edit?: CheckoutStep; total?: boolean; ltr?: boolean };

type Status = { kind: "idle" } | { kind: "redirecting" } | { kind: "error"; error: StartError };

function errorText(error: StartError, gender: Answers["gender"]): string {
  const text = C.errors[error];
  return typeof text === "string" ? text : gendered(gender, text);
}

export default function CheckoutSummary({ plan, name, email, phone, gender, installments, onInstallments, onEdit, onSignedOut }: Props) {
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  // Back from Grow through the back/forward cache: the page returns as it left, mid-redirect. Make the button usable again.
  useEffect(() => onRestoredFromCache(() => setStatus({ kind: "idle" })), []);
  const info = PLANS.find((p) => p.id === plan) ?? PLANS[0];
  const annual = plan === "annual";

  const pay = async () => {
    if (status.kind === "redirecting") return;
    setStatus({ kind: "redirecting" });
    const supabase = await loadBrowserSupabase();
    const result = supabase
      ? await startPayment(supabase, { plan: toWebPlan(plan), installments: annual ? installments : 1, fullName: name, email, tokenConsent: annual && consent })
      : ({ error: "network" } as const);
    if ("url" in result) {
      rememberCheckoutEmail(email);
      window.location.assign(result.url);
      return;
    }
    if (result.error === "signed_out") {
      setStatus({ kind: "idle" });
      onSignedOut();
      return;
    }
    setStatus({ kind: "error", error: result.error });
  };

  const rows: Row[] = [
    { label: C.rows.plan, value: info.longName },
    { label: C.rows.price, value: `${formatShekel(info.price)} ${info.priceSuffix}` },
    { label: C.rows.total, value: formatShekel(info.total), total: true },
    { label: C.rows.name, value: name, edit: "name" },
    { label: C.rows.email, value: email, edit: "email", ltr: true },
    ...(phone ? [{ label: C.rows.phone, value: formatLocal(phone), ltr: true }] : []),
  ];

  return (
    <div>
      <h3 className={STEP_QUESTION}>{C.summaryTitle}</h3>
      <dl className="mt-6 border-y border-hairline">
        {rows.map(({ label, value, edit, total, ltr }) => (
          <div
            key={label}
            className="grid min-h-16 grid-cols-[minmax(7rem,auto)_minmax(0,1fr)] items-center gap-x-4 gap-y-1 border-t border-hairline py-2 first:border-t-0 max-[520px]:grid-cols-1"
          >
            <dt className="text-ink-soft">{label}</dt>
            <dd className="flex items-center justify-between gap-4">
              <bdi dir={ltr ? "ltr" : undefined} className={cn("min-w-0 [overflow-wrap:anywhere]", total ? "font-display text-[1.5rem] font-black" : "font-medium")}>
                {value}
              </bdi>
              {edit ? (
                <button type="button" className={cn(LINKISH, "shrink-0")} onClick={() => onEdit(edit)} aria-label={`${C.edit} ${label}`}>
                  {C.edit}
                </button>
              ) : null}
            </dd>
          </div>
        ))}
      </dl>

      {annual ? (
        <div className="mt-6">
          <label htmlFor={INSTALLMENTS_ID} className="mb-2 block font-display text-lead font-bold">
            {C.rows.installments}
          </label>
          <div className="relative">
            <select
              id={INSTALLMENTS_ID}
              value={installments}
              onChange={(event) => onInstallments(Number(event.target.value))}
              className={cn(fieldClass(false), "cursor-pointer appearance-none pe-[3.25rem]")}
            >
              {Array.from({ length: info.maxInstallments }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n === 1 ? C.singlePayment : C.installmentOption.replace("{n}", String(n))}
                </option>
              ))}
            </select>
            <ChevronIcon className="pointer-events-none absolute end-4 top-1/2 h-[22px] w-[22px] -translate-y-1/2 text-ink-soft" />
          </div>
          <p className="mt-2 text-ink-soft" aria-live="polite">{C.perInstallment.replace("{amount}", formatShekel(installmentAmount(info.total, installments)))}</p>

          {/* One label for the box and its text: the whole row is the target (at least 48px tall). */}
          <label htmlFor={CONSENT_ID} className="mt-6 flex min-h-12 cursor-pointer items-start gap-3">
            <input
              id={CONSENT_ID}
              type="checkbox"
              checked={consent}
              onChange={(event) => setConsent(event.target.checked)}
              aria-labelledby={CONSENT_LABEL_ID}
              aria-describedby={CONSENT_HELP_ID}
              className="mt-0.5 h-7 w-7 shrink-0 cursor-pointer accent-blue-deep"
            />
            <span>
              <span id={CONSENT_LABEL_ID} className="block font-display font-bold">
                {C.consentLabel}
              </span>
              <span id={CONSENT_HELP_ID} className="mt-1 block text-ink-soft">
                {gendered(gender, C.consentHelp)}
              </span>
            </span>
          </label>
        </div>
      ) : (
        <p className="mt-6 text-lead">{C.monthlyTerms.replace("{amount}", formatShekel(info.price))}</p>
      )}

      {status.kind === "error" ? (
        <div role="alert" className="mt-6 rounded-field bg-burgundy-wash px-4 py-3 font-medium text-burgundy">
          <p>{errorText(status.error, gender)}</p>
          {status.error === "already_subscribed" || status.error === "not_configured" ? (
            <StoreButtons />
          ) : null}
        </div>
      ) : null}

      <div className="mt-7 grid gap-3">
        <Button size="lg" className="w-full" onClick={() => void pay()} disabled={status.kind === "redirecting"}>
          {status.kind === "redirecting" ? C.paying : C.pay}
        </Button>
        <p className="flex items-center justify-center gap-2 text-center text-ink-soft">
          <LockIcon className="h-5 w-5 shrink-0" />
          {C.secureNote}
        </p>
      </div>
    </div>
  );
}
