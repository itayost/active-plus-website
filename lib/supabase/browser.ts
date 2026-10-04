"use client";

import { createBrowserClient } from "@supabase/ssr";
import { publicSupabaseEnv } from "./env";

let client: ReturnType<typeof createBrowserClient> | null = null;

/** Anon-key client for the visitor's own session (phone OTP, own-row reads, RPCs). */
export function getBrowserSupabase() {
  if (client) return client;
  const { url, anonKey } = publicSupabaseEnv();
  client = createBrowserClient(url, anonKey);
  return client;
}
