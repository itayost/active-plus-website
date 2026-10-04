import { afterEach, describe, expect, it, vi } from "vitest";
import { publicSupabaseEnv } from "@/lib/supabase/env";

afterEach(() => vi.unstubAllEnvs());

describe("publicSupabaseEnv", () => {
  it("returns both public values", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon");
    expect(publicSupabaseEnv()).toEqual({ url: "https://example.supabase.co", anonKey: "anon" });
  });

  it("names every missing variable", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
    expect(() => publicSupabaseEnv()).toThrow(
      "Supabase is not configured: missing NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  });

  it("names the one that is missing", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
    expect(() => publicSupabaseEnv()).toThrow(/missing NEXT_PUBLIC_SUPABASE_ANON_KEY$/);
  });
});
