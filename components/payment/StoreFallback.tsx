import type { Ref } from "react";
import Button from "@/components/ui/Button";
import { STORE_ANDROID, STORE_IOS } from "@/lib/constants";

/**
 * Phase 1 end of the purchase path: sign-up and payment happen in the app.
 * The section is focusable (tabindex -1) so "המשך לרכישה" can move focus here
 * for keyboard and screen-reader users, not just scroll.
 */
export default function StoreFallback({ sectionRef }: { sectionRef?: Ref<HTMLElement> }) {
  return (
    <section
      ref={sectionRef}
      id="store-fallback"
      tabIndex={-1}
      aria-labelledby="store-fallback-heading"
      className="mt-14 scroll-mt-28 rounded-card bg-sunken p-[clamp(1.75rem,4vw,3rem)] outline-none"
    >
      <h3 id="store-fallback-heading" className="font-display text-h3 font-bold">
        ההרשמה והתשלום מתבצעים כרגע באפליקציה
      </h3>
      <div className="mt-7 flex flex-wrap gap-4">
        <Button href={STORE_IOS} size="lg">
          App Store
        </Button>
        <Button href={STORE_ANDROID} variant="outline" size="lg">
          Google Play
        </Button>
      </div>
    </section>
  );
}
