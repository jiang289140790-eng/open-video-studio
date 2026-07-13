import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const env = loadEnv(resolve(process.cwd(), ".env.local"));
const slug = process.argv[2] || "";
const projectRef = env.SUPABASE_PROJECT_REF || readProjectRef() || "";
const accessToken = env.SUPABASE_ACCESS_TOKEN || "";

if (!slug) fail("Usage: npm run deploy:function -- <function-slug>");
if (!/^[a-z0-9_-]+$/i.test(slug)) fail("Function slug may only contain letters, numbers, underscores, and dashes.");
if (!projectRef) fail("SUPABASE_PROJECT_REF or supabase/config.toml project_id is required.");
if (accessToken && isPlaceholder(accessToken)) fail("SUPABASE_ACCESS_TOKEN contains a placeholder value.");

const functionDir = resolve(process.cwd(), "supabase", "functions", slug);
if (!existsSync(resolve(functionDir, "index.ts"))) fail(`Function entrypoint not found: ${functionDir}`);

const verifyJwt = slug !== "telegram-auth";
const args = [
  "functions",
  "deploy",
  slug,
  "--project-ref",
  projectRef,
  "--use-api",
  "--yes",
  "--output-format",
  "json",
];
if (!verifyJwt) args.push("--no-verify-jwt");

const executable = process.platform === "win32" ? "supabase.exe" : "supabase";
const result = spawnSync(executable, args, {
  cwd: process.cwd(),
  env: accessToken
    ? { ...process.env, ...env, SUPABASE_ACCESS_TOKEN: accessToken }
    : { ...process.env, ...env },
  encoding: "utf8",
  shell: false,
});

if (result.status !== 0) {
  console.error(result.stderr || result.stdout || "Supabase CLI deployment failed.");
  process.exit(result.status || 1);
}

console.log(JSON.stringify({
  ok: true,
  slug,
  projectRef,
  verifyJwt,
  deployment: parseJsonOutput(result.stdout),
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

function parseJsonOutput(value) {
  try {
    return value.trim() ? JSON.parse(value) : null;
  } catch {
    return value.trim().slice(0, 1000);
  }
}

function isPlaceholder(value = "") {
  return value.includes("your-") || value.includes("placeholder") || value.includes("example");
}

function fail(message) {
  console.error(JSON.stringify({ ok: false, message }, null, 2));
  process.exit(1);
}
