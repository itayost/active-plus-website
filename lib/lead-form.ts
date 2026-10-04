import type { LeadField, LeadResult } from "@/lib/leads";
import { CONTACT_PHONE } from "@/lib/constants";

const PHONE_RE = /^0(5\d|7\d|[2-4]|[8-9])\d{7}$/;
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const NAME_MAX = 120;

/**
 * Mirrors the server's rules so the reader hears about a typo on blur. An
 * empty required field is not flagged here: blur fires whenever someone
 * passes through a field, and scolding before they type is noise. The server
 * still rejects it on submit.
 */
export function checkField(field: LeadField, value: string): string | undefined {
  const v = value.trim();
  if (field === "fullName") {
    if (v.length === 0) return undefined;
    if (v.length < 2) return "צריך שם מלא כדי שנדע למי לפנות.";
    if (v.length > NAME_MAX) return "השם ארוך מדי. אפשר לקצר עד 120 תווים.";
  }
  if (field === "phone" && v && !PHONE_RE.test(v.replace(/[\s-]/g, ""))) {
    return "מספר הטלפון לא נראה תקין. לדוגמה: 050-1234567";
  }
  if (field === "email" && v && !EMAIL_RE.test(v)) {
    return "כתובת המייל לא נראית תקינה. לדוגמה: israel@gmail.com";
  }
  return undefined;
}

/** Both fallbacks say what happened, that nothing typed was lost, and the way out. */
export const OFFLINE_MESSAGE =
  `אין כרגע חיבור לאינטרנט, ולכן הפרטים עוד לא נשלחו. הם נשמרו כאן בטופס: ` +
  `אפשר ללחוץ שוב על "שליחה" כשהחיבור יחזור, או להתקשר אלינו ל-${CONTACT_PHONE}.`;

export const NETWORK_MESSAGE =
  `לא הצלחנו לשלוח את הפרטים, כנראה בגלל תקלה בחיבור. הם נשמרו כאן בטופס: ` +
  `אפשר ללחוץ שוב על "שליחה", או להתקשר אלינו ל-${CONTACT_PHONE}.`;

type Submit = (previous: LeadResult, formData: FormData) => Promise<LeadResult>;

/**
 * A server action that cannot reach the server throws, and a throw inside
 * useActionState is rethrown during render, which hands the whole page to the
 * root error boundary. Catch it here and turn it into an ordinary error state,
 * so the form, and everything the reader typed into it, stays on screen.
 */
export async function submitWithFallback(
  submit: Submit,
  previous: LeadResult,
  formData: FormData,
  isOnline: () => boolean,
): Promise<LeadResult> {
  if (!isOnline()) return { status: "error", message: OFFLINE_MESSAGE };
  try {
    return await submit(previous, formData);
  } catch (caught) {
    console.error("[lead-form] submit failed before reaching the server", caught);
    return { status: "error", message: NETWORK_MESSAGE };
  }
}
