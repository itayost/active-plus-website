"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { refreshPlanPrices } from "@/app/payment/actions";
import Button from "@/components/ui/Button";
import { fieldClass, LINKISH } from "@/components/funnel/parts";
import { ChevronIcon, LockIcon } from "@/components/ui/icons";
import { PLANS, type PlanId } from "@/lib/constants";
import type { Answers } from "@/lib/funnel/types";
import { onRestoredFromCache, saveCheckoutDraft, startPayment, toWebPlan, type CheckoutStep, type StartError } from "@/lib/payment/checkout";
import { openGrowWallet, type WalletOutcome } from "@/lib/payment/grow-wallet";
import { CHECKOUT_COPY as C, gendered } from "@/lib/payment/copy";
import { formatLocal } from "@/lib/phone";
import { formatShekel, installmentAmount, type PlanPrice } from "@/lib/pricing";
import { loadBrowserSupabase } from "@/lib/supabase/lazy";
import { cn } from "@/lib/utils";
import { STEP_QUESTION } from "./CheckoutFields";
import StoreButtons from "./StoreButtons";

const INSTALLMENTS_ID = "checkout-installments";
const SUCCESS_PATH = "/payment/success";

type Props = {
  plan: PlanId;
  /** The plan's web_plans row: the total charged, sent as expectedTotal, and the installment ceiling. */
  price: PlanPrice;
  /** The "לחודש" figure, derived from the same row. */
  perMonth: number;
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

type PayError = StartError | "payment_failed" | "expired";
type Status = { kind: "idle" } | { kind: "redirecting" } | { kind: "wallet" } | { kind: "error"; error: PayError };

const WALLET_ERROR: Record<Exclude<WalletOutcome, "success" | "closed">, PayError> = {
  failed: "payment_failed",
  expired: "expired",
  error: "processor_error",
};

function errorText(error: PayError, gender: Answers["gender"]): string {
  const text = C.errors[error];
  return typeof text === "string" ? text : gendered(gender, text);
}

export default function CheckoutSummary({
  plan, price, perMonth, name, email, phone, gender, installments, onInstallments, onEdit, onSignedOut,
}: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  // Back from Grow through the back/forward cache: the page returns as it left, mid-redirect. Make the button usable again.
  useEffect(() => onRestoredFromCache(() => setStatus({ kind: "idle" })), []);
  const info = PLANS.find((p) => p.id === plan) ?? PLANS[0];
  const annual = plan === "annual";
  // A draft from before web_plans lowered the ceiling still opens: the count is held to today's ceiling.
  const count = annual ? Math.min(installments, price.maxInstallments) : 1;

  const busy = status.kind === "redirecting" || status.kind === "wallet";

  const pay = async () => {
    if (busy) return;
    setStatus({ kind: annual ? "wallet" : "redirecting" });
    const supabase = await loadBrowserSupabase();
    const result = supabase
      ? await startPayment(supabase, { plan: toWebPlan(plan), installments: count, fullName: name, email, expectedTotal: price.total })
      : ({ error: "network" } as const);
    if ("url" in result || "authCode" in result) {
      // Stored before paying: the success page reads the invoice email from the draft.
      saveCheckoutDraft({ plan, name, email, installments });
    }
    if ("url" in result) {
      window.location.assign(result.url);
      return;
    }
    if ("authCode" in result) {
      const outcome = await openGrowWallet(result.authCode, result.walletEnvironment);
      // The webhook activates the subscription; the success page waits to see it.
      if (outcome === "success") window.location.assign(SUCCESS_PATH);
      else if (outcome === "closed") setStatus({ kind: "idle" });
      else setStatus({ kind: "error", error: WALLET_ERROR[outcome] });
      return;
    }
    if (result.error === "signed_out") {
      setStatus({ kind: "idle" });
      onSignedOut();
      return;
    }
    setStatus({ kind: "error", error: result.error });
    if (result.error === "price_changed") {
      // Nothing was charged: drop the cached web_plans and re-render, so the summary shows the new price before a retry.
      await refreshPlanPrices().catch(() => undefined);
      router.refresh();
    }
  };

  const rows: Row[] = [
    { label: C.rows.plan, value: info.longName },
    { label: C.rows.price, value: `${formatShekel(perMonth)} ${info.priceSuffix}` },
    { label: C.rows.total, value: formatShekel(price.total), total: true },
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
              <bdi dir={ltr ? "ltr" : undefined} className={cn("min-w-0 [overflow-wrap:anywhere]", total ? "font-display text-[1.5rem] font-extrabold" : "font-medium")}>
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
              value={count}
              onChange={(event) => onInstallments(Number(event.target.value))}
              className={cn(fieldClass(false), "cursor-pointer appearance-none pe-[3.25rem]")}
            >
              {Array.from({ length: price.maxInstallments }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n === 1 ? C.singlePayment : C.installmentOption.replace("{n}", String(n))}
                </option>
              ))}
            </select>
            <ChevronIcon className="pointer-events-none absolute end-4 top-1/2 h-[22px] w-[22px] -translate-y-1/2 text-ink-soft" />
          </div>
          <p className="mt-2 text-ink-soft" aria-live="polite">{C.perInstallment.replace("{amount}", formatShekel(installmentAmount(price.total, count)))}</p>
        </div>
      ) : (
        <p className="mt-6 text-lead">{C.monthlyTerms.replace("{amount}", formatShekel(price.total))}</p>
      )}

      {status.kind === "error" ? (
        <div role="alert" className="mt-6 rounded-field bg-danger/10 px-4 py-3 font-medium text-danger">
          <p>{errorText(status.error, gender)}</p>
          {status.error === "already_subscribed" || status.error === "not_configured" ? (
            <StoreButtons />
          ) : null}
        </div>
      ) : null}

      <div className="mt-7 grid gap-3">
        <Button size="lg" className="w-full" onClick={() => void pay()} disabled={busy}>
          {status.kind === "redirecting" ? C.paying : status.kind === "wallet" ? C.openingWallet : C.pay}
        </Button>
        <p className="flex items-center justify-center gap-2 text-center text-ink-soft">
          <LockIcon className="h-5 w-5 shrink-0" />
          {C.secureNote}
        </p>
      </div>
    </div>
  );
}
