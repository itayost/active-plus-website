import Button from "@/components/ui/Button";
import { STORE_ANDROID, STORE_IOS } from "@/lib/constants";

/**
 * Phase 1 end of the purchase path: sign-up and payment happen in the app.
 * A green field (action) with white pill store buttons; white focus ring and
 * white text for AA on the field.
 */
export default function StoreFallback() {
  return (
    <section
      id="store-fallback"
      aria-labelledby="store-fallback-heading"
      className="mt-10 rounded-card bg-green-deep p-[clamp(1.75rem,4vw,3rem)] text-white shadow-lift-2 [--focus-ring:#ffffff]"
    >
      <h3 id="store-fallback-heading" className="font-display text-h3 font-bold">
        ההרשמה והתשלום מתבצעים כרגע באפליקציה
      </h3>
      <p className="mt-3 max-w-measure text-lead">
        מורידים את פעילים+, בוחרים את המסלול ומשלמים בחנות האפליקציות.
      </p>
      <div className="mt-7 flex flex-wrap gap-4">
        <Button href={STORE_IOS} variant="onColor" size="lg">
          App Store
        </Button>
        <Button href={STORE_ANDROID} variant="onColor" size="lg">
          Google Play
        </Button>
      </div>
    </section>
  );
}
