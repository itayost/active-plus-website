"use client";

import { useState } from "react";
import { ChevronIcon } from "./icons";
import type { QA } from "@/content/pages";

export default function Accordion({ items }: { items: readonly QA[] }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <ul className="divide-y divide-hairline border-y border-hairline">
      {items.map((item, index) => {
        const isOpen = open === index;
        return (
          <li key={item.q}>
            <h3>
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={`faq-panel-${index}`}
                onClick={() => setOpen(isOpen ? null : index)}
                className="group flex w-full items-start gap-[min(1rem,5vw)] py-6 text-start transition-colors duration-[var(--dur-fast)] hover:text-blue-deep"
              >
                <span
                  className={`mt-0.5 shrink-0 rounded-full border-2 p-[6px] transition-[transform,border-color,background-color] duration-[var(--dur)] ease-out-expo ${
                    isOpen
                      ? "rotate-180 border-blue-deep bg-blue-deep text-white"
                      : "border-hairline text-ink-soft group-hover:border-blue-deep"
                  }`}
                >
                  <ChevronIcon className="h-[20px] w-[20px]" />
                </span>
                <span className="min-w-0 text-h3 font-display font-bold">{item.q}</span>
              </button>
            </h3>
            <div
              id={`faq-panel-${index}`}
              hidden={!isOpen}
              className="pb-7 ps-[calc(36px+min(1rem,5vw))] text-ink-soft"
            >
              <p className="max-w-measure">{item.a}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
