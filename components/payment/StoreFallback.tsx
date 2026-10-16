import StoreButtons from "./StoreButtons";

/**
 * Phase 1 end of the purchase path: sign-up and payment happen in the app.
 * A blue-wash panel (the fit-check close's skin) with a blue-deep heading, ink
 * text and the green store buttons as the one action; the default focus ring
 * already clears 3:1 on the wash.
 */
export default function StoreFallback() {
  return (
    <section
      id="store-fallback"
      aria-labelledby="store-fallback-heading"
      className="mt-10 rounded-card bg-blue-wash p-[clamp(min(1.75rem,8.75vw),4vw,3rem)] text-ink"
    >
      <h2 id="store-fallback-heading" className="font-display text-h3 font-bold text-blue-deep">
        ההרשמה והתשלום מתבצעים כרגע באפליקציה
      </h2>
      <p className="mt-3 max-w-measure text-lead">
        מורידים את פעילים+, בוחרים את המסלול ומשלמים בחנות האפליקציות.
      </p>
      <StoreButtons className="mt-7 flex flex-wrap gap-4" variant="primary" size="lg" />
    </section>
  );
}
