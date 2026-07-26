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
const A01_WORKFLOW_ID = "workflow-zealman-image-a01-v1";
const A01_WORKFLOW_NAME = "A01-文生图-Qwen2512高清放大";
const A01_TASK_TIMEOUT_MS = 300_000;
const G20_WORKFLOW_ID = "workflow-zealman-video-g20-v1";
const G20_WORKFLOW_NAME = "G20-图生视频-Wan2.2Remix-v1";
const G20_SOURCE_WORKFLOW_NAME = "测试01-Wan2.2Remix-图生视频";
const G20_TASK_TIMEOUT_MS = 360_000;
const D18_WORKFLOW_ID = "workflow-zealman-image-d18-v1";
const D18_WORKFLOW_NAME = "D18-klein9b真人剧制造机-多图编辑";
const D18_TASK_TIMEOUT_MS = 300_000;
const D18_WIDTH = 512;
const D18_HEIGHT = 512;
const G20_ALLOWED_DURATIONS = new Set([2, 3, 4, 5, 6, 8, 10]);
const G20_ALLOWED_RESOLUTIONS = new Set([512, 768, 1024]);
const G20_FIXED_FPS = 24;
const A01_RESOLUTIONS: Record<string, { width: number; height: number }> = {
  low: { width: 512, height: 512 },
  square: { width: 1024, height: 1024 },
  landscape: { width: 1280, height: 720 },
  portrait: { width: 720, height: 1280 },
  "512x512": { width: 512, height: 512 },
  "1024x1024": { width: 1024, height: 1024 },
  "1280x720": { width: 1280, height: 720 },
  "720x1280": { width: 720, height: 1280 },
};
const DEFAULT_CREDIT_PACKAGES = [
  { id: "starter-200", credits: 200, amountCents: 999, label: "Starter 200" },
  { id: "creator-1000", credits: 1000, amountCents: 2999, label: "Creator 1000" },
  { id: "growth-5000", credits: 5000, amountCents: 9999, label: "Growth 5000" },
  { id: "studio-20000", credits: 20000, amountCents: 29999, label: "Studio 20000" },
];
const DEFAULT_CREDIT_OFFER = {
  code: "WELCOME60",
  packageId: "creator-1000",
  extraPercent: 60,
};
const DEFAULT_REWARD_PROGRAM = {
  timezone: "UTC",
  dailyCheckin: [5, 6, 12, 6, 8, 8, 20],
  firstGenerationCredits: 10,
  referralCredits: 20,
  referralRequiresFirstGeneration: true,
  shareCredits: 5,
  shareDailyCap: 10,
};

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
    const body = await req.json().catch(() => ({}));
    const action = String(body.action ?? "");

    if (action === "get-shared-asset") {
      const result = await getSharedAsset(adminClient, env, body);
      return json(result);
    }
    if (action === "payment-provider-status") {
      return json({ providers: paymentProviderStatus(env) });
    }
    if (action === "record-referral-click") {
      return json(await recordReferralClick(adminClient, body));
    }

    const { data: authData, error: authError } = await userClient.auth.getUser();
    if (authError || !authData.user) {
      return json({ error: { code: "AI_AUTH_REQUIRED", message: "Login is required." } }, 401);
    }
    if (authData.user.is_anonymous && !env.stagingAnonymousGeneration) {
      return json({ error: { code: "AI_AUTH_REQUIRED", message: "登录后才能使用真实生成。" } }, 401);
    }

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
    if (action === "reward-program-status") {
      return json(await getRewardProgramStatus(adminClient, user, body));
    }
    if (action === "claim-daily-checkin") {
      return json(await claimDailyCheckin(adminClient, user));
    }
    if (action === "attribute-referral") {
      return json(await attributeReferral(adminClient, user, body));
    }

    if (action === "enhance-prompt") {
      const prompt = requireText(body.prompt, "PROMPT_REQUIRED");
      const enhanced = await enhancePrompt(env, prompt, safeObject(body.context));
      return json({ prompt, enhancedPrompt: enhanced.prompt, provider: enhanced.provider, model: enhanced.model, fallback: enhanced.fallback });
    }

    if (action === "growth-analysis") {
      const result = await analyzeGrowth(env, safeObject(body.snapshot));
      return json({ suggestion: result.prompt, provider: result.provider, model: result.model, fallback: result.fallback });
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
      const result = await processGenerationJob(adminClient, env, user.id, body, Boolean(user.is_anonymous));
      return json(result);
    }

    if (action === "check-generation-status") {
      const job = await getOwnedJob(adminClient, user.id, requireText(body.jobId, "JOB_ID_REQUIRED"));
      return json({ job });
    }

    if (action === "cancel-generation-job") {
      const jobId = requireText(body.jobId, "JOB_ID_REQUIRED");
      const existingJob = await getOwnedJob(adminClient, user.id, jobId);
      if (!["queued", "pending", "retrying"].includes(String(existingJob.status || "").toLowerCase())) {
        return json({ job: existingJob, refund: null, skipped: true });
      }
      const { data: claimed, error: claimError } = await adminClient
        .from("generation_jobs")
        .update({ status: "cancelling", updated_at: new Date().toISOString() })
        .eq("id", jobId)
        .eq("user_id", user.id)
        .in("status", ["queued", "pending", "retrying"])
        .select("*")
        .maybeSingle();
      if (claimError) throw new AiFunctionError("GENERATION_JOB_CANCEL_FAILED", claimError.message, 502);
      if (!claimed) {
        return json({ job: await getOwnedJob(adminClient, user.id, jobId), refund: null, skipped: true });
      }
      const refund = await refundGenerationCredits(adminClient, user.id, claimed, "Generation cancelled before completion");
      const job = await updateOwnedJob(adminClient, user.id, jobId, {
        status: "cancelled",
        progress: 0,
        updated_at: new Date().toISOString(),
      });
      return json({ job, refund });
    }

    if (action === "create-share-link") {
      const share = await createShareLink(adminClient, user.id, body);
      const reward = await grantShareReward(adminClient, user.id, share.media_asset_id);
      return json({ share, reward });
    }

    if (action === "revoke-share-link") {
      const share = await revokeShareLink(adminClient, user.id, body);
      return json({ share });
    }

    if (action === "update-media-asset") {
      const asset = await updateMediaAsset(adminClient, user.id, body);
      return json({ asset });
    }

    if (action === "delete-media-asset") {
      const result = await deleteMediaAsset(adminClient, user.id, body);
      return json(result);
    }

    if (action === "demo-credit-purchase") {
      const order = await createDemoCreditPurchase(adminClient, user.id, body);
      return json({ order });
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
  if (prompt.length > 2_000) {
    throw new AiFunctionError("PROMPT_TOO_LONG", "Prompt must be 2,000 characters or fewer.", 400);
  }
  const supportedEditorOperations = new Set([
    "remove_background",
    "replace_background",
    "change_outfit",
    "improve_lighting",
    "repair_face",
    "change_pose",
    "outpaint",
    "custom",
  ]);
  const requestedOperation = String(body.operation || "custom").trim();
  const operation = supportedEditorOperations.has(requestedOperation) ? requestedOperation : "custom";
  const editorMode = String(body.editorMode || "single") === "multi" ? "multi" : "single";
  const supportedToolModes = new Set(["face_swap", "preset", "reference", "custom", "simple", "image_to_video"]);
  const requestedToolMode = String(body.toolMode || "").trim();
  const toolMode = supportedToolModes.has(requestedToolMode) ? requestedToolMode : null;
  const effectId = String(body.effectId || "").trim().slice(0, 120) || null;
  const videoEffectId = String(body.videoEffectId || effectId || "").trim().slice(0, 120) || null;
  const effectPromptTemplate = String(body.effectPromptTemplate || "").trim().slice(0, 1200) || null;
  const faceSwapInput = safeObject(body.faceSwap);
  const faceSwap = Object.keys(faceSwapInput).length
    ? {
        targetFaceIndex: clampNumber(faceSwapInput.targetFaceIndex, 0, 0, 20),
        targetFaceCount: faceSwapInput.targetFaceCount == null ? null : clampNumber(faceSwapInput.targetFaceCount, 1, 1, 20),
        preserveHair: faceSwapInput.preserveHair === true,
        preserveExpression: faceSwapInput.preserveExpression === true,
        fusionStrength: clampNumber(faceSwapInput.fusionStrength, 75, 0, 100),
        sourceValidation: String(faceSwapInput.sourceValidation || "").slice(0, 40) || null,
        targetValidation: String(faceSwapInput.targetValidation || "").slice(0, 40) || null,
      }
    : null;
  const durationSeconds = mediaType === "video" ? clampNumber(body.durationSeconds, 6, 1, 60) : null;
  const outputCount = clampNumber(body.outputCount, 1, 1, 8);
  const workflowId = String(body.workflowId ?? (mediaType === "image" ? "workflow-qianwen-image-v1" : "workflow-qianwen-video-v1")).trim();
  const isA01 = workflowId === A01_WORKFLOW_ID;
  const isG20 = workflowId === G20_WORKFLOW_ID;
  const isD18 = workflowId === D18_WORKFLOW_ID;
  if (isA01 && mediaType !== "image") {
    throw new AiFunctionError("A01_MEDIA_TYPE_INVALID", "A01 only supports image generation.", 400);
  }
  if (isG20 && mediaType !== "video") {
    throw new AiFunctionError("G20_MEDIA_TYPE_INVALID", "G20 only supports video generation.", 400);
  }
  if (isD18 && mediaType !== "image") {
    throw new AiFunctionError("D18_MEDIA_TYPE_INVALID", "D18 only supports image generation.", 400);
  }
  const a01Parameters = isA01 ? normalizeA01Parameters(body) : null;
  const g20Parameters = isG20 ? normalizeG20Parameters(body) : null;
  const d18Parameters = isD18 ? normalizeD18Parameters(body) : null;
  const requestedResolution = a01Parameters
    ? `${a01Parameters.width}x${a01Parameters.height}`
    : g20Parameters
      ? String(g20Parameters.resolution)
      : d18Parameters
        ? `${d18Parameters.width}x${d18Parameters.height}`
        : String(body.resolution || "").trim().slice(0, 40) || null;
  const toolSlug = String(body.toolSlug || "").trim();
  const tool = toolSlug ? await resolvePublishedTool(adminClient, toolSlug) : null;
  const publishedWorkflow = await resolvePublishedWorkflow(adminClient, workflowId);
  if (tool && publishedWorkflow?.tool_id && String(publishedWorkflow.tool_id) !== String(tool.id)) {
    throw new AiFunctionError("TOOL_WORKFLOW_MISMATCH", "The selected workflow is not bound to this tool.", 409);
  }
  const workflow = publishedWorkflow || await resolveWorkflowConfig(adminClient, workflowId);
  const provider = isA01 || isG20 || isD18 ? "zealman_workflow" : safeProvider(body.provider) || safeProvider(workflow?.provider) || env.aiProviderDefault;
  const model = isA01
    ? A01_WORKFLOW_NAME
    : isG20
      ? G20_WORKFLOW_NAME
      : isD18
        ? D18_WORKFLOW_NAME
        : String(body.model || defaultModel(env, mediaType, provider)).trim();
  const commercial = await enforceToolCommercialRules(adminClient, userId, tool, isAnonymous);
  const estimatedCredits = calculateWorkflowCredits({
    mediaType,
    durationSeconds,
    resolution: requestedResolution,
    outputCount,
    tool,
    workflow,
    configuredBase: commercial.costPerRun,
  });
  const costCredits = isAnonymous && env.stagingAnonymousGeneration ? 0 : Math.max(0, estimatedCredits - commercial.freeCreditsApplied);
  const timestamp = new Date().toISOString();
  const idempotencyKey = String(body.idempotencyKey || "").trim().slice(0, 128);
  const jobId = idempotencyKey ? await createIdempotentJobId(userId, idempotencyKey) : createId("job");
  if (idempotencyKey) {
    const { data: existing } = await adminClient
      .from("generation_jobs")
      .select("*")
      .eq("id", jobId)
      .eq("user_id", userId)
      .maybeSingle();
    if (existing) return existing;
  }
  const job = {
    id: jobId,
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
      operation,
      editorMode,
      toolMode,
      effectId,
      videoEffectId,
      effectPromptTemplate,
      faceSwap,
      poseAngle: String(body.poseAngle || "").trim().slice(0, 40) || null,
      camera: String(body.camera || "").trim().slice(0, 40) || null,
      outputSettings: safeObject(body.outputSettings),
      sourceAssetId: body.sourceAssetId ?? null,
      sourceAssetIds: d18Parameters?.sourceAssetIds ?? [],
      sourceImageUrl: isG20 ? null : body.sourceImageUrl ?? null,
      characterId: body.characterId ?? null,
      aspectRatio: body.aspectRatio ?? "16:9",
      resolution: requestedResolution,
      durationSeconds: g20Parameters?.durationSeconds ?? durationSeconds,
      cameraMotion: String(body.cameraMotion || "").trim().slice(0, 80) || null,
      motionStrength: body.motionStrength == null ? null : clampNumber(body.motionStrength, 50, 0, 100),
      faceStability: body.faceStability === true,
      loop: body.loop === true,
      outputCount,
      seed: a01Parameters?.seed ?? g20Parameters?.seed ?? d18Parameters?.seed ?? null,
      width: a01Parameters?.width ?? d18Parameters?.width ?? null,
      height: a01Parameters?.height ?? d18Parameters?.height ?? null,
      fps: g20Parameters?.fps ?? null,
      clientPriceQuote: body.priceQuote == null ? null : clampNumber(body.priceQuote, 0, 0, 100000),
      idempotencyKey: idempotencyKey || null,
      providerRequested: provider,
      workflowStatus: workflow?.status ?? "default",
      workflowName: isA01
        ? A01_WORKFLOW_NAME
        : isG20
          ? G20_WORKFLOW_NAME
          : isD18
            ? D18_WORKFLOW_NAME
            : body.workflowName ?? safeObject(workflow?.jsonConfig).workflowName ?? null,
      toolId: tool?.id ?? null,
      agentTaskId: body.agentTaskId ?? null,
      freeCreditsApplied: commercial.freeCreditsApplied,
      planId: commercial.plan?.id ?? null,
      planName: commercial.plan?.name ?? "Free",
      workflowOverrides: isA01 || isG20 || isD18
        ? {}
        : Object.keys(safeObject(body.workflowOverrides)).length
          ? safeObject(body.workflowOverrides)
          : safeObject(workflow?.jsonConfig).workflowOverrides ?? {},
    },
    output_assets: [],
    aspect_ratio: body.aspectRatio ?? "16:9",
    resolution: requestedResolution,
    duration_seconds: g20Parameters?.durationSeconds ?? durationSeconds,
    source_asset_id: d18Parameters?.sourceAssetIds[0] ?? body.sourceAssetId ?? null,
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
  if (error) {
    if (idempotencyKey && String(error.code || "") === "23505") {
      const { data: existing } = await adminClient
        .from("generation_jobs")
        .select("*")
        .eq("id", jobId)
        .eq("user_id", userId)
        .maybeSingle();
      if (existing) return existing;
    }
    throw new AiFunctionError("GENERATION_JOB_CREATE_FAILED", error.message, 502);
  }

  let creditsConsumed = false;
  try {
    await consumeCredits(adminClient, userId, costCredits, job.id, `${mediaType}_generation`);
    creditsConsumed = true;
    if (tool) {
      await recordToolUsage(adminClient, {
        user_id: userId,
        tool_id: tool.id,
        workflow_id: publishedWorkflow?.id ?? null,
        workflow_key: workflowId,
        credits_used: costCredits,
        free_credits_used: commercial.freeCreditsApplied,
      });
    }
  } catch (error) {
    if (creditsConsumed && costCredits > 0) {
      await refundGenerationCredits(adminClient, userId, job, "Tool usage record failed; automatic refund");
    }
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

async function resolvePublishedTool(adminClient: any, slug: string): Promise<Record<string, any> | null> {
  const { data, error } = await adminClient.from("tools").select("*").eq("slug", slug).eq("status", "published").maybeSingle();
  if (error) return null;
  if (!data || ["private"].includes(String(data.visibility || "public"))) {
    if (data) throw new AiFunctionError("TOOL_NOT_AVAILABLE", "This AI tool is not publicly available.", 403);
    return null;
  }
  return data;
}

async function resolvePublishedWorkflow(adminClient: any, workflowKey: string): Promise<Record<string, any> | null> {
  if (!workflowKey) return null;
  const { data, error } = await adminClient.from("workflows").select("*").eq("workflow_id", workflowKey).in("status", ["published", "active"]).order("updated_at", { ascending: false }).limit(1).maybeSingle();
  if (error || !data) return null;
  return data;
}

async function enforceToolCommercialRules(adminClient: any, userId: string, tool: Record<string, any> | null, isAnonymous: boolean) {
  if (!tool) return { costPerRun: 0, freeCreditsApplied: 0 };
  let plan: Record<string, any> | null = null;
  if (!isAnonymous) {
    const { data: subscription, error: subscriptionError } = await adminClient
      .from("subscriptions")
      .select("id,plan_id,status,started_at,ended_at,plans(id,name,tool_access,daily_limit,status)")
      .eq("user_id", userId)
      .in("status", ["active", "trialing"])
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const subscriptionPlan = Array.isArray(subscription?.plans) ? subscription.plans[0] : subscription?.plans;
    if (!subscriptionError && subscriptionPlan && subscriptionPlan.status === "published" && (!subscription.ended_at || new Date(subscription.ended_at).getTime() > Date.now())) {
      plan = subscriptionPlan;
    }
  }
  if (Boolean(tool.membership_required) && !plan) {
    throw new AiFunctionError("TOOL_MEMBERSHIP_REQUIRED", "This tool requires an active membership plan.", 403);
  }
  if (plan) {
    const access = Array.isArray(plan.tool_access) ? plan.tool_access.map(String) : [];
    if (access.length && !access.includes("*") && !access.includes(String(tool.slug))) {
      throw new AiFunctionError("PLAN_TOOL_ACCESS_DENIED", "Your membership plan does not include this tool.", 403);
    }
  }
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  const { data: usage, error } = await adminClient.from("tool_usage").select("credits_used,free_credits_used,created_at").eq("tool_id", tool.id).eq("user_id", userId).gte("created_at", start.toISOString());
  if (error) throw new AiFunctionError("TOOL_USAGE_READ_FAILED", error.message, 502);
  const rows = usage || [];
  const dailyLimit = Math.max(0, Number(tool.daily_limit || 0));
  const planDailyLimit = Math.max(0, Number(plan?.daily_limit || 0));
  const { data: planUsage, error: planUsageError } = plan
    ? await adminClient.from("tool_usage").select("id").eq("user_id", userId).gte("created_at", start.toISOString())
    : { data: [], error: null };
  if (planUsageError) throw new AiFunctionError("TOOL_USAGE_READ_FAILED", planUsageError.message, 502);
  if (dailyLimit > 0 && rows.length >= dailyLimit) {
    throw new AiFunctionError("TOOL_DAILY_LIMIT_REACHED", "Daily limit reached for this tool.", 429);
  }
  if (planDailyLimit > 0 && (planUsage || []).length >= planDailyLimit) {
    throw new AiFunctionError("PLAN_DAILY_LIMIT_REACHED", "Daily limit reached for your membership plan.", 429);
  }
  const freeCredits = Math.max(0, Number(tool.free_credits || 0));
  const freeUsed = rows.reduce((sum: number, row: Record<string, unknown>) => sum + Math.max(0, Number(row.free_credits_used || 0)), 0);
  const costPerRun = Math.max(0, Number(tool.cost_per_run || tool.credits_cost || 0));
  return { costPerRun, freeCreditsApplied: Math.min(costPerRun, Math.max(0, freeCredits - freeUsed)), plan };
}

async function recordToolUsage(adminClient: any, usage: Record<string, unknown>) {
  const { error } = await adminClient.from("tool_usage").insert({ id: crypto.randomUUID(), ...usage, created_at: new Date().toISOString() });
  if (error) throw new AiFunctionError("TOOL_USAGE_WRITE_FAILED", error.message, 502);
}

async function processGenerationJob(
  adminClient: any,
  env: AiEnv,
  userId: string,
  body: Record<string, unknown>,
  isAnonymous = false,
) {
  const jobId = requireText(body.jobId, "JOB_ID_REQUIRED");
  const job = await getOwnedJob(adminClient, userId, jobId);
  if (!["queued", "pending", "retrying"].includes(String(job.status))) {
    return { job, asset: null, skipped: true };
  }

  const started = Date.now();
  const { data: claimed, error: claimError } = await adminClient
    .from("generation_jobs")
    .update({ status: "running", progress: 20, updated_at: new Date().toISOString() })
    .eq("id", jobId)
    .eq("user_id", userId)
    .in("status", ["queued", "pending", "retrying"])
    .select("*")
    .maybeSingle();
  if (claimError) throw new AiFunctionError("GENERATION_JOB_CLAIM_FAILED", claimError.message, 502);
  if (!claimed) {
    return { job: await getOwnedJob(adminClient, userId, jobId), asset: null, skipped: true };
  }
  const claimedJob = claimed as Record<string, any>;
  await updateAgentTaskFromJob(adminClient, userId, claimedJob, "running", { jobId });
  try {
    const mediaType = normalizeMediaType(claimedJob.media_type);
    const provider = String(claimedJob.provider || env.aiProviderDefault);
    const isA01 = String(claimedJob.workflow_id || "") === A01_WORKFLOW_ID;
    const isG20 = String(claimedJob.workflow_id || "") === G20_WORKFLOW_ID;
    const isD18 = String(claimedJob.workflow_id || "") === D18_WORKFLOW_ID;
    if (isG20) {
      const sourceImageUrl = await resolveOwnedG20SourceImageUrl(adminClient, env, userId, claimedJob);
      claimedJob.input_params = { ...safeObject(claimedJob.input_params), sourceImageUrl };
    }
    if (isD18) {
      const sourceImageUrls = await resolveOwnedD18SourceImageUrls(adminClient, env, userId, claimedJob);
      claimedJob.input_params = { ...safeObject(claimedJob.input_params), sourceImageUrls };
    }
    let retryCount = 0;
    let result: Record<string, any>;
    while (true) {
      try {
        const providerCall = provider === "qianwen_generation"
          ? callQianwenGeneration(env, claimedJob)
          : provider === "liblib_generation"
            ? callLiblibGeneration(env, claimedJob)
            : provider === "zealman_workflow"
              ? callZealmanWorkflow(env, claimedJob)
              : fakeWorkerResult(claimedJob);
        result = isA01
          ? await withTaskTimeout(providerCall, A01_TASK_TIMEOUT_MS, "A01_TASK_TIMEOUT")
          : isG20
            ? await withTaskTimeout(providerCall, G20_TASK_TIMEOUT_MS, "G20_TASK_TIMEOUT")
            : isD18
              ? await withTaskTimeout(providerCall, D18_TASK_TIMEOUT_MS, "D18_TASK_TIMEOUT")
              : await providerCall;
        break;
      } catch (error) {
        if (!(isA01 || isG20 || isD18) || retryCount >= 1) throw error;
        retryCount += 1;
      }
    }
    const durationMs = Date.now() - started;
    if (isG20) {
      await updateOwnedJob(adminClient, userId, jobId, {
        status: "uploading",
        progress: 90,
        updated_at: new Date().toISOString(),
      });
    }
    const asset = await saveGeneratedAsset(adminClient, env, userId, claimedJob, result, durationMs);
    const completedStatus = isA01 || isG20 || isD18 ? "succeeded" : "completed";
    const currentInputParams = safeObject(claimedJob.input_params);
    const gpuRuntimeMs = isG20 ? extractG20GpuRuntimeMs(result, durationMs) : null;
    const completed = await updateOwnedJob(adminClient, userId, jobId, {
      status: completedStatus,
      progress: 100,
      result_asset_id: asset.id,
      result_url: asset.storage_key,
      output_assets: [asset.id],
      input_params: {
        ...currentInputParams,
        providerPromptId: result.providerJobId ?? null,
        retryCount,
        gpuRuntimeMs,
        outputFps: isG20 ? G20_FIXED_FPS : null,
        outputCodec: isG20 ? "h264" : null,
      },
      latency: durationMs,
      estimated_cost: isG20 ? Math.max(0, Number(claimedJob.estimated_cost || 0)) : claimedJob.estimated_cost,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    if (!isAnonymous) {
      await grantFirstGenerationReward(adminClient, userId, jobId);
      await qualifyPendingReferral(adminClient, userId);
    }
    await updateAgentTaskFromJob(adminClient, userId, claimedJob, "completed", { jobId, assetId: asset.id, durationMs });
    return { job: completed, asset, provider, mediaType };
  } catch (error) {
    const technicalMessage = error instanceof Error ? error.message : "AI provider failed.";
    const isG20 = String(claimedJob.workflow_id || "") === G20_WORKFLOW_ID;
    const isD18 = String(claimedJob.workflow_id || "") === D18_WORKFLOW_ID;
    const timedOut = (isG20 || isD18) && error instanceof AiFunctionError &&
      ["G20_TASK_TIMEOUT", "D18_TASK_TIMEOUT", "ZEALMAN_GENERATION_TIMEOUT"].includes(error.code);
    const publicMessage = isG20 ? friendlyG20Error(error) : isD18 ? friendlyD18Error(error) : technicalMessage;
    const failed = await updateOwnedJob(adminClient, userId, jobId, {
      status: timedOut ? "timed_out" : "failed",
      progress: 0,
      error_code: error instanceof AiFunctionError ? error.code : "AI_PROVIDER_FAILED",
      error_message: publicMessage,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    if (isG20 || isD18) {
      await writeGenerationTechnicalAudit(adminClient, userId, jobId, error, isD18 ? D18_WORKFLOW_ID : G20_WORKFLOW_ID);
    }
    const refund = await refundGenerationCredits(adminClient, userId, claimedJob, publicMessage);
    await updateAgentTaskFromJob(adminClient, userId, claimedJob, "failed", { jobId, error: failed.error_message });
    return { job: failed, asset: null, refund, error: { code: failed.error_code, message: failed.error_message } };
  }
}

async function updateAgentTaskFromJob(adminClient: any, userId: string, job: Record<string, any>, status: "running" | "completed" | "failed", result: Record<string, unknown>) {
  const input = safeObject(job.input_params);
  const taskId = String(input.agentTaskId || input.agent_task_id || "").trim();
  if (!taskId) return;
  const { error } = await adminClient.from("agent_tasks").update({
    status,
    result,
    completed_at: status === "completed" || status === "failed" ? new Date().toISOString() : null
  }).eq("id", taskId).eq("user_id", userId);
  if (error) console.warn("agent task update failed", error.message);
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

async function analyzeGrowth(env: AiEnv, snapshot: Record<string, unknown>) {
  const fallback = [
    "先检查异常账号和失败任务，确保今天的内容可以按计划发布。",
    "优先复制最高表现内容的主题和渠道组合，再做一到两个小变体。",
    "保持小批量生产，持续观察 Workflow 成功率与单位积分成本，不要只追求数量。"
  ].join("\n");
  if (!env.deepseekApiKey) return { provider: "local_analysis", model: "growth-rules-v1", prompt: fallback, fallback: true };
  try {
    const response = await fetchWithTimeout(`${env.deepseekBaseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${env.deepseekApiKey}`, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        model: env.deepseekModel,
        temperature: 0.2,
        messages: [
          { role: "system", content: "你是个人 AI 内容运营分析助手。只根据提供的数据给出 3-5 条今天可以执行的中文建议；每条包含优先级、具体动作和数据依据。数据不足时明确说暂无数据，不要虚构数字，不要建议支付或商业 SaaS 功能。" },
          { role: "user", content: JSON.stringify(snapshot) }
        ]
      })
    }, env.providerTimeoutMs);
    const data = await parseProviderResponse(response, "DEEPSEEK_GROWTH_ANALYSIS_FAILED");
    const prompt = String(data?.choices?.[0]?.message?.content || data?.content || "").trim();
    return prompt ? { provider: "deepseek_text", model: env.deepseekModel, prompt, fallback: false } : { provider: "local_analysis", model: "growth-rules-v1", prompt: fallback, fallback: true };
  } catch {
    return { provider: "local_analysis", model: "growth-rules-v1", prompt: fallback, fallback: true };
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
  if (!env.zealmanPanelBaseUrl) {
    throw new AiFunctionError("ZEALMAN_NOT_CONFIGURED", "Zealman panel URL is missing.", 500);
  }
  const workflowName = resolveZealmanWorkflowName(env, job);
  if (!workflowName) {
    throw new AiFunctionError("ZEALMAN_WORKFLOW_MISSING", "Zealman workflow name is missing.", 500);
  }

  const workflow = await fetchZealmanWorkflow(env, workflowName);
  const inputParams = safeObject(job.input_params);
  if (String(job.workflow_id || "") === A01_WORKFLOW_ID) {
    applyA01Parameters(workflow, String(job.prompt || ""), inputParams);
  } else if (String(job.workflow_id || "") === G20_WORKFLOW_ID) {
    applyG20Parameters(workflow, String(job.prompt || ""), inputParams);
  } else if (String(job.workflow_id || "") === D18_WORKFLOW_ID) {
    const sourceImageUrls = Array.isArray(inputParams.sourceImageUrls) ? inputParams.sourceImageUrls.map(String) : [];
    if (sourceImageUrls.length !== 2) {
      throw new AiFunctionError("D18_SOURCE_ASSETS_INVALID", "D18 requires exactly two source images.", 400);
    }
    const imageNames = await Promise.all(sourceImageUrls.map((url, index) =>
      uploadZealmanSourceImage(env, url, `${String(job.id || crypto.randomUUID())}-${index + 1}`, "D18")
    ));
    applyD18Parameters(workflow, String(job.prompt || ""), inputParams, imageNames);
  } else {
    applyZealmanPrompt(workflow, String(job.prompt || ""), env.zealmanPromptNodeId);
    applyZealmanOverrides(workflow, inputParams.workflowOverrides);
  }
  const sourceImageUrl = String(inputParams.sourceImageUrl || inputParams.source_image_url || "").trim();
  if (sourceImageUrl && String(job.workflow_id || "") !== D18_WORKFLOW_ID) {
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
  if (workflowId === A01_WORKFLOW_ID) return A01_WORKFLOW_NAME;
  if (workflowId === G20_WORKFLOW_ID) return G20_SOURCE_WORKFLOW_NAME;
  if (workflowId === D18_WORKFLOW_ID) return D18_WORKFLOW_NAME;
  const configuredMap = parseWorkflowMap(env.zealmanWorkflowMapJson);
  const verifiedWorkflowMap: Record<string, string> = {
    "workflow-hifun-image-editor-v1": "功能03-自然语言图片编辑（本地）",
    "workflow-nano-banana-v1": "功能03-自然语言图片编辑（本地）",
    "workflow-hifun-face-swap-v1": "功能01-授权虚构角色换脸（本地）",
    "workflow-faceswap-v1": "功能01-授权虚构角色换脸（本地）",
    "workflow-hifun-combiner-v1": "功能02-多图智能合成（本地）",
    "workflow-combiner-v1": "功能02-多图智能合成（本地）",
    "workflow-zealman-image-d18-v1": "D18-klein9b真人剧制造机-多图编辑",
    "workflow-hifun-upscale-v1": "功能07-图片高清修复（本地）",
    "workflow-hifun-adult-effects-v1": "WAN-NSFW-Undress",
    "workflow-hifun-outfit-v1": "功能04-成年虚构角色换装（本地）",
    "workflow-outfit-v1": "功能04-成年虚构角色换装（本地）",
    "workflow-hifun-pose-v1": "功能05-人物姿势重构（本地）",
    "workflow-pose-v1": "功能05-人物姿势重构（本地）",
    "workflow-hifun-image-to-video-v1": "测试01-Wan2.2Remix-图生视频",
    "workflow-zealman-video-g01-v1": "测试01-Wan2.2Remix-图生视频",
    "workflow-zealman-video-g20-v1": "测试01-Wan2.2Remix-图生视频",
    "workflow-hifun-movie-closeup-v1": "功能09-Wan2.2-电影近景特效（本地）",
    "workflow-zealman-video-g03-v1": "G03-图生视频-Wan2.2SmoothMix",
    "workflow-zealman-digital-human-j11-v1": "J11-LTX2.3高清超自然电商数字人",
    "workflow-qianwen-image-v1": "A01-文生图-Qwen2512高清放大",
    "workflow-flux-klein-v1": "D14-分镜-Flux克莱因9B多角度多场景",
    "workflow-wan22-i2v-v1": "测试01-Wan2.2Remix-图生视频",
    "workflow-qianwen-video-v1": "测试01-Wan2.2Remix-图生视频"
  };
  const mapped = configuredMap[workflowId] || configuredMap[String(job.tool_slug || "").toLowerCase()] || verifiedWorkflowMap[workflowId];
  if (mapped) return mapped;

  // These are the workflow IDs published in the AutoDL/Zealman API panel.
  // Keep the mapping here as a safe fallback so a missing optional
  // ZEALMAN_WORKFLOW_MAP_JSON cannot silently route every tool to one generic
  // workflow. The values are workflow names only; no credentials are stored.
  const publishedWorkflowMap: Record<string, string> = {
    "workflow-zealman-image-a01-v1": "A01-文生图-Qwen2512高清放大",
    "workflow-hifun-image-editor-v1": "功能03-自然语言图片编辑（本地）",
    "workflow-hifun-face-swap-v1": "功能01-授权虚构角色换脸（本地）",
    "workflow-hifun-outfit-v1": "功能04-成年虚构角色换装（本地）",
    "workflow-hifun-pose-v1": "功能05-人物姿势重构（本地）",
    "workflow-hifun-nano-v1": "功能03-自然语言图片编辑（本地）",
    "workflow-hifun-combiner-v1": "功能02-多图智能合成（本地）",
    "workflow-zealman-image-d18-v1": "D18-klein9b真人剧制造机-多图编辑",
    "workflow-hifun-upscale-v1": "功能07-图片高清修复（本地）",
    "workflow-hifun-image-to-video-v1": "测试01-Wan2.2Remix-图生视频",
    "workflow-zealman-video-g01-v1": "测试01-Wan2.2Remix-图生视频",
    "workflow-zealman-video-g20-v1": "测试01-Wan2.2Remix-图生视频",
    "workflow-hifun-movie-closeup-v1": "功能09-Wan2.2-电影近景特效（本地）",
    "workflow-hifun-adult-effects-v1": "功能08-Wan2.2-4in1成人特效（本地）",
    "workflow-zealman-video-g03-v1": "G03-图生视频-Wan2.2SmoothMix",
    "workflow-zealman-digital-human-j11-v1": "J11-LTX2.3高清超自然电商数字人",
    "image-editor": "功能03-自然语言图片编辑（本地）",
    "face-swap": "功能01-授权虚构角色换脸（本地）",
    "outfit-studio": "功能04-成年虚构角色换装（本地）",
    "pose-generator": "功能05-人物姿势重构（本地）",
    "nano-banana": "功能03-自然语言图片编辑（本地）",
    "image-combiner": "D18-klein9b真人剧制造机-多图编辑",
    "image-to-video": "测试01-Wan2.2Remix-图生视频",
  };
  const published = publishedWorkflowMap[workflowId] || publishedWorkflowMap[String(job.tool_slug || "").toLowerCase()];
  if (published) return published;
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
  // The Zealman panel exposes the saved API card and its executable template
  // through the singular workflow config endpoint. `/api/workflows/download`
  // is not the API-card route and returns 400 on the active instance.
  const endpoint = `${env.zealmanPanelBaseUrl.replace(/\/$/, "")}/api/workflow/config/${encodeURIComponent(workflowName)}`;
  const response = await fetchWithTimeout(endpoint, {
    method: "GET",
    headers: zealmanHeaders(env),
  }, env.providerTimeoutMs);
  const payload = await parseProviderResponse(response, "ZEALMAN_WORKFLOW_CONFIG_FAILED");
  const template = payload?.workflow_template || payload?.data?.workflow_template || payload?.workflow || payload?.template;
  if (!template || typeof template !== "object") {
    throw new AiFunctionError("ZEALMAN_WORKFLOW_CONFIG_FAILED", "Zealman workflow config did not include an executable template.", 502);
  }
  return template as Record<string, any>;
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

function normalizeA01Parameters(body: Record<string, unknown>): { seed: number; width: number; height: number } {
  const requestedResolution = String(body.resolution || "").trim().toLowerCase();
  const dimensions = A01_RESOLUTIONS[requestedResolution || "landscape"];
  if (!dimensions) {
    throw new AiFunctionError("A01_RESOLUTION_INVALID", "A01 resolution must be one of 512x512, 1024x1024, 1280x720, or 720x1280.", 400);
  }
  const rawSeed = body.seed;
  const seed = rawSeed === null || rawSeed === undefined || rawSeed === "" || rawSeed === "random"
    ? crypto.getRandomValues(new Uint32Array(1))[0]
    : Number(rawSeed);
  if (!Number.isSafeInteger(seed) || seed < 0 || seed > 4_294_967_295) {
    throw new AiFunctionError("A01_SEED_INVALID", "A01 seed must be an integer from 0 to 4294967295.", 400);
  }
  return { seed, ...dimensions };
}

function applyA01Parameters(workflow: Record<string, any>, prompt: string, inputParams: Record<string, any>) {
  const required = {
    prompt: workflow["187"]?.inputs,
    seed: workflow["3"]?.inputs,
    width: workflow["515"]?.inputs,
    height: workflow["516"]?.inputs,
  };
  if (!required.prompt || typeof required.prompt.text !== "string" ||
      !required.seed || !Object.prototype.hasOwnProperty.call(required.seed, "seed") ||
      !required.width || !Object.prototype.hasOwnProperty.call(required.width, "value") ||
      !required.height || !Object.prototype.hasOwnProperty.call(required.height, "value")) {
    throw new AiFunctionError("A01_TEMPLATE_MISMATCH", "A01 executable template does not match the verified node map.", 502);
  }
  required.prompt.text = prompt;
  required.seed.seed = Number(inputParams.seed);
  required.width.value = Number(inputParams.width);
  required.height.value = Number(inputParams.height);
}

function normalizeG20Parameters(body: Record<string, unknown>): { seed: number; resolution: number; durationSeconds: number; fps: number } {
  const sourceAssetId = String(body.sourceAssetId || "").trim();
  if (!sourceAssetId) {
    throw new AiFunctionError("G20_SOURCE_ASSET_REQUIRED", "Upload one source image before creating a G20 task.", 400);
  }
  const prompt = String(body.prompt || "").trim();
  if (prompt.length < 3 || prompt.length > 1_000) {
    throw new AiFunctionError("G20_PROMPT_INVALID", "G20 prompt must contain 3 to 1,000 characters.", 400);
  }
  const durationSeconds = Number(body.durationSeconds ?? 5);
  if (!Number.isInteger(durationSeconds) || !G20_ALLOWED_DURATIONS.has(durationSeconds)) {
    throw new AiFunctionError("G20_DURATION_INVALID", "G20 duration must be 2, 3, 4, 5, 6, 8, or 10 seconds.", 400);
  }
  const requestedResolution = Number(String(body.resolution || "1024").replace(/[^\d]/g, ""));
  if (!G20_ALLOWED_RESOLUTIONS.has(requestedResolution)) {
    throw new AiFunctionError("G20_RESOLUTION_INVALID", "G20 long-edge resolution must be 512, 768, or 1024.", 400);
  }
  const requestedFps = body.fps == null ? G20_FIXED_FPS : Number(body.fps);
  if (requestedFps !== G20_FIXED_FPS) {
    throw new AiFunctionError("G20_FPS_INVALID", "G20 output fps is fixed at 24.", 400);
  }
  const rawSeed = body.seed;
  const seed = rawSeed === null || rawSeed === undefined || rawSeed === "" || rawSeed === "random"
    ? crypto.getRandomValues(new Uint32Array(1))[0]
    : Number(rawSeed);
  if (!Number.isSafeInteger(seed) || seed < 0 || seed > 4_294_967_295) {
    throw new AiFunctionError("G20_SEED_INVALID", "G20 seed must be an integer from 0 to 4294967295.", 400);
  }
  return { seed, resolution: requestedResolution, durationSeconds, fps: G20_FIXED_FPS };
}

function applyG20Parameters(workflow: Record<string, any>, prompt: string, inputParams: Record<string, any>) {
  const promptInputs = workflow["119"]?.inputs;
  const seedInputs = workflow["142"]?.inputs;
  const resolutionInputs = workflow["144"]?.inputs;
  const durationInputs = workflow["153"]?.inputs;
  const outputInputs = workflow["150"]?.inputs;
  const imageInputs = workflow["145"]?.inputs;
  if (
    !promptInputs || !Object.prototype.hasOwnProperty.call(promptInputs, "text") ||
    !seedInputs || !Object.prototype.hasOwnProperty.call(seedInputs, "seed") ||
    !resolutionInputs || !Object.prototype.hasOwnProperty.call(resolutionInputs, "value") ||
    !durationInputs || !Object.prototype.hasOwnProperty.call(durationInputs, "Number") ||
    !outputInputs || !Object.prototype.hasOwnProperty.call(outputInputs, "frame_rate") ||
    !imageInputs || !Object.prototype.hasOwnProperty.call(imageInputs, "image")
  ) {
    throw new AiFunctionError("G20_TEMPLATE_MISMATCH", "G20 executable template does not match the verified node map.", 502);
  }
  promptInputs.text = prompt;
  seedInputs.seed = Number(inputParams.seed);
  resolutionInputs.value = Number(inputParams.resolution);
  durationInputs.Number = String(inputParams.durationSeconds);
  outputInputs.frame_rate = G20_FIXED_FPS;
  outputInputs.format = "video/h264-mp4";
  outputInputs.pix_fmt = "yuv420p";
  outputInputs.save_output = true;
}

function normalizeD18Parameters(body: Record<string, unknown>): { sourceAssetIds: string[]; seed: number; width: number; height: number } {
  const sourceAssetIds = Array.isArray(body.sourceAssetIds)
    ? body.sourceAssetIds.map((value) => String(value || "").trim()).filter(Boolean)
    : [];
  if (sourceAssetIds.length !== 2 || new Set(sourceAssetIds).size !== 2) {
    throw new AiFunctionError("D18_SOURCE_ASSETS_INVALID", "Upload exactly two different source images before creating a D18 task.", 400);
  }
  const prompt = String(body.prompt || "").trim();
  if (prompt.length < 3 || prompt.length > 1_000) {
    throw new AiFunctionError("D18_PROMPT_INVALID", "D18 prompt must contain 3 to 1,000 characters.", 400);
  }
  const requestedResolution = String(body.resolution || `${D18_WIDTH}x${D18_HEIGHT}`).trim().toLowerCase();
  if (requestedResolution !== `${D18_WIDTH}x${D18_HEIGHT}`) {
    throw new AiFunctionError("D18_RESOLUTION_INVALID", `D18 grey release is fixed at ${D18_WIDTH}x${D18_HEIGHT}.`, 400);
  }
  const rawSeed = body.seed;
  const seed = rawSeed === null || rawSeed === undefined || rawSeed === "" || rawSeed === "random"
    ? crypto.getRandomValues(new Uint32Array(1))[0]
    : Number(rawSeed);
  if (!Number.isSafeInteger(seed) || seed < 0 || seed > 4_294_967_295) {
    throw new AiFunctionError("D18_SEED_INVALID", "D18 seed must be an integer from 0 to 4294967295.", 400);
  }
  return { sourceAssetIds, seed, width: D18_WIDTH, height: D18_HEIGHT };
}

function applyD18Parameters(
  workflow: Record<string, any>,
  prompt: string,
  inputParams: Record<string, any>,
  imageNames: string[],
) {
  const promptInputs = workflow["1072"]?.inputs;
  const samplerInputs = workflow["1102:867"]?.inputs;
  const firstImageInputs = workflow["1103"]?.inputs;
  const secondImageInputs = workflow["1104"]?.inputs;
  const latentInputs = workflow["1232"]?.inputs;
  const upscaleInputs = workflow["1240"]?.inputs;
  const outputInputs = workflow["1243"]?.inputs;
  const disabledImageNodeIds = ["1105", "1106", "1112", "1117"];
  if (
    !promptInputs || !Object.prototype.hasOwnProperty.call(promptInputs, "positive") ||
    !samplerInputs || !Object.prototype.hasOwnProperty.call(samplerInputs, "seed") ||
    !firstImageInputs || !Object.prototype.hasOwnProperty.call(firstImageInputs, "image") ||
    !secondImageInputs || !Object.prototype.hasOwnProperty.call(secondImageInputs, "image") ||
    !latentInputs || !Object.prototype.hasOwnProperty.call(latentInputs, "width") ||
    !Object.prototype.hasOwnProperty.call(latentInputs, "height") ||
    !upscaleInputs || !Object.prototype.hasOwnProperty.call(upscaleInputs, "resolution") ||
    !outputInputs || !Object.prototype.hasOwnProperty.call(outputInputs, "filename_prefix") ||
    imageNames.length !== 2
  ) {
    throw new AiFunctionError("D18_TEMPLATE_MISMATCH", "D18 executable template does not match the verified node map.", 502);
  }
  promptInputs.positive = prompt;
  samplerInputs.seed = Number(inputParams.seed);
  firstImageInputs.image = imageNames[0];
  firstImageInputs.enabled = true;
  secondImageInputs.image = imageNames[1];
  secondImageInputs.enabled = true;
  for (const nodeId of disabledImageNodeIds) {
    const inputs = workflow[nodeId]?.inputs;
    if (!inputs || !Object.prototype.hasOwnProperty.call(inputs, "enabled")) {
      throw new AiFunctionError("D18_TEMPLATE_MISMATCH", `D18 image switch node ${nodeId} is missing.`, 502);
    }
    inputs.enabled = false;
  }
  latentInputs.width = D18_WIDTH;
  latentInputs.height = D18_HEIGHT;
  latentInputs.batch_size = 1;
  upscaleInputs.seed = Number(inputParams.seed);
  upscaleInputs.resolution = D18_WIDTH;
  upscaleInputs.max_resolution = D18_WIDTH;
  upscaleInputs.batch_size = 1;
  outputInputs.filename_prefix = `d18_${Number(inputParams.seed)}`;
}

async function resolveOwnedG20SourceImageUrl(adminClient: any, env: AiEnv, userId: string, job: Record<string, any>): Promise<string> {
  const input = safeObject(job.input_params);
  const sourceAssetId = String(job.source_asset_id || input.sourceAssetId || "").trim();
  if (!sourceAssetId) throw new AiFunctionError("G20_SOURCE_ASSET_REQUIRED", "The source image is missing.", 400);
  const { data: asset, error } = await adminClient
    .from("media_assets")
    .select("id,owner_user_id,user_id,file_type,asset_type,storage_key,metadata_json")
    .eq("id", sourceAssetId)
    .or(`owner_user_id.eq.${userId},user_id.eq.${userId}`)
    .maybeSingle();
  if (error || !asset) throw new AiFunctionError("G20_SOURCE_ASSET_NOT_FOUND", "The uploaded source image was not found.", 404);
  if (!["image", "reference_image"].includes(String(asset.file_type || asset.asset_type || "").toLowerCase())) {
    throw new AiFunctionError("G20_SOURCE_ASSET_INVALID", "The selected source asset is not an image.", 400);
  }
  const metadata = safeObject(asset.metadata_json);
  const size = Number(metadata.fileSize || 0);
  const width = Number(metadata.width || 0);
  const height = Number(metadata.height || 0);
  if (size > 10 * 1024 * 1024 || width < 256 || height < 256 || width > 4096 || height > 4096) {
    throw new AiFunctionError("G20_SOURCE_ASSET_INVALID", "The source image does not meet the G20 size or resolution limits.", 400);
  }
  const storageKey = String(asset.storage_key || "").trim();
  if (!storageKey) throw new AiFunctionError("G20_SOURCE_STORAGE_MISSING", "The source image storage key is missing.", 400);
  const bucket = String(metadata.storageBucket || "source-assets");
  if (bucket !== "source-assets") throw new AiFunctionError("G20_SOURCE_BUCKET_INVALID", "The source image is not in the approved temporary bucket.", 400);
  const { data: signed, error: signedError } = await adminClient.storage.from(bucket).createSignedUrl(storageKey, 900);
  if (signedError || !signed?.signedUrl) throw new AiFunctionError("G20_SOURCE_SIGN_FAILED", "The source image could not be prepared.", 502);
  return signed.signedUrl;
}

async function resolveOwnedD18SourceImageUrls(
  adminClient: any,
  env: AiEnv,
  userId: string,
  job: Record<string, any>,
): Promise<string[]> {
  const input = safeObject(job.input_params);
  const sourceAssetIds = Array.isArray(input.sourceAssetIds)
    ? input.sourceAssetIds.map((value) => String(value || "").trim()).filter(Boolean)
    : [];
  if (sourceAssetIds.length !== 2 || new Set(sourceAssetIds).size !== 2) {
    throw new AiFunctionError("D18_SOURCE_ASSETS_INVALID", "The two source images are missing or duplicated.", 400);
  }
  const urls: string[] = [];
  for (const sourceAssetId of sourceAssetIds) {
    const { data: asset, error } = await adminClient
      .from("media_assets")
      .select("id,owner_user_id,user_id,file_type,asset_type,storage_key,metadata_json")
      .eq("id", sourceAssetId)
      .or(`owner_user_id.eq.${userId},user_id.eq.${userId}`)
      .maybeSingle();
    if (error || !asset) throw new AiFunctionError("D18_SOURCE_ASSET_NOT_FOUND", "One of the uploaded source images was not found.", 404);
    if (!["image", "reference_image"].includes(String(asset.file_type || asset.asset_type || "").toLowerCase())) {
      throw new AiFunctionError("D18_SOURCE_ASSET_INVALID", "D18 source assets must be images.", 400);
    }
    const metadata = safeObject(asset.metadata_json);
    const size = Number(metadata.fileSize || 0);
    const width = Number(metadata.width || 0);
    const height = Number(metadata.height || 0);
    if (!size || size > 10 * 1024 * 1024 || width < 256 || height < 256 || width > 4096 || height > 4096) {
      throw new AiFunctionError("D18_SOURCE_ASSET_INVALID", "A source image does not meet the D18 size or resolution limits.", 400);
    }
    const storageKey = String(asset.storage_key || "").trim();
    const bucket = String(metadata.storageBucket || "source-assets");
    if (!storageKey || bucket !== "source-assets") {
      throw new AiFunctionError("D18_SOURCE_STORAGE_INVALID", "A source image is not in the approved temporary bucket.", 400);
    }
    const { data: signed, error: signedError } = await adminClient.storage.from(bucket).createSignedUrl(storageKey, 900);
    if (signedError || !signed?.signedUrl) throw new AiFunctionError("D18_SOURCE_SIGN_FAILED", "A source image could not be prepared.", 502);
    urls.push(signed.signedUrl);
  }
  return urls;
}

function extractG20GpuRuntimeMs(result: Record<string, any>, fallbackMs: number): number {
  const candidates = [
    result?.raw?.gpuRuntimeMs,
    result?.raw?.execution_duration_ms,
    result?.raw?.status?.execution_duration_ms,
    result?.raw?.status?.execution_time_ms,
  ].map(Number).filter((value) => Number.isFinite(value) && value >= 0);
  return Math.round(candidates[0] ?? fallbackMs);
}

function friendlyG20Error(error: unknown): string {
  const code = error instanceof AiFunctionError ? error.code : "G20_GENERATION_FAILED";
  if (["G20_TASK_TIMEOUT", "ZEALMAN_GENERATION_TIMEOUT"].includes(code)) return "视频生成超时，积分已自动退回，请稍后重试。";
  if (code.includes("SOURCE")) return "输入图片无法读取或不符合要求，请重新上传。";
  if (code.includes("STORAGE")) return "视频结果保存失败，任务未标记成功，积分已自动退回。";
  if (code.includes("OUTPUT")) return "生成服务未返回可播放的 MP4 视频，积分已自动退回。";
  return "视频生成失败，积分已自动退回，请稍后重试。";
}

function friendlyD18Error(error: unknown): string {
  const code = error instanceof AiFunctionError ? error.code : "D18_GENERATION_FAILED";
  if (["D18_TASK_TIMEOUT", "ZEALMAN_GENERATION_TIMEOUT"].includes(code)) return "多图编辑超时，积分已自动退回，请稍后重试。";
  if (code.includes("SOURCE")) return "输入图片无法读取或不符合要求，请重新上传两张图片。";
  if (code.includes("STORAGE")) return "图片结果保存失败，任务未标记成功，积分已自动退回。";
  if (code.includes("OUTPUT")) return "生成服务未返回有效图片，积分已自动退回。";
  return "多图编辑失败，积分已自动退回，请稍后重试。";
}

async function writeGenerationTechnicalAudit(
  adminClient: any,
  userId: string,
  jobId: string,
  error: unknown,
  workflowId = G20_WORKFLOW_ID,
) {
  const technicalMessage = error instanceof Error ? error.message : "Unknown generation error";
  const code = error instanceof AiFunctionError ? error.code : "G20_GENERATION_FAILED";
  const { error: auditError } = await adminClient.from("audit_logs").insert({
    id: createId("audit"),
    actor_type: "user",
    actor_id: userId,
    action: "generation_failed",
    target_type: "generation_job",
    target_id: jobId,
    outcome: "failed",
    risk_classification: "medium",
    metadata_json: { workflowId, code, technicalMessage: technicalMessage.slice(0, 2_000) },
    created_at: new Date().toISOString(),
  });
  if (auditError) console.error("generation technical audit failed", auditError.message);
}

async function withTaskTimeout<T>(promise: Promise<T>, timeoutMs: number, code: string): Promise<T> {
  let timeoutId: number | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new AiFunctionError(code, "Generation task timed out.", 504)), timeoutMs);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timeoutId !== undefined) clearTimeout(timeoutId);
  }
}

async function uploadZealmanSourceImage(
  env: AiEnv,
  sourceImageUrl: string,
  jobId: string,
  errorPrefix = "G20",
): Promise<string> {
  const source = await fetchWithTimeout(sourceImageUrl, { method: "GET", headers: { Accept: "image/*,*/*" } }, env.providerTimeoutMs);
  if (!source.ok) {
    throw new AiFunctionError("ZEALMAN_SOURCE_IMAGE_DOWNLOAD_FAILED", `Could not download source image: ${source.status}`, 502);
  }
  const rawContentType = String(source.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
  if (!["image/jpeg", "image/png", "image/webp"].includes(rawContentType)) {
    throw new AiFunctionError(`${errorPrefix}_SOURCE_CONTENT_TYPE_INVALID`, "The source image content type is not supported.", 400);
  }
  const sourceBody = new Uint8Array(await source.arrayBuffer());
  if (!sourceBody.byteLength || sourceBody.byteLength > 10 * 1024 * 1024) {
    throw new AiFunctionError(`${errorPrefix}_SOURCE_SIZE_INVALID`, "The source image is empty or exceeds 10 MB.", 400);
  }
  const contentType = rawContentType;
  const extension = extensionForContentType(contentType, "image");
  const form = new FormData();
  form.append("file", new Blob([sourceBody], { type: contentType }), `${jobId}.${extension}`);
  form.append("overwrite", "true");
  const response = await fetchWithTimeout(`${env.zealmanPanelBaseUrl.replace(/\/$/, "")}/api/comfy/upload/file`, {
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

function applyZealmanOverrides(workflow: Record<string, any>, overrides: unknown) {
  if (!overrides || typeof overrides !== "object" || Array.isArray(overrides)) return;
  for (const [nodeId, values] of Object.entries(overrides as Record<string, unknown>)) {
    const node = workflow[nodeId];
    if (!node || typeof node !== "object" || !node.inputs || !values || typeof values !== "object" || Array.isArray(values)) continue;
    for (const [key, value] of Object.entries(values as Record<string, unknown>)) {
      if (value === null || ["string", "number", "boolean"].includes(typeof value)) node.inputs[key] = value;
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
    const response = await fetchWithTimeout(`${env.zealmanPanelBaseUrl.replace(/\/$/, "")}/api/workflow/result?prompt_id=${encodeURIComponent(promptId)}`, {
      method: "GET",
      headers: zealmanHeaders(env, false),
    }, env.providerTimeoutMs);
    const data = await parseProviderResponse(response, "ZEALMAN_HISTORY_FAILED");
    if (data?.success === false) {
      throw new AiFunctionError("ZEALMAN_HISTORY_FAILED", data?.message || "Zealman workflow result failed.", 502);
    }
    if (data?.pending === true) continue;
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
  for (const result of arrayOfRecords(history?.results || history?.data?.results)) {
    const remotePath = String(result.url || result.path || "").trim();
    if (!remotePath) continue;
    const filename = String(result.filename || result.raw?.filename || remotePath.split("/").pop() || "").trim();
    const url = /^https?:\/\//i.test(remotePath)
      ? remotePath
      : `${env.zealmanPanelBaseUrl.replace(/\/$/, "")}/${remotePath.replace(/^\//, "")}`;
    outputs.push({ filename, type: String(result.type || result.raw?.type || "output"), promptId, url });
  }
  if (outputs.length) return outputs;
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
        url: `${(env.zealmanComfyBaseUrl || env.zealmanPanelBaseUrl).replace(/\/$/, "")}/view?${query.toString()}`,
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
      workflowId: job.workflow_id,
      outputUrl: result.outputUrl ?? null,
      storageKind: storedObject.storageKind,
      storageContentType: storedObject.contentType,
      credits: job.cost_credits,
      durationMs,
      gpuRuntimeMs: String(job.workflow_id || "") === G20_WORKFLOW_ID ? extractG20GpuRuntimeMs(result, durationMs) : null,
      resolution: job.resolution,
      durationSeconds: job.duration_seconds,
      fps: String(job.workflow_id || "") === G20_WORKFLOW_ID ? G20_FIXED_FPS : null,
      codec: String(job.workflow_id || "") === G20_WORKFLOW_ID ? "h264" : null,
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
    if (String(job.workflow_id || "") === G20_WORKFLOW_ID) {
      validateG20Mp4(downloaded.contentType, downloaded.body);
    }
    if (String(job.workflow_id || "") === D18_WORKFLOW_ID) {
      validateD18Image(downloaded.contentType, downloaded.body);
    }
    return {
      storageKey: `${userId}/${assetId}/${mediaType}-${job.id}.${extensionForContentType(downloaded.contentType, mediaType)}`,
      displayName: `${mediaType}-${job.id}.${extensionForContentType(downloaded.contentType, mediaType)}`,
      contentType: downloaded.contentType,
      body: downloaded.body,
      storageKind: "provider_url",
    };
  }

  if (String(job.workflow_id || "") === G20_WORKFLOW_ID) {
    throw new AiFunctionError("G20_MP4_OUTPUT_REQUIRED", "G20 completed without an MP4 output.", 502);
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

function validateG20Mp4(contentType: string, body: Uint8Array) {
  if (contentType !== "video/mp4") {
    throw new AiFunctionError("G20_MP4_CONTENT_TYPE_INVALID", "G20 output must be video/mp4.", 502);
  }
  if (body.byteLength < 1_024) {
    throw new AiFunctionError("G20_MP4_OUTPUT_INVALID", "G20 MP4 output is too small to be playable.", 502);
  }
  const marker = String.fromCharCode(...body.slice(4, 8));
  if (marker !== "ftyp") {
    throw new AiFunctionError("G20_MP4_OUTPUT_INVALID", "G20 output does not contain a valid MP4 file signature.", 502);
  }
}

function validateD18Image(contentType: string, body: Uint8Array) {
  if (!["image/png", "image/jpeg", "image/webp"].includes(contentType)) {
    throw new AiFunctionError("D18_IMAGE_CONTENT_TYPE_INVALID", "D18 output must be PNG, JPEG, or WebP.", 502);
  }
  if (body.byteLength < 1_024) {
    throw new AiFunctionError("D18_IMAGE_OUTPUT_INVALID", "D18 image output is too small to be valid.", 502);
  }
  const isPng = body[0] === 0x89 && body[1] === 0x50 && body[2] === 0x4e && body[3] === 0x47;
  const isJpeg = body[0] === 0xff && body[1] === 0xd8 && body[body.length - 2] === 0xff && body[body.length - 1] === 0xd9;
  const isWebp =
    String.fromCharCode(...body.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...body.slice(8, 12)) === "WEBP";
  if (!isPng && !isJpeg && !isWebp) {
    throw new AiFunctionError("D18_IMAGE_OUTPUT_INVALID", "D18 output does not contain a valid image signature.", 502);
  }
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
  const providerState = paymentProviderStatus(env).find((item) => item.provider === provider);
  if (!providerState?.configured) {
    throw new AiFunctionError("PAYMENT_PROVIDER_NOT_CONFIGURED", `${provider} checkout is not configured.`, 409);
  }
  const packageId = requireText(body.packageId, "PAYMENT_PACKAGE_REQUIRED").slice(0, 80);
  const offerCode = String(body.offerCode || "").trim().toUpperCase().slice(0, 32);
  const idempotencyKey = requireText(body.idempotencyKey, "PAYMENT_IDEMPOTENCY_KEY_REQUIRED").slice(0, 120);
  const pricing = await resolveConsumerPricing(adminClient, packageId, offerCode);
  const credits = pricing.credits;
  const amountCents = pricing.amountCents;
  const currency = pricing.currency;
  const planName = pricing.label;
  const returnUrl = safeReturnUrl(body.returnUrl, `${env.appUrl}/zh/dashboard/`);
  const cancelUrl = safeReturnUrl(body.cancelUrl, `${env.appUrl}/zh/pricing/`);
  const timestamp = new Date().toISOString();
  const orderId = createId("order");
  const existing = await adminClient
    .from("orders")
    .select("*")
    .eq("user_id", userId)
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle();
  if (existing.error) throw new AiFunctionError("PAYMENT_IDEMPOTENCY_CHECK_FAILED", existing.error.message, 502);
  if (existing.data) {
    throw new AiFunctionError("PAYMENT_CHECKOUT_ALREADY_CREATED", "A checkout already exists for this purchase attempt.", 409);
  }

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
    package_id: packageId,
    offer_code: pricing.offerCode || null,
    idempotency_key: idempotencyKey,
    order_metadata: {
      package_id: packageId,
      base_credits: pricing.baseCredits,
      granted_credits: credits,
      offer_code: pricing.offerCode || null,
      offer_extra_percent: pricing.extraPercent,
      pricing_version: pricing.version,
    },
    credit_transaction_id: null,
    created_at: timestamp,
    updated_at: timestamp,
  }).select("*").single();
  if (orderInsert.error) throw new AiFunctionError("PAYMENT_ORDER_CREATE_FAILED", orderInsert.error.message, 502);

  try {
    const providerResult = provider === "stripe"
      ? await createStripeCheckoutSession(env, { orderId, userId, packageId, offerCode: pricing.offerCode, credits, amountCents, currency, planName, returnUrl, cancelUrl })
      : await createPaypalOrder(env, { orderId, userId, packageId, offerCode: pricing.offerCode, credits, amountCents, currency, planName, returnUrl, cancelUrl });

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

async function resolveConsumerPricing(adminClient: any, packageId: string, offerCode: string) {
  let config: Record<string, any> = {};
  const setting = await adminClient
    .from("site_settings")
    .select("value_json")
    .eq("setting_key", "consumer_credit_pricing")
    .eq("status", "published")
    .maybeSingle();
  if (!setting.error && setting.data?.value_json) config = safeObject(setting.data.value_json);
  const packages = Array.isArray(config.packages) && config.packages.length ? config.packages : DEFAULT_CREDIT_PACKAGES;
  const selected = packages.find((item: Record<string, unknown>) => String(item.id || "") === packageId && item.enabled !== false);
  if (!selected) throw new AiFunctionError("PAYMENT_PACKAGE_INVALID", "The selected credit package is unavailable.", 400);
  const baseCredits = clampNumber(selected.credits, 0, 1, 200000);
  const amountCents = clampNumber(selected.amountCents ?? selected.amount_cents, 0, 50, 100000000);
  const offer = safeObject(Object.keys(safeObject(config.offer)).length ? config.offer : DEFAULT_CREDIT_OFFER);
  const validOffer = Boolean(
    offerCode &&
    offerCode === String(offer.code || "").trim().toUpperCase() &&
    packageId === String(offer.packageId || "")
  );
  const extraPercent = validOffer ? clampNumber(offer.extraPercent, 0, 1, 500) : 0;
  return {
    packageId,
    baseCredits,
    credits: Math.floor(baseCredits * (1 + extraPercent / 100)),
    amountCents,
    currency: String(config.currency || "USD").trim().toUpperCase().slice(0, 8) || "USD",
    label: String(selected.label || `${baseCredits} Luravyn credits`).trim().slice(0, 120),
    offerCode: validOffer ? offerCode : "",
    extraPercent,
    version: clampNumber(config.version, 1, 1, 100),
  };
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
  params.set("metadata[package_id]", input.packageId);
  params.set("metadata[base_or_granted_credits]", String(input.credits));
  params.set("metadata[offer_code]", input.offerCode || "");

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
        description: `${input.planName}${input.offerCode ? ` (${input.offerCode})` : ""}`,
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
      configured: Boolean(env.billingEnabled && env.stripeSecretKey && env.stripeWebhookSecret),
      mode: env.stripeMode,
      publicKeyConfigured: Boolean(env.stripePublishableKey),
      webhookConfigured: Boolean(env.stripeWebhookSecret),
    },
    {
      provider: "paypal",
      // PayPal checkout stays hidden until a verified capture-webhook handler is deployed.
      configured: false,
      mode: env.paypalEnvironment,
      publicClientConfigured: Boolean(env.paypalClientId),
      webhookConfigured: Boolean(env.paypalWebhookId),
    },
  ];
}

async function getSharedAsset(adminClient: any, env: AiEnv, body: Record<string, unknown>) {
  const token = requireText(body.token, "SHARE_TOKEN_REQUIRED");
  const timestamp = new Date().toISOString();
  const shareResult = await adminClient
    .from("share_links")
    .select("id,media_asset_id,token,visibility_status,created_at,expires_at,revoked_at")
    .eq("token", token)
    .eq("visibility_status", "active")
    .is("revoked_at", null)
    .or(`expires_at.is.null,expires_at.gt.${timestamp}`)
    .maybeSingle();
  if (shareResult.error || !shareResult.data) {
    throw new AiFunctionError("SHARE_LINK_NOT_FOUND", "This share link is invalid, expired, or revoked.", 404);
  }
  const assetResult = await adminClient
    .from("media_assets")
    .select("id,asset_type,storage_key,preview_storage_key,display_name,metadata_json,is_favorite,processing_status,visibility_status,generation_job_id,created_at,updated_at,deleted_at")
    .eq("id", shareResult.data.media_asset_id)
    .is("deleted_at", null)
    .maybeSingle();
  if (assetResult.error || !assetResult.data) {
    throw new AiFunctionError("SHARED_ASSET_NOT_FOUND", "The shared creation is no longer available.", 404);
  }
  const metadata = safeObject(assetResult.data.metadata_json);
  const storageKey = String(assetResult.data.preview_storage_key || assetResult.data.storage_key || "");
  let signedUrl = "";
  if (storageKey) {
    const signed = await adminClient.storage.from(env.supabaseStorageBucket).createSignedUrl(storageKey, 900);
    if (!signed.error && signed.data?.signedUrl) signedUrl = String(signed.data.signedUrl);
  }
  const outputUrl = String(metadata.outputUrl || metadata.providerOutputUrl || "");
  return {
    share: shareResult.data,
    asset: assetResult.data,
    previewUrl: signedUrl || outputUrl,
    downloadUrl: signedUrl || outputUrl,
  };
}

async function createShareLink(adminClient: any, userId: string, body: Record<string, unknown>) {
  const assetId = requireText(body.assetId, "ASSET_ID_REQUIRED");
  if (body.confirmPublicShare !== true) {
    throw new AiFunctionError("SHARE_PUBLIC_CONFIRMATION_REQUIRED", "请先确认将该私密作品创建为可访问的分享链接。", 400);
  }
  const expiresInDays = Math.min(30, Math.max(1, Math.round(Number(body.expiresInDays || 7))));
  const expiresAt = new Date(Date.now() + expiresInDays * 86400000).toISOString();
  const timestamp = new Date().toISOString();
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
    .or(`expires_at.is.null,expires_at.gt.${timestamp}`)
    .order("created_at", { ascending: false })
    .limit(1);
  if (existing.error) throw new AiFunctionError("SHARE_LINK_READ_FAILED", existing.error.message, 502);
  if ((existing.data ?? []).length > 0) return existing.data[0];

  const inserted = await adminClient.from("share_links").insert({
    id: createId("share"),
    owner_user_id: userId,
    media_asset_id: assetId,
    token: createShareToken(),
    visibility_status: "active",
    created_at: timestamp,
    expires_at: expiresAt,
    revoked_at: null,
  }).select("*").single();
  if (inserted.error) throw new AiFunctionError("SHARE_LINK_CREATE_FAILED", inserted.error.message, 502);

  return inserted.data;
}

async function getRewardProgramConfig(adminClient: any) {
  const result = await adminClient
    .from("site_settings")
    .select("value_json")
    .eq("setting_key", "reward_program_config")
    .eq("status", "published")
    .maybeSingle();
  const value = safeObject(result.data?.value_json);
  const daily = Array.isArray(value.dailyCheckin)
    ? value.dailyCheckin.map(Number).filter((item) => Number.isInteger(item) && item > 0).slice(0, 31)
    : DEFAULT_REWARD_PROGRAM.dailyCheckin;
  return {
    timezone: "UTC",
    dailyCheckin: daily.length ? daily : DEFAULT_REWARD_PROGRAM.dailyCheckin,
    firstGenerationCredits: clampNumber(value.firstGenerationCredits, DEFAULT_REWARD_PROGRAM.firstGenerationCredits, 0, 10000),
    referralCredits: clampNumber(value.referralCredits, DEFAULT_REWARD_PROGRAM.referralCredits, 0, 10000),
    referralRequiresFirstGeneration: value.referralRequiresFirstGeneration !== false,
    shareCredits: clampNumber(value.shareCredits, DEFAULT_REWARD_PROGRAM.shareCredits, 0, 10000),
    shareDailyCap: clampNumber(value.shareDailyCap, DEFAULT_REWARD_PROGRAM.shareDailyCap, 0, 100000),
  };
}

function utcDay(value = new Date()) {
  return value.toISOString().slice(0, 10);
}

async function digestToken(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function grantReward(adminClient: any, userId: string, type: string, key: string, amount: number, reason: string, metadata: Record<string, unknown> = {}) {
  if (amount <= 0) return { granted: false, transactionId: null, amount: 0 };
  const { data, error } = await adminClient.rpc("grant_credit_reward", {
    p_user_id: userId,
    p_reward_type: type,
    p_reward_key: key,
    p_amount: amount,
    p_reason: reason,
    p_metadata: metadata,
  });
  if (error) throw new AiFunctionError("REWARD_GRANT_FAILED", error.message, 502);
  const row = Array.isArray(data) ? data[0] : data;
  return {
    granted: Boolean(row?.granted),
    transactionId: row?.transaction_id || null,
    amount: Number(row?.amount || 0),
  };
}

async function rewardBalance(adminClient: any, userId: string) {
  const { data, error } = await adminClient
    .from("credit_transactions")
    .select("balance_impact,status")
    .eq("user_id", userId);
  if (error) throw new AiFunctionError("REWARD_BALANCE_READ_FAILED", error.message, 502);
  return (data ?? []).filter((row: any) => row.status === "posted")
    .reduce((sum: number, row: any) => sum + Number(row.balance_impact || 0), 0);
}

async function getOrCreateReferralCode(adminClient: any, userId: string) {
  const existing = await adminClient.from("referral_codes").select("*").eq("user_id", userId).maybeSingle();
  if (existing.error) throw new AiFunctionError("REFERRAL_CODE_READ_FAILED", existing.error.message, 502);
  if (existing.data) return existing.data;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const code = `LRV${crypto.randomUUID().replaceAll("-", "").slice(0, 9).toUpperCase()}`;
    const inserted = await adminClient.from("referral_codes").insert({
      user_id: userId,
      code,
      reward_credits: DEFAULT_REWARD_PROGRAM.referralCredits,
    }).select("*").single();
    if (!inserted.error) return inserted.data;
    if (!String(inserted.error.code || "").includes("23505")) {
      throw new AiFunctionError("REFERRAL_CODE_CREATE_FAILED", inserted.error.message, 502);
    }
  }
  throw new AiFunctionError("REFERRAL_CODE_CREATE_FAILED", "Unable to allocate a unique referral code.", 502);
}

async function recordReferralClick(adminClient: any, body: Record<string, unknown>) {
  const code = requireText(body.code, "REFERRAL_CODE_REQUIRED").slice(0, 64);
  const deviceId = requireText(body.deviceId, "REFERRAL_DEVICE_REQUIRED").slice(0, 160);
  const source = String(body.source || "direct").slice(0, 80);
  const codeResult = await adminClient.from("referral_codes").select("user_id,code").eq("code", code).maybeSingle();
  if (codeResult.error || !codeResult.data) return { recorded: false, reason: "invalid_code" };
  const deviceHash = await digestToken(`referral-device:${deviceId}`);
  const inserted = await adminClient.from("referral_events").insert({
    referrer_user_id: codeResult.data.user_id,
    referral_code: codeResult.data.code,
    status: "clicked",
    risk_status: "unreviewed",
    source,
    device_hash: deviceHash,
    event_day: utcDay(),
    metadata_json: { userAgentFamily: String(body.userAgentFamily || "").slice(0, 80) },
  }).select("id").maybeSingle();
  if (inserted.error && String(inserted.error.code || "") !== "23505") {
    throw new AiFunctionError("REFERRAL_CLICK_WRITE_FAILED", inserted.error.message, 502);
  }
  return { recorded: true };
}

async function attributeReferral(adminClient: any, user: any, body: Record<string, unknown>) {
  const code = requireText(body.code, "REFERRAL_CODE_REQUIRED").slice(0, 64);
  const deviceId = requireText(body.deviceId, "REFERRAL_DEVICE_REQUIRED").slice(0, 160);
  const codeResult = await adminClient.from("referral_codes").select("*").eq("code", code).maybeSingle();
  if (codeResult.error || !codeResult.data) return { attributed: false, reason: "invalid_code" };
  if (codeResult.data.user_id === user.id) return { attributed: false, reason: "self_referral" };
  const existing = await adminClient.from("referral_events").select("*").eq("referred_user_id", user.id).maybeSingle();
  if (existing.error) throw new AiFunctionError("REFERRAL_ATTRIBUTION_READ_FAILED", existing.error.message, 502);
  if (existing.data) return { attributed: false, reason: "already_attributed", event: existing.data };

  const deviceHash = await digestToken(`referral-device:${deviceId}`);
  const duplicates = await adminClient.from("referral_events")
    .select("referred_user_id")
    .eq("device_hash", deviceHash)
    .not("referred_user_id", "is", null)
    .neq("referred_user_id", user.id)
    .limit(1);
  const suspicious = (duplicates.data ?? []).length > 0;
  const verified = Boolean(user.email_confirmed_at);
  const inserted = await adminClient.from("referral_events").insert({
    referrer_user_id: codeResult.data.user_id,
    referred_user_id: user.id,
    referral_code: code,
    status: suspicious ? "risk_review" : verified ? "registered" : "pending_verification",
    risk_status: suspicious ? "review" : "passed",
    source: String(body.source || "direct").slice(0, 80),
    device_hash: deviceHash,
    attributed_at: new Date().toISOString(),
    verified_at: verified ? new Date().toISOString() : null,
    reward_credits: codeResult.data.reward_credits,
    metadata_json: { verified },
  }).select("*").single();
  if (inserted.error) {
    if (String(inserted.error.code || "") === "23505") return { attributed: false, reason: "already_attributed" };
    throw new AiFunctionError("REFERRAL_ATTRIBUTION_WRITE_FAILED", inserted.error.message, 502);
  }
  const qualification = suspicious ? null : await qualifyPendingReferral(adminClient, user.id);
  return { attributed: true, event: inserted.data, qualification };
}

async function grantFirstGenerationReward(adminClient: any, userId: string, completedJobId?: string) {
  const config = await getRewardProgramConfig(adminClient);
  if (config.firstGenerationCredits <= 0) return { granted: false, amount: 0 };
  let jobId = completedJobId || "";
  if (!jobId) {
    const result = await adminClient.from("generation_jobs").select("id")
      .eq("user_id", userId).in("status", ["completed", "succeeded"]).order("completed_at", { ascending: true }).limit(1);
    jobId = String(result.data?.[0]?.id || "");
  }
  if (!jobId) return { granted: false, amount: 0, reason: "no_completed_job" };
  return grantReward(adminClient, userId, "first_generation", "once", config.firstGenerationCredits, "首次成功生成奖励", { completed_job_id: jobId });
}

async function qualifyPendingReferral(adminClient: any, referredUserId: string) {
  const config = await getRewardProgramConfig(adminClient);
  const eventResult = await adminClient.from("referral_events").select("*")
    .eq("referred_user_id", referredUserId).in("status", ["registered", "pending_verification"]).maybeSingle();
  if (eventResult.error || !eventResult.data || eventResult.data.risk_status === "review") return null;
  if (config.referralRequiresFirstGeneration) {
    const jobs = await adminClient.from("generation_jobs").select("id")
      .eq("user_id", referredUserId).in("status", ["completed", "succeeded"]).limit(1);
    if (!(jobs.data ?? []).length) return { qualified: false, reason: "first_generation_required" };
  }
  const reward = await grantReward(
    adminClient,
    eventResult.data.referrer_user_id,
    "referral",
    referredUserId,
    config.referralCredits,
    "有效好友推荐奖励",
    { referred_user_id: referredUserId },
  );
  await adminClient.from("referral_events").update({
    status: "rewarded",
    verified_at: eventResult.data.verified_at || new Date().toISOString(),
    rewarded_at: new Date().toISOString(),
    reward_transaction_id: reward.transactionId,
  }).eq("id", eventResult.data.id);
  return { qualified: true, reward };
}

async function grantShareReward(adminClient: any, userId: string, assetId: string) {
  const config = await getRewardProgramConfig(adminClient);
  return grantReward(adminClient, userId, "share", assetId, config.shareCredits, "作品公开分享奖励", {
    asset_id: assetId,
    daily_cap: config.shareDailyCap,
  });
}

async function dailyStatus(adminClient: any, userId: string, schedule: number[]) {
  const result = await adminClient.from("reward_claims").select("reward_key,created_at")
    .eq("user_id", userId).eq("reward_type", "daily_checkin").order("created_at", { ascending: false }).limit(40);
  if (result.error) throw new AiFunctionError("CHECKIN_STATUS_READ_FAILED", result.error.message, 502);
  const days = new Set((result.data ?? []).map((row: any) => String(row.reward_key)));
  const today = utcDay();
  let cursor = new Date(`${today}T00:00:00.000Z`);
  if (!days.has(today)) cursor = new Date(cursor.getTime() - 86400000);
  let streak = 0;
  while (days.has(utcDay(cursor))) {
    streak += 1;
    cursor = new Date(cursor.getTime() - 86400000);
  }
  return {
    today,
    claimedToday: days.has(today),
    streak,
    nextReward: schedule[streak % schedule.length],
    nextDay: (streak % schedule.length) + 1,
  };
}

async function claimDailyCheckin(adminClient: any, user: any) {
  const config = await getRewardProgramConfig(adminClient);
  const status = await dailyStatus(adminClient, user.id, config.dailyCheckin);
  if (status.claimedToday) return { status, reward: { granted: false, amount: 0, reason: "already_claimed" } };
  const reward = await grantReward(
    adminClient, user.id, "daily_checkin", status.today, status.nextReward,
    `每日签到 Day ${status.nextDay}`, { timezone: "UTC", streak_day: status.nextDay },
  );
  return { status: await dailyStatus(adminClient, user.id, config.dailyCheckin), reward, balance: await rewardBalance(adminClient, user.id) };
}

async function getRewardProgramStatus(adminClient: any, user: any, body: Record<string, unknown>) {
  await grantFirstGenerationReward(adminClient, user.id);
  await qualifyPendingReferral(adminClient, user.id);
  const config = await getRewardProgramConfig(adminClient);
  const code = await getOrCreateReferralCode(adminClient, user.id);
  const [daily, claims, referrals, balance] = await Promise.all([
    dailyStatus(adminClient, user.id, config.dailyCheckin),
    adminClient.from("reward_claims").select("reward_type,reward_key,amount,created_at").eq("user_id", user.id),
    adminClient.from("referral_events").select("status,rewarded_at,referred_user_id,created_at")
      .eq("referrer_user_id", user.id),
    rewardBalance(adminClient, user.id),
  ]);
  if (claims.error || referrals.error) throw new AiFunctionError("REWARD_STATUS_READ_FAILED", claims.error?.message || referrals.error?.message || "", 502);
  const rows = referrals.data ?? [];
  return {
    config,
    daily,
    balance,
    referralCode: code.code,
    referralStats: {
      clicks: rows.filter((row: any) => row.status === "clicked").length,
      registrations: rows.filter((row: any) => row.referred_user_id).length,
      valid: rows.filter((row: any) => ["registered", "rewarded"].includes(row.status)).length,
      rewarded: rows.filter((row: any) => row.status === "rewarded").length,
    },
    claims: claims.data ?? [],
    source: String(body.source || "free-coins").slice(0, 80),
  };
}

async function revokeShareLink(adminClient: any, userId: string, body: Record<string, unknown>) {
  const shareId = requireText(body.shareId, "SHARE_ID_REQUIRED");
  const { data, error } = await adminClient
    .from("share_links")
    .update({ visibility_status: "revoked", revoked_at: new Date().toISOString() })
    .eq("id", shareId)
    .eq("owner_user_id", userId)
    .eq("visibility_status", "active")
    .select("*")
    .maybeSingle();
  if (error) throw new AiFunctionError("SHARE_LINK_REVOKE_FAILED", error.message, 502);
  if (!data) throw new AiFunctionError("SHARE_LINK_NOT_FOUND", "Share link not found.", 404);
  return data;
}

async function updateMediaAsset(adminClient: any, userId: string, body: Record<string, unknown>) {
  const assetId = requireText(body.assetId, "ASSET_ID_REQUIRED");
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (typeof body.favorite === "boolean") patch.is_favorite = body.favorite;
  if (body.visibility !== undefined) {
    const visibility = String(body.visibility);
    if (!["private", "public"].includes(visibility)) {
      throw new AiFunctionError("ASSET_VISIBILITY_INVALID", "Unsupported asset visibility.", 400);
    }
    patch.visibility_status = visibility;
  }
  if (Object.keys(patch).length === 1) throw new AiFunctionError("ASSET_UPDATE_EMPTY", "No supported asset fields were provided.", 400);
  const { data, error } = await adminClient
    .from("media_assets")
    .update(patch)
    .eq("id", assetId)
    .eq("owner_user_id", userId)
    .is("deleted_at", null)
    .select("*")
    .maybeSingle();
  if (error) throw new AiFunctionError("ASSET_UPDATE_FAILED", error.message, 502);
  if (!data) throw new AiFunctionError("ASSET_NOT_FOUND", "Asset not found.", 404);
  return data;
}

async function deleteMediaAsset(adminClient: any, userId: string, body: Record<string, unknown>) {
  const assetId = requireText(body.assetId, "ASSET_ID_REQUIRED");
  const timestamp = new Date().toISOString();
  const assetResult = await adminClient
    .from("media_assets")
    .update({ deleted_at: timestamp, visibility_status: "private", updated_at: timestamp })
    .eq("id", assetId)
    .eq("owner_user_id", userId)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();
  if (assetResult.error) throw new AiFunctionError("ASSET_DELETE_FAILED", assetResult.error.message, 502);
  if (!assetResult.data) throw new AiFunctionError("ASSET_NOT_FOUND", "Asset not found.", 404);
  const shareResult = await adminClient
    .from("share_links")
    .update({ visibility_status: "revoked", revoked_at: timestamp })
    .eq("media_asset_id", assetId)
    .eq("owner_user_id", userId)
    .eq("visibility_status", "active");
  if (shareResult.error) throw new AiFunctionError("ASSET_SHARE_REVOKE_FAILED", shareResult.error.message, 502);
  return { deleted: true, assetId };
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
    { provider: "zealman_workflow", configured: Boolean(env.zealmanPanelBaseUrl && (env.zealmanImageWorkflow || env.zealmanVideoWorkflow)), imageWorkflow: env.zealmanImageWorkflow ? "configured" : "", videoWorkflow: env.zealmanVideoWorkflow ? "configured" : "", endpoint: env.zealmanPanelBaseUrl },
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
    billingEnabled: Deno.env.get("STRIPE_BILLING_ENABLED") === "true" && Deno.env.get("STRIPE_MODE") !== "live",
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

function calculateWorkflowCredits(input: {
  mediaType: "image" | "video";
  durationSeconds: number | null;
  resolution: string | null;
  outputCount: number;
  tool: Record<string, any> | null;
  workflow: Record<string, any> | null;
  configuredBase: number;
}): number {
  const fallback = estimateCredits(input.mediaType, input.durationSeconds ?? undefined);
  const schema = safeObject(input.workflow?.input_schema);
  const pricing = safeObject(schema.pricing ?? schema["x-pricing"]);
  const durationCosts = safeObject(pricing.duration_costs ?? pricing.durationCosts);
  const resolutionMultipliers = safeObject(pricing.resolution_multipliers ?? pricing.resolutionMultipliers);
  const outputMultipliers = safeObject(pricing.output_multipliers ?? pricing.outputMultipliers);
  const configured = Math.max(
    0,
    Number(input.configuredBase || 0),
    Number(input.tool?.credits_cost || 0),
    Number(input.workflow?.cost || 0),
  );
  const durationPrice = input.durationSeconds == null ? 0 : Number(durationCosts[String(input.durationSeconds)] || 0);
  const base = Math.max(configured, durationPrice, fallback);
  const resolutionMultiplier = Math.max(0, Number(resolutionMultipliers[String(input.resolution || "")] || 1));
  const outputMultiplier = Math.max(0, Number(outputMultipliers[String(input.outputCount)] || input.outputCount || 1));
  return Math.max(1, Math.ceil(base * resolutionMultiplier * outputMultiplier));
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

async function createIdempotentJobId(userId: string, idempotencyKey: string): Promise<string> {
  const bytes = new TextEncoder().encode(`${userId}:${idempotencyKey}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const hex = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `job_${hex.slice(0, 48)}`;
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
  billingEnabled: boolean;
  paypalClientId: string;
  paypalClientSecret: string;
  paypalWebhookId: string;
  paypalEnvironment: "sandbox" | "live";
}

interface PaymentCheckoutInput {
  orderId: string;
  userId: string;
  packageId: string;
  offerCode: string;
  credits: number;
  amountCents: number;
  currency: string;
  planName: string;
  returnUrl: string;
  cancelUrl: string;
}
