"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { LockIcon, PhoneIcon } from "@/components/ui/icons";
import { COPY, g } from "@/lib/funnel/copy";
import type { RegisterView } from "@/lib/funnel/machine";
import { sendCode } from "@/lib/funnel/signin";
import type { Answers } from "@/lib/funnel/types";
import { isIsraeliMobile, toE164 } from "@/lib/phone";
import { loadBrowserSupabase } from "@/lib/supabase/lazy";
import { ContinueButton, FieldError, StepIcon, StepTitle, STEP_TITLE_ID, Subtitle, fieldClass } from "./parts";

const MIN_NAME = 2;
const NAME_ID = "funnel-name";
const NAME_ERROR_ID = "funnel-name-error";
const PHONE_ID = "funnel-phone";
const PHONE_SECURE_ID = "funnel-phone-secure";
const PHONE_ERROR_ID = "funnel-phone-error";

const C = COPY.register;

type NameProps = {
  gender: Answers["gender"];
  name: string;
  onChange: (name: string) => void;
  onSubmit: (name: string) => void;
};

function NameStep({ gender, name, onChange, onSubmit }: NameProps) {
  const [error, setError] = useState("");
  const input = useRef<HTMLInputElement>(null);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length < MIN_NAME) {
      setError(C.nameError);
      input.current?.focus();
      return;
    }
    onSubmit(trimmed);
  };

  return (
    <form noValidate onSubmit={submit}>
      <StepTitle>{g(gender, C.nameTitle.fem, C.nameTitle.masc)}</StepTitle>
      <div className="mt-7">
        <input
          ref={input}
          id={NAME_ID}
          name="name"
          autoComplete="name"
          placeholder={C.namePlaceholder}
          aria-labelledby={STEP_TITLE_ID}
          aria-describedby={error ? NAME_ERROR_ID : undefined}
          aria-invalid={error ? true : undefined}
          value={name}
          onChange={(event) => {
            onChange(event.target.value);
            if (error && event.target.value.trim().length >= MIN_NAME) setError("");
          }}
          className={fieldClass(Boolean(error))}
        />
        <FieldError id={NAME_ERROR_ID} text={error} />
      </div>
      <ContinueButton type="submit" label={C.nameCta} />
    </form>
  );
}

type PhoneProps = {
  gender: Answers["gender"];
  /** The number from an earlier send, so "ערוך מספר" finds it filled in. */
  initialPhone: string;
  onSent: (phone: string) => void;
  /** True while the code is being sent: the funnel's back is hidden, as on otp. */
  onBusy: (busy: boolean) => void;
  accountOnly?: AccountOnly;
};

/** Sign-in for existing accounts only (the account page): no user is ever created; `notFound` is shown for an unknown number. */
export type AccountOnly = { notFound: string };

function PhoneStep({ gender, initialPhone, onSent, onBusy, accountOnly }: PhoneProps) {
  const [phone, setPhone] = useState(initialPhone);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  // False once the phone screen has unmounted (back, cancel): a send that resolves later must not act.
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  useEffect(() => {
    onBusy(sending);
  }, [sending, onBusy]);
  useEffect(() => () => onBusy(false), [onBusy]);

  const fail = (message: string) => {
    setError(message);
    input.current?.focus();
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (sending) return;
    if (!isIsraeliMobile(phone)) return fail(C.phoneError);
    setSending(true);
    const supabase = await loadBrowserSupabase();
    const result = supabase ? await sendCode(supabase, toE164(phone), { existingOnly: Boolean(accountOnly) }) : "error";
    if (!alive.current) return;
    setSending(false);
    if (result === "ok") return onSent(phone.trim());
    if (result === "noAccount" && accountOnly) return fail(accountOnly.notFound);
    fail(result === "rateLimited" ? COPY.otp.rateLimited : C.sendFailed);
  };

  const [lead, rest] = C.phoneFooter.split(" • ");
  return (
    <form noValidate onSubmit={submit} aria-busy={sending || undefined}>
      <StepIcon>
        <PhoneIcon />
      </StepIcon>
      <StepTitle>{C.phoneTitle}</StepTitle>
      <Subtitle text={C.phoneSubtitle} />
      <div className="mt-7">
        <label htmlFor={PHONE_ID} className="mb-2 block font-display font-bold">
          {C.phoneLabel}
        </label>
        <input
          ref={input}
          id={PHONE_ID}
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder={g(gender, C.phonePlaceholder.fem, C.phonePlaceholder.masc)}
          aria-describedby={error ? `${PHONE_SECURE_ID} ${PHONE_ERROR_ID}` : PHONE_SECURE_ID}
          aria-invalid={error ? true : undefined}
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          className={fieldClass(Boolean(error))}
        />
        <p id={PHONE_SECURE_ID} className="mt-3 flex items-center gap-2 text-ink-soft">
          <LockIcon className="h-5 w-5 shrink-0" />
          {C.phoneSecure}
        </p>
        <FieldError id={PHONE_ERROR_ID} text={error} />
      </div>
      {/* Disabled while sending, label kept: the press visibly took, and a second tap cannot send twice. */}
      <ContinueButton type="submit" label={C.phoneCta} disabled={sending} />
      <p className="mt-4 text-center text-ink-soft">
        {lead}
        <span aria-hidden="true" className="mx-2.5 inline-block h-[5px] w-[5px] rounded-pill bg-current align-middle" />
        {rest}
      </p>
      {/*
        "תנאי השימוש" is plain text: the site has no terms page and the app shows
        its terms in an in-app sheet, so there is nothing to link to yet.
      */}
      <p className="mt-3 text-center text-ink-soft">
        {g(gender, C.consent.lead.fem, C.consent.lead.masc)} {C.consent.terms} {C.consent.and}
        <Link href="/privacy-policy" className="font-bold text-green-deep underline underline-offset-[3px]">
          {C.consent.privacy}
        </Link>
      </p>
    </form>
  );
}

type Props = {
  view: RegisterView;
  gender: Answers["gender"];
  name: string;
  onNameChange: (name: string) => void;
  onName: (name: string) => void;
  onCodeSent: (phone: string) => void;
  onBusy: (busy: boolean) => void;
  /** Omitted in the funnel and the checkout, which create the account. */
  accountOnly?: AccountOnly;
};

/** register: the name, then the phone the code is sent to. */
export default function Register({ view, gender, name, onNameChange, onName, onCodeSent, onBusy, accountOnly }: Props) {
  // Start fetching the Supabase client while the visitor types, so the send does not wait for it.
  useEffect(() => {
    void loadBrowserSupabase();
  }, []);
  if (view.sub === "phone") {
    return <PhoneStep gender={gender} initialPhone={view.phone} onSent={onCodeSent} onBusy={onBusy} accountOnly={accountOnly} />;
  }
  return <NameStep gender={gender} name={name} onChange={onNameChange} onSubmit={onName} />;
}
