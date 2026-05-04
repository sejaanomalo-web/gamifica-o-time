import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseUrl, getSupabasePublicKey } from "./env";

export const createClient = () =>
  createBrowserClient(getSupabaseUrl(), getSupabasePublicKey());
