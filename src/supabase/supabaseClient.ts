import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { AppError } from "../shared/errors.js";
import type { AppEnvironment } from "../config/environment.js";

export interface SupabaseConnectionStatus {
  configured: boolean;
  auth: "configured" | "missing";
  database: "configured" | "missing";
  storage: "configured" | "missing";
  missing: string[];
}

export function createSupabaseBrowserClient(env: AppEnvironment): SupabaseClient {
  assertSupabasePublicConfig(env);
  return createClient(env.supabaseUrl, env.supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}

export function createSupabaseServerClient(env: AppEnvironment): SupabaseClient {
  assertSupabasePublicConfig(env);
  return createClient(env.supabaseUrl, env.supabaseServiceRoleKey ?? env.supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

export function getSupabaseConnectionStatus(env: AppEnvironment): SupabaseConnectionStatus {
  const missing: string[] = [];
  if (!env.supabaseUrl || isPlaceholder(env.supabaseUrl)) {
    missing.push("SUPABASE_URL");
  }
  if (!env.supabaseAnonKey || isPlaceholder(env.supabaseAnonKey)) {
    missing.push("SUPABASE_ANON_KEY");
  }
  if (!env.supabaseStorageBucket || isPlaceholder(env.supabaseStorageBucket)) {
    missing.push("SUPABASE_STORAGE_BUCKET");
  }

  const configured = missing.length === 0;
  return {
    configured,
    auth: env.supabaseUrl && env.supabaseAnonKey && !isPlaceholder(env.supabaseUrl) && !isPlaceholder(env.supabaseAnonKey) ? "configured" : "missing",
    database: configured ? "configured" : "missing",
    storage: configured ? "configured" : "missing",
    missing,
  };
}

export async function verifySupabaseConnection(env: AppEnvironment): Promise<SupabaseConnectionStatus & {
  liveAuth: boolean;
  liveDatabase: boolean;
  liveStorage: boolean;
}> {
  const status = getSupabaseConnectionStatus(env);
  if (!status.configured) {
    return {
      ...status,
      liveAuth: false,
      liveDatabase: false,
      liveStorage: false,
    };
  }

  const client = createSupabaseServerClient(env);
  const auth = await client.auth.getSession();
  const database = await client.from("_ovs_connection_check").select("*").limit(1);
  const storage = await client.storage.getBucket(env.supabaseStorageBucket);

  return {
    ...status,
    liveAuth: !auth.error,
    liveDatabase: !database.error || database.error.code === "42P01" || database.error.code === "PGRST205",
    liveStorage: !storage.error,
  };
}

function assertSupabasePublicConfig(env: AppEnvironment): asserts env is AppEnvironment & {
  supabaseUrl: string;
  supabaseAnonKey: string;
} {
  const status = getSupabaseConnectionStatus(env);
  if (!status.configured) {
    throw new AppError(
      "SUPABASE_CONFIG_MISSING",
      `Supabase environment is missing: ${status.missing.join(", ")}.`,
      500,
    );
  }
}

function isPlaceholder(value: string): boolean {
  return value.includes("your-") || value.includes("example") || value.includes("placeholder");
}
