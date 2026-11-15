/**
 * Where the funnel hands off. Always a document load, never a client navigation: /payment's CSP and
 * Permissions-Policy, which Grow's wallet needs, apply only to a document.
 */
export const PAYMENT_PATH = "/payment";
/** A new account plays the free first workout here before the plans (owner, 2026-11-14); it leaves for PAYMENT_PATH. */
export const TASTER_PATH = "/taster";
/** A new account first sees its 28-day plan, then the plans (owner, 2026-11-15); closing the plans leads to TASTER_PATH. */
export const MY_PLAN_PATH = "/my-plan";
export const OTP_LENGTH = 6;
export const RESEND_SECONDS = 12;
export const SESSION_TTL_DAYS = 30;
/** The plan-building ring's run; its uneven curve is lib/funnel/plan-build (owner, 2026-11-14: slower). */
export const PLAN_BUILD_MS = 9000;

/** Birth-year picker, mirroring the app: ages 30 to 100, pre-selected at 65. */
export const MIN_AGE = 30;
export const MAX_AGE = 100;
export const DEFAULT_AGE = 65;
/** socialProof shows the age floored to this step, or the fallback without a DOB. */
export const AGE_BAND_STEP = 5;
export const AGE_BAND_FALLBACK = 50;
/** Pause on 100% before the loader moves on by itself. */
export const PLAN_BUILD_HOLD_MS = 500;
