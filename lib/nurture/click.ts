/**
 * peilimplus.co.il/g/<token>: the link in each פעילים+ nurture WhatsApp (owner, 2026-11-24).
 * A click is counted (record_app_nurture_click, an unguessable per-message uuid) and the
 * visitor goes on to download the app. A bad token, or the count failing, still sends
 * them on: the visitor never waits for the count.
 */
const TOKEN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const NURTURE_DESTINATION = "/download";

export function isNurtureToken(value: string): boolean {
  return TOKEN.test(value);
}

export async function recordNurtureClick(token: string, env: { url?: string; anonKey?: string }, fetcher: typeof fetch = fetch): Promise<void> {
  if (!isNurtureToken(token) || !env.url || !env.anonKey) return;
  try {
    await fetcher(`${env.url}/rest/v1/rpc/record_app_nurture_click`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: env.anonKey, Authorization: `Bearer ${env.anonKey}` },
      body: JSON.stringify({ p_token: token }),
      signal: AbortSignal.timeout(2500),
    });
  } catch {
    // The download matters more than the count.
  }
}
