import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const env = loadEnv(resolve(process.cwd(), ".env.local"));
const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL || "";
const missing = !supabaseUrl || isPlaceholder(supabaseUrl) ? ["SUPABASE_URL"] : [];

if (missing.length > 0) {
  console.log(JSON.stringify({
    ok: false,
    reason: "missing_supabase_url",
    missing,
  }, null, 2));
  process.exit(1);
}

const endpoint = `${supabaseUrl.replace(/\/$/, "")}/functions/v1/ai`;
const unauthenticated = await fetch(endpoint, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ action: "provider-status" }),
});
let unauthenticatedBody = {};
try {
  unauthenticatedBody = await unauthenticated.json();
} catch {
  unauthenticatedBody = {};
}

const report = {
  ok: unauthenticated.status === 401,
  endpoint,
  unauthenticatedGate: {
    ok: unauthenticated.status === 401,
    status: unauthenticated.status,
    code: unauthenticatedBody?.code || unauthenticatedBody?.error?.code || "",
    message: unauthenticatedBody?.message || unauthenticatedBody?.error?.message || "",
  },
  optionalAuthenticatedProbe: {
    supported: Boolean(env.SUPABASE_TEST_ACCESS_TOKEN),
    ok: null,
    providerCount: 0,
    error: "",
  },
};

if (env.SUPABASE_TEST_ACCESS_TOKEN) {
  const authenticated = await fetch(endpoint, {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.SUPABASE_TEST_ACCESS_TOKEN}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ action: "provider-status" }),
  });
  const body = await authenticated.json().catch(() => ({}));
  report.optionalAuthenticatedProbe.ok = authenticated.ok && Array.isArray(body.providers);
  report.optionalAuthenticatedProbe.providerCount = Array.isArray(body.providers) ? body.providers.length : 0;
  report.optionalAuthenticatedProbe.error = body?.error?.message || "";
  report.ok = report.ok && report.optionalAuthenticatedProbe.ok;
}

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
