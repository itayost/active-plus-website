/*
  Pieces shared by the lead form and its contact-only fields: the input
  styling from the handoff (52px, 14px radius, 1px #8A8F98 (3.25:1 on white, WCAG 1.4.11), 17px text) and the
  one error line that sits under the field it belongs to.
*/

export const LABEL_CLASS = "flex flex-col gap-1.5 font-bold";

const FIELD_BASE =
  "w-full min-w-0 rounded-field border bg-white px-4 text-[17px] font-normal text-ink " +
  "placeholder:text-ink-faint transition-colors duration-[var(--dur-fast)] " +
  "focus:border-blue-deep focus:outline-none focus:ring-2 focus:ring-blue-deep";

/** Single-line inputs and the select. */
export function fieldClass(invalid: boolean) {
  return `${FIELD_BASE} min-h-[52px] ${invalid ? "border-danger" : "border-[#8A8F98] hover:border-ink"}`;
}

/** The message box: same skin, free height. */
export function areaClass(invalid: boolean) {
  return `${FIELD_BASE} min-h-[120px] resize-y py-3 ${invalid ? "border-danger" : "border-[#8A8F98] hover:border-ink"}`;
}

/**
 * One message, directly under the field it belongs to. Module scope on
 * purpose: defined inside the form it became a new component type on every
 * render, so each blur unmounted and remounted every alert and screen readers
 * re-announced errors the reader had already heard.
 */
export function FieldError({ id, text }: { id: string; text: string | undefined }) {
  if (!text) return null;
  return (
    <p id={id} role="alert" className="font-semibold text-danger">
      {text}
    </p>
  );
}
