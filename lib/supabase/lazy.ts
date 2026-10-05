"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import { logAuthFailure } from "@/lib/funnel/log";

/**
 * The browser client, loaded on first use: supabase-js is only needed from
 * register onward, so the questionnaire's first screens do not download it.
 * Resolves to null (logged, never thrown) when the public env is missing.
 */
export async function loadBrowserSupabase(): Promise<SupabaseClient | null> {
  try {
    const { getBrowserSupabase } = await import("./browser");
    return getBrowserSupabase();
  } catch (caught) {
    logAuthFailure("supabase:client", caught);
    return null;
  }
}

/** The browser client when it holds a session; null without the client or when signed out. */
export async function loadSupabaseSession(): Promise<SupabaseClient | null> {
  const supabase = await loadBrowserSupabase();
  const session = supabase ? (await supabase.auth.getSession()).data.session : null;
  return session ? supabase : null;
}
