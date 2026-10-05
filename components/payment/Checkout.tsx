"use client";

import { useEffect, useRef, useState } from "react";
import Otp from "@/components/funnel/Otp";
import { LINKISH } from "@/components/funnel/parts";
import Register from "@/components/funnel/Register";
import Button from "@/components/ui/Button";
import { CheckIcon } from "@/components/ui/icons";
import { PLANS, type PlanId } from "@/lib/constants";
import { loadSession } from "@/lib/funnel/storage";
import {
  checkoutSteps, isEmail, isFullName, readPaymentGender, saveCheckoutDraft, type CheckoutDraft, type CheckoutStep,
} from "@/lib/payment/checkout";
import { CHECKOUT_COPY as C } from "@/lib/payment/copy";
import { formatLocal } from "@/lib/phone";
import { formatShekel } from "@/lib/pricing";
import { loadBrowserSupabase } from "@/lib/supabase/lazy";
import { cn } from "@/lib/utils";
import { EmailStep, NameStep } from "./CheckoutFields";
import { CheckoutLoading, CheckoutShell } from "./CheckoutShell";
import CheckoutSummary from "./CheckoutSummary";

type Identity = { signedIn: boolean; name: string; phone: string | null };
type PhoneView = { sub: "phone" | "otp"; phone: string };

const SIGNED_OUT: Identity = { signedIn: false, name: "", phone: null };

async function loadIdentity(): Promise<Identity> {
  const supabase = await loadBrowserSupabase();
  if (!supabase) return SIGNED_OUT;
  const { data } = await supabase.auth.getUser();
  if (!data.user) return SIGNED_OUT;
  const { data: profile } = await supabase.from("users").select("full_name").eq("id", data.user.id).maybeSingle();
  const phone = data.user.phone ? `+${data.user.phone.replace(/^\+/, "")}` : null;
  return { signedIn: true, name: (profile as { full_name?: string | null } | null)?.full_name?.trim() ?? "", phone };
}

type Props = {
  plan: PlanId;
  /** The draft PaymentFlow resumed the checkout from (read once there); null for a fresh checkout. */
  initialDraft: CheckoutDraft | null;
  /** Returns the buyer to the plan cards above (the choice stays live). */
  onChangePlan: () => void;
};

/** The checkout steps under the plan selector: identity, invoice email, then the summary that hands off to Grow. */
export default function Checkout({ plan, initialDraft, onChangePlan }: Props) {
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [steps, setSteps] = useState<CheckoutStep[]>([]);
  const [index, setIndex] = useState(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [installments, setInstallments] = useState(1);
  const [editingName, setEditingName] = useState(false);
  const [phoneView, setPhoneView] = useState<PhoneView>({ sub: "phone", phone: "" });
  const [busy, setBusy] = useState(false);
  // True once the buyer has typed a name or email (or a draft was resumed): opening the checkout alone stores nothing.
  const [entered, setEntered] = useState(false);
  const [session] = useState(() => loadSession());
  const [gender] = useState(() => readPaymentGender());
  const heading = useRef<HTMLHeadingElement>(null);
  // Only the draft the checkout opened with: later renders never restart the identity load below.
  const resumed = useRef(initialDraft);
  const info = PLANS.find((p) => p.id === plan) ?? PLANS[0];

  // First load, and again after Otp's router.push("/payment") remounts the page: resume from the draft.
  useEffect(() => {
    let alive = true;
    void loadIdentity().then((loaded) => {
      if (!alive) return;
      const draft = resumed.current;
      const fullName = draft && isFullName(draft.name) ? draft.name : loaded.name;
      const draftEmail = draft?.email ?? "";
      const nextSteps = checkoutSteps(loaded.signedIn, isFullName(fullName));
      const resume = loaded.signedIn && isFullName(fullName) && isEmail(draftEmail);
      setIdentity(loaded);
      setName(fullName);
      setEmail(draftEmail);
      setInstallments(draft?.installments ?? 1);
      setSteps(nextSteps);
      setIndex(resume ? nextSteps.indexOf("summary") : 0);
      setEntered(draft !== null);
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (identity && entered) saveCheckoutDraft({ plan, name, email, installments });
  }, [identity, entered, plan, name, email, installments]);

  // After the checkout opens and after every step change, the heading takes focus (and scrolls into view, under
  // the sticky header via scroll-mt): the submit button that had focus is gone with the step it belonged to.
  useEffect(() => {
    if (identity) heading.current?.focus({ preventScroll: false });
  }, [identity, index, editingName]);

  const typeName = (value: string) => {
    setEntered(true);
    setName(value);
  };
  const typeEmail = (value: string) => {
    setEntered(true);
    setEmail(value);
  };

  const step = steps[index];
  // Once verified, the phone step is done: editing the name or email from the summary never asks for a new code.
  const signedIn = identity?.signedIn ?? false;
  const move = (from: number, by: 1 | -1) => {
    let i = Math.min(Math.max(from + by, 0), steps.length - 1);
    if (signedIn && steps[i] === "phone") i = Math.min(Math.max(i + by, 0), steps.length - 1);
    return i;
  };
  const next = () => setIndex((i) => move(i, 1));
  const back = () => setIndex((i) => move(i, -1));
  const goTo = (target: CheckoutStep) => {
    if (target === "name" && !steps.includes("name")) return setEditingName(true);
    const i = steps.indexOf(target);
    if (i >= 0) setIndex(i);
  };

  const afterSignIn = async () => {
    const loaded = await loadIdentity();
    setIdentity({ ...loaded, name: loaded.name || name });
    next();
  };

  const signInAgain = () => {
    const signedOutSteps = checkoutSteps(false, true);
    setIdentity(SIGNED_OUT);
    setSteps(signedOutSteps);
    setPhoneView({ sub: "phone", phone: "" });
    setIndex(signedOutSteps.indexOf("phone"));
  };

  if (!identity) return <CheckoutLoading />;

  const body = editingName ? (
    <NameStep value={name} onChange={typeName} submitLabel={C.save} onSubmit={(value) => { setName(value); setEditingName(false); }} />
  ) : step === "name" ? (
    <NameStep value={name} onChange={typeName} onSubmit={(value) => { setName(value); next(); }} />
  ) : step === "email" ? (
    <EmailStep value={email} onChange={typeEmail} onSubmit={(value) => { setEmail(value); next(); }} />
  ) : step === "phone" ? (
    phoneView.sub === "phone" ? (
      <Register
        view={{ sub: "phone", phone: phoneView.phone }}
        gender={gender}
        name={name}
        onNameChange={setName}
        onName={setName}
        onCodeSent={(phone) => setPhoneView({ sub: "otp", phone })}
        onBusy={setBusy}
      />
    ) : (
      <Otp
        phone={phoneView.phone}
        answers={{ ...session.answers, full_name: name }}
        sessionId={session.id}
        onEditPhone={() => setPhoneView((view) => ({ ...view, sub: "phone" }))}
        onComplete={() => void afterSignIn()}
        onBusy={setBusy}
      />
    )
  ) : (
    <CheckoutSummary
      plan={plan}
      name={name}
      email={email}
      phone={identity.phone}
      gender={gender}
      installments={installments}
      onInstallments={setInstallments}
      onEdit={goTo}
      onSignedOut={signInAgain}
    />
  );

  const showSteps = !editingName;
  // Back is offered on the phone number, never while a code is being verified.
  const canGoBack = index > 0 && !busy && showSteps && (step !== "phone" || phoneView.sub === "phone");
  const showIdentity = identity.signedIn && !editingName && step !== "summary";

  return (
    <CheckoutShell
      header={
        <>
          <h2 id="checkout-heading" ref={heading} tabIndex={-1} className="scroll-mt-28 font-display text-h2 font-black outline-none">
            {C.heading}
          </h2>
          <p className="mt-4 flex flex-wrap items-center gap-x-3 text-lead text-ink-soft">
            {C.chosenPlan} <strong className="font-display text-ink">{`${info.longName}, ${formatShekel(info.price)} ${info.priceSuffix}`}</strong>
            <button type="button" className={LINKISH} onClick={onChangePlan}>
              {C.changePlan}
            </button>
          </p>
        </>
      }
    >
      {showIdentity ? (
        <IdentityPanel name={name} phone={identity.phone} onEditName={() => goTo("name")} />
      ) : null}

      {showSteps ? <StepProgress at={index} count={steps.length} /> : null}
      <div className="mt-8">{body}</div>
      {canGoBack ? (
        <div className="mt-3 grid">
          <Button variant="outline" size="lg" className="w-full" onClick={back}>
            {C.back}
          </Button>
        </div>
      ) : null}
    </CheckoutShell>
  );
}

/** "שלב x מתוך n" and the segment bar: done steps green, the current one blue. */
function StepProgress({ at, count }: { at: number; count: number }) {
  return (
    <div>
      <p className="font-display font-bold text-ink-soft" aria-live="polite">
        {C.stepOf.replace("{x}", String(at + 1)).replace("{n}", String(count))}
      </p>
      <ol aria-hidden="true" className="mt-3 grid gap-1.5" style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}>
        {Array.from({ length: count }, (_, i) => (
          <li key={i} className={cn("h-2 rounded-pill", i < at ? "bg-green-deep" : i === at ? "bg-blue-deep" : "bg-ink/10")} />
        ))}
      </ol>
    </div>
  );
}

/** Signed in: the verified name and phone. The name can be corrected; the phone is the account. */
function IdentityPanel({ name, phone, onEditName }: { name: string; phone: string | null; onEditName: () => void }) {
  return (
    <div className="mb-7 rounded-tile bg-green-wash px-5 py-4">
      <div className="flex items-center gap-x-3">
        <span aria-hidden="true" className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-pill bg-green-deep text-white">
          <CheckIcon className="h-4 w-4" />
        </span>
        <dl className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2.5 font-display text-[1.25rem] font-bold [overflow-wrap:anywhere]">
          {name ? (
            <div>
              <dt className="sr-only">{C.rows.name}</dt>
              <dd><bdi>{name}</bdi></dd>
            </div>
          ) : null}
          {phone ? (
            <div className={name ? "flex items-center gap-x-2.5 before:text-ink-soft before:content-['·'] max-[560px]:before:hidden" : undefined}>
              <dt className="sr-only">{C.rows.phone}</dt>
              <dd><bdi dir="ltr">{formatLocal(phone)}</bdi></dd>
            </div>
          ) : null}
        </dl>
        {name ? (
          <button type="button" className={LINKISH} onClick={onEditName} aria-label={`${C.edit} ${C.rows.name}`}>
            {C.edit}
          </button>
        ) : null}
      </div>
      {phone ? <p className="mt-2 text-base text-ink-soft">{C.phoneLocked}</p> : null}
    </div>
  );
}
