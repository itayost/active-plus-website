"use client";

import {
  startTransition,
  useActionState,
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { submitLead, type LeadField, type LeadResult } from "@/lib/leads";
import { checkField, submitWithFallback } from "@/lib/lead-form";
import { ArrowIcon, CheckIcon } from "@/components/ui/icons";
import ContactFields from "./ContactFields";
import { FieldError, fieldClass, LABEL_CLASS } from "./FieldParts";

const INITIAL: LeadResult = { status: "idle" };

/*
  Pending comes from the action state rather than useFormStatus: the form is
  submitted through onSubmit (see below), which useFormStatus does not observe.
  aria-disabled keeps the focused button in the tab order while it waits, so
  focus never drops to <body> mid-submit; the click itself is ignored by the
  single-flight guard in the form.
*/
function SubmitButton({ label, pending }: { label: string; pending: boolean }) {
  return (
    <button
      type="submit"
      aria-disabled={pending || undefined}
      className="inline-flex min-h-[58px] w-full items-center justify-center gap-2.5 rounded-[29px] bg-cta pill-pad-lg font-display text-lead font-extrabold text-white shadow-cta transition-[filter,box-shadow,transform] duration-[var(--dur-fast)] ease-out-expo hover:-translate-y-0.5 hover:brightness-95 active:translate-y-0 active:scale-[0.97] active:brightness-90 forced-colors:border-2 aria-disabled:pointer-events-none aria-disabled:opacity-60"
    >
      {pending ? "שולח…" : label}
      {pending ? null : <ArrowIcon className="h-5 w-5" />}
    </button>
  );
}

const isOnline = () => typeof navigator === "undefined" || navigator.onLine !== false;

type Props = {
  /** Which surface the lead came from, stored alongside the row. */
  source: string;
  /** short: name, phone, offers. contact: adds email, topic and message. */
  variant: "short" | "contact";
  submitLabel?: string;
  className?: string;
};

export default function LeadForm({
  source,
  variant,
  submitLabel = "שליחה",
  className = "",
}: Props) {
  // Set synchronously on submit, before React has re-rendered the button, so a
  // double tap or a rapid second Enter cannot send the same lead twice. It is
  // released in the action's own finally, the one place that always runs.
  const inFlight = useRef(false);

  // Two action states, one per way the form can be sent.
  //
  // serverState: the server action itself, wired to <form action>. Before
  // hydration, or with JavaScript off, the browser posts the form natively
  // and Next runs the action and renders this state into the returned page.
  // Without it the native post reached "/" with no action at all and the lead
  // was silently dropped.
  //
  // clientState: the hydrated path. onSubmit cancels the native submit and
  // dispatches here instead, through submitWithFallback (offline and network
  // failures become an inline error rather than an error boundary). A
  // prevented submit that schedules a transition is treated by React as a
  // host transition with no action, so the fields are not reset and
  // useFormStatus still reports pending.
  const [serverState, serverAction] = useActionState(submitLead, INITIAL);
  const [clientState, dispatch, isPending] = useActionState(
    async (previous: LeadResult, formData: FormData) => {
      try {
        return await submitWithFallback(submitLead, previous, formData, isOnline);
      } finally {
        inFlight.current = false;
      }
    },
    INITIAL,
  );
  const state = clientState.status === "idle" ? serverState : clientState;
  const values = state.status === "error" ? (state.values ?? {}) : {};

  const [local, setLocal] = useState<Partial<Record<LeadField, string>>>({});
  const formRef = useRef<HTMLFormElement>(null);
  const uid = useId();

  const serverFields = state.status === "error" ? (state.fields ?? {}) : {};
  // A field the reader has re-checked on blur since the last submit speaks for
  // itself; otherwise the server's verdict stands.
  const errorFor = (field: LeadField) =>
    field in local ? local[field] : serverFields[field];
  const invalid = (field: LeadField) => Boolean(errorFor(field));
  const errorId = (field: LeadField) => `${uid}-${field}-error`;
  const describedBy = (field: LeadField) =>
    invalid(field) ? errorId(field) : undefined;

  // After a rejected submit, move the reader to the first field that needs
  // them instead of leaving them to hunt for the red border.
  useEffect(() => {
    if (state.status !== "error" || !state.fields) return;
    const first = Object.keys(state.fields)[0];
    formRef.current
      ?.querySelector<HTMLElement>(`[name="${first}"]`)
      ?.focus();
  }, [state]);

  // The value is read here, synchronously, while the event is live. Reading it
  // inside the state updater deferred the read until React applied the update,
  // by which time currentTarget was null: the second blur threw, the root error
  // boundary replaced the page, and no lead was ever sent.
  //
  // Passing through an empty field says nothing new, so it does not override
  // the server's verdict (a "required" error stays until the field is filled).
  const handleBlur =
    (field: LeadField) => (event: { currentTarget: { value: string } }) => {
      const value = event.currentTarget.value;
      const message = checkField(field, value);
      setLocal((prev) => {
        if (value.trim() !== "" || message) return { ...prev, [field]: message };
        return Object.fromEntries(
          Object.entries(prev).filter(([key]) => key !== field),
        ) as Partial<Record<LeadField, string>>;
      });
    };

  // Once hydrated, submit through onSubmit rather than letting <form action>
  // run, because a form action resets every uncontrolled field when it
  // settles, error or not: a reader who mistyped a digit, or lost signal,
  // would come back to an empty form.
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (inFlight.current) return;
    inFlight.current = true;
    const formData = new FormData(event.currentTarget);
    setLocal({});
    startTransition(() => dispatch(formData));
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
    <form
      ref={formRef}
      action={serverAction}
      onSubmit={handleSubmit}
      className={className}
      noValidate
      aria-busy={isPending || undefined}
    >
      <input type="hidden" name="source" value={source} />

      {/* Honeypot. Hidden from sight and from assistive technology. */}
      <div aria-hidden="true" className="absolute h-px w-px overflow-hidden opacity-0">
        <label htmlFor={`${uid}-company`}>חברה</label>
        <input id={`${uid}-company`} name="company" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="flex flex-col gap-3.5">
        <div className="flex flex-col gap-2">
          <label htmlFor={`${uid}-fullName`} className={LABEL_CLASS}>
            שם מלא
            <input
              id={`${uid}-fullName`}
              name="fullName"
              autoComplete="name"
              required
              aria-invalid={invalid("fullName")}
              aria-describedby={describedBy("fullName")}
              onBlur={handleBlur("fullName")}
              defaultValue={values.fullName}
              className={fieldClass(invalid("fullName"))}
            />
          </label>
          <FieldError id={errorId("fullName")} text={errorFor("fullName")} />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor={`${uid}-phone`} className={LABEL_CLASS}>
            טלפון
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
              defaultValue={values.phone}
              className={`${fieldClass(invalid("phone"))} text-end`}
            />
          </label>
          <FieldError id={errorId("phone")} text={errorFor("phone")} />
        </div>

        {variant === "contact" ? (
          <ContactFields
            uid={uid}
            values={values}
            errorFor={errorFor}
            errorId={errorId}
            onBlur={handleBlur}
          />
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
        <span className="flex h-[48px] w-[48px] shrink-0 items-center justify-center">
          <input
            id={`${uid}-marketing`}
            name="marketingOptIn"
            type="checkbox"
            className="h-8 w-8 rounded-[8px] border-2 border-[#CFCFCF] accent-[var(--green-deep)]"
          />
        </span>
        <span className="text-ink-soft">
          אני אשמח לקבל מבצעים והטבות
        </span>
      </label>

      {state.status === "error" && state.message ? (
        <p
          role="alert"
          className="mt-5 rounded-field border-2 border-danger bg-danger/10 px-4 py-3 font-semibold text-danger"
        >
          {state.message}
        </p>
      ) : null}

      <div className="mt-7">
        <SubmitButton label={submitLabel} pending={isPending} />
      </div>

      <p className="mt-4 text-ink-soft">
        הפרטים נשמרים אצלנו בלבד ומשמשים ליצירת קשר. אפשר לקרוא את{" "}
        <a href="/privacy-policy" className="underline hover:text-blue-deep">
          מדיניות הפרטיות
        </a>
        .
      </p>
    </form>
  );
}
