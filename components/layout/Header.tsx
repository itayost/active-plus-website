"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import Logo from "./Logo";
import Button from "@/components/ui/Button";
import { CloseIcon, MenuIcon, PhoneIcon } from "@/components/ui/icons";
import {
  CONTACT_HOURS,
  CONTACT_PHONE,
  CONTACT_PHONE_TEL,
  FIT_CHECK,
  NAV,
} from "@/lib/constants";

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

  const isCurrent = (href: string) => pathname === href;

  return (
    <>
      <header
        className={`sticky top-0 z-40 bg-surface pt-[env(safe-area-inset-top)] transition-[box-shadow,border-color] duration-[var(--dur)] ${
          lifted ? "border-b border-hairline shadow-lift-1" : "border-b border-transparent"
        }`}
      >
        <div className="mx-auto flex max-w-shell items-center justify-between gap-2 gutter-x min-[421px]:gap-6 py-3">
          <Logo />

          <nav aria-label="ניווט ראשי" className="hidden lg:block">
            <ul className="flex items-center gap-1">
              {NAV.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={isCurrent(item.href) ? "page" : undefined}
                    className={`inline-flex min-h-12 items-center rounded-pill px-4 text-base transition-colors duration-[var(--dur-fast)] ${
                      isCurrent(item.href)
                        ? "bg-blue-wash font-bold text-blue-deep"
                        : "text-ink-soft hover:bg-sunken hover:text-ink"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-2">
            <Button
              href={FIT_CHECK.href}
              className="whitespace-nowrap max-[420px]:px-4 max-[420px]:text-[1.0625rem]"
            >
              {FIT_CHECK.label}
            </Button>
            <button
              ref={toggleRef}
              type="button"
              onClick={() => (open ? close() : setOpen(true))}
              aria-expanded={open}
              aria-controls="site-drawer"
              className="inline-flex h-12 w-12 items-center justify-center rounded-pill text-ink transition-colors hover:bg-sunken lg:hidden"
            >
              <span className="sr-only">{open ? "סגירת התפריט" : "פתיחת התפריט"}</span>
              <MenuIcon className="h-7 w-7" />
            </button>
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
        className={`fixed inset-0 z-40 bg-ink/45 backdrop-blur-[2px] transition-opacity duration-[var(--dur)] lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <div
        id="site-drawer"
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="תפריט האתר"
        className={`drawer-safe fixed inset-y-0 start-0 z-50 flex w-[min(88vw,380px)] flex-col overflow-y-auto overscroll-contain bg-surface shadow-lift-3 transition-transform duration-[var(--dur)] ease-out-expo motion-reduce:transition-none lg:hidden ${
          open ? "translate-x-0" : "translate-x-full rtl:translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-hairline px-5 py-3">
          <Logo />
          <button
            type="button"
            onClick={close}
            className="inline-flex h-12 w-12 items-center justify-center rounded-pill text-ink transition-colors hover:bg-sunken"
          >
            <span className="sr-only">סגירת התפריט</span>
            <CloseIcon className="h-7 w-7" />
          </button>
        </div>

        <nav aria-label="ניווט האתר" className="flex-1 px-5 py-4">
          <ul className="flex flex-col">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isCurrent(item.href) ? "page" : undefined}
                  className={`flex min-h-[60px] items-center border-b border-hairline text-lead transition-colors ${
                    isCurrent(item.href)
                      ? "font-bold text-blue-deep"
                      : "text-ink hover:text-blue-deep"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* A phone number is the fastest route for this audience, so the
            drawer ends with it rather than with another link. */}
        <div className="border-t border-hairline px-5 py-5">
          <Button href={FIT_CHECK.href} size="lg" className="w-full">
            {FIT_CHECK.label}
          </Button>
          <a
            href={`tel:${CONTACT_PHONE_TEL}`}
            className="mt-4 flex min-h-12 items-center gap-3 text-ink-soft transition-colors hover:text-blue-deep"
          >
            <PhoneIcon className="h-6 w-6 shrink-0 text-blue-deep" />
            <span dir="ltr">{CONTACT_PHONE}</span>
          </a>
          <p className="mt-1 ps-9 text-ink-faint">{CONTACT_HOURS}</p>
        </div>
      </div>
    </>
  );
}
