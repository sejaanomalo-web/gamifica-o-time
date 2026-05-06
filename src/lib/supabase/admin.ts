// Supabase admin client — service role. Bypassa RLS, usado APENAS em route
// handlers server-side gateadas por requireAdmin(). NUNCA importar em client.

import { createClient } from "@supabase/supabase-js";
import { getSupabaseUrl, getSupabaseSecretKey } from "./env";

export function createAdminClient() {
  return createClient(getSupabaseUrl(), getSupabaseSecretKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
