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
    "QIANWEN_IMAGE_MODEL",
    "QIANWEN_VIDEO_MODEL",
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
  assert.equal(combined.includes("c83f9e12-0943-4828-8fec-f00ab3b0d0bd"), false);

  const env = loadEnvironment();
  assert.equal(env.qwenVisionModel, "Qwen/Qwen2.5-VL-7B-Instruct");
  assert.equal(env.deepseekBaseUrl, "https://api.deepseek.com/v1");
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
  for (const provider of ["qwen_vision", "deepseek_text", "qianwen_generation", "fake_worker"]) {
    assert.ok(edgeFunction.includes(provider), `AI Edge Function should include ${provider}`);
  }
  assert.ok(edgeFunction.includes("SUPABASE_SERVICE_ROLE_KEY"));
  assert.ok(edgeFunction.includes("auth.getUser()"));
  assert.ok(edgeFunction.includes("QWEN_VISION_SITE_API_KEY"));
  assert.ok(edgeFunction.includes("resolveWorkflowConfig"));
  assert.ok(edgeFunction.includes("refundGenerationCredits"));
  assert.ok(edgeFunction.includes("generation_refund"));
  assert.ok(edgeFunction.includes("createDemoCreditPurchase"));
  assert.equal(edgeFunction.includes("VITE_QWEN"), false);
  assert.equal(edgeFunction.includes("VITE_DEEPSEEK"), false);
  assert.equal(edgeFunction.includes("VITE_QIANWEN"), false);
});

test("Admin defaults reserve Qwen, DeepSeek, and Qianwen workflows for grey rollout", () => {
  const adminBackend = readFileSync(join(root, "src", "supabase", "adminBackend.ts"), "utf8");
  const adminFunction = readFileSync(join(root, "supabase", "functions", "admin", "index.ts"), "utf8");
  const combined = `${adminBackend}\n${adminFunction}`;

  for (const expected of [
    "workflow-qwen-vision-v1",
    "workflow-deepseek-prompt-v1",
    "workflow-qianwen-image-v1",
    "workflow-qianwen-video-v1",
    "qwen_vision",
    "deepseek_text",
    "qianwen_generation",
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
  assert.ok(appScript.includes("syncRemoteProductData"));
  assert.ok(appScript.includes("demo-credit-purchase"));
  assert.ok(appScript.includes("runRemoteDemoCreditPurchase"));
  assert.ok(appScript.includes("qianwen_generation"));
  assert.ok(appScript.includes("qwen_vision"));
  assert.ok(appScript.includes("deepseek_text"));
});

test("production verification scripts cover OAuth and AI function health", () => {
  const packageJson = readFileSync(join(root, "package.json"), "utf8");
  const oauthScript = readFileSync(join(root, "scripts", "verify-oauth.mjs"), "utf8");
  const aiScript = readFileSync(join(root, "scripts", "verify-ai-function.mjs"), "utf8");
  const paymentScript = readFileSync(join(root, "scripts", "verify-payment-loop.mjs"), "utf8");

  assert.ok(packageJson.includes("verify:oauth"));
  assert.ok(packageJson.includes("verify:ai"));
  assert.ok(packageJson.includes("verify:payments"));
  for (const provider of ["google", "twitter", "discord", "telegram"]) {
    assert.ok(oauthScript.includes(provider), `OAuth verifier should cover ${provider}`);
  }
  assert.ok(oauthScript.includes("skipBrowserRedirect"));
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
  assert.ok(aiScript.includes("generation_jobs"));
  assert.ok(aiScript.includes("media_assets"));
  assert.ok(aiScript.includes("credit_transactions"));
  assert.ok(paymentScript.includes("demo-credit-purchase"));
  assert.ok(paymentScript.includes("orders"));
  assert.ok(paymentScript.includes("credit_transactions"));
  assert.ok(paymentScript.includes("creditBalanceCorrect"));
  assert.ok(paymentScript.includes("SUPABASE_TEST_ACCESS_TOKEN"));
  assert.equal(oauthScript.includes("SUPABASE_SERVICE_ROLE_KEY"), false);
  assert.ok(aiScript.includes("SUPABASE_SERVICE_ROLE_KEY"));
  assert.ok(paymentScript.includes("SUPABASE_SERVICE_ROLE_KEY"));
});
