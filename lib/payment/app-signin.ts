"use client";

import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * After paying, a one-time code that opens the app already signed in (owner, 2026-11-21): the
 * download link carries it to Google Play (Android reads it from the install referrer) and the
 * "פתיחת האפליקציה" button opens activeplus://signin?code=... on a phone that has the app.
 * The server (createAppSignin) spends this page's refresh token to prove who asks, so the page
 * then forgets its session without calling the server: a later refresh here would reuse a spent
 * token and end the app's session too. The code is kept in this tab for a reload.
 */
export const SIGNIN_CODE_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const KEY = "ap.app.signin";

export type AppSignin = { code: string; expiresAt: number };

/** Pure: a stored value still in time, or null. */
export function parseAppSignin(raw: string | null, now = Date.now()): AppSignin | null {
  try {
    const v = JSON.parse(raw ?? "null") as Partial<AppSignin> | null;
    if (!v || typeof v.code !== "string" || !SIGNIN_CODE_PATTERN.test(v.code)) return null;
    if (typeof v.expiresAt !== "number" || v.expiresAt <= now) return null;
    return { code: v.code, expiresAt: v.expiresAt };
  } catch {
    return null;
  }
}

export function storedAppSignin(): AppSignin | null {
  try {
    return parseAppSignin(sessionStorage.getItem(KEY));
  } catch {
    return null;
  }
}

/** The site's own Supabase auth cookies, removed in this browser only (no logout call). */
function forgetLocalSession(supabase: SupabaseClient): void {
  try {
    supabase.auth.stopAutoRefresh();
  } catch {
    // Older clients: the cookies below are what matters.
  }
  for (const part of document.cookie.split(";")) {
    const name = part.split("=")[0]?.trim();
    if (name && name.startsWith("sb-") && name.includes("auth-token")) {
      document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`;
    }
  }
}

/** Asks for the code once; null when it cannot (no session, server error). */
export async function createAppSignin(supabase: SupabaseClient): Promise<AppSignin | null> {
  const existing = storedAppSignin();
  if (existing) return existing;
  const session = (await supabase.auth.getSession()).data.session;
  if (!session?.refresh_token) return null;
  const { data, error } = await supabase.functions.invoke("createAppSignin", { body: { refresh_token: session.refresh_token } });
  const code = (data as { code?: unknown } | null)?.code;
  const expires = Date.parse(String((data as { expires_at?: unknown } | null)?.expires_at ?? ""));
  if (error || typeof code !== "string" || !SIGNIN_CODE_PATTERN.test(code) || !Number.isFinite(expires)) return null;
  // The server spent this page's refresh token: forget it here before anything refreshes it.
  forgetLocalSession(supabase);
  const signin = { code, expiresAt: expires };
  try {
    sessionStorage.setItem(KEY, JSON.stringify(signin));
  } catch {
    // Blocked storage: the buttons still carry the code until the page closes.
  }
  return signin;
}

/** The download link with the code for Google Play; the plain one link without it. */
export function downloadHref(code: string | null): string {
  const params = new URLSearchParams({ utm_source: "website", utm_medium: "payment_success" });
  if (code) params.set("signin", code);
  return `/download?${params.toString()}`;
}

export const openAppHref = (code: string) => `activeplus://signin?code=${code}`;
