export const OTP_LENGTH = 6;
export const RESEND_SECONDS = 12;
export const SESSION_TTL_DAYS = 30;
export const PLAN_BUILD_MS = 6000;

/** Birth-year picker, mirroring the app: ages 30 to 100, pre-selected at 65. */
export const MIN_AGE = 30;
export const MAX_AGE = 100;
export const DEFAULT_AGE = 65;
/** socialProof shows the age floored to this step, or the fallback without a DOB. */
export const AGE_BAND_STEP = 5;
export const AGE_BAND_FALLBACK = 50;
/**
 * A tapped single-choice answer stays highlighted this long, then the next
 * screen opens by itself: long enough to see the choice land (and tap another
 * to change it), short enough to feel instant. "המשך" stays for keyboards and
 * for a returning visitor whose answer is already chosen.
 */
export const AUTO_ADVANCE_MS = 450;
/** Pause on 100% before the loader moves on by itself. */
export const PLAN_BUILD_HOLD_MS = 500;
