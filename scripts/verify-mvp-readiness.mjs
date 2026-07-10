import { spawnSync } from "node:child_process";

const includeRealAi = process.argv.includes("--real-ai") || process.env.OVS_VERIFY_REAL_AI === "true";

const checks = [
  {
    id: "auth",
    title: "真实登录闭环",
    script: "verify:oauth",
    requiredForUserTesting: true,
    blockerLabel: "OAuth / Telegram provider configuration",
  },
  {
    id: "credits",
    title: "真实积分闭环",
    script: "verify:payments",
    requiredForUserTesting: true,
    blockerLabel: "Credit purchase / ledger loop",
  },
  {
    id: "workflow",
    title: "用户生成资产闭环",
    script: "verify:user-loop",
    requiredForUserTesting: true,
    blockerLabel: "Generate / asset / history / share loop",
  },
  {
    id: "admin",
    title: "后台运营闭环",
    script: "verify:admin",
    requiredForUserTesting: true,
    blockerLabel: "Admin operations / audit loop",
  },
  {
    id: "ai",
    title: "AI 服务健康",
    script: "verify:ai",
    requiredForUserTesting: false,
    blockerLabel: "Provider health and fallback loop",
  },
  {
    id: "real_ai",
    title: "真实外部生成",
    script: "verify:real-ai",
    requiredForUserTesting: false,
    costly: true,
    blockerLabel: "Qianwen / Liblib / external generation endpoint",
  },
];

const selectedChecks = checks.filter((check) => includeRealAi || !check.costly);
const startedAt = new Date().toISOString();
const results = selectedChecks.map(runCheck);
const skipped = checks
  .filter((check) => !selectedChecks.includes(check))
  .map((check) => ({
    id: check.id,
    title: check.title,
    script: check.script,
    skipped: true,
    reason: "Run with --real-ai or OVS_VERIFY_REAL_AI=true to execute this cost-bearing provider probe.",
  }));

const blockers = results
  .filter((result) => !result.ok)
  .map((result) => ({
    id: result.id,
    title: result.title,
    requiredForUserTesting: result.requiredForUserTesting,
    blocker: result.blockerLabel,
    summary: summarizeFailure(result),
  }));

const report = {
  ok: blockers.length === 0,
  readyForSmallUserTesting: blockers.every((blocker) => !blocker.requiredForUserTesting),
  startedAt,
  finishedAt: new Date().toISOString(),
  checks: results,
  skipped,
  blockers,
  nextActions: blockers.map(nextActionForBlocker),
};

console.log(JSON.stringify(report, null, 2));
process.exitCode = report.ok ? 0 : 1;

function runCheck(check) {
  const started = Date.now();
  const command = npmCommand(check.script);
  const child = spawnSync(command.file, command.args, {
    cwd: process.cwd(),
    encoding: "utf8",
    windowsHide: true,
    env: process.env,
  });
  const stdout = child.stdout || "";
  const stderr = child.stderr || "";
  const parsed = parseLastJson(stdout);
  return {
    id: check.id,
    title: check.title,
    script: check.script,
    requiredForUserTesting: check.requiredForUserTesting,
    blockerLabel: check.blockerLabel,
    ok: child.status === 0,
    exitCode: child.status,
    spawnError: child.error?.message || "",
    durationMs: Date.now() - started,
    parsed,
    summary: summarizeParsed(parsed) || summarizeText(`${stdout}\n${stderr}`),
  };
}

function npmCommand(script) {
  if (process.platform === "win32") {
    return { file: "cmd.exe", args: ["/d", "/s", "/c", `npm.cmd run ${script}`] };
  }
  return { file: "npm", args: ["run", script] };
}

function parseLastJson(text) {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const start = trimmed.lastIndexOf("\n{");
  const candidate = start >= 0 ? trimmed.slice(start + 1) : trimmed.slice(trimmed.indexOf("{"));
  try {
    return JSON.parse(candidate);
  } catch {
    return null;
  }
}

function summarizeParsed(value) {
  if (!value || typeof value !== "object") return "";
  if (typeof value.error === "string" && value.error) return value.error;
  if (typeof value.reason === "string" && value.reason) return value.reason;
  if (value.generation?.errorMessage) return String(value.generation.errorMessage);
  if (value.qwenVision?.error) return `Qwen Vision: ${value.qwenVision.error}`;
  if (value.supabase?.providers) {
    const failed = value.supabase.providers.filter((provider) => !provider.ok);
    if (failed.length) return failed.map((provider) => `${provider.provider}: ${provider.error || provider.probeError || "not ready"}`).join("; ");
  }
  return "";
}

function summarizeText(text) {
  return text.replace(/\s+/g, " ").trim().slice(0, 320);
}

function summarizeFailure(result) {
  return result.summary || result.spawnError || `npm run ${result.script} failed with exit code ${result.exitCode}`;
}

function nextActionForBlocker(blocker) {
  if (blocker.id === "auth") {
    return "Enable Google, X/Twitter, Discord in Supabase Auth Providers and configure Telegram bot/auth URL, then rerun npm run verify:oauth.";
  }
  if (blocker.id === "real_ai") {
    return "Fix QIANWEN_IMAGE_ENDPOINT / QIANWEN_VIDEO_ENDPOINT or configure Liblib secrets plus template UUID, then rerun npm run verify:real-ai.";
  }
  if (blocker.id === "ai") {
    return "Review provider-status in Admin System readiness; keep Fake Worker enabled until Qwen/Qianwen/Liblib probes are green.";
  }
  if (blocker.id === "credits") {
    return "Inspect demo-credit-purchase, orders, and credit_transactions before accepting any paid traffic.";
  }
  if (blocker.id === "admin") {
    return "Verify profiles.role admin/operator access and admin Edge Function audit writes.";
  }
  if (blocker.id === "workflow") {
    return "Verify create-generation-job, process-generation-job, media_assets, generation_jobs, and share_links.";
  }
  return `Fix ${blocker.blocker}.`;
}
