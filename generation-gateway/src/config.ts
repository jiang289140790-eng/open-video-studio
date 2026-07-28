import { z } from "zod";

const ConfigSchema = z.object({
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_ANON_KEY: z.string().min(1).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  ALLOWED_ORIGINS: z.string().default("http://127.0.0.1:5173,http://localhost:5173"),
  APP_ENV: z.enum(["development", "test", "production"]).default("development"),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  PORT: z.coerce.number().int().min(1).max(65535).default(10000),
  MOCK_PROVIDER_ENABLED: z.string().default("true").transform((value) => value === "true"),
  MOCK_PROVIDER_LATENCY_MS: z.coerce.number().int().min(0).max(120_000).default(250),
  MOCK_PROVIDER_FAILURE_RATE: z.coerce.number().min(0).max(1).default(0),
  MOCK_PROVIDER_TIMEOUT_RATE: z.coerce.number().min(0).max(1).default(0),
  MOCK_PROVIDER_DUPLICATE_WEBHOOK: z.string().default("false").transform((value) => value === "true"),
  WEBHOOK_SIGNING_SECRET: z.string().min(16).optional(),
  REQUEST_BODY_LIMIT_BYTES: z.coerce.number().int().min(1024).max(10 * 1024 * 1024).default(1024 * 1024),
  RATE_LIMIT_PER_MINUTE: z.coerce.number().int().min(1).max(10_000).default(60),
  PUBLIC_BASE_URL: z.string().url().optional(),
  RUNPOD_API_KEY: z.string().min(1).optional(),
  RUNPOD_ENDPOINT_ID: z.string().min(1).optional(),
  RUNPOD_WEBHOOK_SECRET: z.string().min(16).optional(),
  RUNPOD_REQUEST_TIMEOUT_MS: z.coerce.number().int().min(1000).max(120_000).default(15_000),
  RUNPOD_POLL_INTERVAL_MS: z.coerce.number().int().min(250).max(60_000).default(2_000),
  RUNPOD_MAX_POLL_DURATION_MS: z.coerce.number().int().min(10_000).max(3_600_000).default(600_000),
  RUNPOD_COMFYUI_WORKFLOW_REF: z.string().min(1).optional(),
  RUNPOD_MODEL_MANIFEST_REF: z.string().min(1).optional(),
  GENERATION_STORAGE_BUCKET: z.string().min(1).default("generation-results"),
  REAL_PROVIDER_ENABLED: z.string().default("false").transform((value) => value === "true"),
  REAL_PROVIDER_ALLOWLIST: z.string().default(""),
});

export type Config = z.infer<typeof ConfigSchema>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const parsed = ConfigSchema.parse(env);
  if (parsed.APP_ENV === "production") {
    if (!parsed.SUPABASE_URL || !parsed.SUPABASE_ANON_KEY || !parsed.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Production requires SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY.");
    }
    if (!parsed.WEBHOOK_SIGNING_SECRET) throw new Error("Production requires WEBHOOK_SIGNING_SECRET.");
    if (parsed.ALLOWED_ORIGINS.split(",").some((origin) => origin.trim() === "*")) {
      throw new Error("Production CORS cannot contain a wildcard origin.");
    }
  }
  if (parsed.REAL_PROVIDER_ENABLED) {
    if (!parsed.RUNPOD_API_KEY ||
        !parsed.RUNPOD_ENDPOINT_ID ||
        !parsed.RUNPOD_WEBHOOK_SECRET ||
        !parsed.RUNPOD_COMFYUI_WORKFLOW_REF ||
        !parsed.RUNPOD_MODEL_MANIFEST_REF ||
        !parsed.PUBLIC_BASE_URL) {
      throw new Error("Enabled real provider requires complete RunPod, workflow, model, storage and public webhook configuration.");
    }
    if (!parsed.REAL_PROVIDER_ALLOWLIST.split(",").map((value) => value.trim()).includes("single-person-text-to-image-v1")) {
      throw new Error("Enabled real provider requires single-person-text-to-image-v1 in REAL_PROVIDER_ALLOWLIST.");
    }
  }
  return parsed;
}
