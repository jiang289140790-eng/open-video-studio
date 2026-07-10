import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const env = loadEnv(resolve(process.cwd(), ".env.local"));
const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL || "";
const anonKey = env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY || "";
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY || "";
const mode = process.argv.includes("--video") || process.env.OVS_VERIFY_REAL_AI_MODE === "video" ? "video" : "image";
const workflowId = mode === "video" ? "workflow-qianwen-video-v1" : "workflow-qianwen-image-v1";
const toolSlug = mode === "video" ? "image-to-video" : "generate";
const prompt = mode === "video"
  ? "Open Video Studio production verification video: six second cinematic motion preview of a reusable AI creator workspace, smooth camera movement, premium dark interface."
  : "Open Video Studio production verification image: consistent cinematic AI creator workspace, premium dark interface, reusable character asset.";

if (!supabaseUrl || isPlaceholder(supabaseUrl) || !anonKey || isPlaceholder(anonKey) || !serviceRoleKey || isPlaceholder(serviceRoleKey)) {
  console.log(JSON.stringify({
    ok: false,
    reason: "missing_supabase_environment",
    required: ["SUPABASE_URL", "SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"],
  }, null, 2));
  process.exit(1);
}

const aiEndpoint = `${supabaseUrl.replace(/\/$/, "")}/functions/v1/ai`;
const adminClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});
const userClient = createClient(supabaseUrl, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});

const suffix = crypto.randomUUID().replaceAll("-", "").slice(0, 12);
const email = `ovs-real-ai-${suffix}@example.invalid`;
const password = `RealAi-${crypto.randomUUID()}!`;

const report = {
  ok: false,
  endpoint: aiEndpoint,
  provider: "qianwen_generation",
  mode,
  workflowId,
  auth: {
    userCreated: false,
    signedIn: false,
  },
  providerStatus: {
    configured: false,
    probeMessage: "",
  },
  generation: {
    creditsGranted: false,
    jobCreated: false,
    jobId: "",
    jobStatus: "",
    assetCreated: false,
    assetId: "",
    storageKey: "",
    providerRecorded: "",
    modelRecorded: "",
    errorCode: "",
    errorMessage: "",
  },
  refund: {
    expectedOnFailure: false,
    refunded: false,
    refundAmount: 0,
  },
  cleanupComplete: false,
  error: "",
};

let userId = "";

try {
  const created = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: "OVS Real AI Verify" },
  });
  if (created.error || !created.data.user?.id) throw new Error(created.error?.message || "Could not create real AI verification user");
  userId = created.data.user.id;
  report.auth.userCreated = true;
  await upsertProfile(userId, email);

  const login = await userClient.auth.signInWithPassword({ email, password });
  if (login.error || !login.data.session?.access_token) throw new Error(login.error?.message || "Could not sign in real AI verification user");
  const accessToken = login.data.session.access_token;
  report.auth.signedIn = true;

  const status = await invokeAi(accessToken, { action: "provider-status", probe: true });
  const qianwen = (status.providers ?? []).find((provider) => provider.provider === "qianwen_generation");
  report.providerStatus.configured = Boolean(qianwen?.configured);
  report.providerStatus.probeMessage = String(qianwen?.probe?.message || "");
  if (!report.providerStatus.configured) {
    throw new Error("qianwen_generation is not configured in Supabase Edge Function secrets");
  }

  const order = await invokeAi(accessToken, {
    action: "demo-credit-purchase",
    credits: 80,
    amountCents: 0,
    method: "real_ai_generation_verification",
  });
  report.generation.creditsGranted = Boolean(order.order?.id);

  const createdJob = await invokeAi(accessToken, {
    action: "create-generation-job",
    mediaType: mode,
    provider: "qianwen_generation",
    workflowId,
    toolSlug,
    prompt,
    aspectRatio: "16:9",
    durationSeconds: mode === "video" ? 6 : undefined,
  });
  report.generation.jobCreated = Boolean(createdJob.job?.id);
  report.generation.jobId = String(createdJob.job?.id || "");
  report.generation.providerRecorded = String(createdJob.job?.provider || "");
  report.generation.modelRecorded = String(createdJob.job?.model || "");

  const processed = await invokeAi(accessToken, {
    action: "process-generation-job",
    jobId: createdJob.job?.id,
  }, { allowBodyError: true });
  report.generation.jobStatus = String(processed.job?.status || "");
  report.generation.assetCreated = Boolean(processed.asset?.id);
  report.generation.assetId = String(processed.asset?.id || "");
  report.generation.storageKey = String(processed.asset?.storage_key || "");
  report.generation.errorCode = String(processed.error?.code || processed.job?.error_code || "");
  report.generation.errorMessage = String(processed.error?.message || processed.job?.error_message || "");

  if (report.generation.jobStatus === "failed") {
    report.refund.expectedOnFailure = true;
    const refundRead = await adminClient
      .from("credit_transactions")
      .select("balance_impact,status,operation_category")
      .eq("user_id", userId)
      .eq("source_id", report.generation.jobId)
      .eq("operation_category", "refund");
    if (refundRead.error) throw new Error(`refund readback failed: ${refundRead.error.message}`);
    const refunds = refundRead.data ?? [];
    report.refund.refunded = refunds.some((row) => row.status === "posted" && Number(row.balance_impact) > 0);
    report.refund.refundAmount = refunds.reduce((sum, row) => sum + Math.max(0, Number(row.balance_impact || 0)), 0);
  }

  if (report.generation.assetCreated) {
    const assetRead = await adminClient
      .from("media_assets")
      .select("id,storage_key,metadata_json")
      .eq("id", report.generation.assetId)
      .eq("owner_user_id", userId)
      .single();
    if (assetRead.error) throw new Error(`asset readback failed: ${assetRead.error.message}`);
    report.generation.storageKey = String(assetRead.data?.storage_key || report.generation.storageKey);
    report.generation.providerRecorded = String(assetRead.data?.metadata_json?.provider || report.generation.providerRecorded);
    report.generation.modelRecorded = String(assetRead.data?.metadata_json?.model || report.generation.modelRecorded);
  }

  report.ok =
    report.auth.userCreated &&
    report.auth.signedIn &&
    report.providerStatus.configured &&
    report.generation.creditsGranted &&
    report.generation.jobCreated &&
    report.generation.jobStatus === "completed" &&
    report.generation.assetCreated &&
    report.generation.providerRecorded === "qianwen_generation" &&
    Boolean(report.generation.storageKey);
  if (!report.ok && !report.error) report.error = report.generation.errorMessage || "qianwen_generation_live_probe_failed";
} catch (error) {
  report.ok = false;
  report.error = error instanceof Error ? error.message : "real_ai_generation_probe_failed";
} finally {
  report.cleanupComplete = await cleanup(userId).catch((error) => {
    report.error = `${report.error || "cleanup_failed"}; cleanup: ${error instanceof Error ? error.message : String(error)}`;
    return false;
  });
}

console.log(JSON.stringify(report, null, 2));
process.exit(report.ok && report.cleanupComplete ? 0 : 1);

async function invokeAi(accessToken, payload, options = {}) {
  const response = await fetch(aiEndpoint, {
    method: "POST",
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || (body?.error && !options.allowBodyError)) {
    throw new Error(body?.error?.message || body?.message || `AI function returned ${response.status}`);
  }
  return body;
}

async function upsertProfile(id, profileEmail) {
  const common = {
    id,
    email: profileEmail,
    display_name: "OVS Real AI Verify",
    role: "admin",
    account_status: "active",
    locale: "zh-CN",
    timezone: "Asia/Shanghai",
    onboarding_state: "real_ai_verification",
    updated_at: new Date().toISOString(),
  };
  const result = await adminClient.from("profiles").upsert(common, { onConflict: "id" });
  if (!result.error) return;
  const minimal = await adminClient.from("profiles").upsert({
    id,
    email: profileEmail,
    display_name: "OVS Real AI Verify",
    role: "admin",
  }, { onConflict: "id" });
  if (minimal.error) throw new Error(`profile upsert failed: ${minimal.error.message}`);
}

async function cleanup(id) {
  if (!id) return true;
  const bucket = env.SUPABASE_STORAGE_BUCKET || "open-video-studio-assets";
  const assets = await adminClient.from("media_assets").select("storage_key").eq("owner_user_id", id);
  const storageKeys = (assets.data ?? []).map((asset) => asset.storage_key).filter(Boolean);
  if (storageKeys.length > 0) {
    await adminClient.storage.from(bucket).remove(storageKeys);
  }
  await adminClient.from("share_links").delete().eq("owner_user_id", id);
  await adminClient.from("media_assets").delete().eq("owner_user_id", id);
  await adminClient.from("generation_jobs").delete().eq("user_id", id);
  await adminClient.from("orders").delete().eq("user_id", id);
  await adminClient.from("credit_transactions").delete().eq("user_id", id);
  await adminClient.from("profiles").delete().eq("id", id);
  await adminClient.auth.admin.deleteUser(id);
  return true;
}

function loadEnv(path) {
  if (!existsSync(path)) return {};
  const content = readFileSync(path, "utf8");
  const entries = {};
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    const rawValue = trimmed.slice(index + 1).trim();
    entries[key] = rawValue.replace(/^["']|["']$/g, "");
  }
  return entries;
}

function isPlaceholder(value) {
  return !value || /your-|placeholder|example|change-me/i.test(String(value));
}
