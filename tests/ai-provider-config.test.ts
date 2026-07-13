import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { loadEnvironment } from "../src/index.js";

const root = process.cwd();

test("AI provider environment exposes placeholders without committing secrets", () => {
  const envExample = readFileSync(join(root, ".env.example"), "utf8");
  const localExample = readFileSync(join(root, ".env.local.example"), "utf8");
  const combined = `${envExample}\n${localExample}`;

  for (const key of [
    "QWEN_VISION_ENDPOINT",
    "QWEN_VISION_SITE_API_KEY",
    "QWEN_VISION_MODEL",
    "DEEPSEEK_API_KEY",
    "DEEPSEEK_BASE_URL",
    "DEEPSEEK_MODEL",
    "QIANWEN_API_KEY",
    "QIANWEN_BASE_URL",
    "QIANWEN_IMAGE_ENDPOINT",
    "QIANWEN_VIDEO_ENDPOINT",
    "QIANWEN_IMAGE_MODEL",
    "QIANWEN_VIDEO_MODEL",
    "QIANWEN_MAX_POLLS",
    "QIANWEN_POLL_INTERVAL_MS",
    "LIBLIB_ACCESS_KEY",
    "LIBLIB_SECRET_KEY",
    "LIBLIB_BASE_URL",
    "LIBLIB_TEXT2IMG_TEMPLATE_UUID",
    "LIBLIB_IMAGE_MODEL",
    "LIBLIB_MAX_POLLS",
    "LIBLIB_POLL_INTERVAL_MS",
    "ZEALMAN_PANEL_BASE_URL",
    "ZEALMAN_COMFY_BASE_URL",
    "ZEALMAN_API_TOKEN",
    "ZEALMAN_IMAGE_WORKFLOW",
    "ZEALMAN_IMAGE_EDIT_WORKFLOW",
    "ZEALMAN_VIDEO_WORKFLOW",
    "ZEALMAN_SMOOTH_VIDEO_WORKFLOW",
    "ZEALMAN_DIGITAL_HUMAN_WORKFLOW",
    "ZEALMAN_PROMPT_NODE_ID",
    "ZEALMAN_MAX_POLLS",
    "ZEALMAN_POLL_INTERVAL_MS",
    "COMPSHARE_API_BASE_URL",
    "COMPSHARE_PUBLIC_KEY",
    "COMPSHARE_PRIVATE_KEY",
    "COMPSHARE_PROJECT_ID",
    "COMPSHARE_REGION",
    "COMPSHARE_ZONE",
    "COMPSHARE_INSTANCE_ID",
    "COMPSHARE_COLD_START_TIMEOUT_MS",
    "COMPSHARE_POLL_INTERVAL_MS",
    "COMPSHARE_IDLE_SHUTDOWN_SECONDS",
    "AI_PROVIDER_DEFAULT",
    "AI_PROVIDER_ROLLOUT_MODE",
    "AI_PROVIDER_TIMEOUT_MS",
  ]) {
    assert.ok(combined.includes(`${key}=`), `${key} should be documented in env examples`);
  }

  assert.ok(combined.includes("https://47-251-244-196.sslip.io/api/ai/vision/analyze"));
  assert.ok(combined.includes("Qwen/Qwen2.5-VL-7B-Instruct"));
  assert.ok(combined.includes("your-image-model"));
  assert.ok(combined.includes("your-video-model"));
  assert.ok(combined.includes("https://openapi.liblibai.cloud"));
  assert.ok(combined.includes("liblib-text2img-v1"));
  assert.ok(combined.includes("your-a01-image-workflow.json"));
  assert.equal(combined.includes("c83f9e12-0943-4828-8fec-f00ab3b0d0bd"), false);

  const env = loadEnvironment();
  assert.equal(env.qwenVisionModel, "Qwen/Qwen2.5-VL-7B-Instruct");
  assert.equal(env.deepseekBaseUrl, "https://api.deepseek.com/v1");
  assert.equal(env.liblibBaseUrl, "https://openapi.liblibai.cloud");
  assert.equal(env.liblibImageModel, "liblib-text2img-v1");
  assert.equal(env.zealmanMaxPolls, 180);
  assert.equal(env.zealmanPollIntervalMs, 5000);
  assert.equal(env.aiProviderDefault, "fake_worker");
});

test("AI Edge Function contains server-only provider actions and no browser-secret path", () => {
  const edgeFunction = readFileSync(join(root, "supabase", "functions", "ai", "index.ts"), "utf8");
  for (const action of [
    "analyze-image",
    "enhance-prompt",
    "create-generation-job",
    "process-generation-job",
    "check-generation-status",
    "cancel-generation-job",
    "provider-status",
    "demo-credit-purchase",
  ]) {
    assert.ok(edgeFunction.includes(action), `AI Edge Function should include ${action}`);
  }
  for (const provider of ["qwen_vision", "deepseek_text", "qianwen_generation", "liblib_generation", "zealman_workflow", "fake_worker"]) {
    assert.ok(edgeFunction.includes(provider), `AI Edge Function should include ${provider}`);
  }
  assert.ok(edgeFunction.includes("SUPABASE_SERVICE_ROLE_KEY"));
  assert.ok(edgeFunction.includes("auth.getUser()"));
  assert.ok(edgeFunction.includes("QWEN_VISION_SITE_API_KEY"));
  assert.ok(edgeFunction.includes("resolveWorkflowConfig"));
  assert.ok(edgeFunction.includes("refundGenerationCredits"));
  assert.ok(edgeFunction.includes("generation_refund"));
  assert.ok(edgeFunction.includes("createDemoCreditPurchase"));
  assert.ok(edgeFunction.includes("normalizeProbeFailure"));
  assert.ok(edgeFunction.includes("QIANWEN_IMAGE_ENDPOINT"));
  assert.ok(edgeFunction.includes("QIANWEN_VIDEO_ENDPOINT"));
  assert.ok(edgeFunction.includes("qianwenGenerationEndpoint"));
  assert.ok(edgeFunction.includes("qianwenGenerationEndpointCandidates"));
  assert.ok(edgeFunction.includes("submitQianwenGeneration"));
  assert.ok(edgeFunction.includes("isOpenAiCompatibleQianwenBase"));
  assert.ok(edgeFunction.includes("stream=false"));
  assert.ok(edgeFunction.includes("pollQianwenTask"));
  assert.ok(edgeFunction.includes("qianwenTaskStatusEndpoint"));
  assert.ok(edgeFunction.includes("QIANWEN_TASK_STATUS_FAILED"));
  assert.ok(edgeFunction.includes("QIANWEN_GENERATION_TIMEOUT"));
  assert.ok(edgeFunction.includes("compatible-mode"));
  assert.ok(edgeFunction.includes("sourceImageUrl"));
  assert.ok(edgeFunction.includes("image-generation/generation"));
  assert.ok(edgeFunction.includes("isDashScopeAsyncEndpoint"));
  assert.ok(edgeFunction.includes("X-DashScope-Async"));
  assert.ok(edgeFunction.includes("multimodal-generation/generation"));
  assert.ok(edgeFunction.includes("text2image/image-synthesis"));
  assert.ok(edgeFunction.includes("input: {\n            prompt"));
  assert.ok(edgeFunction.includes("video-generation/video-synthesis"));
  assert.ok(edgeFunction.includes("isDashScopeNativeEndpoint"));
  assert.ok(edgeFunction.includes("LIBLIB_ACCESS_KEY"));
  assert.ok(edgeFunction.includes("LIBLIB_SECRET_KEY"));
  assert.ok(edgeFunction.includes("LIBLIB_TEXT2IMG_TEMPLATE_UUID"));
  assert.ok(edgeFunction.includes("callLiblibGeneration"));
  assert.ok(edgeFunction.includes("hmacSha1Base64Url"));
  assert.ok(edgeFunction.includes("/api/generate/webui/text2img"));
  assert.ok(edgeFunction.includes("/api/generate/webui/status"));
  assert.ok(edgeFunction.includes("callZealmanWorkflow"));
  assert.ok(edgeFunction.includes("fetchZealmanWorkflow"));
  assert.ok(edgeFunction.includes("applyZealmanPrompt"));
  assert.ok(edgeFunction.includes("uploadZealmanSourceImage"));
  assert.ok(edgeFunction.includes("pollZealmanHistory"));
  assert.ok(edgeFunction.includes("/api/workflow/generate"));
  assert.ok(edgeFunction.includes("/upload/image"));
  assert.ok(edgeFunction.includes("/history/"));
  assert.ok(edgeFunction.includes("ZEALMAN_PANEL_BASE_URL"));
  assert.ok(edgeFunction.includes("COMPSHARE_INSTANCE_ID"));
  assert.ok(edgeFunction.includes("ensureCompShareRuntime"));
  assert.ok(edgeFunction.includes("storeGeneratedMediaObject"));
  assert.ok(edgeFunction.includes("downloadProviderOutputUrl"));
  assert.ok(edgeFunction.includes("decodeProviderBase64Output"));
  assert.ok(edgeFunction.includes("storageKind"));
  assert.ok(edgeFunction.includes("provider_url"));
  assert.ok(edgeFunction.includes("provider_base64"));
  assert.ok(edgeFunction.includes("metadata_json"));
  assert.ok(edgeFunction.includes("请识别这张图片"));
  assert.ok(edgeFunction.includes("提示词增强助手"));
  assert.equal(/(\u7487|\u6d63\u72b3\u69f8|\u9286|\u9417|\u7ec0|\u59b2)/.test(edgeFunction), false);
  assert.equal(edgeFunction.includes("VITE_QWEN"), false);
  assert.equal(edgeFunction.includes("VITE_DEEPSEEK"), false);
  assert.equal(edgeFunction.includes("VITE_QIANWEN"), false);
});

test("AI Edge Function records jobs and orders before moving credits", () => {
  const edgeFunction = readFileSync(join(root, "supabase", "functions", "ai", "index.ts"), "utf8");
  const createGenerationJob = edgeFunction.slice(
    edgeFunction.indexOf("async function createGenerationJob"),
    edgeFunction.indexOf("async function processGenerationJob"),
  );
  assert.ok(createGenerationJob.includes('.from("generation_jobs").insert(job)'), "generation job should be inserted before credits are charged");
  assert.ok(createGenerationJob.indexOf('.from("generation_jobs").insert(job)') < createGenerationJob.indexOf("await consumeCredits("));
  assert.ok(createGenerationJob.includes('status: "failed"'));
  assert.ok(createGenerationJob.includes("credit_charged: 0"));

  const createDemoCreditPurchase = edgeFunction.slice(
    edgeFunction.indexOf("async function createDemoCreditPurchase"),
    edgeFunction.indexOf("async function createShareLink"),
  );
  assert.ok(createDemoCreditPurchase.includes('status: "pending"'), "demo order should exist before credits are granted");
  assert.ok(createDemoCreditPurchase.indexOf('.from("orders").insert') < createDemoCreditPurchase.indexOf('.from("credit_transactions").insert'));
  assert.ok(createDemoCreditPurchase.includes('status: "fulfilled"'));
  assert.ok(createDemoCreditPurchase.includes('status: "failed"'));
});

test("Admin defaults reserve Qwen, DeepSeek, Qianwen, Liblib, and Zealman workflows for grey rollout", () => {
  const adminBackend = readFileSync(join(root, "src", "supabase", "adminBackend.ts"), "utf8");
  const adminFunction = readFileSync(join(root, "supabase", "functions", "admin", "index.ts"), "utf8");
  const combined = `${adminBackend}\n${adminFunction}`;

  for (const expected of [
    "workflow-qwen-vision-v1",
    "workflow-deepseek-prompt-v1",
    "workflow-qianwen-image-v1",
    "workflow-qianwen-video-v1",
    "workflow-liblib-image-v1",
    "workflow-zealman-image-a01-v1",
    "workflow-zealman-video-g01-v1",
    "workflow-zealman-video-g03-v1",
    "workflow-zealman-digital-human-j11-v1",
    "qwen_vision",
    "deepseek_text",
    "qianwen_generation",
    "liblib_generation",
    "zealman_workflow",
    "fake_worker",
  ]) {
    assert.ok(combined.includes(expected), `Admin defaults should include ${expected}`);
  }
});

test("frontend routes generation through AI Edge Function before local fallback", () => {
  const appScript = readFileSync(join(root, "apps", "web", "app.js"), "utf8");
  assert.ok(appScript.includes("runRemoteGeneration"));
  assert.ok(appScript.includes("create-generation-job"));
  assert.ok(appScript.includes("process-generation-job"));
  assert.ok(appScript.includes("check-generation-status"));
  assert.ok(appScript.includes("cancel-generation-job"));
  assert.ok(appScript.includes("attachRemoteAssetDownloadUrls"));
  assert.ok(appScript.includes("syncRemoteProductData"));
  assert.ok(appScript.includes("demo-credit-purchase"));
  assert.ok(appScript.includes("runRemoteDemoCreditPurchase"));
  assert.ok(appScript.includes("create-share-link"));
  assert.ok(appScript.includes("hydrateRemoteShareByToken"));
  assert.ok(appScript.includes("qianwen_generation"));
  assert.ok(appScript.includes("liblib_generation"));
  assert.ok(appScript.includes("zealman_workflow"));
  assert.ok(appScript.includes("workflowIdForGeneration"));
  assert.ok(appScript.includes("workflow-zealman-video-g01-v1"));
  assert.ok(appScript.includes("qwen_vision"));
  assert.ok(appScript.includes("deepseek_text"));
});

test("production verification scripts cover OAuth and AI function health", () => {
  const packageJson = readFileSync(join(root, "package.json"), "utf8");
  const oauthScript = readFileSync(join(root, "scripts", "verify-oauth.mjs"), "utf8");
  const aiScript = readFileSync(join(root, "scripts", "verify-ai-function.mjs"), "utf8");
  const workflowScript = readFileSync(join(root, "scripts", "verify-workflow-routing.mjs"), "utf8");
  const paymentScript = readFileSync(join(root, "scripts", "verify-payment-loop.mjs"), "utf8");
  const userLoopScript = readFileSync(join(root, "scripts", "verify-user-product-loop.mjs"), "utf8");
  const realAiScript = readFileSync(join(root, "scripts", "verify-real-ai-generation.mjs"), "utf8");
  const mvpReadinessScript = readFileSync(join(root, "scripts", "verify-mvp-readiness.mjs"), "utf8");
  const adminScript = readFileSync(join(root, "scripts", "verify-admin-console.mjs"), "utf8");
  const deployFunctionScript = readFileSync(join(root, "scripts", "deploy-supabase-function.mjs"), "utf8");
  const telegramFunction = readFileSync(join(root, "supabase", "functions", "telegram-auth", "index.ts"), "utf8");

  assert.ok(packageJson.includes("verify:oauth"));
  assert.ok(packageJson.includes("verify:auth-basic"));
  assert.ok(packageJson.includes("verify:ai"));
  assert.ok(packageJson.includes("verify:workflow"));
  assert.ok(packageJson.includes("verify:user-loop"));
  assert.ok(packageJson.includes("verify:real-ai"));
  assert.ok(packageJson.includes("verify:payments"));
  assert.ok(packageJson.includes("verify:mvp"));
  assert.ok(packageJson.includes("verify:admin"));
  assert.ok(packageJson.includes("deploy:function"));
  for (const provider of ["google", "x", "discord", "telegram"]) {
    assert.ok(oauthScript.includes(provider), `OAuth verifier should cover ${provider}`);
  }
  assert.ok(oauthScript.includes("skipBrowserRedirect"));
  assert.ok(oauthScript.includes('redirectTo: `${appUrl}/signin.html`'));
  assert.ok(oauthScript.includes("providerCallbackUrl"));
  assert.ok(oauthScript.includes("providerRedirectUri"));
  assert.ok(oauthScript.includes("providerRedirectUriMatchesCallback"));
  assert.ok(oauthScript.includes("requiredProviderCallbackUrl"));
  assert.ok(oauthScript.includes("/auth/v1/callback"));
  assert.ok(oauthScript.includes('"x"'));
  assert.equal(oauthScript.includes('"twitter"'), false);
  assert.ok(telegramFunction.includes("TELEGRAM_BOT_TOKEN"));
  assert.ok(telegramFunction.includes("verifyTelegramAuth"));
  assert.ok(telegramFunction.includes("crypto.subtle"));
  assert.ok(telegramFunction.includes("generateLink"));
  assert.equal(telegramFunction.includes("VITE_TELEGRAM"), false);
  assert.ok(deployFunctionScript.includes('slug !== "telegram-auth"'));
  assert.ok(aiScript.includes("/functions/v1/ai"));
  assert.ok(aiScript.includes("provider-status"));
  assert.ok(aiScript.includes("SUPABASE_TEST_ACCESS_TOKEN"));
  assert.ok(aiScript.includes("demo-credit-purchase"));
  assert.ok(aiScript.includes("create-generation-job"));
  assert.ok(aiScript.includes("process-generation-job"));
  assert.ok(aiScript.includes("cancel-generation-job"));
  assert.ok(aiScript.includes("analyze-image"));
  assert.ok(aiScript.includes("probeGenerationLoop"));
  assert.ok(aiScript.includes("probeCreditRefundLoop"));
  assert.ok(aiScript.includes("probeDatabasePersistence"));
  assert.ok(aiScript.includes("probePromptEnhancement"));
  assert.ok(aiScript.includes("probeQwenVision"));
  assert.ok(aiScript.includes("providerProbes"));
  assert.ok(aiScript.includes("probe: true"));
  assert.ok(aiScript.includes("generation_jobs"));
  assert.ok(aiScript.includes("media_assets"));
  assert.ok(aiScript.includes("credit_transactions"));
  assert.ok(workflowScript.includes("get-workflow-center-config"));
  assert.ok(workflowScript.includes("update-workflow-center-config"));
  assert.ok(workflowScript.includes("create-generation-job"));
  assert.ok(workflowScript.includes("process-generation-job"));
  assert.ok(workflowScript.includes("providerSelected"));
  assert.ok(workflowScript.includes("assetReadable"));
  assert.ok(workflowScript.includes("restoreWorkflowCenter"));
  assert.ok(workflowScript.includes("SUPABASE_SERVICE_ROLE_KEY"));
  assert.ok(paymentScript.includes("demo-credit-purchase"));
  assert.ok(paymentScript.includes("orders"));
  assert.ok(paymentScript.includes("credit_transactions"));
  assert.ok(paymentScript.includes("creditBalanceCorrect"));
  assert.ok(paymentScript.includes("SUPABASE_TEST_ACCESS_TOKEN"));
  assert.ok(userLoopScript.includes("demo-credit-purchase"));
  assert.ok(userLoopScript.includes("create-generation-job"));
  assert.ok(userLoopScript.includes("process-generation-job"));
  assert.ok(userLoopScript.includes("create-share-link"));
  assert.ok(userLoopScript.includes("media_assets"));
  assert.ok(userLoopScript.includes("generation_jobs"));
  assert.ok(userLoopScript.includes("share_links"));
  assert.ok(userLoopScript.includes("publicLinkReadable"));
  assert.ok(userLoopScript.includes("publicAssetReadable"));
  assert.ok(userLoopScript.includes("SUPABASE_SERVICE_ROLE_KEY"));
  assert.ok(realAiScript.includes("qianwen_generation"));
  assert.ok(realAiScript.includes("zealman_workflow"));
  assert.ok(realAiScript.includes("...process.env"));
  assert.ok(realAiScript.includes("workflow-qianwen-image-v1"));
  assert.ok(realAiScript.includes("workflow-qianwen-video-v1"));
  assert.ok(realAiScript.includes("--video"));
  assert.ok(realAiScript.includes("OVS_VERIFY_REAL_AI_MODE"));
  assert.ok(realAiScript.includes("createReferenceImageUrl"));
  assert.ok(realAiScript.includes("createSolidPng"));
  assert.ok(realAiScript.includes("sourceImageUrl"));
  assert.ok(realAiScript.includes("process-generation-job"));
  assert.ok(realAiScript.includes("providerStatus"));
  assert.ok(realAiScript.includes("refund"));
  assert.ok(realAiScript.includes("media_assets"));
  assert.ok(realAiScript.includes("SUPABASE_SERVICE_ROLE_KEY"));
  for (const loopName of ["Real login loop", "Real credits loop", "User generation asset loop", "Admin operations loop"]) {
    assert.ok(mvpReadinessScript.includes(loopName), `MVP readiness script should include ${loopName}`);
  }
  for (const scriptName of ["verify:auth-basic", "verify:oauth", "verify:payments", "verify:user-loop", "verify:admin", "verify:ai", "verify:real-ai"]) {
    assert.ok(mvpReadinessScript.includes(scriptName), `MVP readiness script should orchestrate ${scriptName}`);
  }
  assert.ok(mvpReadinessScript.includes("readyForSmallUserTesting"));
  assert.ok(mvpReadinessScript.includes("--real-ai"));
  for (const action of ["dashboard-summary", "list-users", "adjust-credits", "update-order-status", "review-asset", "revoke-share-link", "list-audit-logs"]) {
    assert.ok(adminScript.includes(action), `Admin verifier should cover ${action}`);
  }
  assert.ok(adminScript.includes("runAdminOperationProbe"));
  assert.ok(adminScript.includes("cleanupStaleAdminVerificationRows"));
  assert.ok(adminScript.includes("SUPABASE_SERVICE_ROLE_KEY"));
  assert.equal(oauthScript.includes("SUPABASE_SERVICE_ROLE_KEY"), false);
  assert.ok(aiScript.includes("SUPABASE_SERVICE_ROLE_KEY"));
  assert.ok(paymentScript.includes("SUPABASE_SERVICE_ROLE_KEY"));
  assert.ok(deployFunctionScript.includes("SUPABASE_ACCESS_TOKEN"));
  assert.ok(deployFunctionScript.includes('"functions"'));
  assert.ok(deployFunctionScript.includes('"deploy"'));
  assert.ok(deployFunctionScript.includes('"--use-api"'));
  assert.equal(deployFunctionScript.includes("console.log(accessToken"), false);
});
