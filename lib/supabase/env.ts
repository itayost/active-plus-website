/**
 * The two public Supabase values, or a readable error naming what is missing.
 * Both names are written out literally so Next inlines them into the browser bundle.
 */
export function publicSupabaseEnv(): { url: string; anonKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const missing = [!url && "NEXT_PUBLIC_SUPABASE_URL", !anonKey && "NEXT_PUBLIC_SUPABASE_ANON_KEY"].filter(Boolean);
  if (!url || !anonKey) throw new Error(`Supabase is not configured: missing ${missing.join(" and ")}`);
  return { url, anonKey };
}
