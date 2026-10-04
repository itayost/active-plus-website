import { createClient } from "@supabase/supabase-js";

/**
 * Minimal schema for the one table this site writes to.
 *
 * Without a Database generic, supabase-js resolves every table to `never` and
 * `.insert()` fails to type-check — which is what kept this page from building,
 * and therefore from ever being deployed.
 *
 * Mirrors public.account_deletion_requests. Columns with defaults (id, status,
 * created_at, updated_at) are omitted from Insert on purpose.
 */
type AccountDeletionRequest = {
  id: string;
  email: string;
  status: string;
  ip_address: string | null;
  notes: string | null;
  processed_at: string | null;
  processed_by: string | null;
  created_at: string;
  updated_at: string;
};

/**
 * Mirrors the columns of public.leads that this website touches.
 *
 * public.leads is the CRM's existing production lead table, shared with the
 * Meta Lead Ads funnel — not a table this site owns. It has no columns for a
 * subject, a free-text message, a marketing opt-in or an IP, so those are
 * folded into raw_remark. `source` is a small fixed vocabulary in the CRM
 * ("meta", "website", "tiktok", "other"); website submissions use "website"
 * and record which page they came from inside raw_remark.
 */
type Lead = {
  id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  customer_status: string | null;
  process_status: string | null;
  source: string | null;
  raw_remark: string | null;
  created_at: string;
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      account_deletion_requests: {
        Row: AccountDeletionRequest;
        Insert: {
          email: string;
          ip_address?: string | null;
          notes?: string | null;
        };
        Update: Partial<AccountDeletionRequest>;
        Relationships: [];
      };
      leads: {
        Row: Lead;
        Insert: {
          full_name: string;
          phone: string;
          email?: string | null;
          customer_status?: string;
          process_status?: string;
          source?: string;
          raw_remark?: string | null;
        };
        Update: Partial<Lead>;
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};

// Server-side only — uses service role key
let serviceClient: ReturnType<typeof createClient<Database>> | null = null;

export function createServiceClient() {
  if (serviceClient) return serviceClient;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  serviceClient = createClient<Database>(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return serviceClient;
}
