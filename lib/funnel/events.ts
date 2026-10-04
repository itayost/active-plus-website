import { FUNNEL_STEPS } from "./contract.generated";
import type { Step } from "./types";

/**
 * Event names match the app's FunnelEventTracker (FitnessForSeniorsApp,
 * ios/.../Views/Funnel: `FunnelEventTracker.shared.track(step: "...")`), so the
 * admin dashboard combines both platforms. Steps the app does not emit a view
 * event for (dob, payment on the website's step list) use "<snake_case_step>_view".
 */
export const VIEW_EVENT: Record<Step, string> = {
  welcome2: "welcome2_view",
  gender: "questionnaire_q5_view",
  dob: "dob_view",
  socialProof: "social_proof_view",
  aspiration: "questionnaire_aspiration_view",
  activityLevel: "activity_level_view",
  chairRise: "questionnaire_chair_rise_view",
  challengeArea: "challenge_area_view",
  standingComfort: "standing_comfort_view",
  reinforcement2: "reinforcement2_view",
  frequency: "training_frequency_view",
  bodyAreas: "questionnaire_q6_view",
  planBuilding: "plan_build_view",
  time: "questionnaire_q8_view",
  register: "register_view",
  otp: "otp_view",
  payment: "payment_view",
};

/** Action events: the app's names, plus otp_verified (website only). */
export const ACTION_EVENTS = [
  "welcome2_continue",
  "social_proof_continue",
  "reinforcement2_continue",
  "plan_build_complete",
  "register_name_submit",
  "register_submit",
  "otp_resend_tap",
  "otp_edit_phone_tap",
  "otp_verified",
] as const;

export type ActionEvent = (typeof ACTION_EVENTS)[number];
export type FunnelEventName = (typeof VIEW_EVENT)[Step] | ActionEvent;

export const FUNNEL_EVENT_NAMES: ReadonlySet<string> = new Set<string>([
  ...FUNNEL_STEPS.map((step) => VIEW_EVENT[step]),
  ...ACTION_EVENTS,
]);

export const MAX_DATA_BYTES = 2048;
/** Raw request body cap, checked by the route before parsing. */
export const MAX_BODY_BYTES = 4096;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PII_KEYS = new Set(["phone", "full_name", "name"]);

export type ParsedFunnelEvent = {
  sessionId: string;
  /** The event name; stored in funnel_events.step, as the app does. */
  step: string;
  data: Record<string, unknown>;
};

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** Validates an incoming analytics body. Returns null for anything that must not be stored. */
export function parseFunnelEvent(body: unknown): ParsedFunnelEvent | null {
  if (!isPlainObject(body)) return null;
  const { sessionId, step, data } = body;
  if (typeof sessionId !== "string" || !UUID.test(sessionId)) return null;
  if (typeof step !== "string" || !FUNNEL_EVENT_NAMES.has(step)) return null;
  if (data !== undefined && !isPlainObject(data)) return null;

  const kept = Object.fromEntries(Object.entries(data ?? {}).filter(([key]) => !PII_KEYS.has(key.toLowerCase())));
  if (new TextEncoder().encode(JSON.stringify(kept)).length > MAX_DATA_BYTES) return null;
  return { sessionId: sessionId.toLowerCase(), step, data: kept };
}
