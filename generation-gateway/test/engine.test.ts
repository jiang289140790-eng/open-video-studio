import assert from "node:assert/strict";
import test from "node:test";
import { GenerationInputSchema, type GenerationInput } from "../src/domain.js";
import { GenerationEngine } from "../src/engine.js";
import { GatewayError } from "../src/errors.js";
import { MockProvider, RunPodProviderPlaceholder, type GenerationProvider } from "../src/provider.js";
import { MemoryGenerationRepository } from "../src/repository.js";
import { MemoryRegistryStore } from "../src/registry.js";
import { assertTransition } from "../src/state-machine.js";

const userA = "11111111-1111-4111-8111-111111111111";
const userB = "22222222-2222-4222-8222-222222222222";

function imageInput(overrides: Partial<GenerationInput> = {}): GenerationInput {
  return GenerationInputSchema.parse({
    media_type: "image",
    creation_mode: "text_to_image",
    prompt: "A cinematic product portrait for an adult audience",
    structured_options: {},
    reference_assets: [],
    aspect_ratio: "1:1",
    output_count: 1,
    subject_age_confirmed_adult: false,
    idempotency_key: "request-image-0001",
    client_context: { app: "open-video-studio" },
    ...overrides,
  });
}

function videoInput(overrides: Partial<GenerationInput> = {}): GenerationInput {
  return GenerationInputSchema.parse({
    media_type: "video",
    creation_mode: "text_to_video",
    prompt: "A six second product reveal",
    structured_options: {},
    reference_assets: [],
    aspect_ratio: "9:16",
    duration_seconds: 6,
    output_count: 1,
    subject_age_confirmed_adult: false,
    idempotency_key: "request-video-0001",
    client_context: { app: "ai-marketing-studio", platform: "TikTok" },
    ...overrides,
  });
}

function setup(options: { latencyMs?: number; failureRate?: number; timeoutRate?: number } = {}) {
  const repository = new MemoryGenerationRepository();
  const mock = new MockProvider({
    latencyMs: options.latencyMs ?? 5,
    failureRate: options.failureRate ?? 0,
    timeoutRate: options.timeoutRate ?? 0,
    assetBaseUrl: "http://mock.local",
  });
  const providers = new Map<string, GenerationProvider>([["mock", mock]]);
  const engine = new GenerationEngine(repository, providers, { pollIntervalMs: 1, maxExecutionMs: 1000 });
  return { repository, mock, engine };
}

async function terminal(engine: GenerationEngine, userId: string, jobId: string) {
  const deadline = Date.now() + 1500;
  while (Date.now() < deadline) {
    const job = await engine.get(userId, jobId);
    if (["completed", "failed", "cancelled"].includes(job.status)) return job;
    await new Promise((resolve) => setTimeout(resolve, 2));
  }
  throw new Error("job did not reach a terminal state");
}

test("image generation completes with a normalized mock asset and review", async () => {
  const { engine } = setup();
  const created = await engine.create(userA, imageInput());
  const job = await terminal(engine, userA, created.job.id);
  assert.equal(job.status, "completed");
  assert.equal(job.assets.length, 1);
  assert.equal(job.assets[0]?.media_type, "image");
  assert.equal(job.review?.status, "approved");
});

test("video generation completes with duration metadata", async () => {
  const { engine } = setup();
  const created = await engine.create(userA, videoInput());
  const job = await terminal(engine, userA, created.job.id);
  assert.equal(job.status, "completed");
  assert.equal(job.assets[0]?.duration_seconds, 6);
});

test("provider failure produces a stable error and terminal state", async () => {
  const { engine } = setup({ failureRate: 1 });
  const created = await engine.create(userA, imageInput({ idempotency_key: "failure-request-01" }));
  const job = await terminal(engine, userA, created.job.id);
  assert.equal(job.status, "failed");
  assert.equal(job.error_code, "PROVIDER_FAILED");
});

test("provider timeout simulation produces PROVIDER_TIMEOUT", async () => {
  const { engine } = setup({ timeoutRate: 1 });
  const created = await engine.create(userA, videoInput({ idempotency_key: "timeout-request-01" }));
  const job = await terminal(engine, userA, created.job.id);
  assert.equal(job.status, "failed");
  assert.equal(job.error_code, "PROVIDER_TIMEOUT");
});

test("user can cancel a queued or submitted job", async () => {
  const { engine } = setup({ latencyMs: 500 });
  const created = await engine.create(userA, imageInput({ idempotency_key: "cancel-request-01" }));
  const job = await engine.cancel(userA, created.job.id);
  assert.equal(job.status, "cancelled");
});

test("cancellation waits for an in-flight provider submission before cancelling", async () => {
  const repository = new MemoryGenerationRepository();
  const base = new MockProvider({
    latencyMs: 500,
    failureRate: 0,
    timeoutRate: 0,
    assetBaseUrl: "http://mock.local",
  });
  let cancelledProviderJobId: string | undefined;
  const delayed: GenerationProvider = {
    id: "mock",
    async submit(plan) {
      await new Promise((resolve) => setTimeout(resolve, 20));
      return base.submit(plan);
    },
    getStatus: (providerJobId) => base.getStatus(providerJobId),
    async cancel(providerJobId) {
      cancelledProviderJobId = providerJobId;
      await base.cancel(providerJobId);
    },
    normalizeResult: (raw) => base.normalizeResult(raw),
    healthCheck: () => base.healthCheck(),
  };
  const engine = new GenerationEngine(
    repository,
    new Map([["mock", delayed]]),
    { pollIntervalMs: 1, maxExecutionMs: 1000 },
  );
  const created = await engine.create(
    userA,
    imageInput({ idempotency_key: "cancel-during-submit-request-01" }),
  );
  const cancelled = await engine.cancel(userA, created.job.id);
  assert.equal(cancelled.status, "cancelled");
  assert.ok(cancelledProviderJobId);
});

test("failed job can be retried without reusing the same job", async () => {
  const { engine } = setup({ failureRate: 1 });
  const created = await engine.create(userA, imageInput({ idempotency_key: "retry-request-01" }));
  const failed = await terminal(engine, userA, created.job.id);
  const retried = await engine.retry(userA, failed.id);
  assert.notEqual(retried.id, failed.id);
  assert.equal(retried.retry_of_job_id, failed.id);
});

test("page refresh can recover a persisted job through a new engine instance", async () => {
  const { repository, mock, engine } = setup();
  const created = await engine.create(userA, imageInput({ idempotency_key: "refresh-request-01" }));
  await terminal(engine, userA, created.job.id);
  const recoveredEngine = new GenerationEngine(repository, new Map([["mock", mock]]), { pollIntervalMs: 1, maxExecutionMs: 1000 });
  const recovered = await recoveredEngine.get(userA, created.job.id);
  assert.equal(recovered.status, "completed");
});

test("duplicate submission returns the original job", async () => {
  const { engine } = setup();
  const input = imageInput({ idempotency_key: "duplicate-request-01" });
  const first = await engine.create(userA, input);
  const second = await engine.create(userA, input);
  assert.equal(second.duplicate, true);
  assert.equal(second.job.id, first.job.id);
});

test("duplicate provider webhook is idempotent", async () => {
  const { engine } = setup({ latencyMs: 200 });
  const created = await engine.create(userA, imageInput({ idempotency_key: "webhook-request-01" }));
  let job = await engine.get(userA, created.job.id);
  while (!job.provider_job_id) {
    await new Promise((resolve) => setTimeout(resolve, 2));
    job = await engine.get(userA, created.job.id);
  }
  const first = await engine.handleProviderWebhook("mock", "event-001", job.provider_job_id);
  const second = await engine.handleProviderWebhook("mock", "event-001", job.provider_job_id);
  assert.equal(first.duplicate, false);
  assert.equal(second.duplicate, true);
  await engine.cancel(userA, job.id);
});

test("completed provider work resumes idempotently from post processing", async () => {
  const { engine, repository } = setup({ latencyMs: 80 });
  const created = await engine.create(userA, imageInput({ idempotency_key: "resume-post-processing-01" }));
  let job = await engine.get(userA, created.job.id);
  while (!job.provider_job_id) {
    await new Promise((resolve) => setTimeout(resolve, 2));
    job = await engine.get(userA, created.job.id);
  }
  if (job.status === "submitted") job = await repository.transition(job.id, "running");
  if (job.status === "running") await repository.transition(job.id, "post_processing");
  const completed = await terminal(engine, userA, job.id);
  assert.equal(completed.status, "completed");
  assert.equal(completed.assets.length, 1);
});

test("another user cannot read or cancel a job", async () => {
  const { engine } = setup({ latencyMs: 500 });
  const created = await engine.create(userA, imageInput({ idempotency_key: "ownership-request-01" }));
  await assert.rejects(() => engine.get(userB, created.job.id), (error: unknown) =>
    error instanceof GatewayError && error.status === 404);
  await assert.rejects(() => engine.cancel(userB, created.job.id), (error: unknown) =>
    error instanceof GatewayError && error.status === 404);
  await engine.cancel(userA, created.job.id);
});

test("billing events enforce idempotency for reserve and release", async () => {
  const { repository } = setup();
  assert.equal(await repository.recordBilling(userA, "job-1", "reserve", 1, "billing:job-1:reserve"), true);
  assert.equal(await repository.recordBilling(userA, "job-1", "reserve", 1, "billing:job-1:reserve"), false);
  assert.equal(await repository.recordBilling(userA, "job-1", "release", 1, "billing:job-1:release"), true);
});

test("illegal state transitions are rejected", () => {
  assert.throws(() => assertTransition("draft", "completed"), (error: unknown) =>
    error instanceof GatewayError && error.code === "ILLEGAL_STATUS_TRANSITION");
});

test("no matching workflow fails during routing", async () => {
  const { engine } = setup();
  await assert.rejects(
    () => engine.create(userA, imageInput({
      media_type: "image",
      creation_mode: "text_to_video",
      idempotency_key: "no-workflow-request-01",
    })),
    (error: unknown) => error instanceof GatewayError && error.code === "NO_MATCHING_WORKFLOW",
  );
});

test("reference ownership is mandatory", async () => {
  const { engine } = setup();
  await assert.rejects(
    () => engine.create(userA, imageInput({
      creation_mode: "image_to_image",
      reference_assets: [{ asset_id: "asset_other", mime_type: "image/png", size_bytes: 100 }],
      idempotency_key: "bad-owner-request-01",
    })),
    (error: unknown) => error instanceof GatewayError && error.code === "INPUT_ASSET_NOT_OWNED",
  );
});

test("input schema rejects malformed requests", () => {
  const parsed = GenerationInputSchema.safeParse({ media_type: "audio", prompt: "" });
  assert.equal(parsed.success, false);
});

test("unavailable provider falls back to the next healthy provider", async () => {
  const repository = new MemoryGenerationRepository();
  const registry = new MemoryRegistryStore();
  await registry.patchWorkflow("mock-image-single-closeup-v1", {
    provider_ids: ["runpod-placeholder", "mock"],
  });
  const mock = new MockProvider({ latencyMs: 5, failureRate: 0, timeoutRate: 0, assetBaseUrl: "http://mock.local" });
  const providers = new Map<string, GenerationProvider>([
    ["runpod-placeholder", new RunPodProviderPlaceholder()],
    ["mock", mock],
  ]);
  const engine = new GenerationEngine(repository, providers, { pollIntervalMs: 1, maxExecutionMs: 1000 }, registry);
  const created = await engine.create(userA, imageInput({
    prompt: "close-up product portrait",
    idempotency_key: "fallback-provider-request-01",
  }));
  assert.equal(created.job.provider, "mock");
  assert.equal((await terminal(engine, userA, created.job.id)).status, "completed");
});

test("real-test routing fails closed instead of falling back to mock", async () => {
  const repository = new MemoryGenerationRepository();
  const mock = new MockProvider({ latencyMs: 5, failureRate: 0, timeoutRate: 0, assetBaseUrl: "http://mock.local" });
  const engine = new GenerationEngine(
    repository,
    new Map<string, GenerationProvider>([["mock", mock]]),
    {
      pollIntervalMs: 1,
      maxExecutionMs: 1000,
      testingWorkflowsEnabled: true,
      testingWorkflowId: "single-person-text-to-image-v1",
    },
  );
  await assert.rejects(
    () => engine.create(userA, imageInput({
      prompt: "Photorealistic adult woman in a studio",
      structured_options: {
        execution_mode: "real_test",
        people_count: 1,
        visual_style: "photorealistic",
      },
      idempotency_key: "real-provider-fail-closed-01",
      subject_age_confirmed_adult: true,
    })),
    (error: unknown) => error instanceof GatewayError && error.code === "PROVIDER_UNAVAILABLE",
  );
});

test("real-test routing is disabled by default", async () => {
  const { engine } = setup();
  await assert.rejects(
    () => engine.create(userA, imageInput({
      structured_options: {
        execution_mode: "real_test",
        people_count: 1,
        visual_style: "photorealistic",
      },
      idempotency_key: "real-provider-disabled-01",
    })),
    (error: unknown) => error instanceof GatewayError && error.code === "REAL_PROVIDER_NOT_ENABLED",
  );
});

test("adult content without explicit adult age confirmation is rejected", async () => {
  const { engine } = setup();
  await assert.rejects(
    () => engine.create(userA, imageInput({
      prompt: "explicit nude adult portrait",
      structured_options: { people_count: 1 },
      idempotency_key: "adult-policy-request-01",
    })),
    (error: unknown) => error instanceof GatewayError && error.code === "ADULT_AGE_CONFIRMATION_REQUIRED",
  );
});
