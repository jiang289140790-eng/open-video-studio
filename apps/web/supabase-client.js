import { createClient } from "@supabase/supabase-js";

export const PRODUCTION_SITE_URL = "https://jiang289140790-eng.github.io/open-video-studio/";

const supabaseUrl = String(import.meta.env.VITE_SUPABASE_URL || "").trim();
const supabaseBrowserKey = String(import.meta.env.VITE_SUPABASE_ANON_KEY || "").trim();

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseBrowserKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseBrowserKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: "pkce"
      }
    })
  : null;

export function getSupabaseClient() {
  if (!supabase) throw new Error("Supabase browser configuration is missing.");
  return supabase;
}
