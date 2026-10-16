"use client";

import { useState } from "react";
import type { QA } from "@/content/pages";

/**
 * Accessible accordion: one button per question (aria-expanded, aria-controls)
 * inside a heading, the answer in a panel that is `hidden` while closed.
 * The blue marker is decorative; the state is carried by aria-expanded.
 */
export default function Accordion({ items }: { items: readonly QA[] }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <ul className="border-t border-divider">
      {items.map((item, index) => {
        const isOpen = open === index;
        return (
          <li key={item.q} className="border-b border-divider">
            <h3>
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={`faq-panel-${index}`}
                onClick={() => setOpen(isOpen ? null : index)}
                className="group flex min-h-12 w-full items-start gap-4 py-4 text-start text-[17px] font-bold leading-snug text-ink transition-colors duration-[var(--dur-fast)] hover:text-blue-deep lg:text-xl"
              >
                <span className="min-w-0 flex-1">{item.q}</span>
                <span
                  aria-hidden="true"
                  className="w-6 shrink-0 text-center text-2xl font-bold leading-none text-blue"
                >
                  {isOpen ? "−" : "+"}
                </span>
              </button>
            </h3>
            <div id={`faq-panel-${index}`} hidden={!isOpen} className="pb-4">
              <p className="max-w-measure text-lg leading-relaxed text-ink">{item.a}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
