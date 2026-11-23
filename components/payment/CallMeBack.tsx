"use client";

import { useEffect, useState, useTransition } from "react";
import { CallIcon } from "@/components/ui/icons";
import { pushTag } from "@/lib/analytics/tags";
import { CONTACT_PHONE } from "@/lib/constants";
import { NETWORK_MESSAGE } from "@/lib/lead-form";
import { submitLead, type LeadResult } from "@/lib/leads";
import { sessionPhone } from "@/lib/funnel/session-phone";
import { readPlanInputs } from "@/lib/funnel/storage";

/**
 * "מעדיפים שנחזור אליכם?" under the plans (owner, 2026-11-16). Some people over 55 will not pay
 * on a phone alone; at the center a lead and a call is what closes. One tap sends the office a
 * lead with the number verified by SMS; with no session the visitor types a number.
 */
export default function CallMeBack() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [known, setKnown] = useState(false);
  const [result, setResult] = useState<LeadResult>({ status: "idle" });
  const [pending, start] = useTransition();

  useEffect(() => {
    setName(readPlanInputs()?.firstName ?? "");
    void sessionPhone().then((p) => {
      if (!p) return;
      setPhone(p);
      setKnown(true);
    });
  }, []);

  const send = () =>
    start(async () => {
      const form = new FormData();
      form.set("fullName", name.trim().length >= 2 ? name.trim() : "פנייה מדף התשלום");
      form.set("phone", phone);
      form.set("source", "payment");
      form.set("topic", "בירור והצטרפות");
      form.set("message", "ביקש/ה שנחזור אליו/ה מדף בחירת המסלול, אחרי השאלון באתר");
      try {
        const r = await submitLead({ status: "idle" }, form);
        setResult(r);
        if (r.status === "success") pushTag({ event: "generate_lead", form_source: "payment" });
      } catch {
        setResult({ status: "error", message: NETWORK_MESSAGE });
      }
    });

  if (result.status === "success") {
    return (
      <div role="status" className="mt-8 rounded-tile bg-green-wash p-5 text-center">
        <p className="font-display text-[1.25rem] font-extrabold text-green-deep">קיבלנו, נחזור אליך בקרוב</p>
        <p className="mt-1 text-ink-soft">{result.message}</p>
      </div>
    );
  }

  return (
    <div className="mt-8 rounded-tile bg-sunken p-5">
      <p className="font-display text-[1.25rem] font-extrabold">מעדיפים לדבר עם נציג?</p>
      <p className="mt-1 text-ink-soft">נחזור אליכם, נעזור לבחור מסלול ונסביר איך מתחילים. בלי התחייבות.</p>
      {!open ? (
        <button
          type="button"
          onClick={() => (known ? send() : setOpen(true))}
          data-track="pay:call_me_back"
          disabled={pending}
          className="mt-4 inline-flex min-h-[60px] w-full items-center justify-center gap-2 rounded-pill border-2 border-blue-deep bg-surface px-5 font-display text-[1.125rem] font-bold text-blue-deep disabled:opacity-60"
        >
          <CallIcon className="h-5 w-5" />
          {pending ? "שולחים…" : known ? `כן, שתחזרו אליי ל-${phone}` : "כן, שתחזרו אליי"}
        </button>
      ) : (
        <form
          className="mt-4 grid gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
        >
          <label className="grid gap-1 font-bold">
            מספר טלפון
            <input
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              dir="ltr"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="050-1234567"
              className="min-h-[60px] rounded-field border border-hairline bg-surface px-4 text-[1.125rem]"
            />
          </label>
          <button
            type="submit"
            disabled={pending}
            className="min-h-[60px] rounded-pill bg-blue-deep px-5 font-display text-[1.125rem] font-bold text-white disabled:opacity-60"
          >
            {pending ? "שולחים…" : "שתחזרו אליי"}
          </button>
        </form>
      )}
      {result.status === "error" ? (
        <p role="alert" className="mt-3 text-danger">
          {result.message ?? Object.values(result.fields ?? {})[0] ?? NETWORK_MESSAGE}
        </p>
      ) : null}
      <p className="mt-3 text-center text-ink-soft">
        או התקשרו עכשיו:{" "}
        <a href={`tel:${CONTACT_PHONE.replace(/-/g, "")}`} className="whitespace-nowrap font-bold text-blue-deep underline" dir="ltr">
          {CONTACT_PHONE}
        </a>
      </p>
    </div>
  );
}
