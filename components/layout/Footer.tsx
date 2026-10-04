import Link from "next/link";
import { Fragment } from "react";
import Logo from "./Logo";
import { ClockIcon, MailIcon, PhoneIcon, PinIcon } from "@/components/ui/icons";
import {
  CONTACT_ADDRESS,
  CONTACT_EMAIL,
  CONTACT_HOURS,
  CONTACT_PHONE,
  CONTACT_PHONE_TEL,
  FIT_CHECK,
  NAV,
  STORE_ANDROID,
  STORE_IOS,
} from "@/lib/constants";
import PhoneNumber from "@/components/ui/PhoneNumber";

const [EMAIL_LOCAL, EMAIL_DOMAIN] = CONTACT_EMAIL.split("@");

const LEGAL = [
  { href: "/privacy-policy", label: "מדיניות פרטיות" },
  { href: "/delete-account", label: "מחיקת חשבון" },
];

export default function Footer() {
  return (
    <footer className="border-t border-hairline bg-sunken">
      {/* The last thing above the home indicator, so the bottom padding has to
          clear it — otherwise the legal links sit under the gesture bar, where
          a tap scrubs between apps instead of opening the page. */}
      <div className="mx-auto max-w-shell gutter-x pt-16 pb-[max(4rem,calc(env(safe-area-inset-bottom)+1.5rem))]">
        <div className="grid gap-12 md:grid-cols-[1.2fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-5 max-w-[42ch] text-ink-soft">
              מערכת לאימון הגוף ולחדות המחשבה, מבית המרכז לשיפור התנועה.
              10 דקות ביום — כדי להמשיך לזוז, לחשוב ולהישאר פעילים.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a
                href={STORE_IOS}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[48px] items-center rounded-pill border-2 border-ink/15 bg-white px-5 font-display font-bold transition-colors hover:border-ink/35"
              >
                App Store
                <span className="sr-only"> (נפתח בחלון חדש)</span>
              </a>
              <a
                href={STORE_ANDROID}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[48px] items-center rounded-pill border-2 border-ink/15 bg-white px-5 font-display font-bold transition-colors hover:border-ink/35"
              >
                Google Play
                <span className="sr-only"> (נפתח בחלון חדש)</span>
              </a>
            </div>
          </div>

          <nav aria-label="ניווט תחתון">
            <h2 className="font-display text-h3 font-bold">באתר</h2>
            <ul className="mt-5 space-y-3">
              {NAV.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="inline-flex min-h-12 min-w-12 items-center text-ink-soft transition-colors hover:text-blue-deep"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href={FIT_CHECK.href}
                  className="inline-flex min-h-12 min-w-12 items-center text-ink-soft transition-colors hover:text-blue-deep"
                >
                  {FIT_CHECK.label}
                </Link>
              </li>
            </ul>
          </nav>

          <div>
            <h2 className="font-display text-h3 font-bold">יצירת קשר</h2>
            <ul className="mt-5 space-y-4 text-ink-soft">
              {/* Phone and email are the two rows here that are actually tappable,
                  so they carry the 48px target and centre their icon against it.
                  The rows below are plain text and keep the top alignment that a
                  wrapping address needs. */}
              <li className="flex items-center gap-3">
                <PhoneIcon className="h-5 w-5 shrink-0 text-blue-deep" />
                <a
                  href={`tel:${CONTACT_PHONE_TEL}`}
                  dir="ltr"
                  className="inline-flex min-h-12 items-center transition-colors hover:text-blue-deep"
                >
                  <PhoneNumber value={CONTACT_PHONE} />
                </a>
              </li>
              <li className="flex items-center gap-3">
                <MailIcon className="h-5 w-5 shrink-0 text-blue-deep" />
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="inline-flex min-h-12 items-center transition-colors hover:text-blue-deep"
                >
                  {/* Breaks allowed after the @ and before each dot (as well
                      as at the hyphen), so a narrow column or enlarged text
                      wraps the address between its parts, not mid-word. */}
                  <span>
                    {EMAIL_LOCAL}@<wbr />
                    {EMAIL_DOMAIN.split(".").map((part, index) => (
                      <Fragment key={part}>
                        {index > 0 ? (
                          <>
                            <wbr />.
                          </>
                        ) : null}
                        {part}
                      </Fragment>
                    ))}
                  </span>
                </a>
              </li>
              <li className="flex items-start gap-3">
                <ClockIcon className="mt-1 h-5 w-5 shrink-0 text-blue-deep" />
                <span>{CONTACT_HOURS}</span>
              </li>
              <li className="flex items-start gap-3">
                <PinIcon className="mt-1 h-5 w-5 shrink-0 text-blue-deep" />
                <span>{CONTACT_ADDRESS}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-hairline pt-7 text-ink-soft sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} פעילים+ · המרכז לשיפור התנועה</p>
          <ul className="flex flex-wrap gap-x-6">
            {LEGAL.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="inline-flex min-h-12 items-center transition-colors hover:text-blue-deep"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
