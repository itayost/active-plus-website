import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { publicSupabaseEnv } from "./env";

/** The visitor's session on the server (route handlers, server actions). */
export async function getServerSupabase() {
  const store = await cookies();
  const { url, anonKey } = publicSupabaseEnv();
  return createServerClient(url, anonKey, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          // Server Components cannot set cookies and Next throws here. The
          // middleware refreshes the session cookies on the routes that need
          // them, so a read-only render can safely skip the write.
        }
      },
    },
  });
}
