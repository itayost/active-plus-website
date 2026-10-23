"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import Logo from "./Logo";
import Button from "@/components/ui/Button";
import { CallIcon, CloseIcon, MenuIcon } from "@/components/ui/icons";
import {
  CONTACT_HOURS,
  CONTACT_PHONE,
  CONTACT_PHONE_TEL,
  FIT_CHECK,
  NAV,
} from "@/lib/constants";
import PhoneNumber from "@/components/ui/PhoneNumber";

/* 46px disc drawn inside a 48px hit box, so the touch target meets the floor.
   The focus outline sits outside the box, on white, clear of the green, at a
   1px offset (not the global 3px) so the rings of two neighbouring buttons,
   12px apart, never touch. */
const ROUND_HIT =
  "inline-flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-pill focus-visible:outline-offset-1";
const ROUND_DISC =
  "inline-flex h-[46px] w-[46px] items-center justify-center rounded-pill bg-cta text-white shadow-cta " +
  "transition-[transform,filter] duration-[var(--dur-fast)] ease-out-expo hover:brightness-95 active:scale-[0.95]";

export default function Header() {
  const [open, setOpen] = useState(false);
  const [lifted, setLifted] = useState(false);
  const pathname = usePathname();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    toggleRef.current?.focus();
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  // A hash-only link ("/#faq" from the home page) or the link of the current
  // page does not change the pathname, so the effect above never fires for
  // them. Closing on activation covers both. Focus is not returned to the
  // toggle: the page is navigating.
  const closeOnNavigate = useCallback(() => setOpen(false), []);

  useEffect(() => {
    const onScroll = () => setLifted(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // While the drawer is open it owns the screen: the page cannot scroll behind
  // it, Escape closes it, and Tab stays inside it.
  useEffect(() => {
    if (!open) {
      document.body.style.overflow = "";
      return;
    }
    document.body.style.overflow = "hidden";
    drawerRef.current?.querySelector<HTMLElement>("button")?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
        return;
      }
      if (event.key !== "Tab" || !drawerRef.current) return;
      const focusable = drawerRef.current.querySelectorAll<HTMLElement>(
        "a[href], button:not([disabled])",
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, close]);

  const isCurrent = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      {/* site-header is a size container. Which bar shows (inline links and
          pill, or the menu button) is decided in one place, globals.css: only
          while the bar is at least 78.75rem (1260px) wide, so
          enlarged text gets the menu button before anything is pushed off
          the screen. */}
      <header
        className={`site-header sticky top-0 z-40 bg-surface pt-[env(safe-area-inset-top)] transition-[box-shadow,border-color] duration-[var(--dur)] ${
          lifted ? "border-b border-hairline shadow-lift-1" : "border-b border-transparent"
        }`}
      >
        {/*
          The row wraps instead of overflowing, so nothing is ever pushed past
          the inline end, where html's overflow-x: clip would silently hide the
          menu toggle. The round buttons are sized in px, not rem: their 48px
          hit boxes already meet the floor (the discs are 46px) and must not
          grow with the text.
        */}
        <div className="header-row mx-auto flex max-w-shell flex-wrap items-center justify-between gap-x-4 gap-y-1 gutter-x py-2 xl:gap-x-6">
          <Logo />

          <nav aria-label="ניווט ראשי" className="desktop-nav">
            <ul className="flex items-center">
              {NAV.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={isCurrent(item.href) ? "page" : undefined}
                    /* The current page is marked by the wash and the deeper blue,
                       never by weight: bold Hebrew is wider, and at xl the row
                       has ~12px to spare, so a bold current link wrapped the
                       pill and the call button onto a second row. */
                    className={`inline-flex min-h-12 items-center rounded-pill px-2.5 text-[1.125rem] transition-colors duration-[var(--dur-fast)] ${
                      isCurrent(item.href)
                        ? "bg-blue-wash text-blue-deep"
                        : "text-ink-soft hover:bg-sunken hover:text-ink"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Menu then call, as in the handoff: in RTL the call button ends
              the row at the screen's left edge. */}
          <div className="header-actions ms-auto flex items-center gap-3">
            <div className="header-pill">
              <Button href={FIT_CHECK.href} className="whitespace-nowrap [text-wrap:nowrap]">
                {FIT_CHECK.label}
              </Button>
            </div>
            <button
              ref={toggleRef}
              type="button"
              onClick={() => (open ? close() : setOpen(true))}
              aria-expanded={open}
              aria-controls="site-drawer"
              className={`nav-toggle ${ROUND_HIT}`}
            >
              <span className="sr-only">{open ? "סגירת התפריט" : "פתיחת התפריט"}</span>
              <span className={ROUND_DISC} aria-hidden="true">
                <MenuIcon className="h-6 w-6" />
              </span>
            </button>
            <a href={`tel:${CONTACT_PHONE_TEL}`} aria-label="התקשרו אלינו" className={ROUND_HIT}>
              <span className={ROUND_DISC}>
                <CallIcon className="h-[22px] w-[22px]" />
              </span>
            </a>
          </div>
        </div>
      </header>

      {/* The scrim is a button so a tap outside closes the drawer the way
          people expect, and so the gesture has a name for screen readers. */}
      <button
        type="button"
        tabIndex={-1}
        aria-hidden="true"
        onClick={close}
        className={`fixed inset-0 z-40 bg-ink/45 backdrop-blur-[2px] transition-opacity duration-[var(--dur)] ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/*
        Closed means gone, not just slid away: inert takes it out of the tab
        order and the accessibility tree (it was eight invisible Tab stops and
        a second "dialog" on every page), and visibility: hidden does the same
        for browsers without inert. Each state carries its own transition:
        opening flips visibility at once (a transitioned visibility is still
        hidden on the first frame, which made the focus move into the drawer
        fail at random), closing delays it until the slide-out has finished.
        The shadow goes with it: left on, it bled a grey strip along the right
        edge of every phone page.
      */}
      <div
        id="site-drawer"
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="תפריט האתר"
        inert={!open}
        className={`drawer-safe fixed inset-y-0 start-0 z-50 flex w-[min(88vw,380px)] flex-col overflow-y-auto overscroll-contain bg-surface motion-reduce:transition-none ${
          open
            ? "visible translate-x-0 shadow-lift-3 [transition:transform_var(--dur)_var(--ease-out-expo),box-shadow_var(--dur)_var(--ease-out-expo),visibility_0s]"
            : "invisible translate-x-full shadow-none rtl:translate-x-full [transition:transform_var(--dur)_var(--ease-out-expo),box-shadow_var(--dur)_var(--ease-out-expo),visibility_0s_linear_var(--dur)]"
        }`}
      >
        {/* The close row is sized in px, capped at 56px: at 200% a 3rem
            button made this row a sixth of a portrait screen and a third of
            a landscape one, before a single menu item. */}
        <div className="flex items-center justify-between border-b border-divider px-5 py-[12px]">
          <Logo />
          <button
            type="button"
            onClick={close}
            className="inline-flex h-[min(3rem,56px)] w-[min(3rem,56px)] items-center justify-center rounded-pill text-ink transition-colors hover:bg-sunken"
          >
            <span className="sr-only">סגירת התפריט</span>
            <CloseIcon className="h-[min(1.75rem,32px)] w-[min(1.75rem,32px)]" />
          </button>
        </div>

        <nav aria-label="ניווט האתר" className="flex-1 px-5 py-2">
          <ul className="flex flex-col">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={closeOnNavigate}
                  aria-current={isCurrent(item.href) ? "page" : undefined}
                  className={`flex min-h-[60px] items-center border-b border-divider text-[21px] font-bold transition-colors ${
                    isCurrent(item.href) ? "text-blue-deep" : "text-ink hover:text-blue-deep"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* The one action first, then the phone: for this audience a number
            to ring is the fastest route, so the drawer ends with it. */}
        <div className="px-5 pb-6 pt-4">
          <Button href={FIT_CHECK.href} size="lg" className="mb-4 w-full text-center">
            {FIT_CHECK.label}
          </Button>
          <a
            href={`tel:${CONTACT_PHONE_TEL}`}
            className="flex min-h-12 items-center gap-3 text-ink-soft transition-colors hover:text-blue-deep"
          >
            <CallIcon className="h-6 w-6 shrink-0 text-blue-deep" />
            <span dir="ltr"><PhoneNumber value={CONTACT_PHONE} /></span>
          </a>
          <p className="mt-1 ps-9 text-ink-soft">{CONTACT_HOURS}</p>
        </div>
      </div>
    </>
  );
}
