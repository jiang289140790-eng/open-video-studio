import assert from "node:assert/strict";
import test from "node:test";
import { GenerationInputSchema } from "../src/domain.js";
import { GenerationEngine } from "../src/engine.js";
import { GatewayError } from "../src/errors.js";
import {
  MOCK_REFERENCE_LORA_ID,
  MOCK_REFERENCE_WORKFLOW_ID,
  mockCharacterReferenceRemakeManifest,
} from "../src/mock-reference-workflow.js";
import { MockProvider } from "../src/provider.js";
import { analyzeReference } from "../src/reference-analysis.js";
import { MemoryRegistryStore } from "../src/registry.js";
import { MemoryGenerationRepository } from "../src/repository.js";
import { singleCharacterReferenceRemakeManifest } from "../src/reference-remake-workflow.js";

const userId = "3a000000-0000-4000-8000-000000000010";
const assetId = "phase3a-reference-asset";

test("Phase 3A mock workflow is isolated from the real Phase 3 workflow", () => {
  assert.deepEqual(mockCharacterReferenceRemakeManifest.provider_ids, ["mock"]);
  assert.equal(mockCharacterReferenceRemakeManifest.status, "production");
  assert.deepEqual(singleCharacterReferenceRemakeManifest.provider_ids, ["autodl"]);
  assert.equal(singleCharacterReferenceRemakeManifest.provider_ids.includes("mock"), false);
});

test("Mock Analyzer is explicit and still uses the fixed ReferenceAnalysis schema", () => {
  const analysis = analyzeReference({
    reference_asset_id: assetId,
    analyzer_mode: "mock",
    observations: { people_count: 1, pose: "standing", composition: "centered" },
  });
  assert.equal(analysis.analyzer_version, "mock-reference-analyzer/1.0.0");
  assert.equal(analysis.people_count, 1);
  assert.deepEqual(analysis.preserve_candidates, ["pose", "composition", "camera_angle", "shot_type"]);
});

test("confirmed analysis -> mock router -> character -> workflow plan -> mock job completes", async () => {
  const repository = new MemoryGenerationRepository();
  repository.seedOwnedAsset(userId, assetId);
  const registry = new MemoryRegistryStore();
  const character = await registry.ensureMockCharacter(userId);
  const provider = new MockProvider({
    latencyMs: 5,
    failureRate: 0,
    timeoutRate: 0,
    assetBaseUrl: "http://mock.local",
  });
  const engine = new GenerationEngine(
    repository,
    new Map([["mock", provider]]),
    { pollIntervalMs: 1, maxExecutionMs: 2000 },
    registry,
  );
  const record = await engine.analyzeReference(userId, {
    reference_asset_id: assetId,
    analyzer_mode: "mock",
    observations: {
      people_count: 1,
      shot_type: "full_body",
      pose: "standing",
      camera_angle: "eye_level",
      composition: "centered",
      scene: "studio",
      lighting: "soft",
      expression: "neutral",
      outfit: "dress",
      visible_body_region: "full_body",
    },
  });
  const confirmed = await engine.confirmReferenceAnalysis(userId, record.id, assetId, {
    ...record.analysis,
    scene: "confirmed studio",
  });
  const input = GenerationInputSchema.parse({
    media_type: "image",
    creation_mode: "image_to_image",
    prompt: "Create a mock reference remake plan.",
    structured_options: {
      execution_mode: "mock_reference",
      workflow_id: MOCK_REFERENCE_WORKFLOW_ID,
      people_count: 1,
      preserve_pose: true,
      preserve_composition: true,
      reference_analysis_id: record.id,
      reference_analysis_confirmed: true,
      reference_analysis: confirmed.confirmed_analysis,
      replace_scene: "editorial studio",
      lora_weight: 1,
    },
    reference_assets: [{
      asset_id: assetId,
      mime_type: "image/png",
      size_bytes: 1024,
      width: 768,
      height: 1024,
    }],
    character_id: character.id,
    aspect_ratio: "3:4",
    output_count: 2,
    subject_age_confirmed_adult: true,
    idempotency_key: "phase3a-reference-flow-001",
    client_context: { app: "open-video-studio" },
  });
  const created = await engine.create(userId, input);
  const completed = await waitForTerminal(repository, created.job.id);
  assert.equal(completed.status, "completed");
  assert.equal(completed.selected_workflow_id, MOCK_REFERENCE_WORKFLOW_ID);
  assert.equal(completed.provider, "mock");
  assert.equal(completed.generation_plan?.character_id, character.id);
  assert.equal(completed.generation_plan?.reference_asset_id, assetId);
  assert.deepEqual(completed.generation_plan?.selected_lora_ids, [MOCK_REFERENCE_LORA_ID]);
  assert.equal(completed.assets.length, 2);
});

test("mock reference job rejects an unpersisted confirmation", async () => {
  const repository = new MemoryGenerationRepository();
  repository.seedOwnedAsset(userId, assetId);
  const registry = new MemoryRegistryStore();
  const character = await registry.ensureMockCharacter(userId);
  const engine = new GenerationEngine(
    repository,
    new Map([["mock", new MockProvider({ latencyMs: 1, failureRate: 0, timeoutRate: 0, assetBaseUrl: "http://mock.local" })]]),
    { pollIntervalMs: 1, maxExecutionMs: 1000 },
    registry,
  );
  const analysis = analyzeReference({
    reference_asset_id: assetId,
    analyzer_mode: "mock",
    observations: { people_count: 1 },
  });
  const input = GenerationInputSchema.parse({
    media_type: "image",
    creation_mode: "image_to_image",
    prompt: "Reject forged confirmation.",
    structured_options: {
      execution_mode: "mock_reference",
      people_count: 1,
      preserve_pose: true,
      preserve_composition: true,
      reference_analysis_id: "missing-analysis",
      reference_analysis_confirmed: true,
      reference_analysis: analysis,
    },
    reference_assets: [{ asset_id: assetId, mime_type: "image/png", size_bytes: 1024 }],
    character_id: character.id,
    aspect_ratio: "1:1",
    output_count: 1,
    subject_age_confirmed_adult: true,
    client_context: { app: "open-video-studio" },
  });
  await assert.rejects(
    () => engine.create(userId, input),
    (error: unknown) => error instanceof GatewayError && error.code === "REFERENCE_ANALYSIS_CONFIRMATION_MISMATCH",
  );
});

test("registry changes archive revisions and reject invalid LoRA ranges", async () => {
  const registry = new MemoryRegistryStore();
  await registry.patchWorkflow(MOCK_REFERENCE_WORKFLOW_ID, { version: "1.0.1", status: "production" }, userId);
  assert.equal((await registry.listWorkflowVersions(MOCK_REFERENCE_WORKFLOW_ID)).length, 1);
  await assert.rejects(
    () => registry.patchLora(MOCK_REFERENCE_LORA_ID, { min_weight: 1.3, default_weight: 1, max_weight: 1.2 }, userId),
    (error: unknown) => error instanceof GatewayError && error.code === "LORA_WEIGHT_RANGE_INVALID",
  );
});

async function waitForTerminal(repository: MemoryGenerationRepository, jobId: string) {
  const deadline = Date.now() + 3000;
  while (Date.now() < deadline) {
    const job = await repository.getJob(jobId);
    if (job && ["completed", "failed", "cancelled"].includes(job.status)) return job;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error("mock generation did not reach a terminal state");
}
