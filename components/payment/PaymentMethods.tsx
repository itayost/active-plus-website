import { LockIcon } from "@/components/ui/icons";
import type { PlanId } from "@/lib/constants";
import { CHECKOUT_COPY as C } from "@/lib/payment/copy";
import { methodsFor } from "@/lib/payment/methods";
import { cn } from "@/lib/utils";

/** Each mark's tallest height in px; a tile too narrow for it shrinks it, ratio kept. Visa's and PayBox's wordmarks sit lower. */
const MARK_HEIGHT: Record<string, number> = { visa: 20, mastercard: 30, bit: 26, paybox: 22 };

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
      className={cn("grid justify-center gap-2", className)}
      style={{ gridTemplateColumns: `repeat(${methods.length}, minmax(0, 5.5rem))` }}
    >
      {methods.map((m) => (
        <li key={m.id} className="flex h-14 items-center justify-center rounded-[12px] border border-[#D3D8DF] bg-white px-2 shadow-[0_1px_2px_rgb(17_17_17/0.06),0_2px_8px_rgb(17_17_17/0.05)]">
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

/**
 * Right under the pay button (owner, 2026-11-14: "איכותי, אמיתי ומזמין לפעול"):
 * the marks that plan accepts in one row, then a lock, "תשלום מאובטח" and who
 * processes the payment.
 */
export function SecurePanel({ plan }: { plan: PlanId }) {
  return (
    <div className="grid gap-4">
      <p id="secure-methods-label" className="sr-only">
        {C.methodsLabel}
      </p>
      <PaymentLogos plan={plan} labelledBy="secure-methods-label" />
      <div className="flex items-start gap-3 rounded-tile border-2 border-green-deep/35 bg-green-wash p-4">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-deep text-white">
          <LockIcon className="h-[22px] w-[22px]" />
        </span>
        <div className="min-w-0">
          <p className="font-display text-lead font-extrabold text-green-lo">{C.secureTitle}</p>
          <p className="mt-1 text-base text-ink">{C.secureNote}</p>
        </div>
      </div>
    </div>
  );
}
