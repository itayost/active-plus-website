import type { ReactNode } from "react";
import { CHECKOUT_COPY as C } from "@/lib/payment/copy";
import { cn } from "@/lib/utils";

/** The checkout's own sunken section under the plans: heading, then the white step card (mockup: 900px column). */
export function CheckoutShell({ header, busy = false, children }: { header?: ReactNode; busy?: boolean; children: ReactNode }) {
  return (
    <section id="checkout" aria-labelledby={header ? "checkout-heading" : undefined} aria-busy={busy || undefined} className="bg-sunken py-[var(--section-y)]">
      <div className="mx-auto w-full max-w-[56.25rem] gutter-x">
        {header}
        <div className={cn("rounded-card bg-surface p-[clamp(1.25rem,3.5vw,2.5rem)] shadow-lift-2", header ? "mt-7" : "")}>{children}</div>
      </div>
    </section>
  );
}

/** The checkout while it loads (its code, then who the buyer is). */
export function CheckoutLoading() {
  return (
    <CheckoutShell busy>
      <p className="text-lead">{C.loading}</p>
    </CheckoutShell>
  );
}
