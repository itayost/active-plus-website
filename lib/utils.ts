import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/*
  tailwind-merge only knows Tailwind's default scale, so it read the custom
  sizes (text-lead, text-h3, ...) as text colours and dropped them beside a
  real colour: cn("text-lead text-ink-soft") returned "text-ink-soft". The
  font-size group lists every size in tailwind.config.ts `fontSize`; a unit
  test checks the two stay in step.
*/
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: ["base", "lead", "h3", "h2", "h1", "h1-article", "h2-prose", "card-title"] }],
    },
  },
});

/** Merge conditional class lists, with later Tailwind utilities winning. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
