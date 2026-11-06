"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import { LINKISH } from "@/components/ui/linkish";
import { loadGtm } from "@/lib/analytics/gtm";
import { CONSENT_FLAG, CONSENT_SCRIPT, hasConsent, saveConsent } from "@/lib/consent";

export const COOKIE_COPY = {
  label: "הודעה על עוגיות",
  text: "אנחנו משתמשים בעוגיות (Cookies) כדי לשפר את האתר ולמדוד את הפרסום שלנו.",
  link: "מדיניות הפרטיות",
  accept: "אישור",
} as const;

/** The privacy policy's cookies section (app/privacy-policy, id "cookies"). */
export const COOKIES_POLICY_HREF = "/privacy-policy#cookies";

/**
 * The cookie notice, and the only place Google Tag Manager is loaded from.
 *
 * One button, "אישור" (the owner's call, 2026-11-06): until it is pressed no
 * tag loads and nothing leaves the browser. A press loads the container at once
 * and is kept for a year (lib/consent), so later pages load it on mount.
 *
 * The notice sits at the top of the page, in the flow, rather than over the
 * bottom of the screen: the questionnaire's continue button is pinned to the
 * bottom, and a bar over it would hide the one thing a visitor needs. It is in
 * the server's HTML for everyone, so it never pops in and pushes the page down;
 * for a visitor who already accepted, CONSENT_SCRIPT flags <html> before the
 * first paint and globals.css hides it.
 */
export default function CookieConsent({ gtmId }: { gtmId: string }) {
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    if (!hasConsent()) return;
    setAccepted(true);
    loadGtm(gtmId);
  }, [gtmId]);

  const accept = () => {
    saveConsent();
    document.documentElement.dataset[CONSENT_FLAG] = "accepted";
    setAccepted(true);
    loadGtm(gtmId);
  };

  return (
    <>
      {/* Before the notice's markup, so it runs ahead of it: see lib/consent. */}
      <script dangerouslySetInnerHTML={{ __html: CONSENT_SCRIPT }} />
      {accepted ? null : (
        <section data-cookie-notice="" aria-label={COOKIE_COPY.label} className="border-b border-hairline bg-blue-wash">
          <div className="mx-auto flex max-w-shell flex-wrap items-center gap-x-6 gap-y-2 gutter-x py-3">
            <p className="min-w-0 flex-1 basis-[20rem] text-base font-medium text-ink">{COOKIE_COPY.text}</p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <Link href={COOKIES_POLICY_HREF} className={LINKISH}>
                {COOKIE_COPY.link}
              </Link>
              <Button onClick={accept} className="min-w-[8rem]">
                {COOKIE_COPY.accept}
              </Button>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
