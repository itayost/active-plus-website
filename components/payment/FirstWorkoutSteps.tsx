"use client";

import { useEffect, useState } from "react";
import { CallIcon } from "@/components/ui/icons";
import { CONTACT_PHONE } from "@/lib/constants";
import { CHECKOUT_COPY } from "@/lib/payment/copy";
import { sessionPhone } from "@/lib/funnel/session-phone";
import DownloadAppButton from "./DownloadAppButton";

const S = CHECKOUT_COPY.success;
const [DOWNLOAD, SIGN_IN, START] = S.steps;

/**
 * After paying, the shortest way to the first workout in the app (owner, 2026-11-16): one big
 * download button through the one link, the two store badges under it (owner, 2026-11-21), the number to sign in with, and
 * the button to press once inside, and help by phone. The workout is only in the app (owner, 2026-11-16).
 */
export default function FirstWorkoutSteps() {
  const [phone, setPhone] = useState<string | null>(null);
  useEffect(() => {
    void sessionPhone().then(setPhone);
  }, []);

  return (
    <div className="-mt-6 rounded-tile bg-surface p-5 shadow-lift-2">
      <p className="font-display text-[1.3rem] font-extrabold">{S.stepsTitle}</p>
      <ol className="mt-4 grid gap-5">
        <Step n={1} title={DOWNLOAD.title}>
          {/* One button for every phone, through the one link (owner, 2026-11-21). */}
          <div className="mt-3">
            <DownloadAppButton />
          </div>
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
