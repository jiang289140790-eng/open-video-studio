import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const env = loadEnv(resolve(process.cwd(), ".env.local"));
const appUrl = trimSlash(env.APP_URL || "http://127.0.0.1:4173");
const required = ["SUPABASE_URL", "SUPABASE_ANON_KEY"];
const missing = required.filter((key) => !env[key] || isPlaceholder(env[key]));

const report = {
  ok: false,
  supabase: {
    configured: missing.length === 0,
    missing,
    providers: [],
  },
  telegram: {
    configured: Boolean(env.VITE_TELEGRAM_BOT_USERNAME && env.VITE_TELEGRAM_AUTH_URL && !isPlaceholder(env.VITE_TELEGRAM_AUTH_URL)),
    botUsername: mask(env.VITE_TELEGRAM_BOT_USERNAME),
    authUrlConfigured: Boolean(env.VITE_TELEGRAM_AUTH_URL && !isPlaceholder(env.VITE_TELEGRAM_AUTH_URL)),
  },
  redirectTo: `${appUrl}/zh/login/`,
};

if (missing.length === 0) {
  const client = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  for (const provider of ["google", "twitter", "discord"]) {
    const result = await client.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: report.redirectTo,
        skipBrowserRedirect: true,
      },
    });
    report.supabase.providers.push({
      provider,
      ok: Boolean(result.data?.url && !result.error),
      authorizationUrlCreated: Boolean(result.data?.url),
      error: result.error?.message ?? "",
    });
  }
}

report.ok =
  report.supabase.configured &&
  report.supabase.providers.every((provider) => provider.ok) &&
  report.telegram.configured;

console.log(JSON.stringify(report, null, 2));
process.exitCode = report.ok ? 0 : 1;

function loadEnv(path) {
  const output = { ...process.env };
  if (!existsSync(path)) return output;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    output[key] = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, "");
  }
  return output;
}

function isPlaceholder(value = "") {
  return value.includes("your-") || value.includes("placeholder") || value.includes("example");
}

function trimSlash(value) {
  return String(value).replace(/\/$/, "");
}

function mask(value = "") {
  if (!value) return "";
  return value.length <= 4 ? "****" : `${value.slice(0, 2)}***${value.slice(-2)}`;
}
