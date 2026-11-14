import { LockIcon } from "@/components/ui/icons";
import type { PlanId } from "@/lib/constants";
import { CHECKOUT_COPY as C } from "@/lib/payment/copy";
import { methodsFor } from "@/lib/payment/methods";
import { cn } from "@/lib/utils";

/** Each mark's tallest height in px; a tile too narrow for it shrinks it, ratio kept. Visa's and PayBox's wordmarks sit lower. */
const MARK_HEIGHT: Record<string, number> = { visa: 18, mastercard: 26, bit: 24, paybox: 20 };

/**
 * The payment marks in one row on every phone, 360px included (owner,
 * 2026-11-14): equal white tiles, left to right as the brands write.
 */
export function PaymentLogos({ plan, labelledBy, className }: { plan?: PlanId; labelledBy?: string; className?: string }) {
  const methods = methodsFor(plan);
  return (
    <ul
      aria-labelledby={labelledBy}
      dir="ltr"
      className={cn("grid gap-1.5", className)}
      style={{ gridTemplateColumns: `repeat(${methods.length}, minmax(0, 5.5rem))` }}
    >
      {methods.map((m) => (
        <li key={m.id} className="flex h-12 items-center justify-center rounded-[10px] border-2 border-[#C9CED6] bg-white px-1.5">
          {/* eslint-disable-next-line @next/next/no-img-element -- a tiny SVG mark: next/image adds nothing here */}
          <img
            src={m.src}
            alt={m.name}
            width={m.width}
            height={m.height}
            className="w-full object-contain"
            style={{ height: MARK_HEIGHT[m.id] ?? 20 }}
          />
        </li>
      ))}
    </ul>
  );
}

/** Under the pay button: a lock, "תשלום מאובטח", who processes the payment, and the marks that plan accepts. */
export function SecurePanel({ plan }: { plan: PlanId }) {
  return (
    <div className="rounded-tile border-2 border-green-deep/40 bg-green-wash p-4">
      <p className="flex items-center gap-3 font-display text-lead font-extrabold text-green-lo">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-deep text-white">
          <LockIcon className="h-[22px] w-[22px]" />
        </span>
        {C.secureTitle}
      </p>
      <p className="mt-2 text-base text-ink">{C.secureNote}</p>
      <p id="secure-methods-label" className="sr-only">
        {C.methodsLabel}
      </p>
      <PaymentLogos plan={plan} labelledBy="secure-methods-label" className="mt-3" />
    </div>
  );
}
