import { existsSync, readFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";

const env = loadEnv(resolve(process.cwd(), ".env.local"));
const slug = process.argv[2] || "";
const projectRef = env.SUPABASE_PROJECT_REF || readProjectRef() || "";
const accessToken = env.SUPABASE_ACCESS_TOKEN || "";

if (!slug) fail("Usage: npm run deploy:function -- <function-slug>");
if (!/^[a-z0-9_-]+$/i.test(slug)) fail("Function slug may only contain letters, numbers, underscores, and dashes.");
if (!projectRef) fail("SUPABASE_PROJECT_REF or supabase/config.toml project_id is required.");
if (!accessToken || isPlaceholder(accessToken)) fail("SUPABASE_ACCESS_TOKEN is required in .env.local.");

const functionDir = resolve(process.cwd(), "supabase", "functions", slug);
const entrypoint = join(functionDir, "index.ts");
if (!existsSync(entrypoint)) fail(`Function entrypoint not found: ${entrypoint}`);

const source = readFileSync(entrypoint);
const metadata = {
  name: slug,
  entrypoint_path: "index.ts",
  verify_jwt: slug !== "telegram-auth",
};
const form = new FormData();
form.append("metadata", JSON.stringify(metadata));
form.append("file", new Blob([source], { type: "application/typescript" }), basename(entrypoint));

const url = `https://api.supabase.com/v1/projects/${projectRef}/functions/deploy?slug=${encodeURIComponent(slug)}`;
const response = await fetch(url, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${accessToken}`,
  },
  body: form,
});
const text = await response.text();
let body = {};
try {
  body = text ? JSON.parse(text) : {};
} catch {
  body = { message: text.slice(0, 500) };
}

if (!response.ok) {
  console.error(JSON.stringify({
    ok: false,
    slug,
    projectRef,
    status: response.status,
    message: body?.message || body?.error || response.statusText,
  }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  ok: true,
  slug: body.slug || slug,
  projectRef,
  version: body.version ?? null,
  status: body.status || "deployed",
  verifyJwt: body.verify_jwt ?? metadata.verify_jwt,
  entrypointPath: body.entrypoint_path || metadata.entrypoint_path,
}, null, 2));

function loadEnv(path) {
  const output = { ...process.env };
  if (!existsSync(path)) return output;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    output[trimmed.slice(0, index).trim()] = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, "");
  }
  return output;
}

function readProjectRef() {
  const configPath = resolve(process.cwd(), "supabase", "config.toml");
  if (!existsSync(configPath)) return "";
  const match = readFileSync(configPath, "utf8").match(/project_id\s*=\s*"([^"]+)"/);
  return match?.[1] || "";
}

function isPlaceholder(value = "") {
  return value.includes("your-") || value.includes("placeholder") || value.includes("example");
}

function fail(message) {
  console.error(JSON.stringify({ ok: false, message }, null, 2));
  process.exit(1);
}
