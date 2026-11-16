"use client";

import { useEffect, useState } from "react";
import JourneySteps from "@/components/funnel/JourneySteps";
import { readPlanInputs } from "@/lib/funnel/storage";

/**
 * The plans' heading after the questionnaire (owner, 2026-11-16: pay first): the visitor's name,
 * the one thing left, and what comes right after paying. A visitor from a link (no plan answers in
 * this tab) gets the plain heading and no steps.
 */
export default function PaymentHeading() {
  // undefined until mounted: sessionStorage does not exist on the server.
  const [name, setName] = useState<string | null | undefined>(undefined);
  useEffect(() => {
    const inputs = readPlanInputs();
    setName(inputs ? (inputs.firstName ?? "") : null);
  }, []);
  const fromFunnel = name !== null && name !== undefined;
  return (
    <>
      {fromFunnel ? <JourneySteps current={1} className="mb-6" /> : null}
      <h1
        id="payment-heading"
        className="font-display text-[clamp(1.75rem,1.5rem+1vw,2.25rem)] font-extrabold leading-[1.15] text-blue"
      >
        {fromFunnel && name ? `${name}, נשאר רק לבחור מסלול` : "התוכנית האישית שלך מוכנה"}
      </h1>
      <p className="mt-2 text-lead text-ink-soft">מיד אחרי התשלום מורידים את האפליקציה ומתחילים את האימון הראשון, עוד היום.</p>
    </>
  );
}
