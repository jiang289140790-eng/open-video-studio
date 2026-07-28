import { createHmac, timingSafeEqual } from "node:crypto";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { createClient } from "@supabase/supabase-js";
import { GenerationInputSchema, GenerationStatusSchema, WorkflowManifestSchema, type GenerationJob } from "./domain.js";
import { loadConfig } from "./config.js";
import { GenerationEngine } from "./engine.js";
import { errorBody, GatewayError, newId, normalizeError } from "./errors.js";
import { MockProvider, RunPodProviderPlaceholder, type GenerationProvider, type WebhookVerifyingProvider } from "./provider.js";
import { RunPodProvider } from "./providers/runpod/index.js";
import { AutoDLProvider } from "./providers/autodl/index.js";
import { MemoryGenerationRepository, SupabaseGenerationRepository } from "./repository.js";
import { MemoryRegistryStore, SupabaseRegistryStore } from "./registry.js";

const config = loadConfig();
const repository = config.SUPABASE_URL && config.SUPABASE_SERVICE_ROLE_KEY
  ? new SupabaseGenerationRepository(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY)
  : new MemoryGenerationRepository();
const registry = config.SUPABASE_URL && config.SUPABASE_SERVICE_ROLE_KEY
  ? new SupabaseRegistryStore(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY)
  : new MemoryRegistryStore();
const baseUrl = config.PUBLIC_BASE_URL ?? `http://127.0.0.1:${config.PORT}`;
const providers = new Map<string, GenerationProvider>([
  ["mock", new MockProvider({
    latencyMs: config.MOCK_PROVIDER_LATENCY_MS,
    failureRate: config.MOCK_PROVIDER_FAILURE_RATE,
    timeoutRate: config.MOCK_PROVIDER_TIMEOUT_RATE,
    assetBaseUrl: baseUrl,
    duplicateWebhook: config.MOCK_PROVIDER_DUPLICATE_WEBHOOK,
  })],
  ["runpod-placeholder", new RunPodProviderPlaceholder()],
  ["runpod", new RunPodProvider({
    apiKey: config.RUNPOD_API_KEY,
    endpointId: config.RUNPOD_ENDPOINT_ID,
    webhookSecret: config.RUNPOD_WEBHOOK_SECRET,
    requestTimeoutMs: config.RUNPOD_REQUEST_TIMEOUT_MS,
    maxPollDurationMs: config.RUNPOD_MAX_POLL_DURATION_MS,
    enabled: config.REAL_PROVIDER_ENABLED,
    workflowAllowlist: config.REAL_PROVIDER_ALLOWLIST.split(",").map((value) => value.trim()).filter(Boolean),
    publicWebhookBaseUrl: config.PUBLIC_BASE_URL,
    comfyuiWorkflowRef: config.RUNPOD_COMFYUI_WORKFLOW_REF ?? "",
    modelManifestRef: config.RUNPOD_MODEL_MANIFEST_REF ?? "",
    storageBucket: config.GENERATION_STORAGE_BUCKET,
  })],
  ["autodl", new AutoDLProvider({
    baseUrl: config.AUTODL_BASE_URL,
    apiToken: config.AUTODL_API_TOKEN,
    healthPath: config.AUTODL_HEALTH_PATH,
    requestTimeoutMs: config.AUTODL_REQUEST_TIMEOUT_MS,
    maxPollDurationMs: config.AUTODL_MAX_POLL_DURATION_MS,
    enabled: config.AUTODL_PROVIDER_ENABLED,
    workflowAllowlist: config.REAL_PROVIDER_ALLOWLIST.split(",").map((value) => value.trim()).filter(Boolean),
    publicWebhookBaseUrl: config.PUBLIC_BASE_URL,
    comfyuiWorkflowRef: "registry://workflows/single-person-text-to-image-v1/1.0.0",
    modelManifestRef: "registry://models/single-person-photorealistic-model-v1/1.0.0",
    storageBucket: config.GENERATION_STORAGE_BUCKET,
  })],
]);
const engine = new GenerationEngine(repository, providers, {
  pollIntervalMs: config.REAL_PROVIDER_ENABLED
    ? (config.AUTODL_PROVIDER_ENABLED ? config.AUTODL_POLL_INTERVAL_MS : config.RUNPOD_POLL_INTERVAL_MS)
    : Math.max(10, Math.min(1000, Math.ceil(config.MOCK_PROVIDER_LATENCY_MS / 4))),
  maxExecutionMs: config.REAL_PROVIDER_ENABLED
    ? (config.AUTODL_PROVIDER_ENABLED ? config.AUTODL_MAX_POLL_DURATION_MS : config.RUNPOD_MAX_POLL_DURATION_MS)
    : Math.max(5000, config.MOCK_PROVIDER_LATENCY_MS * 10),
  testingWorkflowsEnabled: config.REAL_PROVIDER_ENABLED,
  testingWorkflowId: config.REAL_PROVIDER_ALLOWLIST.split(",").map((value) => value.trim()).filter(Boolean)[0],
}, registry);
const authClient = config.SUPABASE_URL && config.SUPABASE_ANON_KEY
  ? createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } })
  : null;
const allowedOrigins = new Set(config.ALLOWED_ORIGINS.split(",").map((origin) => origin.trim()).filter(Boolean));
const rateWindows = new Map<string, { started: number; count: number }>();
let shuttingDown = false;

interface Actor {
  id: string;
  role: "user" | "operator" | "admin";
}

const server = createServer(async (request, response) => {
  const requestId = safeRequestId(request.headers["x-request-id"]) ?? newId("req");
  const startedAt = Date.now();
  let jobId: string | undefined;
  try {
    setCors(request, response);
    response.setHeader("x-request-id", requestId);
    if (request.method === "OPTIONS") return send(response, 204, undefined);
    applyRateLimit(request);
    const url = new URL(request.url ?? "/", baseUrl);
    const path = url.pathname;
    if (request.method === "GET" && path === "/health") {
      return send(response, 200, { status: "ok", service: "generation-gateway", request_id: requestId });
    }
    if (request.method === "GET" && path === "/ready") {
      const ready = !shuttingDown && await repository.ready() && (await providers.get("mock")!.healthCheck()).healthy;
      return send(response, ready ? 200 : 503, { status: ready ? "ready" : "not_ready", request_id: requestId });
    }
    const mockAsset = path.match(/^\/v1\/mock-assets\/([^/]+)\/(\d+)\.svg$/);
    if (request.method === "GET" && mockAsset) return sendMockAsset(response, mockAsset[1]!, Number(mockAsset[2]));
    const webhookMatch = path.match(/^\/v1\/provider-webhooks\/([a-z0-9-]+)$/);
    if (request.method === "POST" && webhookMatch) {
      const raw = await readBody(request);
      verifyProviderWebhook(webhookMatch[1]!, raw, request.headers["x-webhook-signature"]);
      const payload = parseJson(raw) as Record<string, unknown>;
      const provider = providers.get(webhookMatch[1]!) as WebhookVerifyingProvider | undefined;
      const parsedWebhook = provider?.parseWebhook?.(raw.toString("utf8"));
      const eventId = parsedWebhook?.eventId ?? requiredString(payload.event_id, "event_id");
      const providerJobId = parsedWebhook?.providerJobId ?? requiredString(payload.provider_job_id, "provider_job_id");
      const result = await engine.handleProviderWebhook(webhookMatch[1]!, eventId, providerJobId);
      return send(response, 202, { ...result, request_id: requestId });
    }

    const actor = await authenticate(request);
    if (request.method === "POST" && path === "/v1/generations") {
      const input = GenerationInputSchema.parse(parseJson(await readBody(request)));
      const result = await engine.create(actor.id, input);
      jobId = result.job.id;
      return send(response, result.duplicate ? 200 : 202, {
        job: publicJob(result.job),
        duplicate: result.duplicate,
        request_id: requestId,
        job_id: result.job.id,
      });
    }
    if (request.method === "GET" && path === "/v1/generations") {
      const statusValue = url.searchParams.get("status");
      const status = statusValue ? GenerationStatusSchema.parse(statusValue) : undefined;
      const limit = boundedInt(url.searchParams.get("limit"), 20, 1, 100);
      const offset = boundedInt(url.searchParams.get("offset"), 0, 0, 10_000);
      const jobs = await engine.list(actor.id, { ...(status ? { status } : {}), limit, offset });
      return send(response, 200, { jobs: jobs.map(publicJob), request_id: requestId });
    }
    const generationMatch = path.match(/^\/v1\/generations\/([^/]+)$/);
    if (request.method === "GET" && generationMatch) {
      jobId = decodeURIComponent(generationMatch[1]!);
      const job = await engine.get(actor.id, jobId);
      return send(response, 200, { job: publicJob(job), request_id: requestId, job_id: job.id });
    }
    const actionMatch = path.match(/^\/v1\/generations\/([^/]+)\/(cancel|retry)$/);
    if (request.method === "POST" && actionMatch) {
      jobId = decodeURIComponent(actionMatch[1]!);
      const job = actionMatch[2] === "cancel" ? await engine.cancel(actor.id, jobId) : await engine.retry(actor.id, jobId);
      return send(response, 202, { job: publicJob(job), request_id: requestId, job_id: job.id });
    }
    if (request.method === "GET" && path === "/v1/presets") {
      return send(response, 200, {
        presets: [
          { id: "mock-image-square", media_type: "image", creation_mode: "text_to_image", aspect_ratio: "1:1" },
          { id: "mock-video-vertical", media_type: "video", creation_mode: "text_to_video", aspect_ratio: "9:16", duration_seconds: 6 },
          { id: "mock-effect", media_type: "image", creation_mode: "effect_preset", aspect_ratio: "1:1" },
        ],
        request_id: requestId,
      });
    }
    if (path.startsWith("/v1/admin/")) assertAdmin(actor);
    if (request.method === "GET" && path === "/v1/admin/workflows") {
      return send(response, 200, { workflows: await registry.listWorkflows(), request_id: requestId });
    }
    if (request.method === "POST" && path === "/v1/admin/workflows") {
      const manifest = WorkflowManifestSchema.parse(parseJson(await readBody(request)));
      return send(response, 201, { workflow: await registry.createWorkflow(manifest, actor.id), request_id: requestId });
    }
    const workflowPatch = path.match(/^\/v1\/admin\/workflows\/([^/]+)$/);
    if (request.method === "PATCH" && workflowPatch) {
      const patch = WorkflowManifestSchema.partial().parse(parseJson(await readBody(request)));
      const workflow = await registry.patchWorkflow(decodeURIComponent(workflowPatch[1]!), patch);
      return send(response, 200, { workflow, request_id: requestId });
    }
    if (request.method === "GET" && path === "/v1/admin/models") {
      return send(response, 200, { models: await registry.listModels(), request_id: requestId });
    }
    if (request.method === "GET" && path === "/v1/admin/loras") {
      return send(response, 200, { loras: await registry.listLoras(), request_id: requestId });
    }
    if (request.method === "GET" && path === "/v1/admin/providers") {
      const [configs, health] = await Promise.all([
        registry.listProviders(),
        Promise.all([...providers.values()].map((provider) => provider.healthCheck())),
      ]);
      return send(response, 200, { providers: configs, health, request_id: requestId });
    }
    const eventMatch = path.match(/^\/v1\/admin\/jobs\/([^/]+)\/events$/);
    if (request.method === "GET" && eventMatch) {
      const events = await engine.adminEvents(decodeURIComponent(eventMatch[1]!));
      return send(response, 200, { events, request_id: requestId });
    }
    throw new GatewayError("ROUTE_NOT_FOUND", "The requested API route does not exist.", 404);
  } catch (unknownError) {
    const error = normalizeError(unknownError);
    log("error", "request.failed", {
      request_id: requestId,
      job_id: jobId,
      method: request.method,
      path: safePath(request.url),
      code: error.code,
      status: error.status,
      duration_ms: Date.now() - startedAt,
    });
    return send(response, error.status, errorBody(error, requestId, jobId));
  } finally {
    log("info", "request.completed", {
      request_id: requestId,
      job_id: jobId,
      method: request.method,
      path: safePath(request.url),
      status: response.statusCode,
      duration_ms: Date.now() - startedAt,
    });
  }
});

server.listen(config.PORT, "0.0.0.0", () => log("info", "server.started", { port: config.PORT, app_env: config.APP_ENV }));

for (const signal of ["SIGTERM", "SIGINT"] as const) {
  process.on(signal, () => {
    if (shuttingDown) return;
    shuttingDown = true;
    log("info", "server.shutdown", { signal });
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10_000).unref();
  });
}

async function authenticate(request: IncomingMessage): Promise<Actor> {
  const header = String(request.headers.authorization ?? "");
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) throw new GatewayError("AUTH_REQUIRED", "A Supabase access token is required.", 401);
  if (config.APP_ENV === "test" && token.startsWith("test:")) {
    const [, id, role = "user"] = token.split(":");
    if (!id) throw new GatewayError("AUTH_INVALID", "Test token is invalid.", 401);
    return { id, role: role === "admin" || role === "operator" ? role : "user" };
  }
  if (!authClient) throw new GatewayError("AUTH_NOT_CONFIGURED", "Supabase JWT validation is not configured.", 503);
  const { data, error } = await authClient.auth.getUser(token);
  if (error || !data.user) throw new GatewayError("AUTH_INVALID", "The Supabase access token is invalid or expired.", 401);
  const claimedRole = data.user.app_metadata?.role;
  return { id: data.user.id, role: claimedRole === "admin" || claimedRole === "operator" ? claimedRole : "user" };
}

function assertAdmin(actor: Actor): void {
  if (actor.role !== "admin" && actor.role !== "operator") {
    throw new GatewayError("ADMIN_REQUIRED", "Admin or operator permission is required.", 403);
  }
}

function publicJob(job: GenerationJob) {
  const plan = job.generation_plan;
  return {
    id: job.id,
    user_id: job.user_id,
    media_type: job.input.media_type,
    creation_mode: job.input.creation_mode,
    original_prompt: job.input.prompt,
    status: job.status,
    output_count: job.output_count,
    estimated_cost: job.estimated_cost,
    final_cost: job.final_cost,
    error_code: job.error_code,
    error_message: job.error_message,
    assets: job.assets,
    review: job.review,
    routing_summary: plan ? {
      selected_workflow_id: plan.selected_workflow_id,
      candidate_count: plan.candidate_workflows.length,
      routing_reasons: plan.routing_reasons,
      fallback_count: plan.fallback_workflow_ids.length,
      router_version: plan.router_version,
    } : undefined,
    created_at: job.created_at,
    updated_at: job.updated_at,
    started_at: job.started_at,
    completed_at: job.completed_at,
    cancelled_at: job.cancelled_at,
    retry_of_job_id: job.retry_of_job_id,
  };
}

function setCors(request: IncomingMessage, response: ServerResponse): void {
  const origin = String(request.headers.origin ?? "");
  if (origin && allowedOrigins.has(origin)) {
    response.setHeader("access-control-allow-origin", origin);
    response.setHeader("vary", "Origin");
    response.setHeader("access-control-allow-methods", "GET,POST,PATCH,OPTIONS");
    response.setHeader("access-control-allow-headers", "authorization,content-type,x-request-id,x-webhook-signature,idempotency-key");
    response.setHeader("access-control-max-age", "600");
  } else if (origin) {
    throw new GatewayError("CORS_ORIGIN_DENIED", "Request origin is not allowed.", 403);
  }
}

function applyRateLimit(request: IncomingMessage): void {
  const key = request.socket.remoteAddress ?? "unknown";
  const now = Date.now();
  const current = rateWindows.get(key);
  if (!current || now - current.started >= 60_000) {
    rateWindows.set(key, { started: now, count: 1 });
    return;
  }
  current.count += 1;
  if (current.count > config.RATE_LIMIT_PER_MINUTE) throw new GatewayError("RATE_LIMITED", "Too many requests.", 429, true);
}

async function readBody(request: IncomingMessage): Promise<Buffer> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > config.REQUEST_BODY_LIMIT_BYTES) throw new GatewayError("REQUEST_BODY_TOO_LARGE", "Request body exceeds the configured limit.", 413);
    chunks.push(buffer);
  }
  return Buffer.concat(chunks);
}

function parseJson(raw: Buffer): unknown {
  try {
    return raw.length ? JSON.parse(raw.toString("utf8")) : {};
  } catch {
    throw new GatewayError("INVALID_JSON", "Request body must be valid JSON.", 400);
  }
}

function verifyWebhook(raw: Buffer, signatureHeader: string | string[] | undefined): void {
  if (!config.WEBHOOK_SIGNING_SECRET) {
    if (config.APP_ENV === "production") throw new GatewayError("WEBHOOK_NOT_CONFIGURED", "Webhook signing is not configured.", 503);
    return;
  }
  const supplied = String(signatureHeader ?? "").replace(/^sha256=/, "");
  const expected = createHmac("sha256", config.WEBHOOK_SIGNING_SECRET).update(raw).digest("hex");
  const left = Buffer.from(supplied);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) {
    throw new GatewayError("WEBHOOK_SIGNATURE_INVALID", "Webhook signature is invalid.", 401);
  }
}

function verifyProviderWebhook(providerId: string, raw: Buffer, signatureHeader: string | string[] | undefined): void {
  const provider = providers.get(providerId) as WebhookVerifyingProvider | undefined;
  if (provider && typeof provider.verifyWebhook === "function") {
    if (!provider.verifyWebhook(raw.toString("utf8"), Array.isArray(signatureHeader) ? signatureHeader[0] : signatureHeader)) {
      throw new GatewayError("WEBHOOK_SIGNATURE_INVALID", "Webhook signature is invalid.", 401);
    }
    return;
  }
  verifyWebhook(raw, signatureHeader);
}

function send(response: ServerResponse, status: number, value: unknown): void {
  response.statusCode = status;
  if (value === undefined) {
    response.end();
    return;
  }
  response.setHeader("content-type", "application/json; charset=utf-8");
  response.end(JSON.stringify(value));
}

function sendMockAsset(response: ServerResponse, jobId: string, output: number): void {
  const safeId = jobId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#18122b"/><stop offset="1" stop-color="#7757ff"/></linearGradient></defs><rect width="1024" height="1024" fill="url(#g)"/><text x="64" y="455" fill="white" font-family="sans-serif" font-size="72">Mock Generation</text><text x="64" y="550" fill="#d9d1ff" font-family="monospace" font-size="30">${safeId}</text><text x="64" y="610" fill="#d9d1ff" font-family="monospace" font-size="30">output ${output}</text></svg>`;
  response.statusCode = 200;
  response.setHeader("content-type", "image/svg+xml; charset=utf-8");
  response.setHeader("cache-control", "public, max-age=3600");
  response.end(svg);
}

function boundedInt(value: string | null, fallback: number, min: number, max: number): number {
  const parsed = Number(value ?? fallback);
  return Number.isInteger(parsed) ? Math.max(min, Math.min(max, parsed)) : fallback;
}
function requiredString(value: unknown, field: string): string {
  if (typeof value !== "string" || !value.trim()) throw new GatewayError("INPUT_SCHEMA_INVALID", `${field} is required.`, 422);
  return value.trim();
}
function safeRequestId(value: string | string[] | undefined): string | undefined {
  const text = Array.isArray(value) ? value[0] : value;
  return text && /^[a-zA-Z0-9_-]{8,100}$/.test(text) ? text : undefined;
}
function safePath(value: string | undefined): string {
  try { return new URL(value ?? "/", baseUrl).pathname; } catch { return "/"; }
}
function log(level: "debug" | "info" | "warn" | "error", event: string, fields: Record<string, unknown>): void {
  const priorities = { debug: 10, info: 20, warn: 30, error: 40 };
  if (priorities[level] < priorities[config.LOG_LEVEL]) return;
  process.stdout.write(`${JSON.stringify({ timestamp: new Date().toISOString(), level, event, ...fields })}\n`);
}
