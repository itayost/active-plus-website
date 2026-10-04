/**
 * Sign-in failures are logged by code and status only. The error objects
 * Supabase returns can carry the phone number, the code or the visitor's name
 * in their message, so the message is never logged.
 */
export function logAuthFailure(stage: string, error: unknown): void {
  const e = (typeof error === "object" && error !== null ? error : {}) as { code?: unknown; status?: unknown; name?: unknown };
  const code = typeof e.code === "string" || typeof e.code === "number" ? e.code : undefined;
  const status = typeof e.status === "number" ? e.status : undefined;
  const name = typeof e.name === "string" ? e.name : undefined;
  console.error(`[funnel] ${stage} failed`, { code, status, name });
}
