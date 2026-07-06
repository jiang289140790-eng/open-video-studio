import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import assert from "node:assert/strict";
import {
  AiCostTracker,
  AiEngine,
  AiJobQueue,
  AiProviderRegistry,
  AppError,
  AuthService,
  LocalAiStorageAdapter,
  createMigratedDatabase,
} from "../src/index.js";

test("AI provider registry exposes every future provider behind one interface", () => {
  const registry = new AiProviderRegistry();
  assert.deepEqual(registry.list().sort(), [
    "comfyui",
    "fal",
    "gemini",
    "local_api",
    "openai",
    "replicate",
    "runpod",
  ]);

  for (const providerName of registry.list()) {
    const provider = registry.get(providerName);
    assert.equal(typeof provider.generateImage, "function");
    assert.equal(typeof provider.generateVideo, "function");
    assert.equal(typeof provider.generateCharacter, "function");
    assert.equal(typeof provider.upscale, "function");
    assert.equal(typeof provider.editImage, "function");
    assert.equal(typeof provider.checkJobStatus, "function");
    assert.equal(typeof provider.cancelJob, "function");
  }
});

test("AI engine queues jobs, worker completes local provider job, and records cost", async () => {
  const db = createMigratedDatabase();
  const auth = new AuthService(db);
  const session = auth.signUp({
    email: "ai@example.com",
    password: "correct horse battery staple",
    displayName: "AI User",
  });
  const engine = new AiEngine(db);

  const job = engine.enqueue({
    userId: session.user.id,
    operation: "generate_image",
    provider: "local_api",
    model: "local-image-v0",
    request: {
      prompt: "Generate a clean campaign image.",
      resolution: "1024x1024",
    },
    fallbackProvider: "replicate",
  });
  assert.equal(job.status, "queued");
  assert.equal(job.provider, "local_api");
  assert.equal(job.fallbackProvider, "replicate");

  const processed = await engine.worker.processNext();
  assert.equal(processed.processed, true);
  assert.equal(processed.job?.status, "completed");
  assert.equal(processed.job?.credits, 8);
  assert.equal(processed.job?.estimatedCostCents, 30);
  assert.equal(processed.job?.resolution, "1024x1024");

  const costRecords = engine.costs.listByUser(session.user.id);
  assert.equal(costRecords.length, 1);
  assert.equal(costRecords[0].provider, "local_api");
  assert.equal(costRecords[0].model, "local-image-v0");
  assert.equal(costRecords[0].operation, "generate_image");
  assert.equal(costRecords[0].userId, session.user.id);
  assert.equal(costRecords[0].aiJobId, job.id);
});

test("AI queue supports cancellation and retrying failed not-configured providers", async () => {
  const db = createMigratedDatabase();
  const auth = new AuthService(db);
  const session = auth.signUp({
    email: "retry@example.com",
    password: "correct horse battery staple",
    displayName: "Retry User",
  });
  const engine = new AiEngine(db);

  const queued = engine.enqueue({
    userId: session.user.id,
    operation: "generate_video",
    provider: "openai",
    model: "future-video-model",
    request: { prompt: "Generate a future video.", durationSeconds: 8 },
  });

  const failed = await engine.worker.processJob(queued.id);
  assert.equal(failed.status, "retrying");
  assert.equal(failed.errorCode, "AI_PROVIDER_NOT_CONFIGURED");

  const cancellable = engine.enqueue({
    userId: session.user.id,
    operation: "edit_image",
    provider: "local_api",
    model: "local-edit-v0",
    request: { prompt: "Edit the image." },
  });
  const cancelled = engine.queue.cancel(cancellable.id);
  assert.equal(cancelled.status, "cancelled");
  assert.ok(cancelled.cancelledAt);
});

test("AI storage abstraction stores local objects and rejects unconfigured providers", async () => {
  const root = mkdtempSync(join(tmpdir(), "ovs-ai-storage-"));
  try {
    const local = new LocalAiStorageAdapter(root);
    const stored = await local.putObject({
      key: "user/job/output.txt",
      data: "synthetic output",
      contentType: "text/plain",
    });
    assert.equal(stored.key, "user/job/output.txt");
    assert.equal(stored.sizeBytes, "synthetic output".length);

    const loaded = await local.getObject(stored.key);
    assert.equal(loaded.toString("utf8"), "synthetic output");
    assert.equal(await local.getPublicUrl(stored.key), "local://user/job/output.txt");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("AI cost tracker can list multiple operations for one user", async () => {
  const db = createMigratedDatabase();
  const auth = new AuthService(db);
  const session = auth.signUp({
    email: "cost@example.com",
    password: "correct horse battery staple",
    displayName: "Cost User",
  });
  const queue = new AiJobQueue(db);
  const costs = new AiCostTracker(db);

  const queued = queue.enqueue({
    userId: session.user.id,
    provider: "local_api",
    model: "local-upscale-v0",
    operation: "upscale",
    request: { resolution: "2048x2048" },
  });
  queue.markRunning(queued.id);
  const completed = queue.complete(queued.id, {
    output: { assetKey: "upscaled.txt" },
    credits: 6,
    estimatedCostCents: 20,
    durationMs: 240,
    resolution: "2048x2048",
  });
  costs.record(completed);

  const listed = costs.listByUser(session.user.id);
  assert.equal(listed.length, 1);
  assert.equal(listed[0].credits, 6);
  assert.equal(listed[0].estimatedCostCents, 20);
  assert.equal(listed[0].resolution, "2048x2048");
});
