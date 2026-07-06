import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const env = loadEnv(resolve(process.cwd(), ".env.local"));
const required = ["SUPABASE_URL", "SUPABASE_ANON_KEY", "SUPABASE_STORAGE_BUCKET"];
const missing = required.filter((key) => !env[key] || isPlaceholder(env[key]));

if (missing.length > 0) {
  console.log(JSON.stringify({
    ok: false,
    reason: "missing_supabase_environment",
    missing,
  }, null, 2));
  process.exit(1);
}

const client = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

const auth = await client.auth.getSession();
const database = await client.from("_ovs_connection_check").select("*").limit(1);
const storage = await client.storage.getBucket(env.SUPABASE_STORAGE_BUCKET);

const databaseOk = !database.error || database.error.code === "42P01" || database.error.code === "PGRST205";
const result = {
  ok: !auth.error && databaseOk && !storage.error,
  auth: { ok: !auth.error, error: auth.error?.message },
  database: { ok: databaseOk, error: database.error?.message, code: database.error?.code },
  storage: { ok: !storage.error, bucket: env.SUPABASE_STORAGE_BUCKET, error: storage.error?.message },
};

console.log(JSON.stringify(result, null, 2));
process.exit(result.ok ? 0 : 1);

function loadEnv(path) {
  const output = { ...process.env };
  if (!existsSync(path)) {
    return output;
  }
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const index = trimmed.indexOf("=");
    if (index === -1) {
      continue;
    }
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, "");
    output[key] = value;
  }
  return output;
}

function isPlaceholder(value) {
  return value.includes("your-") || value.includes("placeholder") || value.includes("example");
}
