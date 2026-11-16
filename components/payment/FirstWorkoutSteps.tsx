"use client";

import { useEffect, useState } from "react";
import { CallIcon } from "@/components/ui/icons";
import { pushTag } from "@/lib/analytics/tags";
import { CONTACT_PHONE } from "@/lib/constants";
import { CHECKOUT_COPY } from "@/lib/payment/copy";
import { TASTER_PATH } from "@/lib/funnel/constants";
import { sessionPhone } from "@/lib/funnel/session-phone";
import { platformOf, storeUrlFor, type Platform } from "@/lib/store-link";
import StoreButtons from "./StoreButtons";

const S = CHECKOUT_COPY.success;
const [DOWNLOAD, SIGN_IN, START] = S.steps;
const STORE_NAME: Record<Platform, string> = { ios: "App Store", android: "Google Play" };

/**
 * After paying, the shortest way to the first workout in the app (owner, 2026-11-16): one big
 * button to this phone's own store (both badges on a computer), the number to sign in with, and
 * the button to press once inside. Help by phone, and the workout on the site for someone who
 * cannot install the app right now.
 */
export default function FirstWorkoutSteps() {
  const [platform, setPlatform] = useState<Platform | null>(null);
  const [phone, setPhone] = useState<string | null>(null);
  useEffect(() => {
    setPlatform(platformOf(navigator.userAgent));
    void sessionPhone().then(setPhone);
  }, []);

  return (
    <div className="-mt-6 rounded-tile bg-surface p-5 shadow-lift-2">
      <p className="font-display text-[1.3rem] font-extrabold">{S.stepsTitle}</p>
      <ol className="mt-4 grid gap-5">
        <Step n={1} title={DOWNLOAD.title}>
          {platform ? (
            <a
              href={storeUrlFor(platform)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => pushTag({ event: "store_click", store: platform === "ios" ? "app_store" : "google_play" })}
              className="mt-3 flex min-h-[64px] w-full items-center justify-center rounded-[32px] bg-cta px-5 font-display text-[1.2rem] font-extrabold text-white shadow-lift-2"
            >
              {S.storeButton.replace("{store}", STORE_NAME[platform])}
            </a>
          ) : (
            <StoreButtons className="mt-3 flex flex-nowrap justify-center gap-2" size="sm" />
          )}
        </Step>
        <Step n={2} title={SIGN_IN.title}>
          <p className="mt-1 text-ink-soft">
            {phone ? (
              <>
                {S.yourPhone} <bdi dir="ltr" className="font-bold text-ink">{phone}</bdi>. {SIGN_IN.body}
              </>
            ) : (
              `המספר שאימתת כאן. ${SIGN_IN.body}`
            )}
          </p>
        </Step>
        <Step n={3} title={START.title}>
          <p className="mt-1 text-ink-soft">{START.body}</p>
        </Step>
      </ol>

      <div className="mt-5 grid gap-2 border-t border-hairline pt-4 text-center">
        <a href={`tel:${CONTACT_PHONE.replace(/-/g, "")}`} className="flex min-h-[60px] flex-col items-center justify-center font-bold text-blue-deep">
          <span>{S.help}</span>
          <span className="inline-flex items-center gap-2 whitespace-nowrap text-[1.2rem]" dir="ltr">
            <CallIcon className="h-5 w-5" />
            {CONTACT_PHONE}
          </span>
        </a>
        <a href={TASTER_PATH} className="inline-flex min-h-[60px] items-center justify-center text-ink-soft underline">
          {S.onSite}
        </a>
      </div>
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <li className="grid grid-cols-[2.75rem_minmax(0,1fr)] items-start gap-3">
      <span aria-hidden="true" className="flex h-11 w-11 items-center justify-center rounded-pill bg-blue-deep font-display text-[1.25rem] font-extrabold text-white">
        {n}
      </span>
      <div>
        <strong className="block font-display text-[1.2rem] font-bold leading-snug">{title}</strong>
        {children}
      </div>
    </li>
  );
}
