"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import { loadGtm } from "@/lib/analytics/gtm";
import {
  CONSENT_FLAG,
  CONSENT_SCRIPT,
  hasConsent,
  hasDeclined,
  saveConsent,
  saveDecline,
} from "@/lib/consent";

export const COOKIE_COPY = {
  label: "הודעה על עוגיות",
  /** The sentence runs into the policy link, then ends: "...שלנו (מדיניות הפרטיות)." */
  text: "אנחנו משתמשים בעוגיות (Cookies) כדי לשפר את האתר ולמדוד את הפרסום שלנו",
  link: "מדיניות הפרטיות",
  accept: "אישור",
  decline: "לא, תודה",
} as const;

/** The privacy policy's cookies section (app/privacy-policy, id "cookies"). */
export const COOKIES_POLICY_HREF = "/privacy-policy#cookies";

type Choice = "accepted" | "declined" | null;

/**
 * The cookie notice, and the only place Google Tag Manager is loaded from.
 *
 * "אישור" or "לא, תודה" (the owner's call, 2026-11-07, mockup
 * .impeccable/mocks/cookie-overlay/decline.html). Until "אישור" no tag loads
 * and nothing leaves the browser; "לא, תודה" loads nothing at all. Either
 * choice is kept for a year (lib/consent). The decline is deliberately the
 * quieter control, an underlined text button beside the green pill, but it is
 * always visible, one tap, and at the same 48px height floor.
 *
 * A card floating over the page, not a band in the layout, so it never pushes
 * the page down. Fixed to the bottom on every page: on the questionnaire it
 * covers the pinned continue button until the visitor chooses (the owner's
 * call), which asks for a choice without forcing a yes. From sm it is a 400px
 * card in the bottom-left corner: the end side in RTL, over the hero photo,
 * away from the headline and the main button on the start side.
 *
 * It is in the server's HTML for everyone; for a visitor who already chose,
 * CONSENT_SCRIPT flags <html> before the first paint and globals.css hides it.
 */
export default function CookieConsent({ gtmId }: { gtmId: string }) {
  const [choice, setChoice] = useState<Choice>(null);

  useEffect(() => {
    if (hasConsent()) {
      setChoice("accepted");
      loadGtm(gtmId);
    } else if (hasDeclined()) {
      setChoice("declined");
    }
  }, [gtmId]);

  const choose = (next: Exclude<Choice, null>) => {
    if (next === "accepted") saveConsent();
    else saveDecline();
    document.documentElement.dataset[CONSENT_FLAG] = next;
    setChoice(next);
    if (next === "accepted") loadGtm(gtmId);
  };

  return (
    <>
      {/* Before the notice's markup, so it runs ahead of it: see lib/consent. */}
      <script dangerouslySetInnerHTML={{ __html: CONSENT_SCRIPT }} />
      {choice ? null : (
        <section
          data-cookie-notice=""
          aria-label={COOKIE_COPY.label}
          className={
            "fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-50 " +
            "rounded-[22px] border border-hairline bg-surface p-4 shadow-lift-3 " +
            "sm:inset-x-auto sm:bottom-7 sm:left-7 sm:w-[25rem] sm:p-5"
          }
        >
          <p className="text-base font-medium leading-relaxed text-ink">
            {COOKIE_COPY.text} (
            <Link href={COOKIES_POLICY_HREF} className="font-bold text-blue-deep underline underline-offset-4">
              {COOKIE_COPY.link}
            </Link>
            ).
          </p>
          {/* Source order is reading order: "אישור" lands on the right. */}
          <div className="mt-3 flex items-center gap-3">
            <Button onClick={() => choose("accepted")} className="flex-1">
              {COOKIE_COPY.accept}
            </Button>
            <button
              type="button"
              onClick={() => choose("declined")}
              className="inline-flex min-h-12 shrink-0 items-center rounded-[10px] px-3 text-base font-semibold text-ink-soft underline underline-offset-4 hover:bg-sunken hover:text-ink"
            >
              {COOKIE_COPY.decline}
            </button>
          </div>
        </section>
      )}
    </>
  );
}
