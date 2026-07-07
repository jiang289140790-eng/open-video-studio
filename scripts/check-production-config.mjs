import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const repo = process.env.GITHUB_REPOSITORY || "jiang289140790-eng/open-video-studio";
const localEnv = loadEnv(resolve(process.cwd(), ".env.local"));

const localRequired = [
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_ANON_KEY",
  "SUPABASE_STORAGE_BUCKET",
];
const githubVariables = [
  "VITE_SUPABASE_URL",
  "VITE_TELEGRAM_BOT_USERNAME",
  "VITE_TELEGRAM_AUTH_URL",
];
const githubSecrets = [
  "VITE_SUPABASE_ANON_KEY",
];

const report = {
  ok: true,
  local: checkLocal(localRequired, localEnv),
  github: checkGithub(repo, githubVariables, githubSecrets),
  oauth: {
    supabaseProviders: ["Google", "X/Twitter", "Discord"],
    telegram: "Requires VITE_TELEGRAM_BOT_USERNAME and VITE_TELEGRAM_AUTH_URL plus backend signed-hash verification.",
    redirectUrls: [
      "https://jiang289140790-eng.github.io/open-video-studio/",
      "https://jiang289140790-eng.github.io/open-video-studio/signin.html",
      "https://jiang289140790-eng.github.io/open-video-studio/zh/login/",
      "http://127.0.0.1:4173",
      "http://127.0.0.1:4174",
    ],
  },
};

report.ok = report.local.ok && report.github.ok;
console.log(JSON.stringify(report, null, 2));
process.exit(report.ok ? 0 : 1);

function checkLocal(required, env) {
  const missing = required.filter((key) => !env[key] || isPlaceholder(env[key]));
  return {
    ok: missing.length === 0,
    envFile: existsSync(resolve(process.cwd(), ".env.local")) ? ".env.local" : "missing",
    missing,
  };
}

function checkGithub(repoName, variables, secrets) {
  const output = {
    ok: false,
    repo: repoName,
    variables: { required: variables, present: [], missing: variables },
    secrets: { required: secrets, present: [], missing: secrets },
    error: "",
  };
  try {
    const variableRows = execFileSync("gh", ["variable", "list", "--repo", repoName], { encoding: "utf8" });
    const secretRows = execFileSync("gh", ["secret", "list", "--repo", repoName], { encoding: "utf8" });
    const presentVariables = parseGhNames(variableRows);
    const presentSecrets = parseGhNames(secretRows);
    output.variables.present = variables.filter((key) => presentVariables.has(key));
    output.variables.missing = variables.filter((key) => !presentVariables.has(key));
    output.secrets.present = secrets.filter((key) => presentSecrets.has(key));
    output.secrets.missing = secrets.filter((key) => !presentSecrets.has(key));
    output.ok = output.variables.missing.length === 0 && output.secrets.missing.length === 0;
  } catch (error) {
    output.error = error.message;
  }
  return output;
}

function parseGhNames(text) {
  return new Set(text.split(/\r?\n/).map((line) => line.trim().split(/\s+/)[0]).filter(Boolean));
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
