import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

export interface AppEnvironment {
  nodeEnv: string;
  appUrl: string;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  supabaseStorageBucket: string;
  supabaseServiceRoleKey?: string;
  stripePublishableKey?: string;
  stripeSecretKey?: string;
  stripeWebhookSecret?: string;
  stripeMode?: string;
  paypalClientId?: string;
  paypalClientSecret?: string;
  paypalWebhookId?: string;
  paypalEnvironment?: string;
  qwenVisionEndpoint?: string;
  qwenVisionSiteApiKey?: string;
  qwenVisionModel?: string;
  deepseekApiKey?: string;
  deepseekBaseUrl?: string;
  deepseekModel?: string;
  qianwenApiKey?: string;
  qianwenBaseUrl?: string;
  qianwenImageEndpoint?: string;
  qianwenVideoEndpoint?: string;
  qianwenImageModel?: string;
  qianwenVideoModel?: string;
  qianwenMaxPolls?: number;
  qianwenPollIntervalMs?: number;
  liblibAccessKey?: string;
  liblibSecretKey?: string;
  liblibBaseUrl?: string;
  liblibText2ImageTemplateUuid?: string;
  liblibImageModel?: string;
  liblibMaxPolls?: number;
  liblibPollIntervalMs?: number;
  zealmanPanelBaseUrl?: string;
  zealmanComfyBaseUrl?: string;
  zealmanApiToken?: string;
  zealmanImageWorkflow?: string;
  zealmanImageEditWorkflow?: string;
  zealmanImageCompositionWorkflow?: string;
  zealmanPoseWorkflow?: string;
  zealmanOutfitWorkflow?: string;
  zealmanVideoWorkflow?: string;
  zealmanSmoothVideoWorkflow?: string;
  zealmanDigitalHumanWorkflow?: string;
  zealmanPromptNodeId?: string;
  zealmanMaxPolls?: number;
  zealmanPollIntervalMs?: number;
  compShareApiBaseUrl?: string;
  compSharePublicKey?: string;
  compSharePrivateKey?: string;
  compShareProjectId?: string;
  compShareRegion?: string;
  compShareZone?: string;
  compShareInstanceId?: string;
  compShareColdStartTimeoutMs?: number;
  compSharePollIntervalMs?: number;
  compShareIdleShutdownSeconds?: number;
  aiProviderDefault?: string;
  aiProviderRolloutMode?: string;
  aiProviderTimeoutMs?: number;
}

export function loadEnvironment(filePath?: string): AppEnvironment {
  const parsed = filePath ? parseEnvFile(filePath) : {};
  const value = (key: string, fallback = "") => parsed[key] ?? process.env[key] ?? fallback;

  return {
    nodeEnv: value("NODE_ENV", "development"),
    appUrl: value("APP_URL", "http://127.0.0.1:4173"),
    supabaseUrl: emptyToUndefined(value("SUPABASE_URL")),
    supabaseAnonKey: emptyToUndefined(value("SUPABASE_ANON_KEY")),
    supabaseStorageBucket: value("SUPABASE_STORAGE_BUCKET", "open-video-studio-assets"),
    supabaseServiceRoleKey: emptyToUndefined(value("SUPABASE_SERVICE_ROLE_KEY")),
    stripePublishableKey: emptyToUndefined(value("VITE_STRIPE_PUBLISHABLE_KEY") || value("STRIPE_PUBLISHABLE_KEY")),
    stripeSecretKey: emptyToUndefined(value("STRIPE_SECRET_KEY")),
    stripeWebhookSecret: emptyToUndefined(value("STRIPE_WEBHOOK_SECRET")),
    stripeMode: value("STRIPE_MODE", "test"),
    paypalClientId: emptyToUndefined(value("PAYPAL_CLIENT_ID") || value("VITE_PAYPAL_CLIENT_ID")),
    paypalClientSecret: emptyToUndefined(value("PAYPAL_CLIENT_SECRET")),
    paypalWebhookId: emptyToUndefined(value("PAYPAL_WEBHOOK_ID")),
    paypalEnvironment: value("PAYPAL_ENVIRONMENT", "sandbox"),
    qwenVisionEndpoint: value("QWEN_VISION_ENDPOINT", "https://47-251-244-196.sslip.io/api/ai/vision/analyze"),
    qwenVisionSiteApiKey: emptyToUndefined(value("QWEN_VISION_SITE_API_KEY")),
    qwenVisionModel: value("QWEN_VISION_MODEL", "Qwen/Qwen2.5-VL-7B-Instruct"),
    deepseekApiKey: emptyToUndefined(value("DEEPSEEK_API_KEY")),
    deepseekBaseUrl: value("DEEPSEEK_BASE_URL", "https://api.deepseek.com/v1"),
    deepseekModel: value("DEEPSEEK_MODEL", "deepseek-chat"),
    qianwenApiKey: emptyToUndefined(value("QIANWEN_API_KEY")),
    qianwenBaseUrl: emptyToUndefined(value("QIANWEN_BASE_URL")),
    qianwenImageEndpoint: emptyToUndefined(value("QIANWEN_IMAGE_ENDPOINT")),
    qianwenVideoEndpoint: emptyToUndefined(value("QIANWEN_VIDEO_ENDPOINT")),
    qianwenImageModel: value("QIANWEN_IMAGE_MODEL", "your-image-model"),
    qianwenVideoModel: value("QIANWEN_VIDEO_MODEL", "your-video-model"),
    qianwenMaxPolls: Number(value("QIANWEN_MAX_POLLS", "36")),
    qianwenPollIntervalMs: Number(value("QIANWEN_POLL_INTERVAL_MS", "5000")),
    liblibAccessKey: emptyToUndefined(value("LIBLIB_ACCESS_KEY")),
    liblibSecretKey: emptyToUndefined(value("LIBLIB_SECRET_KEY")),
    liblibBaseUrl: value("LIBLIB_BASE_URL", "https://openapi.liblibai.cloud"),
    liblibText2ImageTemplateUuid: emptyToUndefined(value("LIBLIB_TEXT2IMG_TEMPLATE_UUID")),
    liblibImageModel: value("LIBLIB_IMAGE_MODEL", "liblib-text2img-v1"),
    liblibMaxPolls: Number(value("LIBLIB_MAX_POLLS", "12")),
    liblibPollIntervalMs: Number(value("LIBLIB_POLL_INTERVAL_MS", "5000")),
    zealmanPanelBaseUrl: emptyToUndefined(value("ZEALMAN_PANEL_BASE_URL")),
    zealmanComfyBaseUrl: emptyToUndefined(value("ZEALMAN_COMFY_BASE_URL")),
    zealmanApiToken: emptyToUndefined(value("ZEALMAN_API_TOKEN")),
    zealmanImageWorkflow: emptyToUndefined(value("ZEALMAN_IMAGE_WORKFLOW")),
    zealmanImageEditWorkflow: emptyToUndefined(value("ZEALMAN_IMAGE_EDIT_WORKFLOW")),
    zealmanImageCompositionWorkflow: emptyToUndefined(value("ZEALMAN_IMAGE_COMPOSITION_WORKFLOW")),
    zealmanPoseWorkflow: emptyToUndefined(value("ZEALMAN_POSE_WORKFLOW")),
    zealmanOutfitWorkflow: emptyToUndefined(value("ZEALMAN_OUTFIT_WORKFLOW")),
    zealmanVideoWorkflow: emptyToUndefined(value("ZEALMAN_VIDEO_WORKFLOW")),
    zealmanSmoothVideoWorkflow: emptyToUndefined(value("ZEALMAN_SMOOTH_VIDEO_WORKFLOW")),
    zealmanDigitalHumanWorkflow: emptyToUndefined(value("ZEALMAN_DIGITAL_HUMAN_WORKFLOW")),
    zealmanPromptNodeId: emptyToUndefined(value("ZEALMAN_PROMPT_NODE_ID")),
    zealmanMaxPolls: Number(value("ZEALMAN_MAX_POLLS", "180")),
    zealmanPollIntervalMs: Number(value("ZEALMAN_POLL_INTERVAL_MS", "5000")),
    compShareApiBaseUrl: value("COMPSHARE_API_BASE_URL", "https://api.compshare.cn"),
    compSharePublicKey: emptyToUndefined(value("COMPSHARE_PUBLIC_KEY")),
    compSharePrivateKey: emptyToUndefined(value("COMPSHARE_PRIVATE_KEY")),
    compShareProjectId: emptyToUndefined(value("COMPSHARE_PROJECT_ID")),
    compShareRegion: value("COMPSHARE_REGION", "cn-wlcb"),
    compShareZone: value("COMPSHARE_ZONE", "cn-wlcb-01"),
    compShareInstanceId: emptyToUndefined(value("COMPSHARE_INSTANCE_ID")),
    compShareColdStartTimeoutMs: Number(value("COMPSHARE_COLD_START_TIMEOUT_MS", "240000")),
    compSharePollIntervalMs: Number(value("COMPSHARE_POLL_INTERVAL_MS", "5000")),
    compShareIdleShutdownSeconds: Number(value("COMPSHARE_IDLE_SHUTDOWN_SECONDS", "600")),
    aiProviderDefault: value("AI_PROVIDER_DEFAULT", "fake_worker"),
    aiProviderRolloutMode: value("AI_PROVIDER_ROLLOUT_MODE", "admin_config"),
    aiProviderTimeoutMs: Number(value("AI_PROVIDER_TIMEOUT_MS", "60000")),
  };
}

export function loadLocalEnvironment(): AppEnvironment {
  const localPath = resolve(process.cwd(), ".env.local");
  return loadEnvironment(existsSync(localPath) ? localPath : undefined);
}

function parseEnvFile(filePath: string): Record<string, string> {
  const output: Record<string, string> = {};
  if (!existsSync(filePath)) {
    return output;
  }

  for (const line of readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const index = trimmed.indexOf("=");
    if (index === -1) {
      continue;
    }
    const key = trimmed.slice(0, index).trim();
    const rawValue = trimmed.slice(index + 1).trim();
    output[key] = rawValue.replace(/^["']|["']$/g, "");
  }
  return output;
}

function emptyToUndefined(value: string): string | undefined {
  return value.trim() ? value.trim() : undefined;
}
