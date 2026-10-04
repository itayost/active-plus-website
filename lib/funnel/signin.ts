import type { SupabaseClient } from "@supabase/supabase-js";
import { logAuthFailure } from "./log";

type Auth = Pick<SupabaseClient, "auth">;

/** Sends the SMS code (delivered by the project's sendAuthOtpSms hook). */
export async function sendCode(supabase: Auth, e164: string): Promise<boolean> {
  try {
    const { error } = await supabase.auth.signInWithOtp({ phone: e164 });
    if (!error) return true;
    logAuthFailure("otp:send", error);
  } catch (caught) {
    logAuthFailure("otp:send", caught);
  }
  return false;
}

export type VerifyResult = "ok" | "invalid" | "rateLimited" | "error";

const TOO_MANY = 429;

function classify(error: unknown): VerifyResult {
  const status = (error as { status?: unknown } | null)?.status;
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
