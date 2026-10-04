import type { HOW } from "@/content/how-it-works";

type Step = (typeof HOW.steps)[number];

/**
 * The four-step sequence. A hairline joins the numerals: vertical beside the
 * stacked steps, horizontal through the row from `lg`. The numerals stay
 * because they carry the order.
 */
export default function Steps({ steps }: { steps: Step[] }) {
  return (
    <ol className="relative mt-[clamp(3rem,5vw,4.5rem)] grid gap-9 before:absolute before:bottom-8 before:top-8 before:w-0.5 before:bg-hairline before:content-[''] before:[inset-inline-start:2.25rem] lg:grid-cols-4 lg:gap-8 lg:before:bottom-auto lg:before:top-11 lg:before:h-0.5 lg:before:w-auto lg:before:[inset-inline:12.5%]">
      {steps.map((s) => (
        <li
          key={s.n}
          className="relative grid grid-cols-[4.5rem_1fr] items-start gap-5 lg:grid-cols-1 lg:justify-items-center lg:gap-5 lg:text-center"
        >
          <span
            dir="ltr"
            className="inline-flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-pill bg-blue-wash font-display text-[1.875rem] font-black tracking-tight text-blue-deep shadow-[0_0_0_8px_var(--surface)] lg:h-[5.5rem] lg:w-[5.5rem] lg:text-[2.25rem]"
          >
            {s.n}
          </span>
          <div>
            <h3 className="pt-1.5 text-h3 font-display font-bold text-ink lg:pt-0">{s.title}</h3>
            <p className="mt-1.5 max-w-[30ch] text-base text-ink-soft">{s.body}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
