import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const env = loadEnv(resolve(process.cwd(), ".env.local"));
const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL || "";
const anonKey = env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY || "";
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY || "";
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
    supported: Boolean(env.SUPABASE_TEST_ACCESS_TOKEN || (anonKey && serviceRoleKey)),
    ok: null,
    providerCount: 0,
    providersConfigured: {},
    providerProbes: {},
    error: "",
  },
  promptEnhancement: {
    ok: null,
    provider: "",
    fallback: null,
    error: "",
  },
  qwenVision: {
    ok: null,
    provider: "",
    model: "",
    durationMs: 0,
    error: "",
  },
  generationLoop: {
    ok: null,
    jobId: "",
    assetId: "",
    storageKey: "",
    orderCreated: false,
    jobCreated: false,
    assetCreated: false,
    jobStatus: "",
    error: "",
  },
  creditRefundLoop: {
    ok: null,
    jobId: "",
    jobCreated: false,
    jobStatus: "",
    refunded: false,
    refundAmount: 0,
    error: "",
  },
  databasePersistence: {
    ok: null,
    jobReadable: false,
    assetReadable: false,
    creditDebitReadable: false,
    refundReadable: false,
    error: "",
  },
};

const temporaryAccess = env.SUPABASE_TEST_ACCESS_TOKEN
  ? { accessToken: env.SUPABASE_TEST_ACCESS_TOKEN, cleanup: async () => {} }
  : await createTemporaryAdminAccessToken().catch((error) => {
  report.optionalAuthenticatedProbe.error = error instanceof Error ? error.message : "temporary_admin_probe_failed";
  return { accessToken: "", cleanup: async () => {} };
});
const accessToken = temporaryAccess.accessToken;

if (accessToken) {
  try {
    const authenticated = await fetch(endpoint, {
      method: "POST",
      headers: {
        authorization: `Bearer ${accessToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ action: "provider-status", probe: true }),
    });
    const body = await authenticated.json().catch(() => ({}));
    report.optionalAuthenticatedProbe.ok = authenticated.ok && Array.isArray(body.providers);
    report.optionalAuthenticatedProbe.providerCount = Array.isArray(body.providers) ? body.providers.length : 0;
    report.optionalAuthenticatedProbe.providersConfigured = Object.fromEntries(
      (body.providers ?? []).map((provider) => [provider.provider, Boolean(provider.configured)]),
    );
    report.optionalAuthenticatedProbe.providerProbes = Object.fromEntries(
      (body.providers ?? []).map((provider) => [provider.provider, provider.probe ?? null]),
    );
    report.optionalAuthenticatedProbe.error = body?.error?.message || "";
    report.ok = report.ok && report.optionalAuthenticatedProbe.ok;
    if (report.optionalAuthenticatedProbe.ok) {
      await probePromptEnhancement(accessToken);
      await probeQwenVision(accessToken);
      await probeGenerationLoop(accessToken);
      await probeCreditRefundLoop(accessToken);
      await probeDatabasePersistence(accessToken);
      report.ok =
        report.ok &&
        report.promptEnhancement.ok !== false &&
        report.qwenVision.ok !== false &&
        report.generationLoop.ok === true &&
        report.creditRefundLoop.ok === true &&
        report.databasePersistence.ok === true;
    }
  } finally {
    await temporaryAccess.cleanup();
  }
}

if (report.optionalAuthenticatedProbe.supported && !accessToken) {
  report.optionalAuthenticatedProbe.ok = false;
  report.ok = false;
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

async function createTemporaryAdminAccessToken() {
  if (!anonKey || !serviceRoleKey) return "";
  const { createClient } = await import("@supabase/supabase-js");
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const userClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const email = `ovs-ai-verify-${Date.now()}@example.invalid`;
  const password = `Verify-${crypto.randomUUID()}!`;
  const created = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: "OVS AI Verify" },
  });
  if (created.error || !created.data.user?.id) {
    throw new Error(created.error?.message || "Could not create temporary verification user");
  }
  const userId = created.data.user.id;
  try {
    const profile = await adminClient.from("profiles").upsert({
      id: userId,
      email,
      display_name: "OVS AI Verify",
      role: "admin",
      account_status: "active",
      locale: "en",
      timezone: "UTC",
      onboarding_state: "verification",
      updated_at: new Date().toISOString(),
    }, { onConflict: "id" });
    if (profile.error) {
      const minimalProfile = await adminClient.from("profiles").upsert({
        id: userId,
        email,
        display_name: "OVS AI Verify",
        role: "admin",
      }, { onConflict: "id" });
      if (minimalProfile.error) throw new Error(minimalProfile.error.message);
    }
    const login = await userClient.auth.signInWithPassword({ email, password });
    if (login.error || !login.data.session?.access_token) {
      throw new Error(login.error?.message || "Could not sign in temporary verification user");
    }
    return {
      accessToken: login.data.session.access_token,
      cleanup: async () => {
        const bucket = env.SUPABASE_STORAGE_BUCKET || "open-video-studio-assets";
        const assets = await adminClient.from("media_assets").select("storage_key").eq("owner_user_id", userId);
        const storageKeys = (assets.data ?? []).map((asset) => asset.storage_key).filter(Boolean);
        if (storageKeys.length > 0) await adminClient.storage.from(bucket).remove(storageKeys);
        await adminClient.from("share_links").delete().eq("owner_user_id", userId);
        await adminClient.from("media_assets").delete().eq("owner_user_id", userId);
        await adminClient.from("generation_jobs").delete().eq("user_id", userId);
        await adminClient.from("orders").delete().eq("user_id", userId);
        await adminClient.from("credit_transactions").delete().eq("user_id", userId);
        await adminClient.from("profiles").delete().eq("id", userId);
        await adminClient.auth.admin.deleteUser(userId);
      },
    };
  } catch (error) {
    await adminClient.from("profiles").delete().eq("id", userId);
    await adminClient.auth.admin.deleteUser(userId);
    throw error;
  }
}

async function probePromptEnhancement(accessToken) {
  try {
    const response = await invokeAi(accessToken, {
      action: "enhance-prompt",
      prompt: "一个稳定角色在霓虹城市里展示新产品",
      context: { verification: true },
    });
    report.promptEnhancement.ok = Boolean(response.enhancedPrompt);
    report.promptEnhancement.provider = response.provider || "";
    report.promptEnhancement.fallback = Boolean(response.fallback);
    if (!report.promptEnhancement.ok) report.promptEnhancement.error = "enhanced_prompt_missing";
  } catch (error) {
    report.promptEnhancement.ok = false;
    report.promptEnhancement.error = error instanceof Error ? error.message : "prompt_enhancement_failed";
  }
}

async function probeQwenVision(accessToken) {
  if (report.optionalAuthenticatedProbe.providersConfigured.qwen_vision !== true) {
    report.qwenVision.ok = true;
    report.qwenVision.error = "qwen_vision_not_configured";
    return;
  }
  try {
    const response = await invokeAi(accessToken, {
      action: "analyze-image",
      prompt: "Analyze this small verification image. Return concise JSON with subject, scene, text, risk, tags, and prompt suggestions.",
      image_base64: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=",
      json: true,
      max_tokens: 300,
      temperature: 0.1,
    });
    report.qwenVision.ok = Boolean(response.analysis);
    report.qwenVision.provider = response.provider || "";
    report.qwenVision.model = response.model || "";
    report.qwenVision.durationMs = Number(response.durationMs || 0);
    if (!report.qwenVision.ok) report.qwenVision.error = "analysis_missing";
  } catch (error) {
    report.qwenVision.ok = false;
    report.qwenVision.error = error instanceof Error ? error.message : "qwen_vision_failed";
  }
}

async function probeGenerationLoop(accessToken) {
  try {
    const order = await invokeAi(accessToken, {
      action: "demo-credit-purchase",
      credits: 40,
      amountCents: 0,
      method: "verification",
    });
    report.generationLoop.orderCreated = Boolean(order.order?.id);

    const created = await invokeAi(accessToken, {
      action: "create-generation-job",
      mediaType: "image",
      provider: "fake_worker",
      workflowId: "workflow-qianwen-image-v1",
      prompt: "Verification image generation for Open Video Studio",
      aspectRatio: "16:9",
    });
    report.generationLoop.jobCreated = Boolean(created.job?.id);
    report.generationLoop.jobId = String(created.job?.id || "");

    const processed = await invokeAi(accessToken, {
      action: "process-generation-job",
      jobId: created.job?.id,
    });
    report.generationLoop.assetCreated = Boolean(processed.asset?.id);
    report.generationLoop.assetId = String(processed.asset?.id || "");
    report.generationLoop.storageKey = String(processed.asset?.storage_key || processed.asset?.file_url || "");
    report.generationLoop.jobStatus = String(processed.job?.status || "");
    report.generationLoop.ok =
      report.generationLoop.orderCreated &&
      report.generationLoop.jobCreated &&
      report.generationLoop.assetCreated &&
      report.generationLoop.jobStatus === "completed";
  } catch (error) {
    report.generationLoop.ok = false;
    report.generationLoop.error = error instanceof Error ? error.message : "generation_loop_failed";
  }
}

async function probeCreditRefundLoop(accessToken) {
  try {
    const created = await invokeAi(accessToken, {
      action: "create-generation-job",
      mediaType: "image",
      provider: "fake_worker",
      workflowId: "workflow-qianwen-image-v1",
      prompt: "Verification cancellation refund for Open Video Studio",
      aspectRatio: "16:9",
    });
    report.creditRefundLoop.jobCreated = Boolean(created.job?.id);
    report.creditRefundLoop.jobId = String(created.job?.id || "");

    const cancelled = await invokeAi(accessToken, {
      action: "cancel-generation-job",
      jobId: created.job?.id,
    });
    report.creditRefundLoop.jobStatus = String(cancelled.job?.status || "");
    report.creditRefundLoop.refunded = Boolean(cancelled.refund?.refunded);
    report.creditRefundLoop.refundAmount = Number(cancelled.refund?.amount || 0);
    report.creditRefundLoop.ok =
      report.creditRefundLoop.jobCreated &&
      report.creditRefundLoop.jobStatus === "cancelled" &&
      report.creditRefundLoop.refunded &&
      report.creditRefundLoop.refundAmount > 0;
  } catch (error) {
    report.creditRefundLoop.ok = false;
    report.creditRefundLoop.error = error instanceof Error ? error.message : "credit_refund_loop_failed";
  }
}

async function probeDatabasePersistence(accessToken) {
  try {
    if (!anonKey) throw new Error("SUPABASE_ANON_KEY is required for database readback verification");
    if (!report.generationLoop.jobId || !report.generationLoop.assetId || !report.creditRefundLoop.jobId) {
      throw new Error("Generation and refund probes must create IDs before database readback");
    }

    const { createClient } = await import("@supabase/supabase-js");
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });

    const [jobRead, assetRead, debitRead, refundRead] = await Promise.all([
      userClient
        .from("generation_jobs")
        .select("id,status,result_asset_id,cost_credits")
        .eq("id", report.generationLoop.jobId)
        .single(),
      userClient
        .from("media_assets")
        .select("id,generation_job_id,storage_key,file_url,asset_type,processing_status")
        .eq("id", report.generationLoop.assetId)
        .single(),
      userClient
        .from("credit_transactions")
        .select("source_type,source_id,balance_impact,status,operation_category")
        .eq("source_id", report.generationLoop.jobId),
      userClient
        .from("credit_transactions")
        .select("source_type,source_id,balance_impact,status,operation_category")
        .eq("source_id", report.creditRefundLoop.jobId),
    ]);

    if (jobRead.error) throw new Error(`generation_jobs readback failed: ${jobRead.error.message}`);
    if (assetRead.error) throw new Error(`media_assets readback failed: ${assetRead.error.message}`);
    if (debitRead.error) throw new Error(`credit debit readback failed: ${debitRead.error.message}`);
    if (refundRead.error) throw new Error(`credit refund readback failed: ${refundRead.error.message}`);

    const debitRows = debitRead.data ?? [];
    const refundRows = refundRead.data ?? [];
    report.databasePersistence.jobReadable =
      jobRead.data?.id === report.generationLoop.jobId &&
      jobRead.data?.status === "completed";
    report.databasePersistence.assetReadable =
      assetRead.data?.id === report.generationLoop.assetId &&
      assetRead.data?.generation_job_id === report.generationLoop.jobId &&
      Boolean(assetRead.data?.storage_key || assetRead.data?.file_url);
    report.databasePersistence.creditDebitReadable = debitRows.some((row) =>
      row.source_id === report.generationLoop.jobId &&
      Number(row.balance_impact) < 0 &&
      row.status === "posted"
    );
    report.databasePersistence.refundReadable = refundRows.some((row) =>
      row.source_id === report.creditRefundLoop.jobId &&
      Number(row.balance_impact) > 0 &&
      row.status === "posted" &&
      row.operation_category === "refund"
    );
    report.databasePersistence.ok =
      report.databasePersistence.jobReadable &&
      report.databasePersistence.assetReadable &&
      report.databasePersistence.creditDebitReadable &&
      report.databasePersistence.refundReadable;
    if (!report.databasePersistence.ok) report.databasePersistence.error = "database_readback_incomplete";
  } catch (error) {
    report.databasePersistence.ok = false;
    report.databasePersistence.error = error instanceof Error ? error.message : "database_persistence_probe_failed";
  }
}

async function invokeAi(accessToken, payload) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body?.error) {
    throw new Error(body?.error?.message || body?.message || `AI function returned ${response.status}`);
  }
  return body;
}
