import type { Page, Request, Route } from "@playwright/test";

/**
 * The Supabase project the e2e server is built against: `.invalid` never
 * resolves, so nothing can leave the machine. Sign-in tests answer every auth
 * and REST call from here with page.route, and refuse any other host.
 */
export const E2E_SUPABASE = {
  url: "https://stub.supabase.invalid",
  anonKey: "e2e-anon-key",
} as const;

const HOST = new URL(E2E_SUPABASE.url).hostname;

export const GOOD_CODE = "123456";
export const USER_ID = "00000000-0000-4000-8000-000000000001";

const b64url = (value: object) => Buffer.from(JSON.stringify(value)).toString("base64url");
const FAR = Math.floor(Date.now() / 1000) + 86_400 * 365;

/** A well-formed but unsigned token: the stubs never check it, the client only stores it. */
export const ACCESS_TOKEN = `${b64url({ alg: "HS256", typ: "JWT" })}.${b64url({
  sub: USER_ID,
  role: "authenticated",
  aud: "authenticated",
  exp: FAR,
})}.c3R1Yg`;

const USER = {
  id: USER_ID,
  aud: "authenticated",
  role: "authenticated",
  phone: "972501234567",
  app_metadata: { provider: "phone" },
  user_metadata: {},
  created_at: "2026-10-04T00:00:00Z",
};

const SESSION = {
  access_token: ACCESS_TOKEN,
  token_type: "bearer",
  expires_in: 3600,
  expires_at: FAR,
  refresh_token: "e2e-refresh",
  user: USER,
};

export type StubOptions = {
  /** null = a new user (no profile row yet). */
  profileName?: string | null;
  /** HTTP status of /otp; 200 sends the code. */
  otpStatus?: number;
  /** Replies for successive merge_funnel_session calls (the last repeats). */
  mergeStatuses?: number[];
};

export type Call = { path: string; body: unknown; authorization: string | null };

/** The page (localhost) calls the stub host cross-origin, so every reply carries CORS headers. */
const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "*",
  "access-control-allow-methods": "GET, POST, PATCH, DELETE, OPTIONS",
};

const json = (route: Route, status: number, body: unknown) =>
  route.fulfill({ status, headers: CORS, contentType: "application/json", body: JSON.stringify(body) });

function bodyOf(request: Request): unknown {
  try {
    return request.postDataJSON();
  } catch {
    return null;
  }
}

/** Answers Supabase auth and REST calls; returns every call it saw, in order. */
export async function stubSupabase(page: Page, options: StubOptions = {}) {
  const { profileName = null, otpStatus = 200, mergeStatuses = [200] } = options;
  const calls: Call[] = [];
  const foreign: string[] = [];
  let merges = 0;

  await page.route(/\/(auth|rest)\/v1\//, async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.hostname !== HOST) {
      foreign.push(url.hostname);
      return route.abort();
    }
    if (request.method() === "OPTIONS") return route.fulfill({ status: 204, headers: CORS });
    const path = url.pathname;
    calls.push({ path, body: bodyOf(request), authorization: await request.headerValue("authorization") });

    if (path === "/auth/v1/otp") {
      return otpStatus === 200 ? json(route, 200, {}) : json(route, otpStatus, { code: otpStatus, error_code: "sms_send_failed", msg: "stub" });
    }
    if (path === "/auth/v1/verify") {
      const token = (bodyOf(request) as { token?: string } | null)?.token;
      return token === GOOD_CODE
        ? json(route, 200, SESSION)
        : json(route, 403, { code: 403, error_code: "otp_expired", msg: "Token has expired or is invalid" });
    }
    if (path === "/auth/v1/user") return json(route, 200, USER);
    if (path === "/rest/v1/users") return json(route, 200, profileName === null ? [] : [{ full_name: profileName }]);
    if (path === "/rest/v1/rpc/merge_funnel_session") {
      const status = mergeStatuses[Math.min(merges, mergeStatuses.length - 1)];
      merges += 1;
      return status === 200
        ? json(route, 200, { success: true, user_id: USER_ID, linked_events: 0 })
        : json(route, status, { code: "XX000", message: "stub failure" });
    }
    if (path === "/rest/v1/rpc/fill_missing_funnel_answers") return json(route, 200, { success: true, filled: [] });
    return json(route, 404, { message: "not stubbed" });
  });

  return {
    calls,
    /** Hosts other than the stub that the page tried to reach (must stay empty). */
    foreign,
    to: (path: string) => calls.filter((c) => c.path === path),
  };
}
