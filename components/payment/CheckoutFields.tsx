"use client";

import { useRef, useState, type FormEvent } from "react";
import { ContinueButton, FieldError, fieldClass } from "@/components/funnel/parts";
import { isEmail, isFullName } from "@/lib/payment/checkout";
import { CHECKOUT_COPY as C } from "@/lib/payment/copy";

/** Each step's question, set as the mockup's step heading (0.78 of h2). */
export const STEP_QUESTION = "block font-display text-[clamp(1.46rem,1.01rem+1.56vw,2.93rem)] font-black leading-[1.12] tracking-[-0.02em]";

type FieldProps = {
  id: string;
  label: string;
  placeholder: string;
  error: string;
  type: "text" | "email";
  autoComplete: string;
  value: string;
  valid: (value: string) => boolean;
  submitLabel: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
};

/** One labelled field and its continue button; the label is the step's question. */
function Field({ id, label, placeholder, error, type, autoComplete, value, valid, submitLabel, onChange, onSubmit }: FieldProps) {
  const [invalid, setInvalid] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const errorId = `${id}-error`;
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = value.trim().replace(/\s+/g, " ");
    if (!valid(trimmed)) {
      setInvalid(true);
      input.current?.focus();
      return;
    }
    onSubmit(trimmed);
  };
  return (
    <form noValidate onSubmit={submit}>
      <label htmlFor={id} className={STEP_QUESTION}>
        {label}
      </label>
      <input
        ref={input}
        id={id}
        type={type}
        dir={type === "email" ? "ltr" : undefined}
        inputMode={type === "email" ? "email" : undefined}
        autoComplete={autoComplete}
        placeholder={placeholder}
        aria-describedby={invalid ? errorId : undefined}
        aria-invalid={invalid ? true : undefined}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          if (invalid && valid(event.target.value.trim())) setInvalid(false);
        }}
        // An address reads left to right but sits on the right edge, under the Hebrew question.
        className={`mt-6 ${fieldClass(invalid)} ${type === "email" ? "text-right" : ""}`}
      />
      <FieldError id={errorId} text={invalid ? error : ""} />
      <ContinueButton type="submit" label={submitLabel} />
    </form>
  );
}

type StepProps = { value: string; onChange: (value: string) => void; onSubmit: (value: string) => void; submitLabel?: string };

export function NameStep({ value, onChange, onSubmit, submitLabel = C.next }: StepProps) {
  return (
    <Field id="checkout-name" label={C.nameTitle} placeholder={C.namePlaceholder} error={C.nameError} type="text"
      autoComplete="name" value={value} valid={isFullName} submitLabel={submitLabel} onChange={onChange} onSubmit={onSubmit} />
  );
}

export function EmailStep({ value, onChange, onSubmit, submitLabel = C.next }: StepProps) {
  return (
    <Field id="checkout-email" label={C.emailTitle} placeholder={C.emailPlaceholder} error={C.emailError} type="email"
      autoComplete="email" value={value} valid={isEmail} submitLabel={submitLabel} onChange={onChange} onSubmit={onSubmit} />
  );
}
