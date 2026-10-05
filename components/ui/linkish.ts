/*
  Kept out of funnel/parts (which re-exports them) so a page that only needs
  the class string, such as the payment success page, does not pull in the
  funnel's shared chunk with it.
*/

/** A text button or link set as an underlined blue link, at least 48px tall. */
export const LINKISH =
  "inline-flex min-h-12 items-center rounded-[10px] px-2 font-bold text-blue-deep underline underline-offset-4 hover:bg-blue-wash";

/** Added to LINKISH on a button that is disabled while a request runs. */
export const LINKISH_DISABLED = "disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:bg-transparent";
