import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const env = loadEnv(resolve(process.cwd(), ".env.local"));
const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL || "";
const anonKey = env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY || "";
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseUrl || isPlaceholder(supabaseUrl) || !anonKey || isPlaceholder(anonKey) || !serviceRoleKey || isPlaceholder(serviceRoleKey)) {
  console.log(JSON.stringify({
    ok: false,
    reason: "missing_supabase_environment",
    required: ["SUPABASE_URL", "SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"],
  }, null, 2));
  process.exit(1);
}

const adminEndpoint = `${supabaseUrl.replace(/\/$/, "")}/functions/v1/admin`;
const aiEndpoint = `${supabaseUrl.replace(/\/$/, "")}/functions/v1/ai`;
const adminClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});
const userClient = createClient(supabaseUrl, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});

const suffix = crypto.randomUUID().replaceAll("-", "").slice(0, 12);
const email = `ovs-workflow-verify-${suffix}@example.invalid`;
const password = `Workflow-${crypto.randomUUID()}!`;
const workflowId = `workflow-routing-verify-${suffix}`;

const report = {
  ok: false,
  workflowId,
  adminConfig: {
    readable: false,
    updated: false,
    restored: false,
    previousStatus: "",
  },
  routing: {
    orderCreated: false,
    jobCreated: false,
    providerSelected: "",
    workflowStatus: "",
    processed: false,
    assetCreated: false,
    assetReadable: false,
    storageKey: "",
  },
  cleanupComplete: false,
  error: "",
};

let userId = "";
let previousWorkflowCenter = null;
let previousWasDefault = false;

try {
  const created = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: "OVS Workflow Verify" },
  });
  if (created.error || !created.data.user?.id) throw new Error(created.error?.message || "Could not create workflow verification user");
  userId = created.data.user.id;
  await upsertProfile(userId, email);
  const login = await userClient.auth.signInWithPassword({ email, password });
  if (login.error || !login.data.session?.access_token) throw new Error(login.error?.message || "Could not sign in workflow verification user");
  const accessToken = login.data.session.access_token;

  const current = await invokeAdmin(accessToken, { action: "get-workflow-center-config" });
  previousWorkflowCenter = current.workflowCenter?.value_json || current.workflowCenter || null;
  previousWasDefault = current.workflowCenter?.status === "default";
  report.adminConfig.readable = Boolean(previousWorkflowCenter);
  report.adminConfig.previousStatus = current.workflowCenter?.status || "";

  const updatedConfig = addRoutingVerificationWorkflow(previousWorkflowCenter, workflowId);
  const updated = await invokeAdmin(accessToken, {
    action: "update-workflow-center-config",
    config: updatedConfig,
    reason: "workflow routing verification publish",
  });
  report.adminConfig.updated = Array.isArray(updated.workflowCenter?.value_json?.workflows)
    && updated.workflowCenter.value_json.workflows.some((workflow) => workflow.workflowId === workflowId);

  const order = await invokeAi(accessToken, {
    action: "demo-credit-purchase",
    credits: 40,
    amountCents: 0,
    method: "workflow_routing_verification",
  });
  report.routing.orderCreated = Boolean(order.order?.id);

  const createdJob = await invokeAi(accessToken, {
    action: "create-generation-job",
    mediaType: "image",
    workflowId,
    prompt: "Workflow routing verification scene",
    aspectRatio: "16:9",
  });
  report.routing.jobCreated = Boolean(createdJob.job?.id);
  report.routing.providerSelected = String(createdJob.job?.provider || "");
  report.routing.workflowStatus = String(createdJob.job?.input_params?.workflowStatus || "");

  const processed = await invokeAi(accessToken, {
    action: "process-generation-job",
    jobId: createdJob.job?.id,
  });
  report.routing.processed = processed.job?.status === "completed";
  report.routing.assetCreated = Boolean(processed.asset?.id);
  report.routing.storageKey = String(processed.asset?.storage_key || "");

  if (processed.asset?.id) {
    const assetRead = await adminClient
      .from("media_assets")
      .select("id,generation_job_id,storage_key,metadata_json,processing_status")
      .eq("id", processed.asset.id)
      .single();
    if (assetRead.error) throw new Error(`asset readback failed: ${assetRead.error.message}`);
    report.routing.assetReadable =
      assetRead.data?.id === processed.asset.id &&
      assetRead.data?.generation_job_id === createdJob.job?.id &&
      Boolean(assetRead.data?.storage_key);
  }

  report.ok =
    report.adminConfig.readable &&
    report.adminConfig.updated &&
    report.routing.orderCreated &&
    report.routing.jobCreated &&
    report.routing.providerSelected === "fake_worker" &&
    report.routing.workflowStatus === "testing" &&
    report.routing.processed &&
    report.routing.assetCreated &&
    report.routing.assetReadable;
  if (!report.ok) report.error = "workflow_routing_probe_incomplete";
} catch (error) {
  report.ok = false;
  report.error = error instanceof Error ? error.message : "workflow_routing_probe_failed";
} finally {
  await restoreWorkflowCenter().catch((error) => {
    report.adminConfig.restored = false;
    report.error = report.error || (error instanceof Error ? error.message : "workflow_restore_failed");
  });
  await cleanup().catch(() => {});
  report.cleanupComplete = true;
}

console.log(JSON.stringify(report, null, 2));
process.exitCode = report.ok ? 0 : 1;

function addRoutingVerificationWorkflow(config, id) {
  const workflows = Array.isArray(config?.workflows) ? config.workflows : [];
  return {
    workflows: [
      ...workflows.filter((workflow) => workflow.workflowId !== id),
      {
        workflowId: id,
        name: "Workflow routing verification",
        type: "api_chain",
        provider: "fake_worker",
        jsonConfig: { verification: true, action: "process-generation-job", mediaType: "image" },
        requiredModels: ["local-image-v0"],
        requiredInputs: ["prompt"],
        outputType: "image",
        creditPrice: 8,
        version: "verify-v1",
        status: "testing",
        description: "Temporary workflow used to verify Admin Workflow Center routes AI jobs without frontend changes.",
      },
    ],
  };
}

async function restoreWorkflowCenter() {
  if (!previousWorkflowCenter) return;
  if (previousWasDefault) {
    await adminClient.from("site_settings").delete().eq("setting_key", "workflow_center_config");
    report.adminConfig.restored = true;
    return;
  }
  const result = await adminClient
    .from("site_settings")
    .upsert({
      setting_key: "workflow_center_config",
      value_json: previousWorkflowCenter,
      status: report.adminConfig.previousStatus || "published",
      updated_by: userId || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: "setting_key" });
  if (result.error) throw new Error(result.error.message);
  report.adminConfig.restored = true;
}

async function upsertProfile(id, userEmail) {
  const result = await adminClient.from("profiles").upsert({
    id,
    email: userEmail,
    display_name: "OVS Workflow Verify",
    role: "admin",
    account_status: "active",
    locale: "zh-CN",
    timezone: "Asia/Shanghai",
    onboarding_state: "workflow_verification",
    updated_at: new Date().toISOString(),
  }, { onConflict: "id" });
  if (!result.error) return;
  const minimal = await adminClient.from("profiles").upsert({
    id,
    email: userEmail,
    display_name: "OVS Workflow Verify",
    role: "admin",
  }, { onConflict: "id" });
  if (minimal.error) throw new Error(minimal.error.message);
}

async function invokeAdmin(accessToken, payload) {
  return invoke(adminEndpoint, accessToken, payload);
}

async function invokeAi(accessToken, payload) {
  return invoke(aiEndpoint, accessToken, payload);
}

async function invoke(endpoint, accessToken, payload) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: anonKey,
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body?.error) {
    throw new Error(body?.error?.message || body?.message || `${endpoint} returned ${response.status}`);
  }
  return body;
}

async function cleanup() {
  if (!userId) return;
  const bucket = env.SUPABASE_STORAGE_BUCKET || "open-video-studio-assets";
  const assets = await adminClient.from("media_assets").select("storage_key").eq("owner_user_id", userId);
  const storageKeys = (assets.data ?? []).map((asset) => asset.storage_key).filter(Boolean);
  if (storageKeys.length > 0) await adminClient.storage.from(bucket).remove(storageKeys);
  await adminClient.from("share_links").delete().eq("owner_user_id", userId);
  await adminClient.from("media_assets").delete().eq("owner_user_id", userId);
  await adminClient.from("generation_jobs").delete().eq("user_id", userId);
  await adminClient.from("orders").delete().eq("user_id", userId);
  await adminClient.from("credit_transactions").delete().eq("user_id", userId);
  await adminClient.from("audit_logs").delete().eq("actor_id", userId);
  await adminClient.from("profiles").delete().eq("id", userId);
  await adminClient.auth.admin.deleteUser(userId);
}

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

function isPlaceholder(value = "") {
  return value.includes("your-") || value.includes("placeholder") || value.includes("example");
}
