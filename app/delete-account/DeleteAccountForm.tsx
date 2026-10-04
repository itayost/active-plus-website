"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { submitDeletionRequest, type DeleteAccountResult } from "./actions";
import { CheckIcon } from "@/components/ui/icons";

/*
  Accessibility wiring only. The URL, the field names, the confirmation phrase,
  the server action and every word of copy are registered with Apple and
  Google and stay exactly as they are.

  Which field a rejection is about is read from the server's own message
  rather than a new error code, so the action's contract does not change.
*/
const CONFIRMATION_ERROR = 'נא להקליד "מחיקת חשבון" בשדה האישור';
const EMAIL_ERROR = "כתובת אימייל לא תקינה";

const EMAIL_HINT_ID = "email-hint";
const CONFIRMATION_HINT_ID = "confirmation-hint";
const ERROR_ID = "delete-account-error";

const INPUT_CLASS =
  "w-full rounded-[14px] border-2 bg-white px-4 py-3.5 text-lead text-ink transition-colors duration-[var(--dur-fast)] focus:border-burgundy focus:outline-none";
const inputClass = (invalid: boolean) =>
  `${INPUT_CLASS} ${invalid ? "border-burgundy" : "border-hairline hover:border-ink/25"}`;

export default function DeleteAccountForm() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<DeleteAccountResult | null>(null);
  // Bumped on every response, so a second identical rejection still moves
  // focus and is announced again.
  const [attempt, setAttempt] = useState(0);
  const errorRef = useRef<HTMLDivElement>(null);
  const successRef = useRef<HTMLDivElement>(null);

  const error = result && !result.success ? result.message : null;
  const emailInvalid = error === EMAIL_ERROR;
  const confirmationInvalid = error === CONFIRMATION_ERROR;

  // A rejection used to leave focus on <body> with nothing announced. Move the
  // reader to the message itself: it names the problem, and the field it is
  // about is the next Tab stop after it.
  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error, attempt]);

  // The confirmation replaces the form the reader was focused in, so focus
  // follows it rather than falling to <body>.
  const succeeded = result?.success === true;
  useEffect(() => {
    if (succeeded) successRef.current?.focus();
  }, [succeeded]);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await submitDeletionRequest(formData);
      setResult(res);
      setAttempt((n) => n + 1);
    });
  }

  if (result?.success) {
    return (
      <div
        role="status"
        aria-live="polite"
        tabIndex={-1}
        ref={successRef}
        className="rounded-card border-2 border-green bg-green-wash p-8 text-center"
      >
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-deep text-white">
          <CheckIcon className="h-8 w-8" />
        </span>
        <p className="mt-5 text-lead font-semibold text-green-deep">
          {result.message}
        </p>
        <p className="mt-3 text-ink-soft">
          לשאלות נוספות אפשר לפנות ל־
          <a
            href="mailto:office@improve-movement.co.il"
            className="underline hover:text-green-deep"
          >
            office@improve-movement.co.il
          </a>
        </p>
      </div>
    );
  }

  return (
    <form action={handleSubmit} className="space-y-6" aria-busy={isPending || undefined}>
      {/* The live region is always in the document and only its content
          changes, which is what screen readers reliably announce. */}
      <div
        ref={errorRef}
        id={ERROR_ID}
        role="alert"
        tabIndex={-1}
        className={error ? "rounded-[14px] border-2 border-burgundy bg-[var(--burgundy-wash)] px-4 py-3" : undefined}
      >
        {error ? <p className="font-semibold text-burgundy">{error}</p> : null}
      </div>

      <div>
        <label
          htmlFor="email"
          className="mb-2 block font-display font-bold text-ink"
        >
          כתובת אימייל
        </label>
        <input
          type="email"
          id="email"
          name="email"
          required
          dir="ltr"
          autoComplete="email"
          inputMode="email"
          aria-invalid={emailInvalid || undefined}
          aria-describedby={emailInvalid ? `${ERROR_ID} ${EMAIL_HINT_ID}` : EMAIL_HINT_ID}
          placeholder="your@email.com"
          className={inputClass(emailInvalid)}
        />
        <p id={EMAIL_HINT_ID} className="mt-2 text-ink-soft">
          הכניסו את כתובת האימייל שאיתה נרשמתם לאפליקציה
        </p>
      </div>

      <div>
        <label
          htmlFor="confirmation"
          className="mb-2 block font-display font-bold text-ink"
        >
          אישור מחיקה
        </label>
        <input
          type="text"
          id="confirmation"
          name="confirmation"
          required
          dir="rtl"
          autoComplete="off"
          aria-invalid={confirmationInvalid || undefined}
          aria-describedby={
            confirmationInvalid ? `${ERROR_ID} ${CONFIRMATION_HINT_ID}` : CONFIRMATION_HINT_ID
          }
          placeholder='הקלידו "מחיקת חשבון"'
          className={inputClass(confirmationInvalid)}
        />
        <p id={CONFIRMATION_HINT_ID} className="mt-2 text-ink-soft">
          הקלידו &quot;מחיקת חשבון&quot; לאישור
        </p>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex min-h-[60px] w-full items-center justify-center rounded-pill bg-burgundy px-8 font-display text-lead font-bold text-white shadow-lift-1 transition-[background-color,box-shadow,transform] duration-[var(--dur-fast)] ease-out-expo hover:-translate-y-0.5 hover:bg-burgundy-deep hover:shadow-lift-2 disabled:pointer-events-none disabled:opacity-55"
      >
        {isPending ? "שולח בקשה..." : "שליחת בקשת מחיקה"}
      </button>
    </form>
  );
}
