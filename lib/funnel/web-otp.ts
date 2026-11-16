"use client";

import { useEffect, useRef } from "react";
import { codeDigits } from "./signin";

type OtpCredential = Credential & { code?: string };

/** Whether this browser can read a code from an SMS (Chrome on Android; not Safari, not Samsung Internet). */
export function webOtpSupported(): boolean {
  return typeof window !== "undefined" && "OTPCredential" in window && typeof navigator.credentials?.get === "function";
}

/**
 * Waits for the code SMS and hands its code over (owner, 2026-11-16). Chrome on Android
 * reads only an SMS whose last line is "@<this site's host> #<code>", and asks the
 * visitor once before it fills. Resolves null when unsupported, aborted, refused or
 * timed out: the visitor types the code as before.
 */
export async function readSmsCode(signal: AbortSignal): Promise<string | null> {
  if (!webOtpSupported()) return null;
  try {
    const credential = (await navigator.credentials.get({
      otp: { transport: ["sms"] },
      signal,
    } as CredentialRequestOptions)) as OtpCredential | null;
    const code = codeDigits(credential?.code ?? "");
    return code || null;
  } catch {
    // AbortError on leaving the screen, NotAllowedError when the visitor said no.
    return null;
  }
}

/**
 * While `active`, listens for the code SMS; a new `attempt` (a resend) listens again.
 * `onCode` gets the digits once, as if typed. iPhones need none of this: the
 * input's autocomplete="one-time-code" offers the code above the keyboard.
 */
export function useSmsCode(active: boolean, attempt: unknown, onCode: (code: string) => void): void {
  const latest = useRef(onCode);
  useEffect(() => {
    latest.current = onCode;
  }, [onCode]);
  useEffect(() => {
    if (!active) return;
    const controller = new AbortController();
    void readSmsCode(controller.signal).then((code) => {
      if (code && !controller.signal.aborted) latest.current(code);
    });
    return () => controller.abort();
  }, [active, attempt]);
}
