import type { SupabaseClient } from "@supabase/supabase-js";
import { OTP_LENGTH } from "./constants";
import { COPY } from "./copy";
import { logAuthFailure } from "./log";

type Auth = Pick<SupabaseClient, "auth">;

export type SendResult = "ok" | "rateLimited" | "error";

const TOO_MANY = 429;
const statusOf = (error: unknown) => (error as { status?: unknown } | null)?.status;

/** Supabase's refusal when shouldCreateUser is false and no user has the number (422 otp_disabled). */
function isNoAccount(error: unknown): boolean {
  const { code, message } = (error ?? {}) as { code?: unknown; message?: unknown };
  return code === "otp_disabled" || (typeof message === "string" && /signups not allowed for otp/i.test(message));
}

/**
 * Sends the SMS code (delivered by the project's sendAuthOtpSms hook).
 * `existingOnly`: never create a user for an unknown number (the account
 * page). Supabase then refuses and sends nothing, but the answer is "ok": the
 * visitor gets the same code screen as for a known number, so the page never
 * says whether a number has an account.
 */
export async function sendCode(supabase: Auth, e164: string, opts: { existingOnly?: boolean } = {}): Promise<SendResult> {
  try {
    const { error } = await supabase.auth.signInWithOtp(
      opts.existingOnly ? { phone: e164, options: { shouldCreateUser: false } } : { phone: e164 },
    );
    if (!error) return "ok";
    logAuthFailure("otp:send", error);
    if (statusOf(error) === TOO_MANY) return "rateLimited";
    return opts.existingOnly && isNoAccount(error) ? "ok" : "error";
  } catch (caught) {
    logAuthFailure("otp:send", caught);
    return "error";
  }
}

export type VerifyResult = "ok" | "invalid" | "rateLimited" | "error";

/** What a failed verify tells the visitor (the funnel's code step and the account page's). */
export const VERIFY_MESSAGE: Record<Exclude<VerifyResult, "ok">, string> = {
  invalid: COPY.otp.wrongCode,
  rateLimited: COPY.otp.rateLimited,
  error: COPY.otp.verifyFailed,
};

/** A typed or pasted code as the field keeps it: digits only, at most OTP_LENGTH. */
export const codeDigits = (value: string): string => value.replace(/\D/g, "").slice(0, OTP_LENGTH);

function classify(error: unknown): VerifyResult {
  const status = statusOf(error);
  if (status === TOO_MANY) return "rateLimited";
  // Supabase answers a wrong or expired code with 4xx (otp_expired / invalid token).
  if (typeof status === "number" && status >= 400 && status < 500) return "invalid";
  return "error";
}

/** Verifies the code; on "ok" the browser client holds the new session. */
export async function verifyCode(supabase: Auth, e164: string, token: string): Promise<VerifyResult> {
  try {
    const { error } = await supabase.auth.verifyOtp({ phone: e164, token, type: "sms" });
    if (!error) return "ok";
    logAuthFailure("otp:verify", error);
    return classify(error);
  } catch (caught) {
    logAuthFailure("otp:verify", caught);
    return "error";
  }
}
