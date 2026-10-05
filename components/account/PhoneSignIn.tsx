"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { PhoneStep } from "@/components/funnel/Register";
import { ContinueButton, FieldError, fieldClass, LINKISH, LINKISH_DISABLED } from "@/components/funnel/parts";
import { useAlive } from "@/components/ui/useAlive";
import { OTP_LENGTH } from "@/lib/funnel/constants";
import { COPY } from "@/lib/funnel/copy";
import { codeDigits, VERIFY_MESSAGE, verifyCode } from "@/lib/funnel/signin";
import { readPaymentGender } from "@/lib/payment/checkout";
import { ACCOUNT_COPY as A } from "@/lib/payment/copy";
import { toE164 } from "@/lib/phone";
import { loadBrowserSupabase } from "@/lib/supabase/lazy";
import { cn } from "@/lib/utils";

const CODE_ID = "account-code";
const CODE_HINT_ID = "account-code-hint";
const CODE_ERROR_ID = "account-code-error";

/** Typing the number, or entering the code sent to it. The number stays, so "ערוך מספר" finds it filled in. */
type Step = { kind: "phone" | "sent"; phone: string };

/**
 * Sign-in for the subscription page: the funnel's phone step sends the code
 * (existing accounts only: shouldCreateUser is off, so an unknown number gets
 * no auth user and no SMS), this form verifies it. Known or unknown, the
 * visitor sees the same code screen and hint, and a wrong code reads the
 * same, so the page never tells whether a number has an account. No
 * questionnaire merge: an account page must never create or change a profile.
 */
export default function PhoneSignIn({ onSignedIn }: { onSignedIn: () => void }) {
  const [step, setStep] = useState<Step>({ kind: "phone", phone: "" });
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  // Only the placeholder is gendered; the questionnaire saved the visitor's choice in this tab.
  const [gender] = useState(() => readPaymentGender());
  const input = useRef<HTMLInputElement>(null);
  // False once unmounted: a verify that resolves later must not act.
  const alive = useAlive();

  // The code field takes focus as soon as the code is sent: the phone form it replaces is gone.
  useEffect(() => {
    if (step.kind === "sent") input.current?.focus();
  }, [step.kind]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy || step.kind !== "sent") return;
    setBusy(true);
    const supabase = await loadBrowserSupabase();
    const result = supabase ? await verifyCode(supabase, toE164(step.phone), code) : "error";
    if (!alive.current) return;
    setBusy(false);
    if (result === "ok") return onSignedIn();
    setError(VERIFY_MESSAGE[result]);
    input.current?.focus();
  };

  const editPhone = () => {
    setStep({ kind: "phone", phone: step.phone });
    setCode("");
    setError("");
  };

  if (step.kind === "phone") {
    return (
      <PhoneStep
        gender={gender}
        initialPhone={step.phone}
        onSent={(sent) => setStep({ kind: "sent", phone: sent })}
        onBusy={setBusy}
        existingOnly
      />
    );
  }
  return (
    <form noValidate onSubmit={submit} aria-busy={busy || undefined}>
      <label htmlFor={CODE_ID} className="mb-2 block font-display font-bold">{A.codeLabel}</label>
      <p id={CODE_HINT_ID} className="mb-3 text-ink-soft">{A.codeHint}</p>
      <input
        ref={input}
        id={CODE_ID}
        name="otp"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]*"
        maxLength={OTP_LENGTH}
        dir="ltr"
        value={code}
        readOnly={busy}
        aria-describedby={error ? `${CODE_HINT_ID} ${CODE_ERROR_ID}` : CODE_HINT_ID}
        aria-invalid={error ? true : undefined}
        onChange={(event) => {
          setCode(codeDigits(event.target.value));
          if (error) setError("");
        }}
        className={fieldClass(Boolean(error))}
      />
      <FieldError id={CODE_ERROR_ID} text={error} />
      {/* Disabled while checking, label kept: the press visibly took, and a second tap cannot verify twice. */}
      <ContinueButton type="submit" label={A.verify} disabled={busy} />
      <button type="button" className={cn("mt-4", LINKISH, LINKISH_DISABLED)} disabled={busy} onClick={editPhone}>
        {COPY.otp.editPhone}
      </button>
    </form>
  );
}
