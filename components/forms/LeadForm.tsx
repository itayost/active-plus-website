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

const INITIAL: LeadResult = { status: "idle" };

const FIELD_BASE =
  "w-full min-w-0 rounded-field border-2 bg-white px-[min(1rem,5vw)] py-3.5 text-lead text-ink " +
  "placeholder:text-ink-faint transition-colors duration-[var(--dur-fast)] " +
  "focus:border-blue-deep focus:outline-none";

function fieldClass(invalid: boolean) {
  return `${FIELD_BASE} ${invalid ? "border-burgundy" : "border-hairline hover:border-ink/25"}`;
}

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
      className="inline-flex min-h-[60px] w-full items-center justify-center gap-2.5 rounded-[30px] bg-green-deep pill-pad-lg font-display text-lead font-bold text-white shadow-lift-1 transition-[background-color,box-shadow,transform] duration-[var(--dur-fast)] ease-out-expo hover:-translate-y-0.5 hover:bg-green hover:shadow-lift-2 active:translate-y-0 active:scale-[0.97] aria-disabled:pointer-events-none aria-disabled:opacity-60 sm:w-auto"
    >
      {pending ? "שולח…" : label}
      {pending ? null : <ArrowIcon className="h-5 w-5" />}
    </button>
  );
}

/**
 * One message, directly under the field it belongs to. Module scope on
 * purpose: defined inside the form it became a new component type on every
 * render, so each blur unmounted and remounted every alert and screen readers
 * re-announced errors the reader had already heard.
 */
function FieldError({ id, text }: { id: string; text: string | undefined }) {
  if (!text) return null;
  return (
    <p id={id} role="alert" className="mt-2 font-semibold text-burgundy">
      {text}
    </p>
  );
}

const isOnline = () => typeof navigator === "undefined" || navigator.onLine !== false;

type Props = {
  /** Which surface the lead came from, stored alongside the row. */
  source: string;
  submitLabel?: string;
  /** Show the optional email field. The home page asks for name and phone only. */
  withEmail?: boolean;
  className?: string;
};

export default function LeadForm({
  source,
  submitLabel = "שליחה",
  withEmail = true,
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
            defaultValue={values.fullName}
            placeholder="ישראל ישראלי"
            className={fieldClass(invalid("fullName"))}
          />
          <FieldError id={errorId("fullName")} text={errorFor("fullName")} />
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
            defaultValue={values.phone}
            placeholder="050-1234567"
            className={`${fieldClass(invalid("phone"))} text-end`}
          />
          <FieldError id={errorId("phone")} text={errorFor("phone")} />
        </div>

        {withEmail ? (
          <div className="sm:col-span-2">
            <label
              htmlFor={`${uid}-email`}
              className="mb-2 block font-display font-bold"
            >
              אימייל{" "}
              <span className="font-sans font-normal text-ink-soft">(לא חובה)</span>
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
              defaultValue={values.email}
              placeholder="israel@gmail.com"
              className={`${fieldClass(invalid("email"))} text-end`}
            />
            <FieldError id={errorId("email")} text={errorFor("email")} />
          </div>
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
          className="mt-5 rounded-field border-2 border-burgundy bg-burgundy-wash px-4 py-3 font-semibold text-burgundy"
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
