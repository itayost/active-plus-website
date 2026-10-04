"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ChangeEvent, type Ref } from "react";
import Button from "@/components/ui/Button";
import { ArrowIcon, CheckIcon, LockIcon } from "@/components/ui/icons";
import { OTP_LENGTH, RESEND_SECONDS } from "@/lib/funnel/constants";
import { COPY } from "@/lib/funnel/copy";
import { finishSignup } from "@/lib/funnel/finish";
import { sendCode, verifyCode, type VerifyResult } from "@/lib/funnel/signin";
import { handOffToPayment, loadSession } from "@/lib/funnel/storage";
import type { Answers } from "@/lib/funnel/types";
import { formatLocal, toE164 } from "@/lib/phone";
import { loadBrowserSupabase } from "@/lib/supabase/lazy";
import { cn } from "@/lib/utils";
import { ContinueButton, FieldError, StepIcon, StepTitle, STEP_TITLE_ID, Subtitle } from "./parts";

const CODE_ID = "funnel-otp";
const CODE_ERROR_ID = "funnel-otp-error";
const TICK_MS = 1000;
const PAYMENT = "/payment";

const C = COPY.otp;

type Phase = "enter" | "verifying" | "finishing" | "failed" | "existing";

const VERIFY_MESSAGE: Record<Exclude<VerifyResult, "ok">, string> = {
  invalid: C.wrongCode,
  rateLimited: C.rateLimited,
  error: C.verifyFailed,
};

function secondsLeft(until: number, now: number) {
  return Math.max(0, Math.ceil((until - now) / 1000));
}

/** One real input under six drawn boxes: paste and SMS autofill keep working. */
function CodeBoxes({ code, invalid, busy, onChange, inputRef }: {
  code: string;
  invalid: boolean;
  busy: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  inputRef: Ref<HTMLInputElement>;
}) {
  const next = Math.min(code.length, OTP_LENGTH - 1);
  return (
    <div className="group relative mt-7 w-fit max-w-full rounded-[18px] has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-[6px] has-[:focus-visible]:outline-blue-deep">
      <div
        dir="ltr"
        aria-hidden="true"
        className="grid justify-center gap-2"
        style={{ gridTemplateColumns: `repeat(${OTP_LENGTH}, minmax(0, 4rem))` }}
      >
        {Array.from({ length: OTP_LENGTH }, (_, i) => (
          <span
            key={i}
            className={cn(
              "flex h-[4.25rem] items-center justify-center rounded-field border-2 bg-surface font-display text-[2rem] font-bold text-ink",
              "transition-[border-color,box-shadow] duration-[var(--dur-fast)]",
              invalid
                ? "border-burgundy"
                : i === next
                  ? "border-hairline group-focus-within:border-blue-deep group-focus-within:ring-[3px] group-focus-within:ring-blue-wash"
                  : "border-hairline",
            )}
          >
            {code[i] ?? ""}
          </span>
        ))}
      </div>
      <input
        ref={inputRef}
        id={CODE_ID}
        name="otp"
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]*"
        maxLength={OTP_LENGTH}
        aria-label={C.codeLabel.replace("{n}", String(OTP_LENGTH))}
        aria-describedby={invalid ? CODE_ERROR_ID : undefined}
        aria-invalid={invalid ? true : undefined}
        readOnly={busy}
        value={code}
        onChange={onChange}
        className="absolute inset-0 h-full w-full cursor-text border-0 text-[16px] text-transparent caret-transparent opacity-0"
      />
    </div>
  );
}

const LINKISH =
  "inline-flex min-h-12 items-center rounded-[10px] px-2 font-bold text-blue-deep underline underline-offset-4 hover:bg-blue-wash";

type Props = {
  /** The number as the visitor typed it (validated before the code was sent). */
  phone: string;
  answers: Answers;
  onEditPhone: () => void;
  /** Signed in and merged: the funnel hides back and cancel. */
  onComplete: () => void;
};

/** otp: verify the SMS code, then merge the answers and hand off to /payment. */
export default function Otp({ phone, answers, onEditPhone, onComplete }: Props) {
  const router = useRouter();
  const e164 = toE164(phone);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [phase, setPhase] = useState<Phase>("enter");
  const [name, setName] = useState("");
  const [resendAt, setResendAt] = useState(() => Date.now() + RESEND_SECONDS * 1000);
  const [now, setNow] = useState(() => Date.now());
  const input = useRef<HTMLInputElement>(null);
  const busy = useRef(false);

  const waiting = secondsLeft(resendAt, now);
  useEffect(() => {
    if (waiting === 0) return;
    const id = window.setInterval(() => setNow(Date.now()), TICK_MS);
    return () => window.clearInterval(id);
  }, [waiting]);

  // The failure and welcome-back screens bring their own heading: move focus to it.
  useEffect(() => {
    if (phase === "failed" || phase === "existing") document.getElementById(STEP_TITLE_ID)?.focus({ preventScroll: true });
  }, [phase]);

  const finish = async () => {
    setPhase("finishing");
    const supabase = await loadBrowserSupabase();
    const result = supabase ? await finishSignup(supabase, loadSession().id, answers) : ({ kind: "error" } as const);
    if (result.kind === "error") return setPhase("failed");
    handOffToPayment(answers.gender);
    onComplete();
    if (result.kind === "existing") {
      setName(result.name);
      setPhase("existing");
      return;
    }
    router.push(PAYMENT); // the overlay stays up until /payment renders
  };

  const verify = async (token: string) => {
    setPhase("verifying");
    const supabase = await loadBrowserSupabase();
    const result = supabase ? await verifyCode(supabase, e164, token) : "error";
    if (result === "ok") return finish();
    setCode("");
    setError(VERIFY_MESSAGE[result]);
    setPhase("enter");
    input.current?.focus();
  };

  const onCode = (event: ChangeEvent<HTMLInputElement>) => {
    const digits = event.target.value.replace(/\D/g, "").slice(0, OTP_LENGTH);
    setCode(digits);
    if (digits) setError("");
    if (digits.length === OTP_LENGTH && phase === "enter") void verify(digits);
  };

  const resend = async () => {
    if (busy.current) return;
    busy.current = true;
    const supabase = await loadBrowserSupabase();
    const ok = supabase ? await sendCode(supabase, e164) : false;
    busy.current = false;
    if (!ok) return setError(COPY.register.sendFailed);
    setError("");
    setNow(Date.now());
    setResendAt(Date.now() + RESEND_SECONDS * 1000);
    input.current?.focus();
  };

  if (phase === "failed") {
    return (
      <div className="rounded-card bg-surface p-[clamp(1rem,3.5vw,2.5rem)] text-center shadow-lift-2">
        <StepTitle>{C.mergeFailed}</StepTitle>
        <div className="mx-auto max-w-[28rem]">
          <ContinueButton label={C.retry} onClick={() => void finish()} />
        </div>
      </div>
    );
  }

  if (phase === "existing") {
    return (
      <div className="rounded-card bg-surface p-[clamp(1rem,3.5vw,2.5rem)] text-center shadow-lift-2">
        <span aria-hidden="true" className="mx-auto mb-6 flex h-[84px] w-[84px] items-center justify-center rounded-pill bg-green-deep text-white">
          <CheckIcon className="h-[42px] w-[42px]" />
        </span>
        <StepTitle size="interstitial">{C.welcomeBack.replace("{name}", name)}</StepTitle>
        <div className="mx-auto mt-7 grid max-w-[28rem]">
          <Button href={PAYMENT} size="lg" className="w-full flex-wrap gap-y-1">
            {C.toPayment}
            <ArrowIcon className="h-5 w-5" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <StepIcon>
        <LockIcon />
      </StepIcon>
      <StepTitle>{C.title}</StepTitle>
      <Subtitle text={C.subtitle} />
      <p className="mt-1.5 font-display text-lead font-bold">
        {C.sentTo.split("{phone}")[0]}
        <bdi dir="ltr">{formatLocal(e164)}</bdi>
      </p>
      <CodeBoxes code={code} invalid={Boolean(error)} busy={phase !== "enter"} onChange={onCode} inputRef={input} />
      <FieldError id={CODE_ERROR_ID} text={error} />
      <div className="mt-5 flex min-h-12 flex-wrap items-center justify-between gap-2">
        {waiting > 0 ? (
          <span className="text-ink-soft">{C.resendIn.replace("{n}", String(waiting))}</span>
        ) : (
          <button type="button" className={LINKISH} onClick={() => void resend()}>
            {C.resend}
          </button>
        )}
        <button type="button" className={LINKISH} onClick={onEditPhone}>
          {C.editPhone}
        </button>
      </div>
      <div
        role="status"
        className={
          phase === "finishing"
            ? "fixed inset-0 z-[80] flex flex-col items-center justify-center gap-5 bg-sunken/95 gutter-x text-center font-display text-h3 font-bold text-ink"
            : "sr-only"
        }
      >
        {phase === "finishing" ? (
          <>
            <span
              aria-hidden="true"
              className="h-14 w-14 animate-[spin_900ms_linear_infinite] rounded-pill border-[5px] border-blue-wash border-t-blue-deep motion-reduce:animate-none motion-reduce:border-blue-deep"
            />
            <p>{C.finishing}</p>
          </>
        ) : null}
      </div>
    </>
  );
}
