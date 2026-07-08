// Open Video Studio AI Edge Function.
// Server-only provider orchestration for Qwen Vision, DeepSeek text, Qianwen generation, and Fake Worker fallback.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const DEFAULT_QWEN_VISION_ENDPOINT = "https://47-251-244-196.sslip.io/api/ai/vision/analyze";
const DEFAULT_QWEN_VISION_MODEL = "Qwen/Qwen2.5-VL-7B-Instruct";
const DEFAULT_DEEPSEEK_BASE_URL = "https://api.deepseek.com/v1";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: { code: "METHOD_NOT_ALLOWED", message: "Use POST." } }, 405);

  try {
    const env = loadAiEnv();
    if (!env.supabaseUrl || !env.supabaseAnonKey || !env.supabaseServiceRoleKey) {
      return json({ error: { code: "AI_FUNCTION_NOT_CONFIGURED", message: "Supabase AI function secrets are missing." } }, 500);
    }

    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(env.supabaseUrl, env.supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const adminClient = createClient(env.supabaseUrl, env.supabaseServiceRoleKey);
    const { data: authData, error: authError } = await userClient.auth.getUser();
    if (authError || !authData.user) {
      return json({ error: { code: "AI_AUTH_REQUIRED", message: "Login is required." } }, 401);
    }

    const body = await req.json().catch(() => ({}));
    const action = String(body.action ?? "");
    const user = authData.user;
    const actor = await getActor(adminClient, user.id);

    if (action === "provider-status") {
      requireOperator(actor);
      const providers = providerStatus(env);
      if (body.probe === true) {
        return json({ actor, providers: await providerStatusWithProbes(env, providers) });
      }
      return json({ actor, providers });
    }

    if (action === "enhance-prompt") {
      const prompt = requireText(body.prompt, "PROMPT_REQUIRED");
      const enhanced = await enhancePrompt(env, prompt, safeObject(body.context));
      return json({ prompt, enhancedPrompt: enhanced.prompt, provider: enhanced.provider, model: enhanced.model, fallback: enhanced.fallback });
    }

    if (action === "analyze-image") {
      const result = await analyzeImage(adminClient, env, user.id, body);
      return json(result);
    }

    if (action === "create-generation-job") {
      const job = await createGenerationJob(adminClient, env, user.id, body);
      return json({ job });
    }

    if (action === "process-generation-job") {
      const result = await processGenerationJob(adminClient, env, user.id, body);
      return json(result);
    }

    if (action === "check-generation-status") {
      const job = await getOwnedJob(adminClient, user.id, requireText(body.jobId, "JOB_ID_REQUIRED"));
      return json({ job });
    }

    if (action === "cancel-generation-job") {
      const jobId = requireText(body.jobId, "JOB_ID_REQUIRED");
      const existingJob = await getOwnedJob(adminClient, user.id, jobId);
      const refund = await refundGenerationCredits(adminClient, user.id, existingJob, "Generation cancelled before completion");
      const job = await updateOwnedJob(adminClient, user.id, jobId, {
        status: "cancelled",
        progress: 0,
        updated_at: new Date().toISOString(),
      });
      return json({ job, refund });
    }

    if (action === "demo-credit-purchase") {
      const order = await createDemoCreditPurchase(adminClient, user.id, body);
      return json({ order });
    }

    return json({ error: { code: "AI_ACTION_UNKNOWN", message: `Unknown AI action: ${action}` } }, 400);
  } catch (error) {
    const code = error instanceof AiFunctionError ? error.code : "AI_FUNCTION_FAILED";
    const status = error instanceof AiFunctionError ? error.status : 500;
    const message = error instanceof Error ? error.message : "AI function failed.";
    return json({ error: { code, message } }, status);
  }
});

async function analyzeImage(adminClient: any, env: AiEnv, userId: string, body: Record<string, unknown>) {
  const prompt = String(body.prompt || "请识别这张图片，并用中文输出主体、场景、文字、风险和可用于运营的文案。").trim();
  const imageUrl = typeof body.image_url === "string" ? body.image_url.trim() : "";
  const imageBase64 = typeof body.image_base64 === "string" ? body.image_base64.trim() : "";
  const assetId = typeof body.assetId === "string" ? body.assetId.trim() : "";
  const storageKey = typeof body.storageKey === "string" ? body.storageKey.trim() : "";
  const resolvedImageUrl = imageUrl || await signedImageUrl(adminClient, env, userId, assetId, storageKey);
  if (!resolvedImageUrl && !imageBase64) {
    throw new AiFunctionError("IMAGE_INPUT_REQUIRED", "image_url, image_base64, assetId, or storageKey is required.", 400);
  }

  const started = Date.now();
  const analysis = await callQwenVision(env, {
    prompt,
    image_url: resolvedImageUrl || undefined,
    image_base64: imageBase64 || undefined,
    json: body.json !== false,
    max_tokens: clampNumber(body.max_tokens, 1200, 128, 4000),
    temperature: clampNumber(body.temperature, 0.2, 0, 1),
  });
  const durationMs = Date.now() - started;

  if (assetId) {
    await updateAssetMetadata(adminClient, userId, assetId, {
      qwenVision: {
        provider: "qwen_vision",
        model: env.qwenVisionModel,
        durationMs,
        analysis,
        analyzedAt: new Date().toISOString(),
      },
    });
  }

  return { provider: "qwen_vision", model: env.qwenVisionModel, durationMs, analysis };
}

async function createGenerationJob(adminClient: any, env: AiEnv, userId: string, body: Record<string, unknown>) {
  const mediaType = normalizeMediaType(body.mediaType);
  const prompt = requireText(body.prompt, "PROMPT_REQUIRED");
  const durationSeconds = mediaType === "video" ? clampNumber(body.durationSeconds, 6, 1, 60) : null;
  const workflowId = String(body.workflowId ?? (mediaType === "image" ? "workflow-qianwen-image-v1" : "workflow-qianwen-video-v1")).trim();
  const workflow = await resolveWorkflowConfig(adminClient, workflowId);
  const provider = safeProvider(body.provider) || safeProvider(workflow?.provider) || env.aiProviderDefault;
  const model = String(body.model || defaultModel(env, mediaType, provider)).trim();
  const costCredits = estimateCredits(mediaType, durationSeconds ?? undefined);
  const timestamp = new Date().toISOString();
  const job = {
    id: createId("job"),
    user_id: userId,
    media_type: mediaType,
    status: "queued",
    project_id: body.projectId ?? null,
    prompt,
    provider,
    model,
    tool_slug: body.toolSlug ?? null,
    workflow_id: workflowId,
    workflow_version: body.workflowVersion ?? workflow?.version ?? "v1",
    input_params: {
      prompt,
      sourceAssetId: body.sourceAssetId ?? null,
      characterId: body.characterId ?? null,
      aspectRatio: body.aspectRatio ?? "16:9",
      resolution: body.resolution ?? null,
      durationSeconds,
      providerRequested: provider,
      workflowStatus: workflow?.status ?? "default",
    },
    output_assets: [],
    aspect_ratio: body.aspectRatio ?? "16:9",
    resolution: body.resolution ?? null,
    duration_seconds: durationSeconds,
    source_asset_id: body.sourceAssetId ?? null,
    character_id: body.characterId ?? null,
    cost_credits: costCredits,
    credit_charged: costCredits,
    estimated_cost_cents: estimateCostCents(mediaType, costCredits),
    estimated_cost: estimateCostCents(mediaType, costCredits),
    progress: 0,
    safety_status: "pending_review",
    created_at: timestamp,
    updated_at: timestamp,
  };

  await consumeCredits(adminClient, userId, costCredits, job.id, `${mediaType}_generation`);
  const { data, error } = await adminClient.from("generation_jobs").insert(job).select("*").single();
  if (error) throw new AiFunctionError("GENERATION_JOB_CREATE_FAILED", error.message, 502);
  return data;
}

async function processGenerationJob(adminClient: any, env: AiEnv, userId: string, body: Record<string, unknown>) {
  const jobId = requireText(body.jobId, "JOB_ID_REQUIRED");
  const job = await getOwnedJob(adminClient, userId, jobId);
  if (!["queued", "pending", "retrying", "failed"].includes(String(job.status))) {
    return { job, asset: null, skipped: true };
  }

  const started = Date.now();
  await updateOwnedJob(adminClient, userId, jobId, { status: "running", progress: 20, updated_at: new Date().toISOString() });
  try {
    const mediaType = normalizeMediaType(job.media_type);
    const provider = String(job.provider || env.aiProviderDefault);
    const result = provider === "qianwen_generation"
      ? await callQianwenGeneration(env, job)
      : await fakeWorkerResult(job);
    const durationMs = Date.now() - started;
    const asset = await saveGeneratedAsset(adminClient, env, userId, job, result, durationMs);
    const completed = await updateOwnedJob(adminClient, userId, jobId, {
      status: "completed",
      progress: 100,
      result_asset_id: asset.id,
      output_assets: [asset.id],
      latency: durationMs,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    return { job: completed, asset, provider, mediaType };
  } catch (error) {
    const failed = await updateOwnedJob(adminClient, userId, jobId, {
      status: "failed",
      progress: 0,
      error_code: error instanceof AiFunctionError ? error.code : "AI_PROVIDER_FAILED",
      error_message: error instanceof Error ? error.message : "AI provider failed.",
      updated_at: new Date().toISOString(),
    });
    const refund = await refundGenerationCredits(adminClient, userId, job, error instanceof Error ? error.message : "AI provider failed");
    return { job: failed, asset: null, refund, error: { code: failed.error_code, message: failed.error_message } };
  }
}

async function callQwenVision(env: AiEnv, body: Record<string, unknown>) {
  if (!env.qwenVisionSiteApiKey) throw new AiFunctionError("QWEN_VISION_NOT_CONFIGURED", "Qwen Vision API key is missing.", 500);
  const response = await fetchWithTimeout(env.qwenVisionEndpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.qwenVisionSiteApiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  }, env.providerTimeoutMs);
  return parseProviderResponse(response, "QWEN_VISION_FAILED");
}

async function enhancePrompt(env: AiEnv, prompt: string, context: Record<string, unknown>) {
  if (!env.deepseekApiKey) {
    return { provider: "fake_worker", model: "local-prompt-v0", prompt, fallback: true };
  }
  try {
    const response = await fetchWithTimeout(`${env.deepseekBaseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.deepseekApiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        model: env.deepseekModel,
        temperature: 0.3,
        messages: [
          { role: "system", content: "你是 Open Video Studio 的提示词增强助手。请保留用户意图，用中文输出更适合图片/视频生成的清晰 prompt，不要输出解释。" },
          { role: "user", content: JSON.stringify({ prompt, context }) },
        ],
      }),
    }, env.providerTimeoutMs);
    const data = await parseProviderResponse(response, "DEEPSEEK_FAILED");
    const enhanced = data?.choices?.[0]?.message?.content || data?.content || "";
    return { provider: "deepseek_text", model: env.deepseekModel, prompt: String(enhanced || prompt).trim(), fallback: false };
  } catch {
    return { provider: "fake_worker", model: "local-prompt-v0", prompt, fallback: true };
  }
}

async function callQianwenGeneration(env: AiEnv, job: Record<string, any>) {
  if (!env.qianwenApiKey || !env.qianwenBaseUrl) {
    throw new AiFunctionError("QIANWEN_NOT_CONFIGURED", "Qianwen generation secrets are missing.", 500);
  }
  const mediaType = normalizeMediaType(job.media_type);
  const model = job.model || defaultModel(env, mediaType, "qianwen_generation");
  const response = await fetchWithTimeout(`${env.qianwenBaseUrl.replace(/\/$/, "")}/generations`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.qianwenApiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      model,
      type: mediaType,
      prompt: job.prompt,
      image_url: job.input_params?.sourceImageUrl,
      source_asset_id: job.source_asset_id,
      aspect_ratio: job.aspect_ratio,
      resolution: job.resolution,
      duration_seconds: job.duration_seconds,
      json: true,
    }),
  }, env.providerTimeoutMs);
  const data = await parseProviderResponse(response, "QIANWEN_GENERATION_FAILED");
  return {
    providerJobId: data.id || data.job_id || data.providerJobId || `qianwen_${job.id}`,
    outputUrl: data.output_url || data.url || data.image_url || data.video_url,
    outputBase64: data.output_base64 || data.image_base64 || data.video_base64,
    raw: data,
  };
}

async function fakeWorkerResult(job: Record<string, any>) {
  return {
    providerJobId: `fake_worker_${job.id}`,
    raw: {
      simulated: true,
      prompt: job.prompt,
      provider: job.provider || "fake_worker",
      model: job.model || "local-demo",
      mediaType: job.media_type,
    },
  };
}

async function saveGeneratedAsset(adminClient: any, env: AiEnv, userId: string, job: Record<string, any>, result: Record<string, any>, durationMs: number) {
  const assetId = createId("asset");
  const mediaType = normalizeMediaType(job.media_type);
  const ext = mediaType === "video" ? "json" : "json";
  const storageKey = `${userId}/${assetId}/${mediaType}-${job.id}.${ext}`;
  const payload = JSON.stringify({
    providerJobId: result.providerJobId,
    outputUrl: result.outputUrl ?? null,
    outputBase64: result.outputBase64 ? "[base64 omitted]" : null,
    raw: result.raw ?? {},
  });
  const upload = await adminClient.storage.from(env.supabaseStorageBucket).upload(storageKey, payload, {
    contentType: "application/json",
    upsert: false,
  });
  if (upload.error) throw new AiFunctionError("SUPABASE_STORAGE_UPLOAD_FAILED", upload.error.message, 502);

  const timestamp = new Date().toISOString();
  const asset = {
    id: assetId,
    user_id: userId,
    file_url: storageKey,
    file_type: mediaType,
    consent_confirmed: true,
    owner_user_id: userId,
    project_id: job.project_id ?? null,
    character_id: job.character_id ?? null,
    generation_job_id: job.id,
    asset_type: mediaType,
    source_type: "generation",
    storage_key: storageKey,
    display_name: `${mediaType}-${job.id}.json`,
    tags_json: [],
    metadata_json: {
      generationJobId: job.id,
      provider: job.provider,
      model: job.model,
      prompt: job.prompt,
      providerJobId: result.providerJobId,
      outputUrl: result.outputUrl ?? null,
      credits: job.cost_credits,
      durationMs,
      resolution: job.resolution,
    },
    processing_status: "ready",
    rights_status: "generated",
    moderation_status: "pending",
    visibility_status: "private",
    created_at: timestamp,
    updated_at: timestamp,
  };
  const { data, error } = await adminClient.from("media_assets").insert(asset).select("*").single();
  if (error) throw new AiFunctionError("SUPABASE_ASSET_CREATE_FAILED", error.message, 502);
  return data;
}

async function signedImageUrl(adminClient: any, env: AiEnv, userId: string, assetId: string, storageKey: string) {
  let key = storageKey;
  if (!key && assetId) {
    const { data, error } = await adminClient
      .from("media_assets")
      .select("storage_key,owner_user_id")
      .eq("id", assetId)
      .eq("owner_user_id", userId)
      .single();
    if (error || !data) throw new AiFunctionError("ASSET_NOT_FOUND", "Asset not found.", 404);
    key = data.storage_key;
  }
  if (!key) return "";
  const signed = await adminClient.storage.from(env.supabaseStorageBucket).createSignedUrl(key, 300);
  if (signed.error) throw new AiFunctionError("SUPABASE_SIGNED_URL_FAILED", signed.error.message, 502);
  return signed.data?.signedUrl ?? "";
}

async function updateAssetMetadata(adminClient: any, userId: string, assetId: string, patch: Record<string, unknown>) {
  const { data, error } = await adminClient
    .from("media_assets")
    .select("metadata_json")
    .eq("id", assetId)
    .eq("owner_user_id", userId)
    .single();
  if (error || !data) throw new AiFunctionError("ASSET_NOT_FOUND", "Asset not found.", 404);
  const metadata = typeof data.metadata_json === "object" && data.metadata_json ? data.metadata_json : {};
  const update = await adminClient
    .from("media_assets")
    .update({ metadata_json: { ...metadata, ...patch }, updated_at: new Date().toISOString() })
    .eq("id", assetId)
    .eq("owner_user_id", userId);
  if (update.error) throw new AiFunctionError("ASSET_METADATA_UPDATE_FAILED", update.error.message, 502);
}

async function consumeCredits(adminClient: any, userId: string, amount: number, sourceId: string, operationCategory: string) {
  const { data, error } = await adminClient
    .from("credit_transactions")
    .select("balance_impact,status")
    .eq("user_id", userId);
  if (error) throw new AiFunctionError("CREDITS_READ_FAILED", error.message, 502);
  const balance = (data ?? [])
    .filter((row: Record<string, unknown>) => row.status === "posted")
    .reduce((sum: number, row: Record<string, unknown>) => sum + Number(row.balance_impact ?? 0), 0);
  if (balance < amount) throw new AiFunctionError("CREDITS_INSUFFICIENT", "Not enough credits.", 402);
  const tx = {
    id: createId("ctx"),
    account_id: userId,
    user_id: userId,
    source_type: "generation_job",
    source_id: sourceId,
    amount,
    balance_impact: -amount,
    operation_category: operationCategory,
    status: "posted",
    reason: `AI ${operationCategory}`,
    created_at: new Date().toISOString(),
  };
  const inserted = await adminClient.from("credit_transactions").insert(tx);
  if (inserted.error) throw new AiFunctionError("CREDITS_CONSUME_FAILED", inserted.error.message, 502);
}

async function createDemoCreditPurchase(adminClient: any, userId: string, body: Record<string, unknown>) {
  const credits = clampNumber(body.credits, 0, 1, 200000);
  const amountCents = clampNumber(body.amountCents, 0, 0, 100000000);
  const currency = String(body.currency || "USD").trim().slice(0, 8) || "USD";
  const method = String(body.method || "demo_checkout").trim().slice(0, 80) || "demo_checkout";
  const timestamp = new Date().toISOString();
  const orderId = createId("order");
  const creditTransactionId = createId("ctx");
  const creditInsert = await adminClient.from("credit_transactions").insert({
    id: creditTransactionId,
    account_id: userId,
    user_id: userId,
    source_type: "order",
    source_id: orderId,
    amount: credits,
    balance_impact: credits,
    operation_category: "grant",
    status: "posted",
    reason: "Demo credit purchase fulfilled before real payment gateway is connected",
    created_at: timestamp,
  });
  if (creditInsert.error) throw new AiFunctionError("DEMO_PURCHASE_CREDIT_FAILED", creditInsert.error.message, 502);
  const orderInsert = await adminClient.from("orders").insert({
    id: orderId,
    account_id: userId,
    user_id: userId,
    provider_reference: `demo_${method}`,
    order_type: "credit_purchase",
    status: "fulfilled",
    currency,
    amount_cents: amountCents,
    credits_granted: credits,
    credit_transaction_id: creditTransactionId,
    created_at: timestamp,
    updated_at: timestamp,
    completed_at: timestamp,
  }).select("*").single();
  if (orderInsert.error) throw new AiFunctionError("DEMO_PURCHASE_ORDER_FAILED", orderInsert.error.message, 502);
  return orderInsert.data;
}

async function refundGenerationCredits(adminClient: any, userId: string, job: Record<string, any>, reason: string) {
  const status = String(job.status ?? "");
  if (status === "completed") return { refunded: false, amount: 0, reason: "completed_job" };
  const amount = Number(job.cost_credits ?? job.credit_charged ?? 0);
  if (!Number.isFinite(amount) || amount <= 0) return { refunded: false, amount: 0, reason: "no_credit_charge" };
  const sourceId = String(job.id ?? "");
  if (!sourceId) return { refunded: false, amount: 0, reason: "missing_job_id" };
  const existing = await adminClient
    .from("credit_transactions")
    .select("id")
    .eq("user_id", userId)
    .eq("source_type", "generation_refund")
    .eq("source_id", sourceId)
    .eq("operation_category", "refund")
    .eq("status", "posted")
    .limit(1);
  if (existing.error) throw new AiFunctionError("CREDITS_REFUND_CHECK_FAILED", existing.error.message, 502);
  if ((existing.data ?? []).length > 0) return { refunded: false, amount, reason: "already_refunded" };
  const inserted = await adminClient.from("credit_transactions").insert({
    id: createId("ctx"),
    account_id: userId,
    user_id: userId,
    source_type: "generation_refund",
    source_id: sourceId,
    amount,
    balance_impact: amount,
    operation_category: "refund",
    status: "posted",
    reason,
    created_at: new Date().toISOString(),
  });
  if (inserted.error) throw new AiFunctionError("CREDITS_REFUND_FAILED", inserted.error.message, 502);
  return { refunded: true, amount, reason: "refunded" };
}

async function resolveWorkflowConfig(adminClient: any, workflowId: string): Promise<Record<string, any> | null> {
  if (!workflowId) return null;
  const { data: row, error } = await adminClient
    .from("site_settings")
    .select("value_json")
    .eq("setting_key", "workflow_center_config")
    .maybeSingle();
  if (error || !row?.value_json) return null;
  const workflows = Array.isArray(row.value_json?.workflows) ? row.value_json.workflows : [];
  const workflow = workflows.find((item: Record<string, unknown>) => String(item.workflowId ?? item.workflow_id ?? "") === workflowId);
  if (!workflow) return null;
  const status = String(workflow.status ?? "draft");
  if (!["published", "testing"].includes(status)) return null;
  return workflow;
}

async function getOwnedJob(adminClient: any, userId: string, jobId: string) {
  const { data, error } = await adminClient.from("generation_jobs").select("*").eq("id", jobId).eq("user_id", userId).single();
  if (error || !data) throw new AiFunctionError("GENERATION_JOB_NOT_FOUND", "Generation job not found.", 404);
  return data;
}

async function updateOwnedJob(adminClient: any, userId: string, jobId: string, patch: Record<string, unknown>) {
  const { data, error } = await adminClient.from("generation_jobs").update(patch).eq("id", jobId).eq("user_id", userId).select("*").single();
  if (error || !data) throw new AiFunctionError("GENERATION_JOB_UPDATE_FAILED", error?.message ?? "Generation job update failed.", 502);
  return data;
}

async function getActor(adminClient: any, userId: string) {
  const { data } = await adminClient.from("profiles").select("id,email,display_name,role").eq("id", userId).single();
  return {
    id: userId,
    email: data?.email ?? "",
    displayName: data?.display_name ?? "",
    role: data?.role ?? "user",
  };
}

function requireOperator(actor: Record<string, unknown>) {
  if (!["admin", "operator"].includes(String(actor.role))) {
    throw new AiFunctionError("AI_ADMIN_REQUIRED", "Admin or operator access is required.", 403);
  }
}

function providerStatus(env: AiEnv) {
  return [
    { provider: "qwen_vision", configured: Boolean(env.qwenVisionSiteApiKey), model: env.qwenVisionModel, endpoint: env.qwenVisionEndpoint },
    { provider: "deepseek_text", configured: Boolean(env.deepseekApiKey), model: env.deepseekModel, endpoint: env.deepseekBaseUrl },
    { provider: "qianwen_generation", configured: Boolean(env.qianwenApiKey && env.qianwenBaseUrl), imageModel: env.qianwenImageModel, videoModel: env.qianwenVideoModel, endpoint: env.qianwenBaseUrl },
    { provider: "fake_worker", configured: true, model: "local-demo", endpoint: "internal" },
  ];
}

async function providerStatusWithProbes(env: AiEnv, providers: Array<Record<string, unknown>>) {
  const results = await Promise.all(providers.map(async (provider) => {
    const name = String(provider.provider || "");
    if (name === "qwen_vision" && provider.configured) {
      const started = Date.now();
      try {
        await callQwenVision(env, {
          prompt: "Analyze this small admin provider-health verification image. Return concise JSON.",
          image_base64: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=",
          json: true,
          max_tokens: 180,
          temperature: 0.1,
        });
        return { ...provider, probe: { ok: true, durationMs: Date.now() - started, message: "verified" } };
      } catch (error) {
        return { ...provider, probe: { ok: false, durationMs: Date.now() - started, message: error instanceof Error ? error.message : "Qwen Vision probe failed" } };
      }
    }
    if (name === "deepseek_text" && provider.configured) {
      const started = Date.now();
      try {
        const result = await enhancePrompt(env, "Admin provider health check", { source: "admin-provider-health" });
        return { ...provider, probe: { ok: !result.fallback, durationMs: Date.now() - started, message: result.fallback ? "fallback" : "verified" } };
      } catch (error) {
        return { ...provider, probe: { ok: false, durationMs: Date.now() - started, message: error instanceof Error ? error.message : "DeepSeek probe failed" } };
      }
    }
    if (name === "fake_worker") {
      return { ...provider, probe: { ok: true, durationMs: 0, message: "internal fallback" } };
    }
    return { ...provider, probe: { ok: Boolean(provider.configured), durationMs: 0, message: provider.configured ? "configured; live generation probe skipped" : "missing configuration" } };
  }));
  return results;
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function parseProviderResponse(response: Response, code: string) {
  const text = await response.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { text };
  }
  if (!response.ok) {
    throw new AiFunctionError(code, data?.error?.message || data?.message || response.statusText, response.status);
  }
  return data;
}

function loadAiEnv(): AiEnv {
  return {
    supabaseUrl: Deno.env.get("SUPABASE_URL") ?? "",
    supabaseAnonKey: Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    supabaseServiceRoleKey: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    supabaseStorageBucket: Deno.env.get("SUPABASE_STORAGE_BUCKET") || "open-video-studio-assets",
    qwenVisionEndpoint: Deno.env.get("QWEN_VISION_ENDPOINT") || DEFAULT_QWEN_VISION_ENDPOINT,
    qwenVisionSiteApiKey: Deno.env.get("QWEN_VISION_SITE_API_KEY") ?? "",
    qwenVisionModel: Deno.env.get("QWEN_VISION_MODEL") || DEFAULT_QWEN_VISION_MODEL,
    deepseekApiKey: Deno.env.get("DEEPSEEK_API_KEY") ?? "",
    deepseekBaseUrl: Deno.env.get("DEEPSEEK_BASE_URL") || DEFAULT_DEEPSEEK_BASE_URL,
    deepseekModel: Deno.env.get("DEEPSEEK_MODEL") || "deepseek-chat",
    qianwenApiKey: Deno.env.get("QIANWEN_API_KEY") ?? "",
    qianwenBaseUrl: Deno.env.get("QIANWEN_BASE_URL") ?? "",
    qianwenImageModel: Deno.env.get("QIANWEN_IMAGE_MODEL") || "qianwen-image-v1",
    qianwenVideoModel: Deno.env.get("QIANWEN_VIDEO_MODEL") || "qianwen-video-v1",
    aiProviderDefault: safeProvider(Deno.env.get("AI_PROVIDER_DEFAULT")) || "fake_worker",
    providerTimeoutMs: clampNumber(Deno.env.get("AI_PROVIDER_TIMEOUT_MS"), 60000, 5000, 180000),
  };
}

function normalizeMediaType(value: unknown): "image" | "video" {
  return value === "video" ? "video" : "image";
}

function safeProvider(value: unknown): string {
  const provider = String(value || "").trim();
  return ["qwen_vision", "deepseek_text", "qianwen_generation", "fake_worker", "local_api"].includes(provider) ? provider : "";
}

function defaultModel(env: AiEnv, mediaType: "image" | "video", provider: string) {
  if (provider === "qianwen_generation") return mediaType === "image" ? env.qianwenImageModel : env.qianwenVideoModel;
  return mediaType === "image" ? "local-image-v0" : "local-video-v0";
}

function estimateCredits(mediaType: "image" | "video", durationSeconds?: number): number {
  if (mediaType === "image") return 8;
  return Math.max(24, Math.ceil((durationSeconds ?? 6) / 6) * 24);
}

function estimateCostCents(mediaType: "image" | "video", credits: number): number {
  return mediaType === "image" ? credits * 3 : credits * 5;
}

function clampNumber(value: unknown, fallback: number, min: number, max: number): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.max(min, Math.min(max, numeric));
}

function requireText(value: unknown, code: string): string {
  const text = String(value || "").trim();
  if (!text) throw new AiFunctionError(code, `${code} is required.`, 400);
  return text;
}

function safeObject(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? value as Record<string, unknown> : {};
}

function createId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replaceAll("-", "")}`;
}

function json(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

class AiFunctionError extends Error {
  constructor(readonly code: string, message: string, readonly status = 400) {
    super(message);
  }
}

interface AiEnv {
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceRoleKey: string;
  supabaseStorageBucket: string;
  qwenVisionEndpoint: string;
  qwenVisionSiteApiKey: string;
  qwenVisionModel: string;
  deepseekApiKey: string;
  deepseekBaseUrl: string;
  deepseekModel: string;
  qianwenApiKey: string;
  qianwenBaseUrl: string;
  qianwenImageModel: string;
  qianwenVideoModel: string;
  aiProviderDefault: string;
  providerTimeoutMs: number;
}
