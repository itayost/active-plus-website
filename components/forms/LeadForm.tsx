"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { submitLead, type LeadField, type LeadResult } from "@/lib/leads";
import { ArrowIcon, CheckIcon } from "@/components/ui/icons";

export const TOPICS = [
  "בירור והצטרפות",
  "שירות לקוחות",
  "תמיכה באפליקציה",
  "אחר",
] as const;

const INITIAL: LeadResult = { status: "idle" };

const FIELD_BASE =
  "w-full rounded-[14px] border-2 bg-white px-4 py-3.5 text-lead text-ink " +
  "placeholder:text-ink-faint transition-colors duration-[var(--dur-fast)] " +
  "focus:border-blue-deep focus:outline-none";

function fieldClass(invalid: boolean) {
  return `${FIELD_BASE} ${invalid ? "border-burgundy" : "border-hairline hover:border-ink/25"}`;
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex min-h-[60px] w-full items-center justify-center gap-2.5 rounded-pill bg-green-deep px-8 font-display text-lead font-bold text-white shadow-lift-1 transition-[background-color,box-shadow,transform] duration-[var(--dur-fast)] ease-out-expo hover:-translate-y-0.5 hover:bg-green hover:shadow-lift-2 disabled:pointer-events-none disabled:opacity-60 sm:w-auto"
    >
      {pending ? "שולח…" : label}
      {pending ? null : <ArrowIcon className="h-5 w-5" />}
    </button>
  );
}

type Props = {
  /** Which surface the lead came from, stored alongside the row. */
  source: string;
  /** Long form adds a topic select and a free-text message. */
  detailed?: boolean;
  submitLabel?: string;
  className?: string;
};

const PHONE_RE = /^0(5\d|7\d|[2-4]|[8-9])\d{7}$/;
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** Mirrors the server's rules so the reader hears about a typo on blur. */
function checkField(field: LeadField, value: string): string | undefined {
  const v = value.trim();
  if (field === "fullName") {
    if (v.length === 0) return undefined;
    if (v.length < 2) return "צריך שם מלא כדי שנדע למי לפנות.";
    if (v.length > 120) return "השם ארוך מדי. אפשר לקצר עד 120 תווים.";
  }
  if (field === "phone" && v && !PHONE_RE.test(v.replace(/[\s-]/g, ""))) {
    return "מספר הטלפון לא נראה תקין. לדוגמה: 050-1234567";
  }
  if (field === "email" && v && !EMAIL_RE.test(v)) {
    return "כתובת המייל לא נראית תקינה. לדוגמה: israel@gmail.com";
  }
  return undefined;
}

export default function LeadForm({
  source,
  detailed = false,
  submitLabel = "שליחה",
  className = "",
}: Props) {
  const [state, formAction] = useActionState(submitLead, INITIAL);
  const [local, setLocal] = useState<Partial<Record<LeadField, string>>>({});
  const formRef = useRef<HTMLFormElement>(null);
  const uid = useId();

  const serverFields = state.status === "error" ? (state.fields ?? {}) : {};
  const errorFor = (field: LeadField) => local[field] ?? serverFields[field];
  const invalid = (field: LeadField) => Boolean(errorFor(field));
  const describedBy = (field: LeadField) =>
    invalid(field) ? `${uid}-${field}-error` : undefined;

  // After a rejected submit, move the reader to the first field that needs
  // them instead of leaving them to hunt for the red border.
  useEffect(() => {
    if (state.status !== "error" || !state.fields) return;
    const first = Object.keys(state.fields)[0];
    formRef.current
      ?.querySelector<HTMLElement>(`[name="${first}"]`)
      ?.focus();
  }, [state]);

  const handleBlur = (field: LeadField) => (event: {
    currentTarget: { value: string };
  }) => setLocal((prev) => ({ ...prev, [field]: checkField(field, event.currentTarget.value) }));

  /** One message, directly under the field it belongs to. */
  const FieldError = ({ field }: { field: LeadField }) => {
    const text = errorFor(field);
    if (!text) return null;
    return (
      <p
        id={`${uid}-${field}-error`}
        role="alert"
        className="mt-2 font-semibold text-burgundy"
      >
        {text}
      </p>
    );
  };

  if (state.status === "success") {
    return (
      <div
        role="status"
        className={`rounded-card border-2 border-green bg-green-wash p-8 text-center ${className}`}
      >
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-deep text-white">
          <CheckIcon className="h-8 w-8" />
        </span>
        <p className="mt-5 font-display text-h3 font-bold text-green-deep">
          תודה, קיבלנו את הפרטים
        </p>
        <p className="mt-3 text-ink-soft">{state.message}</p>
      </div>
    );
  }

  return (
    <form ref={formRef} action={formAction} className={className} noValidate>
      <input type="hidden" name="source" value={source} />

      {/* Honeypot. Hidden from sight and from assistive technology. */}
      <div aria-hidden="true" className="absolute h-px w-px overflow-hidden opacity-0">
        <label htmlFor={`${uid}-company`}>חברה</label>
        <input id={`${uid}-company`} name="company" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label
            htmlFor={`${uid}-fullName`}
            className="mb-2 block font-display font-bold"
          >
            שם מלא
          </label>
          <input
            id={`${uid}-fullName`}
            name="fullName"
            autoComplete="name"
            required
            aria-invalid={invalid("fullName")}
            aria-describedby={describedBy("fullName")}
            onBlur={handleBlur("fullName")}
            placeholder="ישראל ישראלי"
            className={fieldClass(invalid("fullName"))}
          />
          <FieldError field="fullName" />
        </div>

        <div>
          <label
            htmlFor={`${uid}-phone`}
            className="mb-2 block font-display font-bold"
          >
            טלפון
          </label>
          <input
            id={`${uid}-phone`}
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            required
            dir="ltr"
            aria-invalid={invalid("phone")}
            aria-describedby={describedBy("phone")}
            onBlur={handleBlur("phone")}
            placeholder="050-1234567"
            className={`${fieldClass(invalid("phone"))} text-end`}
          />
          <FieldError field="phone" />
        </div>

        <div className={detailed ? "" : "sm:col-span-2"}>
          <label
            htmlFor={`${uid}-email`}
            className="mb-2 block font-display font-bold"
          >
            אימייל{" "}
            <span className="font-sans font-normal text-ink-faint">(לא חובה)</span>
          </label>
          <input
            id={`${uid}-email`}
            name="email"
            type="email"
            autoComplete="email"
            dir="ltr"
            aria-invalid={invalid("email")}
            aria-describedby={describedBy("email")}
            onBlur={handleBlur("email")}
            placeholder="israel@gmail.com"
            className={`${fieldClass(invalid("email"))} text-end`}
          />
          <FieldError field="email" />
        </div>

        {detailed ? (
          <>
            <div>
              <label
                htmlFor={`${uid}-topic`}
                className="mb-2 block font-display font-bold"
              >
                נושא הפנייה
              </label>
              <select
                id={`${uid}-topic`}
                name="topic"
                defaultValue={TOPICS[0]}
                className={fieldClass(false)}
              >
                {TOPICS.map((topic) => (
                  <option key={topic} value={topic}>
                    {topic}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor={`${uid}-message`}
                className="mb-2 block font-display font-bold"
              >
                פירוט הפנייה{" "}
                <span className="font-sans font-normal text-ink-faint">
                  (לא חובה)
                </span>
              </label>
              <textarea
                id={`${uid}-message`}
                name="message"
                rows={5}
                maxLength={2000}
                aria-invalid={invalid("message")}
                aria-describedby={describedBy("message")}
            onBlur={handleBlur("message")}
                className={`${fieldClass(invalid("message"))} resize-y`}
              />
              <FieldError field="message" />
            </div>
          </>
        ) : null}
      </div>

      {/* The label wraps the control, so the target is the whole row rather than
          the box alone — far more than the 48px floor, and nothing a 55+ hand
          has to aim for. That is what lets the box be sized against the 18px
          text beside it instead of inflated to carry the target by itself; a
          48px square next to one line of type reads as a defect, not as care.
          Centred rather than top-aligned so it stays balanced when the sentence
          wraps to two lines on a phone. */}
      {/* No htmlFor: wrapping the input already associates the two, and a second
          redundant association buys nothing. */}
      <label className="mt-6 flex cursor-pointer items-center gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center">
          <input
            id={`${uid}-marketing`}
            name="marketingOptIn"
            type="checkbox"
            className="h-8 w-8 rounded-[8px] border-2 border-hairline accent-[var(--green-deep)]"
          />
        </span>
        <span className="text-ink-soft">
          אני רוצה לקבל מידע על מבצעים והטבות.
        </span>
      </label>

      {state.status === "error" && state.message ? (
        <p
          role="alert"
          className="mt-5 rounded-[14px] border-2 border-burgundy bg-burgundy-wash px-4 py-3 font-semibold text-burgundy"
        >
          {state.message}
        </p>
      ) : null}

      <div className="mt-7">
        <SubmitButton label={submitLabel} />
      </div>

      <p className="mt-4 text-ink-faint">
        הפרטים נשמרים אצלנו בלבד ומשמשים ליצירת קשר. אפשר לקרוא את{" "}
        <a href="/privacy-policy" className="underline hover:text-blue-deep">
          מדיניות הפרטיות
        </a>
        .
      </p>
    </form>
  );
}
