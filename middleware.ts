import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { GROW_NOTIFY_PATH } from "@/lib/domains";
import { growNotifyDecision } from "@/lib/grow-notify";

/** Grow's server callbacks: only Grow's IPs reach growWebhook, with the proxy secret (lib/grow-notify.ts). */
function growNotify(request: NextRequest): NextResponse {
  const decision = growNotifyDecision(request.headers, {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    proxySecret: process.env.GROW_PROXY_SECRET,
  });
  if (decision.kind === "unconfigured") return NextResponse.json({ code: "not_configured" }, { status: 503 });
  if (decision.kind === "denied") {
    console.warn(JSON.stringify({ fn: "growNotify", event: "ip_denied", ip: decision.ip }));
    return NextResponse.json({ code: "forbidden" }, { status: 403 });
  }
  return NextResponse.rewrite(decision.destination, { request: { headers: decision.headers } });
}

/** Refreshes the visitor's Supabase session cookies on the funnel, checkout and account routes only. */
export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === GROW_NOTIFY_PATH) return growNotify(request);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  // Preview builds without the public env must not fail every request.
  if (!url || !key) return NextResponse.next();

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  await supabase.auth.getUser();
  return response;
}

// Scoped matcher: never runs on static assets or other pages.
export const config = { matcher: ["/questionnaire", "/payment/:path*", "/account/:path*", "/api/checkout/:path*", "/api/grow/notify"] };
