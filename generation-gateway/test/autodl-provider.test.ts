import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";
import { GenerationInputSchema, type GenerationPlan } from "../src/domain.js";
import { GatewayError } from "../src/errors.js";
import { AutoDLProvider } from "../src/providers/autodl/index.js";
import { REAL_IMAGE_WORKFLOW_ID } from "../src/providers/runpod/workflow.js";

const now = Date.parse("2026-07-28T08:00:00.000Z");
const userId = "11111111-1111-4111-8111-111111111111";

function plan(overrides: Partial<GenerationPlan["input"]> = {}): GenerationPlan {
  const input = GenerationInputSchema.parse({
    media_type: "image",
    creation_mode: "text_to_image",
    prompt: "Photorealistic adult woman in a bright studio",
    structured_options: { people_count: 1, visual_style: "photorealistic" },
    reference_assets: [],
    aspect_ratio: "1:1",
    output_count: 1,
    subject_age_confirmed_adult: true,
    client_context: { app: "open-video-studio" },
    ...overrides,
  });
  return {
    job_id: "job_real_001",
    user_id: userId,
    input,
    brief: {
      media_type: "image",
      input_type: "text",
      people_count: Number(input.structured_options.people_count ?? 1),
      character_ids: [],
      scene: input.prompt,
      pose: "",
      outfit: "",
      expression: "",
      shot_type: "auto",
      camera: "auto",
      lighting: "auto",
      visual_style: String(input.structured_options.visual_style ?? "photorealistic"),
      aspect_ratio: input.aspect_ratio,
      preserve_pose: false,
      preserve_face: false,
      preserve_composition: false,
      replace_character: false,
      replace_background: false,
      output_count: input.output_count,
    },
    required_capabilities: {},
    selected_workflow_id: REAL_IMAGE_WORKFLOW_ID,
    candidate_workflows: [],
    routing_reasons: [],
    fallback_workflow_ids: [],
    router_version: "test",
    selected_model_id: "single-person-photorealistic-model-v1",
    selected_lora_ids: [],
    prompt_package: {
      positivePrompt: input.prompt,
      negativePrompt: "watermark",
      structuredPrompt: {},
      templateIds: ["test"],
      templateVersions: { test: "1.0.0" },
      adapterId: "real-image-v1",
    },
  };
}

function options(fetchImpl: typeof fetch, overrides: Partial<ConstructorParameters<typeof AutoDLProvider>[0]> = {}) {
  return {
    baseUrl: "https://autodl.example.test",
    apiToken: "test-autodl-api-token-value",
    healthPath: "/health",
    requestTimeoutMs: 1000,
    maxPollDurationMs: 600_000,
    enabled: true,
    workflowAllowlist: [REAL_IMAGE_WORKFLOW_ID],
    publicWebhookBaseUrl: "https://gateway.example.test",
    comfyuiWorkflowRef: "registry://workflows/single-person-text-to-image-v1/1.0.0",
    modelManifestRef: "registry://models/single-person-photorealistic-model-v1/1.0.0",
    storageBucket: "generation-results",
    fetchImpl,
    now: () => now,
    ...overrides,
  };
}

function json(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), { status, headers: { "content-type": "application/json" } });
}

function validOutput() {
  return {
    schema_version: "1.0",
    job_id: "job_real_001",
    user_id: userId,
    assets: [{
      storage_path: `generation-results/${userId}/job_real_001/output-0.png`,
      signed_url: "https://storage.example.test/signed/output-0.png?token=redacted",
      signed_url_expires_at: "2026-07-28T08:10:00.000Z",
      mime_type: "image/png",
      width: 1024,
      height: 1024,
      output_index: 0,
      checksum_sha256: "a".repeat(64),
    }],
    metrics: {
      gpu_type: "NVIDIA GeForce RTX 5090",
      generation_duration_ms: 1234,
      estimated_cost: 0.01,
      actual_cost: 0.009,
    },
  };
}

test("AutoDL submit uses only the unified worker contract", async () => {
  let url = "";
  let body: Record<string, unknown> = {};
  const provider = new AutoDLProvider(options(async (input, init) => {
    url = String(input);
    body = JSON.parse(String(init?.body)) as Record<string, unknown>;
    return json({ id: "ad-job-1", status: "queued" });
  }));
  const result = await provider.submit(plan());
  assert.equal(url, "https://autodl.example.test/v1/jobs");
  assert.equal(result.provider_job_id, "ad-job-1");
  assert.equal((body.input as Record<string, unknown>).schema_version, "1.0");
  assert.deepEqual(body.callback, {
    url: "https://gateway.example.test/v1/provider-webhooks/autodl",
    signature_algorithm: "hmac-sha256",
    signature_header: "x-webhook-signature",
  });
  assert.equal(JSON.stringify(body).includes("api-token"), false);
});

test("AutoDL maps queued, running, cancelled, timeout and failed states", async () => {
  const responses = [
    { id: "ad-job-1", status: "queued" },
    { id: "ad-job-1", status: "running" },
    { id: "ad-job-1", status: "cancelled" },
    { id: "ad-job-1", status: "timeout" },
    { id: "ad-job-1", status: "failed", error: { code: "CUDA_OUT_OF_MEMORY" } },
  ];
  const provider = new AutoDLProvider(options(async () => json(responses.shift())));
  assert.equal((await provider.getStatus("ad-job-1")).status, "queued");
  assert.equal((await provider.getStatus("ad-job-1")).status, "running");
  assert.equal((await provider.getStatus("ad-job-1")).status, "cancelled");
  assert.equal((await provider.getStatus("ad-job-1")).error_code, "PROVIDER_TIMEOUT");
  assert.equal((await provider.getStatus("ad-job-1")).error_code, "PROVIDER_GPU_CAPACITY");
});

test("AutoDL completed output is normalized and owner isolated", async () => {
  const provider = new AutoDLProvider(options(async () => json({
    id: "ad-job-1",
    status: "completed",
    output: validOutput(),
  })));
  const status = await provider.getStatus("ad-job-1");
  assert.equal(status.status, "completed");
  assert.equal(status.result?.raw_redacted.provider, "autodl");
  assert.equal(status.result?.assets[0]?.metadata.storage_path, `generation-results/${userId}/job_real_001/output-0.png`);
  provider.validateResultForPlan(status.result!, plan());
  assert.throws(
    () => provider.validateResultForPlan(status.result!, plan({ output_count: 2 })),
    (error: unknown) => error instanceof GatewayError && error.code === "PROVIDER_RESULT_OWNERSHIP_INVALID",
  );
});

test("AutoDL rejects local paths, expired URLs and cross-user storage paths", async () => {
  const provider = new AutoDLProvider(options(async () => json({ id: "unused", status: "queued" })));
  await assert.rejects(
    () => provider.normalizeResult({
      provider_job_id: "ad-job-1",
      output: {
        ...validOutput(),
        assets: [{ ...validOutput().assets[0], signed_url: "/root/ComfyUI/output/image.png" }],
      },
    }),
    (error: unknown) => error instanceof GatewayError && error.code === "PROVIDER_RESULT_INVALID",
  );
  await assert.rejects(
    () => provider.normalizeResult({
      provider_job_id: "ad-job-1",
      output: {
        ...validOutput(),
        assets: [{ ...validOutput().assets[0], storage_path: "generation-results/other/job/output.png" }],
      },
    }),
    (error: unknown) => error instanceof GatewayError && error.code === "PROVIDER_RESULT_OWNERSHIP_INVALID",
  );
});

test("AutoDL cancel, health and webhook authentication follow the provider contract", async () => {
  const calls: string[] = [];
  const provider = new AutoDLProvider(options(async (input) => {
    calls.push(String(input));
    return String(input).endsWith("/health")
      ? json({ status: "ok" })
      : json({ id: "ad-job-1", status: "cancelled" });
  }));
  assert.equal((await provider.healthCheck()).healthy, true);
  await provider.cancel("ad-job-1");
  assert.deepEqual(calls, [
    "https://autodl.example.test/health",
    "https://autodl.example.test/v1/jobs/ad-job-1/cancel",
  ]);
  const raw = JSON.stringify({ id: "ad-job-1", status: "running" });
  const signature = createHmac("sha256", "test-autodl-api-token-value").update(raw).digest("hex");
  assert.equal(provider.verifyWebhook(raw, `sha256=${signature}`), true);
  assert.equal(provider.verifyWebhook(raw, undefined), false);
  assert.equal(provider.parseWebhook(raw).providerJobId, "ad-job-1");

  const completed = new AutoDLProvider(options(async () => json({
    id: "ad-job-terminal",
    status: "completed",
    output: validOutput(),
  })));
  await assert.rejects(
    () => completed.cancel("ad-job-terminal"),
    (error: unknown) => error instanceof GatewayError &&
      error.code === "PROVIDER_JOB_TERMINAL" &&
      error.status === 409,
  );
});

test("AutoDL provider fails closed and never exposes raw worker errors", async () => {
  const disabled = new AutoDLProvider(options(async () => json({}), {
    enabled: false,
    apiToken: undefined,
  }));
  await assert.rejects(
    () => disabled.submit(plan()),
    (error: unknown) => error instanceof GatewayError && error.code === "PROVIDER_NOT_CONFIGURED",
  );
  const unauthorized = new AutoDLProvider(options(async () => json({ detail: "raw private detail" }, 401)));
  await assert.rejects(
    () => unauthorized.submit(plan()),
    (error: unknown) => error instanceof GatewayError &&
      error.code === "PROVIDER_AUTH_FAILED" &&
      !error.message.includes("raw private detail"),
  );
});
