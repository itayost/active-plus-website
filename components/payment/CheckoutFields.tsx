"use client";

import { useRef, useState, type FormEvent, type Ref } from "react";
import { ContinueButton, FieldError, fieldClass } from "@/components/funnel/parts";
import { isEmail, joinFullName, splitFullName } from "@/lib/payment/checkout";
import { CHECKOUT_COPY as C } from "@/lib/payment/copy";
import { cn } from "@/lib/utils";

/** Each step's question, set as the mockup's step heading (0.78 of h2). */
export const STEP_QUESTION = "block font-display text-[clamp(1.46rem,1.01rem+1.56vw,2.93rem)] font-extrabold leading-[1.12] tracking-[-0.02em]";

type StepProps = { value: string; onChange: (value: string) => void; onSubmit: (value: string) => void; submitLabel?: string };

const NAME_ERROR_ID = "checkout-name-error";
const COUNTRY_ID = "checkout-country";
const SUB_LABEL = "mb-2 block font-display text-lead font-bold";

const hasLetter = (value: string) => /\p{L}/u.test(value);

type NamePartProps = {
  id: string;
  label: string;
  autoComplete: string;
  value: string;
  invalid: boolean;
  inputRef: Ref<HTMLInputElement>;
  onChange: (value: string) => void;
};

function NamePart({ id, label, autoComplete, value, invalid, inputRef, onChange }: NamePartProps) {
  return (
    <div>
      <label htmlFor={id} className={SUB_LABEL}>
        {label}
      </label>
      <input
        ref={inputRef}
        id={id}
        type="text"
        autoComplete={autoComplete}
        aria-describedby={invalid ? NAME_ERROR_ID : undefined}
        aria-invalid={invalid ? true : undefined}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={fieldClass(invalid)}
      />
    </div>
  );
}

/** The buyer's details: first and last name (kept as one name everywhere else) and the fixed country, as Grow's review requires. */
export function NameStep({ value, onChange, onSubmit, submitLabel = C.next }: StepProps) {
  const [parts, setParts] = useState(() => splitFullName(value));
  const [invalid, setInvalid] = useState(false);
  const firstInput = useRef<HTMLInputElement>(null);
  const lastInput = useRef<HTMLInputElement>(null);

  const update = (next: typeof parts) => {
    setParts(next);
    onChange(joinFullName(next.first, next.last));
    if (hasLetter(next.first) && hasLetter(next.last)) setInvalid(false);
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const missing = !hasLetter(parts.first) ? firstInput : !hasLetter(parts.last) ? lastInput : null;
    if (missing) {
      setInvalid(true);
      missing.current?.focus();
      return;
    }
    onSubmit(joinFullName(parts.first, parts.last));
  };

  return (
    <form noValidate onSubmit={submit}>
      <h3 className={STEP_QUESTION}>{C.nameTitle}</h3>
      <div className="mt-6 grid gap-4">
        <NamePart id="checkout-first-name" label={C.firstName} autoComplete="given-name" value={parts.first}
          invalid={invalid && !hasLetter(parts.first)} inputRef={firstInput} onChange={(first) => update({ ...parts, first })} />
        <NamePart id="checkout-last-name" label={C.lastName} autoComplete="family-name" value={parts.last}
          invalid={invalid && !hasLetter(parts.last)} inputRef={lastInput} onChange={(last) => update({ ...parts, last })} />
        <div>
          <label htmlFor={COUNTRY_ID} className={SUB_LABEL}>
            {C.rows.country}
          </label>
          <input id={COUNTRY_ID} type="text" readOnly value={C.country} className={cn(fieldClass(false), "bg-sunken text-ink-soft")} />
        </div>
      </div>
      <FieldError id={NAME_ERROR_ID} text={invalid ? C.nameError : ""} />
      <ContinueButton type="submit" label={submitLabel} />
    </form>
  );
}

const EMAIL_ID = "checkout-email";
const EMAIL_ERROR_ID = "checkout-email-error";

/** The invoice address; the label is the step's question. */
export function EmailStep({ value, onChange, onSubmit, submitLabel = C.next }: StepProps) {
  const [invalid, setInvalid] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = value.trim().replace(/\s+/g, " ");
    if (!isEmail(trimmed)) {
      setInvalid(true);
      input.current?.focus();
      return;
    }
    onSubmit(trimmed);
  };
  return (
    <form noValidate onSubmit={submit}>
      <label htmlFor={EMAIL_ID} className={STEP_QUESTION}>
        {C.emailTitle}
      </label>
      <input
        ref={input}
        id={EMAIL_ID}
        type="email"
        dir="ltr"
        inputMode="email"
        autoComplete="email"
        placeholder={C.emailPlaceholder}
        aria-describedby={invalid ? EMAIL_ERROR_ID : undefined}
        aria-invalid={invalid ? true : undefined}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          if (invalid && isEmail(event.target.value.trim())) setInvalid(false);
        }}
        // An address reads left to right but sits on the right edge, under the Hebrew question.
        className={`mt-6 ${fieldClass(invalid)} text-right`}
      />
      <FieldError id={EMAIL_ERROR_ID} text={invalid ? C.emailError : ""} />
      <ContinueButton type="submit" label={submitLabel} />
    </form>
  );
}
