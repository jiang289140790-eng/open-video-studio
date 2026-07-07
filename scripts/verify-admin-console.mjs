import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const env = loadEnv(resolve(process.cwd(), ".env.local"));
const required = ["SUPABASE_URL", "SUPABASE_ANON_KEY"];
const missing = required.filter((key) => !env[key] || isPlaceholder(env[key]));

if (missing.length > 0) {
  reportAndExit({
    ok: false,
    reason: "missing_supabase_environment",
    missing,
  });
}

const adminTables = [
  "profiles",
  "credit_transactions",
  "generation_jobs",
  "media_assets",
  "share_links",
  "characters",
  "images",
  "videos",
  "orders",
  "audit_logs",
];

const key = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY;
const client = createClient(env.SUPABASE_URL, key, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

const tables = [];
for (const table of adminTables) {
  const result = await client.from(table).select("*", { count: "exact", head: true });
  tables.push({
    table,
    ok: !result.error,
    count: result.count,
    error: result.error?.message,
    code: result.error?.code,
  });
}

const functionCheck = await checkAdminFunction(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
const ok = tables.every((table) => table.ok) && functionCheck.ok;

reportAndExit({
  ok,
  database: {
    usingServiceRole: Boolean(env.SUPABASE_SERVICE_ROLE_KEY),
    tables,
  },
  edgeFunction: functionCheck,
  nextSteps: ok ? [] : [
    "Apply supabase/migrations/202607070001_mvp_admin_console.sql in Supabase SQL Editor.",
    "Deploy supabase/functions/admin/index.ts as the admin Edge Function.",
    "Set SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY as Supabase Function secrets.",
    "Set your profile role to admin: update public.profiles set role = 'admin' where email = 'YOUR_EMAIL';",
  ],
});

async function checkAdminFunction(supabaseUrl, anonKey) {
  const endpoint = `${supabaseUrl.replace(/\/$/, "")}/functions/v1/admin`;
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
      body: JSON.stringify({ action: "dashboard-summary" }),
    });
    const body = await response.json().catch(() => ({}));
    const code = body?.error?.code;
    return {
      ok: response.status === 401 && code === "ADMIN_AUTH_REQUIRED" || response.status === 403 && code === "ADMIN_FORBIDDEN",
      endpoint,
      status: response.status,
      expectedUnauthenticatedCode: "ADMIN_AUTH_REQUIRED",
      code,
      message: body?.error?.message,
    };
  } catch (error) {
    return {
      ok: false,
      endpoint,
      status: 0,
      error: error instanceof Error ? error.message : "Unknown function check error",
    };
  }
}

function reportAndExit(report) {
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.ok ? 0 : 1);
}

function loadEnv(path) {
  const output = { ...process.env };
  if (!existsSync(path)) return output;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, "");
    output[key] = value;
  }
  return output;
}

function isPlaceholder(value) {
  return value.includes("your-") || value.includes("placeholder") || value.includes("example");
}
