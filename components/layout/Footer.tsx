import Link from "next/link";
import { Fragment } from "react";
import Logo from "./Logo";
import {
  COMPANY_LINE,
  CONTACT_ADDRESS,
  CONTACT_EMAIL,
  CONTACT_HOURS,
  CONTACT_PHONE,
  CONTACT_PHONE_TEL,
  CONTACT_WHATSAPP,
  CONTACT_WHATSAPP_URL,
  NAV,
} from "@/lib/constants";
import PhoneNumber from "@/components/ui/PhoneNumber";
import { WEB_CHECKOUT_ENABLED } from "@/lib/payment/config";

const [EMAIL_LOCAL, EMAIL_DOMAIN] = CONTACT_EMAIL.split("@");

/* Every row that can be tapped carries the 48px target. */
const ROW = "inline-flex min-h-12 min-w-12 items-center transition-colors hover:text-blue-deep";

const LEGAL = [
  // Web buyers cancel here; shown only once the site sells subscriptions.
  ...(WEB_CHECKOUT_ENABLED ? [{ href: "/account/subscription", label: "ניהול מנוי" }] : []),
  { href: "/privacy-policy", label: "מדיניות פרטיות" },
  { href: "/delete-account", label: "מחיקת חשבון" },
];

/*
  One column on a phone, in the handoff's order: wordmark, menu, contact,
  company line, legal links. On a tablet the brand runs across the top and
  the menu and contact sit side by side; from lg the blocks become three
  columns (brand with the company line under it, menu, contact) over a ruled
  legal row, so a wide screen gets a footer shaped like one instead of a
  phone column against the right edge. Grid areas, not reordered markup, so
  the reading and Tab order is the phone's at every width.
*/
const GRID =
  "md:grid md:grid-cols-2 md:gap-x-10 " +
  "md:[grid-template-areas:'brand_brand'_'company_company'_'nav_contact'_'legal_legal'] " +
  "lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1.2fr)] lg:grid-rows-[auto_1fr_auto] lg:gap-x-16 " +
  "lg:[grid-template-areas:'brand_nav_contact'_'company_nav_contact'_'legal_legal_legal']";

export default function Footer() {
  return (
    <footer className="border-t border-divider bg-sunken text-ink">
      {/* The last thing above the home indicator, so the bottom padding has to
          clear it, otherwise the legal links sit under the gesture bar, where
          a tap scrubs between apps instead of opening the page. */}
      <div
        className={`mx-auto max-w-shell gutter-x pt-11 pb-[max(2.5rem,calc(env(safe-area-inset-bottom)+1.5rem))] md:pt-14 ${GRID}`}
      >
        <Logo size="lg" className="mb-3 md:mb-0 md:self-start md:justify-self-start md:[grid-area:brand]" />

        <nav aria-label="ניווט תחתון" className="md:mt-6 md:[grid-area:nav] lg:mt-0">
          <ul className="flex flex-col">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className={`${ROW} font-medium`}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <ul className="mt-5 md:mt-6 md:[grid-area:contact] lg:mt-0">
          <li>
            <a href={`tel:${CONTACT_PHONE_TEL}`} className={ROW}>
              טלפון:&nbsp;<span dir="ltr"><PhoneNumber value={CONTACT_PHONE} /></span>
            </a>
            <span className="-mt-1 mb-1 block text-ink-soft">{CONTACT_HOURS}</span>
          </li>
          <li>
            <a href={CONTACT_WHATSAPP_URL} className={ROW}>
              וואטסאפ:&nbsp;<span dir="ltr">{CONTACT_WHATSAPP}</span>
            </a>
          </li>
          <li>
            <a href={`mailto:${CONTACT_EMAIL}`} className={`${ROW} text-blue-deep`}>
              {/* Breaks allowed after the @ and before each dot, so a narrow
                  column or enlarged text wraps the address between its parts,
                  not mid-word. */}
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
          <li className="flex min-h-12 items-center">{CONTACT_ADDRESS}</li>
        </ul>

        <p className="mt-4 text-sm text-ink-faint md:mt-2 md:self-start md:[grid-area:company]">{COMPANY_LINE}</p>

        <ul className="mt-3 flex flex-wrap gap-x-6 md:mt-10 md:border-t md:border-divider md:pt-3 md:[grid-area:legal]">
          {LEGAL.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className={`${ROW} text-ink-soft`}>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
