import StoreButtons from "./StoreButtons";

/**
 * Phase 1 end of the purchase path: sign-up and payment happen in the app.
 * A white card with the app's name, one line on what to do, and the official
 * store badges as the one action (owner, 2026-11-15: the real badges, premium).
 */
export default function StoreFallback() {
  return (
    <section
      id="store-fallback"
      aria-labelledby="store-fallback-heading"
      className="mt-8 rounded-card border border-hairline bg-surface p-[clamp(min(1.5rem,7.5vw),4vw,2.5rem)] text-center text-ink shadow-lift-2"
    >
      <p className="font-display text-[1rem] font-bold tracking-wide text-green-deep">פעילים+ באפליקציה</p>
      <h2 id="store-fallback-heading" className="mt-2 font-display text-[1.75rem] font-extrabold leading-tight">
        ממשיכים את התוכנית באפליקציה
      </h2>
      <p className="mx-auto mt-3 max-w-measure text-lead text-ink-soft">מורידים, נכנסים עם אותו מספר טלפון, ובוחרים מסלול בחנות.</p>
      <StoreButtons className="mt-7 flex flex-wrap justify-center gap-2.5" size="sm" />
      <p className="mt-5 text-[0.9375rem] text-ink-faint">7 ימי ניסיון בחינם למצטרפים חדשים</p>
    </section>
  );
}
