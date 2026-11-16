"use client";

import { loadSupabaseSession } from "@/lib/supabase/lazy";

/**
 * The signed-in visitor's phone in the local form people read and type ("050-1234567"),
 * from the session's E.164 number. Null when signed out or not an Israeli mobile.
 */
export function localPhone(e164: string | null | undefined): string | null {
  const digits = (e164 ?? "").replace(/\D/g, "");
  const local = digits.startsWith("972") ? `0${digits.slice(3)}` : digits;
  return /^05\d{8}$/.test(local) ? `${local.slice(0, 3)}-${local.slice(3)}` : null;
}

/** The number verified by SMS in this browser, or null. Never throws. */
export async function sessionPhone(): Promise<string | null> {
  try {
    const supabase = await loadSupabaseSession();
    if (!supabase) return null;
    const { data } = await supabase.auth.getUser();
    return localPhone(data.user?.phone);
  } catch {
    return null;
  }
}
