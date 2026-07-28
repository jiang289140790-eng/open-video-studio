import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";
import { GenerationInputSchema, type GenerationPlan } from "../src/domain.js";
import { GatewayError } from "../src/errors.js";
import { RunPodProvider } from "../src/providers/runpod/runpod-provider.js";
import {
  mapPlanToWorkerInput,
  REAL_IMAGE_WORKFLOW_ID,
  singlePersonTextToImageManifest,
  withMockFallbackForContractTest,
} from "../src/providers/runpod/workflow.js";

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

function options(fetchImpl: typeof fetch, overrides: Partial<ConstructorParameters<typeof RunPodProvider>[0]> = {}) {
  return {
    apiKey: "test-api-key",
    endpointId: "endpoint-001",
    webhookSecret: "test-webhook-secret-value",
    requestTimeoutMs: 1000,
    maxPollDurationMs: 600_000,
    enabled: true,
    workflowAllowlist: [REAL_IMAGE_WORKFLOW_ID],
    publicWebhookBaseUrl: "https://gateway.example.test",
    comfyuiWorkflowRef: "config://workflows/single-person-text-to-image-v1.json",
    modelManifestRef: "config://models/single-person-photorealistic-v1.json",
    storageBucket: "generation-results",
    apiBaseUrl: "https://runpod.example.test/v2",
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
    }],
    metrics: {
      gpu_type: "GPU_TEST_FIXTURE",
      generation_duration_ms: 1234,
      estimated_cost: 0.01,
      actual_cost: 0.009,
    },
  };
}

test("workflow manifest is a testing-only provider-neutral workflow without LoRA or mock fallback", () => {
  assert.equal(singlePersonTextToImageManifest.status, "testing");
  assert.deepEqual(singlePersonTextToImageManifest.provider_ids, ["autodl", "runpod"]);
  assert.deepEqual(singlePersonTextToImageManifest.lora_binding_ids, []);
  assert.equal(singlePersonTextToImageManifest.capability.max_output_count, 4);
  assert.deepEqual(singlePersonTextToImageManifest.capability.supported_aspect_ratios, ["1:1", "4:5"]);
});

test("mock fallback helper is explicit and test-only", () => {
  const fixture = withMockFallbackForContractTest(singlePersonTextToImageManifest);
  assert.deepEqual(fixture.provider_ids, ["autodl", "runpod", "mock"]);
  assert.deepEqual(singlePersonTextToImageManifest.provider_ids, ["autodl", "runpod"]);
});

test("worker input contains config references and an owner-isolated storage prefix", () => {
  const input = mapPlanToWorkerInput(plan({ output_count: 4, aspect_ratio: "4:5" }), {
    comfyuiWorkflowRef: "config://workflow.json",
    modelManifestRef: "config://model.json",
    storageBucket: "generation-results",
  });
  assert.equal(input.request.output_count, 4);
  assert.equal(input.request.aspect_ratio, "4:5");
  assert.equal(input.storage.path_prefix, `generation-results/${userId}/job_real_001`);
  assert.equal(JSON.stringify(input).includes("runpod"), false);
});

test("worker mapping rejects reference images, multiple people and non-photorealistic styles", () => {
  assert.throws(
    () => mapPlanToWorkerInput(plan({ structured_options: { people_count: 2, visual_style: "photorealistic" } }), {
      comfyuiWorkflowRef: "config://workflow.json",
      modelManifestRef: "config://model.json",
      storageBucket: "generation-results",
    }),
    (error: unknown) => error instanceof GatewayError && error.code === "RUNPOD_WORKFLOW_INPUT_UNSUPPORTED",
  );
  assert.throws(
    () => mapPlanToWorkerInput(plan({ structured_options: { people_count: 1, visual_style: "anime" } }), {
      comfyuiWorkflowRef: "config://workflow.json",
      modelManifestRef: "config://model.json",
      storageBucket: "generation-results",
    }),
    (error: unknown) => error instanceof GatewayError && error.code === "RUNPOD_WORKFLOW_INPUT_UNSUPPORTED",
  );
});

test("submit uses the async run endpoint, signed worker callback contract and bounded execution policy", async () => {
  let requestUrl = "";
  let requestBody: Record<string, unknown> = {};
  const provider = new RunPodProvider(options(async (input, init) => {
    requestUrl = String(input);
    requestBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
    return json({ id: "rp-job-1", status: "IN_QUEUE" });
  }));
  const submitted = await provider.submit(plan());
  assert.equal(requestUrl, "https://runpod.example.test/v2/endpoint-001/run");
  assert.equal(submitted.provider_job_id, "rp-job-1");
  assert.equal(submitted.status, "queued");
  assert.deepEqual((requestBody.input as Record<string, unknown>).callback, {
    url: "https://gateway.example.test/v1/provider-webhooks/runpod",
    signature_algorithm: "hmac-sha256",
    signature_header: "x-webhook-signature",
  });
  assert.equal("webhook" in requestBody, false);
  assert.deepEqual(requestBody.policy, { executionTimeout: 600_000, ttl: 600_000 });
});

test("status maps queue, running, cancelled and timeout states", async () => {
  const responses = [
    { id: "rp-job-1", status: "IN_QUEUE" },
    { id: "rp-job-1", status: "IN_PROGRESS" },
    { id: "rp-job-1", status: "CANCELLED" },
    { id: "rp-job-1", status: "TIMED_OUT" },
  ];
  const provider = new RunPodProvider(options(async () => json(responses.shift())));
  assert.equal((await provider.getStatus("rp-job-1")).status, "queued");
  assert.equal((await provider.getStatus("rp-job-1")).status, "running");
  assert.equal((await provider.getStatus("rp-job-1")).status, "cancelled");
  const timedOut = await provider.getStatus("rp-job-1");
  assert.equal(timedOut.status, "failed");
  assert.equal(timedOut.error_code, "PROVIDER_TIMEOUT");
});

test("completed output is normalized without inline image transfer", async () => {
  const provider = new RunPodProvider(options(async () => json({
    id: "rp-job-1",
    status: "COMPLETED",
    output: validOutput(),
  })));
  const completed = await provider.getStatus("rp-job-1");
  assert.equal(completed.status, "completed");
  assert.equal(completed.result?.assets[0]?.job_id, "job_real_001");
  assert.equal(completed.result?.assets[0]?.metadata.storage_path, `generation-results/${userId}/job_real_001/output-0.png`);
  assert.equal(completed.result?.raw_redacted.gpu_type, "GPU_TEST_FIXTURE");
  assert.equal(completed.result?.raw_redacted.provider_attempt_id, "rp-job-1");
});

test("empty, malformed, expired and cross-user outputs are rejected", async () => {
  const provider = new RunPodProvider(options(async () => json({ id: "unused", status: "IN_QUEUE" })));
  await assert.rejects(
    () => provider.normalizeResult({ provider_job_id: "rp", output: { ...validOutput(), assets: [] } }),
    (error: unknown) => error instanceof GatewayError && error.code === "PROVIDER_RESULT_INVALID",
  );
  await assert.rejects(
    () => provider.normalizeResult({
      provider_job_id: "rp",
      output: {
        ...validOutput(),
        assets: [{ ...validOutput().assets[0], storage_path: "generation-results/another-user/job/output.png" }],
      },
    }),
    (error: unknown) => error instanceof GatewayError && error.code === "PROVIDER_RESULT_OWNERSHIP_INVALID",
  );
  await assert.rejects(
    () => provider.normalizeResult({
      provider_job_id: "rp",
      output: {
        ...validOutput(),
        assets: [{ ...validOutput().assets[0], signed_url_expires_at: "2026-07-28T07:59:00.000Z" }],
      },
    }),
    (error: unknown) => error instanceof GatewayError && error.code === "PROVIDER_RESULT_OWNERSHIP_INVALID",
  );
});

test("normalized output must still match the submitted plan owner, job and output count", async () => {
  const provider = new RunPodProvider(options(async () => json({ id: "unused", status: "IN_QUEUE" })));
  const result = await provider.normalizeResult({ provider_job_id: "rp", output: validOutput() });
  const duplicate = await provider.normalizeResult({ provider_job_id: "rp", output: validOutput() });
  assert.equal(result.assets[0]?.id, duplicate.assets[0]?.id);
  provider.validateResultForPlan(result, plan());
  assert.throws(
    () => provider.validateResultForPlan(result, plan({ output_count: 2 })),
    (error: unknown) => error instanceof GatewayError && error.code === "PROVIDER_RESULT_OWNERSHIP_INVALID",
  );
});

test("cancel calls the provider cancellation endpoint", async () => {
  let url = "";
  let method = "";
  const provider = new RunPodProvider(options(async (input, init) => {
    url = String(input);
    method = String(init?.method);
    return json({ id: "rp-job-1", status: "CANCELLED" });
  }));
  await provider.cancel("rp-job-1");
  assert.equal(url, "https://runpod.example.test/v2/endpoint-001/cancel/rp-job-1");
  assert.equal(method, "POST");
});

test("health check is false when disabled and redacts credentials", async () => {
  const provider = new RunPodProvider(options(async () => json({ workers: {} }), {
    enabled: false,
    apiKey: undefined,
  }));
  const health = await provider.healthCheck();
  assert.equal(health.healthy, false);
  assert.equal(JSON.stringify(health).includes("test-api-key"), false);
});

test("health check calls the endpoint health route when configured", async () => {
  let url = "";
  const provider = new RunPodProvider(options(async (input) => {
    url = String(input);
    return json({ workers: { idle: 1 } });
  }));
  assert.equal((await provider.healthCheck()).healthy, true);
  assert.equal(url, "https://runpod.example.test/v2/endpoint-001/health");
});

test("webhook verification is HMAC timing-safe and rejects missing signatures", () => {
  const provider = new RunPodProvider(options(async () => json({})));
  const raw = JSON.stringify({ id: "rp-job-1", status: "COMPLETED" });
  const signature = createHmac("sha256", "test-webhook-secret-value").update(raw).digest("hex");
  assert.equal(provider.verifyWebhook(raw, `sha256=${signature}`), true);
  assert.equal(provider.verifyWebhook(raw, undefined), false);
  assert.equal(provider.verifyWebhook(`${raw} `, signature), false);
});

test("worker webhook payload is parsed into an idempotent event identity", () => {
  const provider = new RunPodProvider(options(async () => json({})));
  const raw = JSON.stringify({ id: "rp-job-1", status: "RUNNING" });
  const first = provider.parseWebhook(raw);
  const duplicate = provider.parseWebhook(raw);
  const later = provider.parseWebhook(JSON.stringify({ id: "rp-job-1", status: "COMPLETED", output: validOutput() }));
  assert.equal(first.providerJobId, "rp-job-1");
  assert.equal(first.eventId, duplicate.eventId);
  assert.notEqual(first.eventId, later.eventId);
});

test("HTTP and worker errors map to stable errors without raw provider details", async () => {
  const unauthorized = new RunPodProvider(options(async () => json({ error: "secret raw detail" }, 401)));
  await assert.rejects(
    () => unauthorized.submit(plan()),
    (error: unknown) => error instanceof GatewayError &&
      error.code === "PROVIDER_AUTH_FAILED" &&
      !error.message.includes("secret raw detail"),
  );
  const failedProvider = new RunPodProvider(options(async () => json({
    id: "rp-job-1",
    status: "FAILED",
    error: "CUDA out of memory at /private/worker/path",
  })));
  const failed = await failedProvider.getStatus("rp-job-1");
  assert.equal(failed.error_code, "PROVIDER_GPU_CAPACITY");
  assert.equal(failed.error_message?.includes("/private/worker/path"), false);
});

test("unconfigured provider fails closed and never silently falls back", async () => {
  const provider = new RunPodProvider(options(async () => json({}), {
    enabled: false,
    apiKey: undefined,
    endpointId: undefined,
  }));
  await assert.rejects(
    () => provider.submit(plan()),
    (error: unknown) => error instanceof GatewayError && error.code === "PROVIDER_NOT_CONFIGURED",
  );
});
