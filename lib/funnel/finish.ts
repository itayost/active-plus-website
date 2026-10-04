import type { SupabaseClient } from "@supabase/supabase-js";
import { logAuthFailure } from "./log";
import { buildMergePayload } from "./payload";
import type { Answers } from "./types";

/**
 * `path` on an error says which RPC failed. A merge can succeed on the server
 * and still fail on the client (a dropped response), after which the profile
 * has a name and a retry would look like a returning user; the caller uses
 * the path to keep treating that visitor as new.
 */
export type FinishResult =
  | { kind: "new" }
  | { kind: "existing"; name: string }
  | { kind: "error"; path?: "new" | "existing" };

const ERROR: FinishResult = { kind: "error" };

/** An RPC reply counts only when it has no error and does not say success: false. */
function failed(data: unknown, error: unknown): boolean {
  if (error) return true;
  return typeof data === "object" && data !== null && (data as { success?: unknown }).success === false;
}

async function run(supabase: SupabaseClient, sessionId: string, answers: Answers): Promise<FinishResult> {
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) {
    logAuthFailure("finish:user", authError);
    return ERROR;
  }

  // The app reads the user's own row the same way (SupabaseManager+User.fetchUser).
  const { data: profile, error: readError } = await supabase
    .from("users")
    .select("full_name")
    .eq("id", auth.user.id)
    .maybeSingle();
  // A failed read must not fall through to the new-user merge: that would
  // overwrite an existing user's name with the one typed here.
  if (readError) {
    logAuthFailure("finish:profile", readError);
    return ERROR;
  }

  const existingName = (profile as { full_name?: string | null } | null)?.full_name?.trim();
  const payload = buildMergePayload(answers);

  if (existingName) {
    // fill_missing_funnel_answers never writes full_name; sending it would suggest otherwise.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { full_name: _drop, ...rest } = payload;
    const { data, error } = await supabase.rpc("fill_missing_funnel_answers", { p_answers: rest });
    if (failed(data, error)) {
      logAuthFailure("finish:fill", error);
      return { kind: "error", path: "existing" };
    }
    return { kind: "existing", name: existingName };
  }

  const { data, error } = await supabase.rpc("merge_funnel_session", { p_session_id: sessionId, p_answers: payload });
  if (failed(data, error)) {
    logAuthFailure("finish:merge", error);
    return { kind: "error", path: "new" };
  }
  return { kind: "new" };
}

/**
 * After verifyOtp: a new user's answers become their profile (merge_funnel_session);
 * an existing user (non-empty full_name) only has missing answers filled in.
 * Never throws: every failure is { kind: "error" }, and the caller may retry.
 */
export async function finishSignup(supabase: SupabaseClient, sessionId: string, answers: Answers): Promise<FinishResult> {
  try {
    return await run(supabase, sessionId, answers);
  } catch (caught) {
    logAuthFailure("finish:thrown", caught);
    return ERROR;
  }
}
