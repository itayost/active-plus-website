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
  /** Statuses for successive /otp calls (the last repeats); 200 sends the code. */
  otpStatuses?: number[];
  /** Replies for successive merge_funnel_session calls (the last repeats). */
  mergeStatuses?: number[];
  /**
   * The profile name once merge_funnel_session has been called, even when its
   * reply was a failure: a merge that committed on the server but whose
   * response never reached the browser.
   */
  profileAfterMerge?: string;
  /** A PostgREST error body for fill_missing_funnel_answers (e.g. the no-trainee-profile raise). */
  fillError?: { code: string; message: string };
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

/** Hosts the page may reach: the app itself and the stub. */
const ALLOWED = new Set(["localhost", "127.0.0.1", HOST]);

/** The nth reply of a sequence; the last one repeats. */
const nth = (list: number[], n: number) => list[Math.min(n, list.length - 1)];

/**
 * Answers Supabase auth and REST calls and returns every call it saw, in
 * order. Any request to a host other than localhost or the stub is aborted
 * and recorded in `foreign`.
 */
export async function stubSupabase(page: Page, options: StubOptions = {}) {
  const { profileName = null, otpStatuses = [200], mergeStatuses = [200], profileAfterMerge, fillError } = options;
  const calls: Call[] = [];
  const foreign: string[] = [];
  const held = new Map<string, Promise<void>>();
  let otps = 0;
  let merges = 0;

  // Registered first, so it runs last: everything the Supabase route below does not take.
  await page.route("**/*", (route) => {
    const { hostname } = new URL(route.request().url());
    if (ALLOWED.has(hostname)) return route.fallback();
    foreign.push(hostname);
    return route.abort();
  });

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
    await held.get(path);

    if (path === "/auth/v1/otp") {
      const status = nth(otpStatuses, otps);
      otps += 1;
      return status === 200 ? json(route, 200, {}) : json(route, status, { code: status, error_code: "sms_send_failed", msg: "stub" });
    }
    if (path === "/auth/v1/verify") {
      const token = (bodyOf(request) as { token?: string } | null)?.token;
      return token === GOOD_CODE
        ? json(route, 200, SESSION)
        : json(route, 403, { code: 403, error_code: "otp_expired", msg: "Token has expired or is invalid" });
    }
    if (path === "/auth/v1/user") return json(route, 200, USER);
    if (path === "/rest/v1/users") {
      const name = merges > 0 && profileAfterMerge ? profileAfterMerge : profileName;
      return json(route, 200, name === null ? [] : [{ full_name: name }]);
    }
    if (path === "/rest/v1/rpc/merge_funnel_session") {
      const status = nth(mergeStatuses, merges);
      merges += 1;
      return status === 200
        ? json(route, 200, { success: true, user_id: USER_ID, linked_events: 0 })
        : json(route, status, { code: "XX000", message: "stub failure" });
    }
    if (path === "/rest/v1/rpc/fill_missing_funnel_answers") {
      return fillError ? json(route, 400, { ...fillError, details: null, hint: null }) : json(route, 200, { success: true, filled: [] });
    }
    return json(route, 404, { message: "not stubbed" });
  });

  return {
    calls,
    /** Hosts other than the stub that the page tried to reach (must stay empty). */
    foreign,
    to: (path: string) => calls.filter((c) => c.path === path),
    /** Holds replies to `path` until the returned release() is called. */
    hold(path: string) {
      let release = () => {};
      held.set(path, new Promise<void>((resolve) => (release = resolve)));
      return () => {
        held.delete(path);
        release();
      };
    },
  };
}
