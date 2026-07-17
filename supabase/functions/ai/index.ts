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
const DEFAULT_LIBLIB_BASE_URL = "https://openapi.liblibai.cloud";

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
    if (authData.user.is_anonymous && !env.stagingAnonymousGeneration) {
      return json({ error: { code: "AI_AUTH_REQUIRED", message: "登录后才能使用真实生成。" } }, 401);
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
      const job = await createGenerationJob(adminClient, env, user.id, body, Boolean(user.is_anonymous));
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

    if (action === "create-share-link") {
      const share = await createShareLink(adminClient, user.id, body);
      return json({ share });
    }

    if (action === "demo-credit-purchase") {
      const order = await createDemoCreditPurchase(adminClient, user.id, body);
      return json({ order });
    }

    if (action === "payment-provider-status") {
      return json({ providers: paymentProviderStatus(env), demoCheckoutAvailable: true });
    }

    if (action === "create-payment-checkout") {
      const checkout = await createPaymentCheckout(adminClient, env, user.id, body);
      return json(checkout);
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

async function createGenerationJob(adminClient: any, env: AiEnv, userId: string, body: Record<string, unknown>, isAnonymous = false) {
  const mediaType = normalizeMediaType(body.mediaType);
  const prompt = requireText(body.prompt, "PROMPT_REQUIRED");
  const durationSeconds = mediaType === "video" ? clampNumber(body.durationSeconds, 6, 1, 60) : null;
  const workflowId = String(body.workflowId ?? (mediaType === "image" ? "workflow-qianwen-image-v1" : "workflow-qianwen-video-v1")).trim();
  const workflow = await resolveWorkflowConfig(adminClient, workflowId);
  const provider = safeProvider(body.provider) || safeProvider(workflow?.provider) || env.aiProviderDefault;
  const model = String(body.model || defaultModel(env, mediaType, provider)).trim();
  const costCredits = isAnonymous && env.stagingAnonymousGeneration ? 0 : estimateCredits(mediaType, durationSeconds ?? undefined);
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
      sourceImageUrl: body.sourceImageUrl ?? null,
      characterId: body.characterId ?? null,
      aspectRatio: body.aspectRatio ?? "16:9",
      resolution: body.resolution ?? null,
      durationSeconds,
      providerRequested: provider,
      workflowStatus: workflow?.status ?? "default",
      workflowName: safeObject(workflow?.jsonConfig).workflowName ?? null,
      workflowOverrides: safeObject(workflow?.jsonConfig).workflowOverrides ?? null,
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

  const { data, error } = await adminClient.from("generation_jobs").insert(job).select("*").single();
  if (error) throw new AiFunctionError("GENERATION_JOB_CREATE_FAILED", error.message, 502);

  try {
    await consumeCredits(adminClient, userId, costCredits, job.id, `${mediaType}_generation`);
  } catch (error) {
    await updateOwnedJob(adminClient, userId, job.id, {
      status: "failed",
      progress: 0,
      credit_charged: 0,
      error_code: error instanceof AiFunctionError ? error.code : "CREDITS_CONSUME_FAILED",
      error_message: error instanceof Error ? error.message : "Credit charge failed.",
      updated_at: new Date().toISOString(),
    });
    throw error;
  }

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
      : provider === "liblib_generation"
        ? await callLiblibGeneration(env, job)
        : provider === "zealman_workflow"
          ? await callZealmanWorkflow(env, job)
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
          { role: "system", content: "你是 Open Video Studio 的提示词增强助手。请保留用户意图，用中文输出更适合图片和视频生成的清晰 prompt，不要输出解释。" },
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
  const endpoint = qianwenGenerationEndpoint(env, mediaType);
  const submitted = await submitQianwenGeneration(env, endpoint, model, mediaType, job);
  const data = submitted.data;
  const providerJobId = extractQianwenProviderJobId(data, job.id);
  const outputUrl = extractQianwenOutputUrl(data);
  const outputBase64 = extractQianwenOutputBase64(data);
  if (submitted.isDashScopeNative && providerJobId && !outputUrl && !outputBase64) {
    const completed = await pollQianwenTask(env, submitted.endpoint, providerJobId, mediaType);
    return {
      providerJobId,
      outputUrl: extractQianwenOutputUrl(completed),
      outputBase64: extractQianwenOutputBase64(completed),
      raw: { endpoint: submitted.endpoint, submit: data, result: completed },
    };
  }
  return {
    providerJobId,
    outputUrl,
    outputBase64,
    raw: { endpoint: submitted.endpoint, response: data },
  };
}

async function submitQianwenGeneration(env: AiEnv, endpoint: string, model: string, mediaType: "image" | "video", job: Record<string, any>) {
  const candidates = qianwenGenerationEndpointCandidates(env, mediaType, endpoint);
  let lastError: unknown = null;
  for (const candidate of candidates) {
    const isDashScopeNative = isDashScopeNativeEndpoint(candidate);
    try {
      const response = await fetchWithTimeout(candidate, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.qianwenApiKey}`,
          "Content-Type": "application/json",
          Accept: "application/json",
          ...(isDashScopeAsyncEndpoint(candidate) ? { "X-DashScope-Async": "enable" } : {}),
        },
        body: JSON.stringify(qianwenGenerationPayload(model, mediaType, job, isDashScopeNative, candidate)),
      }, env.providerTimeoutMs);
      const data = await parseProviderResponse(response, "QIANWEN_GENERATION_FAILED");
      return { endpoint: candidate, isDashScopeNative, data };
    } catch (error) {
      lastError = error;
      const status = error instanceof AiFunctionError ? error.status : 0;
      const message = error instanceof Error ? error.message.toLowerCase() : "";
      const retryableCandidateError = status === 404 || message.includes("stream=false") || message.includes("stream false");
      if (!retryableCandidateError) throw error;
    }
  }
  throw lastError instanceof Error ? lastError : new AiFunctionError("QIANWEN_GENERATION_FAILED", "Qianwen generation endpoint was not found.", 404);
}

async function pollQianwenTask(env: AiEnv, generationEndpoint: string, taskId: string, mediaType: "image" | "video") {
  const statusEndpoint = qianwenTaskStatusEndpoint(env, generationEndpoint, taskId);
  const maxPolls = clampNumber(Deno.env.get("QIANWEN_MAX_POLLS"), 36, 1, 80);
  const pollIntervalMs = clampNumber(Deno.env.get("QIANWEN_POLL_INTERVAL_MS"), 5000, 1000, 30000);
  let latest: any = null;
  for (let index = 0; index < maxPolls; index += 1) {
    if (index > 0) await sleep(pollIntervalMs);
    const response = await fetchWithTimeout(statusEndpoint, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${env.qianwenApiKey}`,
        Accept: "application/json",
      },
    }, env.providerTimeoutMs);
    latest = await parseProviderResponse(response, "QIANWEN_TASK_STATUS_FAILED");
    const outputUrl = extractQianwenOutputUrl(latest);
    const outputBase64 = extractQianwenOutputBase64(latest);
    if (outputUrl || outputBase64) return latest;
    if (qianwenTaskFailed(latest)) {
      throw new AiFunctionError("QIANWEN_GENERATION_FAILED", qianwenTaskMessage(latest), 502);
    }
  }
  throw new AiFunctionError("QIANWEN_GENERATION_TIMEOUT", `Qianwen task ${taskId} did not finish before the polling limit.`, 504);
}

async function callLiblibGeneration(env: AiEnv, job: Record<string, any>) {
  if (!env.liblibAccessKey || !env.liblibSecretKey) {
    throw new AiFunctionError("LIBLIB_NOT_CONFIGURED", "Liblib generation secrets are missing.", 500);
  }
  const mediaType = normalizeMediaType(job.media_type);
  if (mediaType !== "image") {
    throw new AiFunctionError("LIBLIB_MEDIA_UNSUPPORTED", "Liblib provider currently supports image generation only.", 400);
  }

  const submitPath = "/api/generate/webui/text2img";
  const submitData = await callLiblibApi(env, submitPath, liblibTextToImagePayload(env, job));
  const providerJobId = String(
    submitData?.data?.generateUuid
    || submitData?.generateUuid
    || submitData?.data?.generate_uuid
    || "",
  );
  if (!providerJobId) {
    throw new AiFunctionError("LIBLIB_GENERATION_FAILED", "Liblib did not return a generateUuid.", 502);
  }

  const statusPath = "/api/generate/webui/status";
  const maxPolls = clampNumber(env.liblibMaxPolls, 12, 1, 60);
  const pollIntervalMs = clampNumber(env.liblibPollIntervalMs, 5000, 1000, 30000);
  let latest: any = null;
  for (let index = 0; index < maxPolls; index += 1) {
    if (index > 0) await sleep(pollIntervalMs);
    latest = await callLiblibApi(env, statusPath, { generateUuid: providerJobId });
    const outputUrl = extractLiblibOutputUrl(latest);
    if (outputUrl) {
      return { providerJobId, outputUrl, raw: latest };
    }
    if (liblibStatusFailed(latest)) {
      throw new AiFunctionError("LIBLIB_GENERATION_FAILED", liblibStatusMessage(latest), 502);
    }
  }

  throw new AiFunctionError("LIBLIB_GENERATION_TIMEOUT", "Liblib generation did not finish before the polling limit.", 504);
}

function liblibTextToImagePayload(env: AiEnv, job: Record<string, any>) {
  const size = normalizeLiblibImageSize(job.resolution, job.aspect_ratio);
  return {
    templateUuid: env.liblibText2ImageTemplateUuid || job.model || env.liblibImageModel,
    generateParams: {
      prompt: String(job.prompt || ""),
      negativePrompt: String(job.input_params?.negativePrompt || job.input_params?.negative_prompt || ""),
      steps: clampNumber(job.input_params?.steps, 25, 1, 80),
      width: size.width,
      height: size.height,
      imgCount: clampNumber(job.input_params?.imgCount, 1, 1, 4),
      seed: Number.isFinite(Number(job.input_params?.seed)) ? Number(job.input_params.seed) : -1,
      restoreFaces: clampNumber(job.input_params?.restoreFaces, 0, 0, 1),
    },
  };
}

async function callLiblibApi(env: AiEnv, path: string, body: Record<string, unknown>) {
  const signedUrl = await liblibSignedUrl(env, path);
  const response = await fetchWithTimeout(signedUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  }, env.providerTimeoutMs);
  const data = await parseProviderResponse(response, "LIBLIB_REQUEST_FAILED");
  const code = data?.code ?? data?.statusCode;
  if (code !== undefined && !["0", "200", 0, 200].includes(code)) {
    throw new AiFunctionError("LIBLIB_REQUEST_FAILED", data?.msg || data?.message || "Liblib request failed.", 502);
  }
  return data;
}

async function liblibSignedUrl(env: AiEnv, path: string) {
  const timestamp = String(Date.now());
  const nonce = crypto.randomUUID().replaceAll("-", "");
  const signature = await hmacSha1Base64Url(env.liblibSecretKey, [path, timestamp, nonce].join("&"));
  const query = new URLSearchParams({
    AccessKey: env.liblibAccessKey,
    Signature: signature,
    Timestamp: timestamp,
    SignatureNonce: nonce,
  });
  return `${env.liblibBaseUrl.replace(/\/$/, "")}${path}?${query.toString()}`;
}

async function hmacSha1Base64Url(secret: string, content: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(content));
  let binary = "";
  for (const byte of new Uint8Array(signature)) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/g, "");
}

function extractLiblibOutputUrl(data: any): string {
  const root = data?.data ?? data ?? {};
  const images = root.images || root.imageList || root.outputImages || root.generateImages || root.result?.images || [];
  const first = Array.isArray(images) ? images[0] : images;
  return String(
    first?.imageUrl
    || first?.url
    || first?.originImageUrl
    || first?.previewUrl
    || root.imageUrl
    || root.outputUrl
    || root.result?.imageUrl
    || "",
  ).trim();
}

function liblibStatusFailed(data: any): boolean {
  const root = data?.data ?? data ?? {};
  const status = String(root.generateStatus ?? root.status ?? root.state ?? "").toLowerCase();
  return ["failed", "fail", "error", "timeout", "4", "6", "7"].includes(status);
}

function liblibStatusMessage(data: any): string {
  const root = data?.data ?? data ?? {};
  return String(root.message || root.msg || root.errorMessage || data?.message || "Liblib generation failed.");
}

function normalizeLiblibImageSize(resolution: unknown, aspectRatio: unknown): { width: number; height: number } {
  const value = String(resolution || "").trim();
  const match = value.match(/^(\d+)x(\d+)$/);
  if (match) return { width: Number(match[1]), height: Number(match[2]) };
  const ratio = String(aspectRatio || "16:9");
  if (ratio === "1:1") return { width: 1024, height: 1024 };
  if (ratio === "9:16") return { width: 768, height: 1344 };
  return { width: 1344, height: 768 };
}

async function callZealmanWorkflow(env: AiEnv, job: Record<string, any>) {
  if (!env.zealmanPanelBaseUrl || !env.zealmanComfyBaseUrl) {
    throw new AiFunctionError("ZEALMAN_NOT_CONFIGURED", "Zealman panel and ComfyUI URLs are missing.", 500);
  }
  const workflowName = resolveZealmanWorkflowName(env, job);
  if (!workflowName) {
    throw new AiFunctionError("ZEALMAN_WORKFLOW_MISSING", "Zealman workflow name is missing.", 500);
  }

  const workflow = await fetchZealmanWorkflow(env, workflowName);
  applyZealmanPrompt(workflow, String(job.prompt || ""), env.zealmanPromptNodeId);
  const inputParams = safeObject(job.input_params);
  const sourceImageUrl = String(inputParams.sourceImageUrl || inputParams.source_image_url || "").trim();
  if (sourceImageUrl) {
    const uploadedImage = await uploadZealmanSourceImage(env, sourceImageUrl, String(job.id || crypto.randomUUID()));
    applyZealmanUploadedImage(workflow, uploadedImage);
  }

  const submit = await submitZealmanWorkflow(env, workflow);
  const providerJobId = String(submit.prompt_id || submit.promptId || submit.data?.prompt_id || "").trim();
  if (!providerJobId) {
    throw new AiFunctionError("ZEALMAN_SUBMIT_FAILED", "Zealman did not return a prompt id.", 502);
  }

  const result = await pollZealmanHistory(env, providerJobId);
  const outputs = extractZealmanOutputs(env, result, providerJobId);
  if (!outputs.length) {
    throw new AiFunctionError("ZEALMAN_OUTPUT_MISSING", "Zealman workflow completed without an output file.", 502);
  }
  return {
    providerJobId,
    outputUrl: outputs[0].url,
    raw: { workflowName, submit, outputs, status: result?.status ?? null },
  };
}

function resolveZealmanWorkflowName(env: AiEnv, job: Record<string, any>): string {
  const mediaType = normalizeMediaType(job.media_type);
  const inputParams = safeObject(job.input_params);
  const requested = String(inputParams.workflowName || inputParams.workflow_name || "").trim();
  if (requested) return requested;
  const model = String(job.model || "").trim();
  if (model && !["zealman_workflow", "zealman-image-v1", "zealman-video-v1"].includes(model)) return model;
  const workflowId = String(job.workflow_id || "").toLowerCase();
  const configuredMap = parseWorkflowMap(env.zealmanWorkflowMapJson);
  const mapped = configuredMap[workflowId] || configuredMap[String(job.tool_slug || "").toLowerCase()];
  if (mapped) return mapped;
  if (workflowId.includes("g03")) return env.zealmanSmoothVideoWorkflow || env.zealmanVideoWorkflow;
  if (workflowId.includes("j11")) return env.zealmanDigitalHumanWorkflow || env.zealmanVideoWorkflow;
  return mediaType === "video" ? env.zealmanVideoWorkflow : env.zealmanImageWorkflow;
}

function parseWorkflowMap(raw: string): Record<string, string> {
  if (!raw) return {};
  try {
    const value = JSON.parse(raw);
    if (!value || typeof value !== "object") return {};
    return Object.fromEntries(Object.entries(value).filter(([, item]) => typeof item === "string" && item.trim()).map(([key, item]) => [String(key).toLowerCase(), String(item).trim()]));
  } catch { return {}; }
}

async function fetchZealmanWorkflow(env: AiEnv, workflowName: string): Promise<Record<string, any>> {
  const endpoint = `${env.zealmanPanelBaseUrl.replace(/\/$/, "")}/api/workflows/download/${encodeURIComponent(workflowName)}`;
  const response = await fetchWithTimeout(endpoint, {
    method: "GET",
    headers: zealmanHeaders(env),
  }, env.providerTimeoutMs);
  return await parseProviderResponse(response, "ZEALMAN_WORKFLOW_DOWNLOAD_FAILED");
}

function applyZealmanPrompt(workflow: Record<string, any>, prompt: string, promptNodeId: string) {
  if (!prompt) return;
  const direct = promptNodeId ? workflow[promptNodeId] : null;
  if (direct?.inputs && typeof direct.inputs.text === "string") {
    direct.inputs.text = prompt;
    return;
  }
  let fallbackNode: any = null;
  for (const node of Object.values(workflow)) {
    if (!node || typeof node !== "object" || !node.inputs || typeof node.inputs.text !== "string") continue;
    const nodeName = `${node.class_type || ""} ${node._meta?.title || ""}`.toLowerCase();
    if (nodeName.includes("negative")) continue;
    fallbackNode = fallbackNode || node;
    if (nodeName.includes("positive") || nodeName.includes("prompt") || nodeName.includes("text")) {
      node.inputs.text = prompt;
      return;
    }
  }
  if (fallbackNode) fallbackNode.inputs.text = prompt;
}

async function uploadZealmanSourceImage(env: AiEnv, sourceImageUrl: string, jobId: string): Promise<string> {
  const source = await fetchWithTimeout(sourceImageUrl, { method: "GET", headers: { Accept: "image/*,*/*" } }, env.providerTimeoutMs);
  if (!source.ok) {
    throw new AiFunctionError("ZEALMAN_SOURCE_IMAGE_DOWNLOAD_FAILED", `Could not download source image: ${source.status}`, 502);
  }
  const contentType = normalizeGeneratedContentType(source.headers.get("content-type"), "image");
  const extension = extensionForContentType(contentType, "image");
  const form = new FormData();
  form.append("image", new Blob([await source.arrayBuffer()], { type: contentType }), `${jobId}.${extension}`);
  form.append("overwrite", "true");
  const response = await fetchWithTimeout(`${env.zealmanComfyBaseUrl.replace(/\/$/, "")}/upload/image`, {
    method: "POST",
    headers: zealmanHeaders(env, false),
    body: form,
  }, env.providerTimeoutMs);
  const data = await parseProviderResponse(response, "ZEALMAN_SOURCE_IMAGE_UPLOAD_FAILED");
  const name = String(data?.name || data?.filename || data?.data?.name || "").trim();
  if (!name) throw new AiFunctionError("ZEALMAN_SOURCE_IMAGE_UPLOAD_FAILED", "ComfyUI did not return an uploaded image name.", 502);
  return name;
}

function applyZealmanUploadedImage(workflow: Record<string, any>, imageName: string) {
  for (const node of Object.values(workflow)) {
    if (!node || typeof node !== "object" || !node.inputs) continue;
    const nodeName = String(node.class_type || "").toLowerCase();
    if (nodeName.includes("loadimage") || Object.prototype.hasOwnProperty.call(node.inputs, "image")) {
      node.inputs.image = imageName;
      return;
    }
  }
}

async function submitZealmanWorkflow(env: AiEnv, workflow: Record<string, any>) {
  const endpoint = `${env.zealmanPanelBaseUrl.replace(/\/$/, "")}/api/workflow/generate`;
  const response = await fetchWithTimeout(endpoint, {
    method: "POST",
    headers: zealmanHeaders(env),
    body: JSON.stringify({ workflow_template: workflow, client_id: crypto.randomUUID() }),
  }, env.providerTimeoutMs);
  return await parseProviderResponse(response, "ZEALMAN_SUBMIT_FAILED");
}

async function pollZealmanHistory(env: AiEnv, promptId: string) {
  const maxPolls = clampNumber(env.zealmanMaxPolls, 180, 1, 720);
  const pollIntervalMs = clampNumber(env.zealmanPollIntervalMs, 5000, 1000, 30000);
  let latest: any = null;
  for (let index = 0; index < maxPolls; index += 1) {
    if (index > 0) await sleep(pollIntervalMs);
    const response = await fetchWithTimeout(`${env.zealmanComfyBaseUrl.replace(/\/$/, "")}/history/${encodeURIComponent(promptId)}`, {
      method: "GET",
      headers: zealmanHeaders(env, false),
    }, env.providerTimeoutMs);
    const data = await parseProviderResponse(response, "ZEALMAN_HISTORY_FAILED");
    latest = data?.[promptId] || data?.data?.[promptId] || data;
    if (!latest || !Object.keys(latest).length) continue;
    const status = String(latest?.status?.status_str || latest?.status || "").toLowerCase();
    if (["error", "failed", "failure"].includes(status)) {
      throw new AiFunctionError("ZEALMAN_GENERATION_FAILED", zealmanHistoryMessage(latest), 502);
    }
    const outputs = extractZealmanOutputs(env, latest, promptId);
    if (outputs.length || status === "success" || latest.outputs) return latest;
  }
  throw new AiFunctionError("ZEALMAN_GENERATION_TIMEOUT", `Zealman workflow ${promptId} did not finish before the polling limit.`, 504);
}

function extractZealmanOutputs(env: AiEnv, history: any, promptId: string): Array<Record<string, string>> {
  const outputs: Array<Record<string, string>> = [];
  const nodes = history?.outputs || history?.data?.outputs || {};
  for (const output of Object.values(nodes)) {
    const files = [
      ...arrayOfRecords((output as any)?.images),
      ...arrayOfRecords((output as any)?.gifs),
      ...arrayOfRecords((output as any)?.videos),
    ];
    for (const file of files) {
      const filename = String(file.filename || file.name || "").trim();
      if (!filename) continue;
      const subfolder = String(file.subfolder || "");
      const type = String(file.type || "output");
      const query = new URLSearchParams({ filename, subfolder, type });
      outputs.push({
        filename,
        subfolder,
        type,
        promptId,
        url: `${env.zealmanComfyBaseUrl.replace(/\/$/, "")}/view?${query.toString()}`,
      });
    }
  }
  return outputs;
}

function arrayOfRecords(value: unknown): Array<Record<string, any>> {
  if (Array.isArray(value)) return value.filter((item) => item && typeof item === "object") as Array<Record<string, any>>;
  return [];
}

function zealmanHistoryMessage(history: any): string {
  return String(history?.status?.messages?.[0]?.[1]?.exception_message || history?.error || history?.message || "Zealman workflow failed.");
}

function zealmanHeaders(env: AiEnv, jsonBody = true): HeadersInit {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (jsonBody) headers["Content-Type"] = "application/json";
  if (env.zealmanApiToken) headers.Authorization = env.zealmanApiToken;
  return headers;
}

function qianwenGenerationEndpoint(env: AiEnv, mediaType: "image" | "video"): string {
  const explicit = mediaType === "image" ? env.qianwenImageEndpoint : env.qianwenVideoEndpoint;
  if (explicit) return explicit;
  const base = env.qianwenBaseUrl.replace(/\/$/, "");
  if (/\/(generations|image-synthesis|video-synthesis)$/i.test(base) || base.includes("/services/")) return base;
  if (isOpenAiCompatibleQianwenBase(base)) {
    return mediaType === "image" ? `${base}/images/generations` : `${base}/videos/generations`;
  }
  if (base.includes("dashscope") || base.includes("maas.aliyuncs.com") || /\/api\/v1$/i.test(base)) {
    const apiBase = /\/api\/v1$/i.test(base) ? base : `${base}/api/v1`;
    return mediaType === "image"
      ? `${apiBase}/services/aigc/multimodal-generation/generation`
      : `${apiBase}/services/aigc/video-generation/video-synthesis`;
  }
  return mediaType === "image" ? `${base}/images/generations` : `${base}/videos/generations`;
}

function qianwenGenerationEndpointCandidates(env: AiEnv, mediaType: "image" | "video", primary: string): string[] {
  const base = env.qianwenBaseUrl.replace(/\/$/, "");
  const roots = qianwenEndpointRoots(base, primary);
  const candidates = [primary];
  for (const root of roots) {
    const openAiBase = `${root}/compatible-mode/v1`;
    const nativeBase = `${root}/api/v1`;
    if (mediaType === "image") {
      candidates.push(
        `${nativeBase}/services/aigc/image-generation/generation`,
        `${nativeBase}/services/aigc/multimodal-generation/generation`,
        `${nativeBase}/services/aigc/text2image/image-synthesis`,
        `${openAiBase}/images/generations`,
      );
    } else {
      candidates.push(
        `${nativeBase}/services/aigc/video-generation/video-synthesis`,
        `${openAiBase}/videos/generations`,
      );
    }
  }
  return [...new Set(candidates.map((item) => item.replace(/([^:]\/)\/+/g, "$1")))];
}

function qianwenEndpointRoots(...values: string[]): string[] {
  const roots: string[] = [];
  for (const value of values) {
    const cleaned = String(value || "").replace(/\/$/, "");
    if (!cleaned) continue;
    const root = cleaned
      .replace(/\/compatible-mode\/v1(?:\/.*)?$/i, "")
      .replace(/\/openai\/v1(?:\/.*)?$/i, "")
      .replace(/\/api\/v1(?:\/.*)?$/i, "")
      .replace(/\/images\/generations$/i, "")
      .replace(/\/videos\/generations$/i, "");
    if (/^https?:\/\//i.test(root)) roots.push(root);
  }
  return [...new Set(roots)];
}

function qianwenTaskStatusEndpoint(env: AiEnv, generationEndpoint: string, taskId: string): string {
  const explicitBase = env.qianwenBaseUrl.replace(/\/$/, "");
  const nativeApiBase = generationEndpoint.includes("/api/v1/")
    ? generationEndpoint.split("/api/v1/")[0] + "/api/v1"
    : explicitBase.endsWith("/api/v1")
      ? explicitBase
      : `${explicitBase}/api/v1`;
  return `${nativeApiBase}/tasks/${encodeURIComponent(taskId)}`;
}

function isOpenAiCompatibleQianwenBase(base: string): boolean {
  return /\/compatible-mode\/v1$/i.test(base) || /\/openai\/v1$/i.test(base) || /\/v1$/i.test(base) && !base.includes("/api/v1");
}

function qianwenGenerationPayload(model: string, mediaType: "image" | "video", job: Record<string, any>, dashScopeNative: boolean, endpoint = "") {
  if (dashScopeNative) {
    if (mediaType === "image") {
      if (endpoint.includes("/text2image/image-synthesis")) {
        return {
          model,
          input: {
            prompt: String(job.prompt || ""),
          },
          parameters: {
            prompt_extend: true,
            watermark: false,
            n: 1,
            size: normalizeDashScopeImageSize(job.resolution, job.aspect_ratio),
          },
        };
      }
      return {
        model,
        input: {
          messages: [
            {
              role: "user",
              content: [{ text: String(job.prompt || "") }],
            },
          ],
        },
        parameters: {
          prompt_extend: true,
          watermark: false,
          n: 1,
          enable_interleave: true,
          size: normalizeDashScopeImageSize(job.resolution, job.aspect_ratio),
        },
      };
    }
    return {
      model,
      input: {
        prompt: job.prompt,
        ...(job.input_params?.sourceImageUrl ? {
          media: [{ type: "first_frame", url: job.input_params.sourceImageUrl }],
        } : {}),
      },
      parameters: {
        size: normalizeDashScopeVideoSize(job.resolution, job.aspect_ratio),
        duration: job.duration_seconds ?? 5,
        prompt_extend: true,
      },
    };
  }
  const basePayload = {
    model,
    prompt: job.prompt,
    json: true,
  };
  if (mediaType === "image") {
    return {
      ...basePayload,
      size: normalizeImageSize(job.resolution, job.aspect_ratio),
      aspect_ratio: job.aspect_ratio,
      response_format: "url",
    };
  }
  return {
    ...basePayload,
    type: "video",
    image_url: job.input_params?.sourceImageUrl,
    source_asset_id: job.source_asset_id,
    aspect_ratio: job.aspect_ratio,
    resolution: job.resolution,
    duration_seconds: job.duration_seconds,
  };
}

function isDashScopeNativeEndpoint(endpoint: string): boolean {
  if (endpoint.includes("/compatible-mode/") || endpoint.includes("/openai/")) return false;
  return endpoint.includes("/api/v1/services/aigc/") || endpoint.includes("dashscope") || endpoint.includes("maas.aliyuncs.com");
}

function isDashScopeAsyncEndpoint(endpoint: string): boolean {
  return endpoint.includes("/image-generation/generation") || endpoint.includes("/video-generation/video-synthesis");
}

function extractQianwenProviderJobId(data: any, fallbackId: unknown): string {
  return String(
    data?.id
    || data?.job_id
    || data?.task_id
    || data?.output?.task_id
    || data?.output?.taskId
    || data?.providerJobId
    || data?.request_id
    || `qianwen_${fallbackId}`,
  );
}

function extractQianwenOutputUrl(data: any): string {
  const messageContent = data?.output?.choices?.[0]?.message?.content;
  const generatedContent = Array.isArray(messageContent)
    ? messageContent.find((item: Record<string, unknown>) => item?.image || item?.video)
    : null;
  const outputResults = data?.output?.results || data?.output?.result || data?.results || data?.result || data?.data;
  const firstResult = Array.isArray(outputResults) ? outputResults[0] : outputResults;
  return String(
    data?.output_url
    || data?.url
    || data?.image_url
    || data?.video_url
    || data?.output?.url
    || data?.output?.image_url
    || data?.output?.video_url
    || data?.output?.video?.url
    || data?.output?.image?.url
    || generatedContent?.image
    || generatedContent?.video
    || firstResult?.url
    || firstResult?.image_url
    || firstResult?.video_url
    || firstResult?.orig_url
    || firstResult?.render_url
    || "",
  ).trim();
}

function extractQianwenOutputBase64(data: any): string {
  const outputResults = data?.output?.results || data?.results || data?.data;
  const firstResult = Array.isArray(outputResults) ? outputResults[0] : outputResults;
  return String(
    data?.output_base64
    || data?.image_base64
    || data?.video_base64
    || data?.b64_json
    || firstResult?.b64_json
    || firstResult?.image_base64
    || firstResult?.video_base64
    || "",
  ).trim();
}

function qianwenTaskFailed(data: any): boolean {
  const status = String(data?.output?.task_status || data?.task_status || data?.status || data?.state || "").toLowerCase();
  return ["failed", "fail", "error", "canceled", "cancelled", "unknown"].includes(status);
}

function qianwenTaskMessage(data: any): string {
  return String(data?.output?.message || data?.message || data?.error?.message || "Qianwen generation failed.");
}

function normalizeImageSize(resolution: unknown, aspectRatio: unknown): string {
  const value = String(resolution || "").trim();
  if (/^\d+x\d+$/.test(value)) return value;
  const ratio = String(aspectRatio || "16:9");
  if (ratio === "1:1") return "1024x1024";
  if (ratio === "9:16") return "1024x1792";
  return "1792x1024";
}

function normalizeDashScopeImageSize(resolution: unknown, aspectRatio: unknown): string {
  const value = String(resolution || "").trim().replace("x", "*");
  if (/^\d+\*\d+$/.test(value)) return value;
  const ratio = String(aspectRatio || "16:9");
  if (ratio === "1:1") return "1280*1280";
  if (ratio === "9:16") return "720*1280";
  return "1280*720";
}

function normalizeDashScopeVideoSize(resolution: unknown, aspectRatio: unknown): string {
  const value = String(resolution || "").trim().replace("x", "*");
  if (/^\d+\*\d+$/.test(value)) return value;
  const ratio = String(aspectRatio || "16:9");
  if (ratio === "9:16") return "720*1280";
  if (ratio === "1:1") return "960*960";
  return "1280*720";
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
  const storedObject = await storeGeneratedMediaObject(env, userId, assetId, mediaType, job, result);
  const upload = await adminClient.storage.from(env.supabaseStorageBucket).upload(storedObject.storageKey, storedObject.body, {
    contentType: storedObject.contentType,
    upsert: false,
  });
  if (upload.error) throw new AiFunctionError("SUPABASE_STORAGE_UPLOAD_FAILED", upload.error.message, 502);

  const timestamp = new Date().toISOString();
  const asset = {
    id: assetId,
    user_id: userId,
    file_url: storedObject.storageKey,
    file_type: mediaType,
    consent_confirmed: true,
    owner_user_id: userId,
    project_id: job.project_id ?? null,
    character_id: job.character_id ?? null,
    generation_job_id: job.id,
    asset_type: mediaType,
    source_type: "generation",
    storage_key: storedObject.storageKey,
    display_name: storedObject.displayName,
    tags_json: [],
    metadata_json: {
      generationJobId: job.id,
      provider: job.provider,
      model: job.model,
      prompt: job.prompt,
      providerJobId: result.providerJobId,
      outputUrl: result.outputUrl ?? null,
      storageKind: storedObject.storageKind,
      storageContentType: storedObject.contentType,
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

async function storeGeneratedMediaObject(env: AiEnv, userId: string, assetId: string, mediaType: "image" | "video", job: Record<string, any>, result: Record<string, any>) {
  if (result.outputBase64) {
    const decoded = decodeProviderBase64Output(String(result.outputBase64), mediaType);
    return {
      storageKey: `${userId}/${assetId}/${mediaType}-${job.id}.${extensionForContentType(decoded.contentType, mediaType)}`,
      displayName: `${mediaType}-${job.id}.${extensionForContentType(decoded.contentType, mediaType)}`,
      contentType: decoded.contentType,
      body: decoded.body,
      storageKind: "provider_base64",
    };
  }

  if (result.outputUrl) {
    const downloaded = await downloadProviderOutputUrl(env, String(result.outputUrl), mediaType);
    return {
      storageKey: `${userId}/${assetId}/${mediaType}-${job.id}.${extensionForContentType(downloaded.contentType, mediaType)}`,
      displayName: `${mediaType}-${job.id}.${extensionForContentType(downloaded.contentType, mediaType)}`,
      contentType: downloaded.contentType,
      body: downloaded.body,
      storageKind: "provider_url",
    };
  }

  const payload = JSON.stringify({
    providerJobId: result.providerJobId,
    outputUrl: result.outputUrl ?? null,
    outputBase64: result.outputBase64 ? "[base64 omitted]" : null,
    raw: result.raw ?? {},
  });
  return {
    storageKey: `${userId}/${assetId}/${mediaType}-${job.id}.json`,
    displayName: `${mediaType}-${job.id}.json`,
    contentType: "application/json",
    body: payload,
    storageKind: "metadata_json",
  };
}

async function downloadProviderOutputUrl(env: AiEnv, outputUrl: string, mediaType: "image" | "video") {
  const response = await fetchWithTimeout(outputUrl, {
    method: "GET",
    headers: { Accept: mediaType === "video" ? "video/*,*/*" : "image/*,*/*" },
  }, env.providerTimeoutMs);
  if (!response.ok) {
    throw new AiFunctionError("PROVIDER_OUTPUT_DOWNLOAD_FAILED", `Could not download provider output: ${response.status}`, 502);
  }
  const contentType = normalizeGeneratedContentType(response.headers.get("content-type"), mediaType);
  const body = new Uint8Array(await response.arrayBuffer());
  if (!body.byteLength) {
    throw new AiFunctionError("PROVIDER_OUTPUT_EMPTY", "Provider output was empty.", 502);
  }
  return { contentType, body };
}

function decodeProviderBase64Output(outputBase64: string, mediaType: "image" | "video") {
  const match = outputBase64.match(/^data:([^;]+);base64,(.+)$/);
  const contentType = normalizeGeneratedContentType(match?.[1] || "", mediaType);
  const raw = match?.[2] || outputBase64;
  const binary = atob(raw);
  const body = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    body[index] = binary.charCodeAt(index);
  }
  if (!body.byteLength) {
    throw new AiFunctionError("PROVIDER_OUTPUT_EMPTY", "Provider base64 output was empty.", 502);
  }
  return { contentType, body };
}

function normalizeGeneratedContentType(contentType: string | null, mediaType: "image" | "video") {
  const value = String(contentType || "").split(";")[0].trim().toLowerCase();
  if (mediaType === "video" && value.startsWith("video/")) return value;
  if (mediaType === "image" && value.startsWith("image/")) return value;
  return mediaType === "video" ? "video/mp4" : "image/png";
}

function extensionForContentType(contentType: string, mediaType: "image" | "video") {
  const value = String(contentType || "").toLowerCase();
  if (value.includes("webp")) return "webp";
  if (value.includes("jpeg") || value.includes("jpg")) return "jpg";
  if (value.includes("gif")) return "gif";
  if (value.includes("quicktime")) return "mov";
  if (value.includes("webm")) return "webm";
  if (value.includes("mp4")) return "mp4";
  return mediaType === "video" ? "mp4" : "png";
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
  const orderInsert = await adminClient.from("orders").insert({
    id: orderId,
    account_id: userId,
    user_id: userId,
    provider_reference: `demo_${method}`,
    order_type: "credit_purchase",
    status: "pending",
    currency,
    amount_cents: amountCents,
    credits_granted: credits,
    credit_transaction_id: null,
    created_at: timestamp,
    updated_at: timestamp,
  }).select("*").single();
  if (orderInsert.error) throw new AiFunctionError("DEMO_PURCHASE_ORDER_FAILED", orderInsert.error.message, 502);

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
  if (creditInsert.error) {
    await adminClient.from("orders").update({
      status: "failed",
      updated_at: new Date().toISOString(),
    }).eq("id", orderId).eq("user_id", userId);
    throw new AiFunctionError("DEMO_PURCHASE_CREDIT_FAILED", creditInsert.error.message, 502);
  }

  const fulfilled = await adminClient.from("orders").update({
    status: "fulfilled",
    credit_transaction_id: creditTransactionId,
    updated_at: new Date().toISOString(),
    completed_at: new Date().toISOString(),
  }).eq("id", orderId).eq("user_id", userId).select("*").single();
  if (fulfilled.error) throw new AiFunctionError("DEMO_PURCHASE_FULFILL_FAILED", fulfilled.error.message, 502);
  return fulfilled.data;
}

async function createPaymentCheckout(adminClient: any, env: AiEnv, userId: string, body: Record<string, unknown>) {
  const provider = String(body.provider || "").trim().toLowerCase();
  if (!["stripe", "paypal"].includes(provider)) {
    throw new AiFunctionError("PAYMENT_PROVIDER_UNSUPPORTED", "Only Stripe and PayPal checkout are supported.", 400);
  }
  const credits = clampNumber(body.credits, 0, 1, 200000);
  const amountCents = clampNumber(body.amountCents, 0, 50, 100000000);
  const currency = String(body.currency || "USD").trim().toUpperCase().slice(0, 8) || "USD";
  const planName = String(body.planName || `${credits} Luravyn credits`).trim().slice(0, 120);
  const returnUrl = safeReturnUrl(body.returnUrl, `${env.appUrl}/zh/dashboard/`);
  const cancelUrl = safeReturnUrl(body.cancelUrl, `${env.appUrl}/zh/pricing/`);
  const timestamp = new Date().toISOString();
  const orderId = createId("order");

  const orderInsert = await adminClient.from("orders").insert({
    id: orderId,
    account_id: userId,
    user_id: userId,
    provider_reference: `${provider}:pending`,
    order_type: "credit_purchase",
    status: "pending",
    currency,
    amount_cents: amountCents,
    credits_granted: credits,
    credit_transaction_id: null,
    created_at: timestamp,
    updated_at: timestamp,
  }).select("*").single();
  if (orderInsert.error) throw new AiFunctionError("PAYMENT_ORDER_CREATE_FAILED", orderInsert.error.message, 502);

  try {
    const providerResult = provider === "stripe"
      ? await createStripeCheckoutSession(env, { orderId, userId, credits, amountCents, currency, planName, returnUrl, cancelUrl })
      : await createPaypalOrder(env, { orderId, userId, credits, amountCents, currency, planName, returnUrl, cancelUrl });

    const updated = await adminClient.from("orders").update({
      provider_reference: `${provider}:${providerResult.providerReference}`,
      updated_at: new Date().toISOString(),
    }).eq("id", orderId).eq("user_id", userId).select("*").single();
    if (updated.error) throw new AiFunctionError("PAYMENT_ORDER_UPDATE_FAILED", updated.error.message, 502);

    return {
      provider,
      checkoutUrl: providerResult.checkoutUrl,
      providerReference: providerResult.providerReference,
      order: updated.data,
      mode: "provider_checkout",
    };
  } catch (error) {
    await adminClient.from("orders").update({
      status: "failed",
      updated_at: new Date().toISOString(),
    }).eq("id", orderId).eq("user_id", userId);
    throw error;
  }
}

async function createStripeCheckoutSession(env: AiEnv, input: PaymentCheckoutInput) {
  if (!env.stripeSecretKey) {
    throw new AiFunctionError("PAYMENT_PROVIDER_NOT_CONFIGURED", "Stripe is not configured yet.", 409);
  }
  const successUrl = appendCheckoutParams(input.returnUrl, { provider: "stripe", order_id: input.orderId, checkout: "success" });
  const cancelUrl = appendCheckoutParams(input.cancelUrl, { provider: "stripe", order_id: input.orderId, checkout: "cancelled" });
  const params = new URLSearchParams();
  params.set("mode", "payment");
  params.set("success_url", `${successUrl}&session_id={CHECKOUT_SESSION_ID}`);
  params.set("cancel_url", cancelUrl);
  params.set("client_reference_id", input.orderId);
  params.set("line_items[0][price_data][currency]", input.currency.toLowerCase());
  params.set("line_items[0][price_data][product_data][name]", input.planName);
  params.set("line_items[0][price_data][unit_amount]", String(input.amountCents));
  params.set("line_items[0][quantity]", "1");
  params.set("metadata[order_id]", input.orderId);
  params.set("metadata[user_id]", input.userId);
  params.set("metadata[credits]", String(input.credits));

  const response = await fetchWithTimeout("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.stripeSecretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  }, env.providerTimeoutMs);
  const data = await parseProviderResponse(response, "STRIPE_CHECKOUT_FAILED");
  if (!data?.id || !data?.url) throw new AiFunctionError("STRIPE_CHECKOUT_INVALID_RESPONSE", "Stripe did not return a checkout URL.", 502);
  return { providerReference: String(data.id), checkoutUrl: String(data.url) };
}

async function createPaypalOrder(env: AiEnv, input: PaymentCheckoutInput) {
  if (!env.paypalClientId || !env.paypalClientSecret) {
    throw new AiFunctionError("PAYMENT_PROVIDER_NOT_CONFIGURED", "PayPal is not configured yet.", 409);
  }
  const baseUrl = env.paypalEnvironment === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
  const tokenResponse = await fetchWithTimeout(`${baseUrl}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`${env.paypalClientId}:${env.paypalClientSecret}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  }, env.providerTimeoutMs);
  const tokenData = await parseProviderResponse(tokenResponse, "PAYPAL_TOKEN_FAILED");
  const accessToken = String(tokenData?.access_token || "");
  if (!accessToken) throw new AiFunctionError("PAYPAL_TOKEN_INVALID_RESPONSE", "PayPal did not return an access token.", 502);

  const orderResponse = await fetchWithTimeout(`${baseUrl}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [{
        reference_id: input.orderId,
        custom_id: input.orderId,
        description: input.planName,
        amount: {
          currency_code: input.currency,
          value: (input.amountCents / 100).toFixed(2),
        },
      }],
      payment_source: {
        paypal: {
          experience_context: {
            brand_name: "Luravyn",
            user_action: "PAY_NOW",
            shipping_preference: "NO_SHIPPING",
            return_url: appendCheckoutParams(input.returnUrl, { provider: "paypal", order_id: input.orderId, checkout: "success" }),
            cancel_url: appendCheckoutParams(input.cancelUrl, { provider: "paypal", order_id: input.orderId, checkout: "cancelled" }),
          },
        },
      },
    }),
  }, env.providerTimeoutMs);
  const data = await parseProviderResponse(orderResponse, "PAYPAL_ORDER_FAILED");
  const checkoutUrl = Array.isArray(data?.links)
    ? data.links.find((link: Record<string, unknown>) => ["approve", "payer-action"].includes(String(link.rel)))?.href
    : "";
  if (!data?.id || !checkoutUrl) throw new AiFunctionError("PAYPAL_ORDER_INVALID_RESPONSE", "PayPal did not return an approval URL.", 502);
  return { providerReference: String(data.id), checkoutUrl: String(checkoutUrl) };
}

function paymentProviderStatus(env: AiEnv) {
  return [
    {
      provider: "stripe",
      configured: Boolean(env.stripeSecretKey),
      mode: env.stripeMode,
      publicKeyConfigured: Boolean(env.stripePublishableKey),
      webhookConfigured: Boolean(env.stripeWebhookSecret),
    },
    {
      provider: "paypal",
      configured: Boolean(env.paypalClientId && env.paypalClientSecret),
      mode: env.paypalEnvironment,
      publicClientConfigured: Boolean(env.paypalClientId),
      webhookConfigured: Boolean(env.paypalWebhookId),
    },
  ];
}

async function createShareLink(adminClient: any, userId: string, body: Record<string, unknown>) {
  const assetId = requireText(body.assetId, "ASSET_ID_REQUIRED");
  const { data: asset, error: assetError } = await adminClient
    .from("media_assets")
    .select("id,owner_user_id,visibility_status,deleted_at,display_name")
    .eq("id", assetId)
    .eq("owner_user_id", userId)
    .is("deleted_at", null)
    .single();
  if (assetError || !asset) throw new AiFunctionError("ASSET_NOT_FOUND", "Asset not found.", 404);

  const existing = await adminClient
    .from("share_links")
    .select("*")
    .eq("owner_user_id", userId)
    .eq("media_asset_id", assetId)
    .eq("visibility_status", "active")
    .is("revoked_at", null)
    .order("created_at", { ascending: false })
    .limit(1);
  if (existing.error) throw new AiFunctionError("SHARE_LINK_READ_FAILED", existing.error.message, 502);
  if ((existing.data ?? []).length > 0) return existing.data[0];

  const timestamp = new Date().toISOString();
  const inserted = await adminClient.from("share_links").insert({
    id: createId("share"),
    owner_user_id: userId,
    media_asset_id: assetId,
    token: createShareToken(),
    visibility_status: "active",
    created_at: timestamp,
    revoked_at: null,
  }).select("*").single();
  if (inserted.error) throw new AiFunctionError("SHARE_LINK_CREATE_FAILED", inserted.error.message, 502);

  const updated = await adminClient
    .from("media_assets")
    .update({ visibility_status: "public", updated_at: timestamp })
    .eq("id", assetId)
    .eq("owner_user_id", userId);
  if (updated.error) throw new AiFunctionError("ASSET_SHARE_PUBLISH_FAILED", updated.error.message, 502);

  return inserted.data;
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
    { provider: "qianwen_generation", configured: Boolean(env.qianwenApiKey && env.qianwenBaseUrl), imageModel: env.qianwenImageModel, videoModel: env.qianwenVideoModel, endpoint: env.qianwenBaseUrl, imageEndpoint: env.qianwenImageEndpoint || "", videoEndpoint: env.qianwenVideoEndpoint || "" },
    { provider: "liblib_generation", configured: Boolean(env.liblibAccessKey && env.liblibSecretKey && env.liblibText2ImageTemplateUuid), imageModel: env.liblibImageModel, endpoint: env.liblibBaseUrl, templateUuid: env.liblibText2ImageTemplateUuid ? "configured" : "" },
    { provider: "zealman_workflow", configured: Boolean(env.zealmanPanelBaseUrl && env.zealmanComfyBaseUrl && (env.zealmanImageWorkflow || env.zealmanVideoWorkflow)), imageWorkflow: env.zealmanImageWorkflow ? "configured" : "", videoWorkflow: env.zealmanVideoWorkflow ? "configured" : "", endpoint: env.zealmanPanelBaseUrl },
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
        return { ...provider, probe: normalizeProbeFailure(error, Date.now() - started, "Qwen Vision probe failed") };
      }
    }
    if (name === "deepseek_text" && provider.configured) {
      const started = Date.now();
      try {
        const result = await enhancePrompt(env, "Admin provider health check", { source: "admin-provider-health" });
        return { ...provider, probe: { ok: !result.fallback, durationMs: Date.now() - started, message: result.fallback ? "fallback" : "verified" } };
      } catch (error) {
        return { ...provider, probe: normalizeProbeFailure(error, Date.now() - started, "DeepSeek probe failed") };
      }
    }
    if (name === "zealman_workflow" && provider.configured) {
      const started = Date.now();
      try {
        const response = await fetchWithTimeout(`${env.zealmanPanelBaseUrl.replace(/\/$/, "")}/api/health`, {
          method: "GET",
          headers: zealmanHeaders(env, false),
        }, Math.min(env.providerTimeoutMs, 10000));
        await parseProviderResponse(response, "ZEALMAN_HEALTH_FAILED");
        return { ...provider, probe: { ok: true, durationMs: Date.now() - started, message: "panel online" } };
      } catch (error) {
        return { ...provider, probe: normalizeProbeFailure(error, Date.now() - started, "Zealman health probe failed") };
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

function normalizeProbeFailure(error: unknown, durationMs: number, fallbackMessage: string) {
  const status = error instanceof AiFunctionError ? error.status : 0;
  const code = error instanceof AiFunctionError ? error.code : "PROVIDER_PROBE_FAILED";
  const message = error instanceof Error ? error.message : fallbackMessage;
  const lower = message.toLowerCase();
  const category =
    status === 401 || status === 403 || lower.includes("unauth")
      ? "auth"
      : status === 408 || lower.includes("timeout") || lower.includes("abort")
        ? "timeout"
        : status >= 500
          ? "provider"
          : "request";
  return { ok: false, durationMs, code, status, category, message };
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
    qianwenImageEndpoint: Deno.env.get("QIANWEN_IMAGE_ENDPOINT") ?? "",
    qianwenVideoEndpoint: Deno.env.get("QIANWEN_VIDEO_ENDPOINT") ?? "",
    qianwenImageModel: Deno.env.get("QIANWEN_IMAGE_MODEL") || "qianwen-image-v1",
    qianwenVideoModel: Deno.env.get("QIANWEN_VIDEO_MODEL") || "qianwen-video-v1",
    liblibAccessKey: Deno.env.get("LIBLIB_ACCESS_KEY") ?? "",
    liblibSecretKey: Deno.env.get("LIBLIB_SECRET_KEY") ?? "",
    liblibBaseUrl: Deno.env.get("LIBLIB_BASE_URL") || DEFAULT_LIBLIB_BASE_URL,
    liblibText2ImageTemplateUuid: Deno.env.get("LIBLIB_TEXT2IMG_TEMPLATE_UUID") ?? "",
    liblibImageModel: Deno.env.get("LIBLIB_IMAGE_MODEL") || "liblib-text2img-v1",
    liblibMaxPolls: clampNumber(Deno.env.get("LIBLIB_MAX_POLLS"), 12, 1, 60),
    liblibPollIntervalMs: clampNumber(Deno.env.get("LIBLIB_POLL_INTERVAL_MS"), 5000, 1000, 30000),
    zealmanPanelBaseUrl: Deno.env.get("ZEALMAN_PANEL_BASE_URL") ?? "",
    zealmanComfyBaseUrl: Deno.env.get("ZEALMAN_COMFY_BASE_URL") ?? "",
    zealmanApiToken: Deno.env.get("ZEALMAN_API_TOKEN") ?? "",
    zealmanImageWorkflow: Deno.env.get("ZEALMAN_IMAGE_WORKFLOW") ?? "",
    zealmanVideoWorkflow: Deno.env.get("ZEALMAN_VIDEO_WORKFLOW") ?? "",
    zealmanSmoothVideoWorkflow: Deno.env.get("ZEALMAN_SMOOTH_VIDEO_WORKFLOW") ?? "",
    zealmanDigitalHumanWorkflow: Deno.env.get("ZEALMAN_DIGITAL_HUMAN_WORKFLOW") ?? "",
    zealmanWorkflowMapJson: Deno.env.get("ZEALMAN_WORKFLOW_MAP_JSON") ?? "",
    stagingAnonymousGeneration: Deno.env.get("STAGING_ANONYMOUS_GENERATION") === "true",
    zealmanPromptNodeId: Deno.env.get("ZEALMAN_PROMPT_NODE_ID") ?? "",
    zealmanMaxPolls: clampNumber(Deno.env.get("ZEALMAN_MAX_POLLS"), 180, 1, 720),
    zealmanPollIntervalMs: clampNumber(Deno.env.get("ZEALMAN_POLL_INTERVAL_MS"), 5000, 1000, 30000),
    aiProviderDefault: safeProvider(Deno.env.get("AI_PROVIDER_DEFAULT")) || "fake_worker",
    providerTimeoutMs: clampNumber(Deno.env.get("AI_PROVIDER_TIMEOUT_MS"), 60000, 5000, 180000),
    appUrl: Deno.env.get("APP_URL") || "https://jiang289140790-eng.github.io/open-video-studio",
    stripeSecretKey: Deno.env.get("STRIPE_SECRET_KEY") ?? "",
    stripePublishableKey: Deno.env.get("STRIPE_PUBLISHABLE_KEY") ?? "",
    stripeWebhookSecret: Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "",
    stripeMode: Deno.env.get("STRIPE_MODE") === "live" ? "live" : "test",
    paypalClientId: Deno.env.get("PAYPAL_CLIENT_ID") ?? "",
    paypalClientSecret: Deno.env.get("PAYPAL_CLIENT_SECRET") ?? "",
    paypalWebhookId: Deno.env.get("PAYPAL_WEBHOOK_ID") ?? "",
    paypalEnvironment: Deno.env.get("PAYPAL_ENVIRONMENT") === "live" ? "live" : "sandbox",
  };
}

function normalizeMediaType(value: unknown): "image" | "video" {
  return value === "video" ? "video" : "image";
}

function safeProvider(value: unknown): string {
  const provider = String(value || "").trim();
  return ["qwen_vision", "deepseek_text", "qianwen_generation", "liblib_generation", "zealman_workflow", "fake_worker", "local_api"].includes(provider) ? provider : "";
}

function defaultModel(env: AiEnv, mediaType: "image" | "video", provider: string) {
  if (provider === "qianwen_generation") return mediaType === "image" ? env.qianwenImageModel : env.qianwenVideoModel;
  if (provider === "liblib_generation") return env.liblibImageModel;
  if (provider === "zealman_workflow") return mediaType === "image" ? (env.zealmanImageWorkflow || "zealman-image-v1") : (env.zealmanVideoWorkflow || "zealman-video-v1");
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

function createShareToken(): string {
  return `s_${crypto.randomUUID().replaceAll("-", "").slice(0, 24)}`;
}

function safeReturnUrl(value: unknown, fallback: string): string {
  const raw = String(value || "").trim();
  const candidate = raw || fallback;
  try {
    const url = new URL(candidate);
    if (!["http:", "https:"].includes(url.protocol)) return fallback;
    return url.toString();
  } catch {
    return fallback;
  }
}

function appendCheckoutParams(baseUrl: string, params: Record<string, string>) {
  const url = new URL(baseUrl);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  return url.toString();
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
  qianwenImageEndpoint: string;
  qianwenVideoEndpoint: string;
  qianwenImageModel: string;
  qianwenVideoModel: string;
  liblibAccessKey: string;
  liblibSecretKey: string;
  liblibBaseUrl: string;
  liblibText2ImageTemplateUuid: string;
  liblibImageModel: string;
  liblibMaxPolls: number;
  liblibPollIntervalMs: number;
  zealmanPanelBaseUrl: string;
  zealmanComfyBaseUrl: string;
  zealmanApiToken: string;
  zealmanImageWorkflow: string;
  zealmanVideoWorkflow: string;
  zealmanSmoothVideoWorkflow: string;
  zealmanDigitalHumanWorkflow: string;
  zealmanWorkflowMapJson: string;
  stagingAnonymousGeneration: boolean;
  zealmanPromptNodeId: string;
  zealmanMaxPolls: number;
  zealmanPollIntervalMs: number;
  aiProviderDefault: string;
  providerTimeoutMs: number;
  appUrl: string;
  stripeSecretKey: string;
  stripePublishableKey: string;
  stripeWebhookSecret: string;
  stripeMode: "test" | "live";
  paypalClientId: string;
  paypalClientSecret: string;
  paypalWebhookId: string;
  paypalEnvironment: "sandbox" | "live";
}

interface PaymentCheckoutInput {
  orderId: string;
  userId: string;
  credits: number;
  amountCents: number;
  currency: string;
  planName: string;
  returnUrl: string;
  cancelUrl: string;
}
