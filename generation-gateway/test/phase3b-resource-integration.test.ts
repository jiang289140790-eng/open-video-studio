import assert from "node:assert/strict";
import test from "node:test";
import { loadConfig } from "../src/config.js";
import { GenerationInputSchema, type GenerationPlan } from "../src/domain.js";
import { GatewayError } from "../src/errors.js";
import {
  assertLoraRegistryPromotionReady,
  buildPhase3BChecklist,
  createPhase3BDryRun,
  validateLoraImport,
  validateWorkflowImport,
} from "../src/phase3b-resource-integration.js";
import { parseCreativeBrief } from "../src/planning.js";
import { analyzeReference } from "../src/reference-analysis.js";
import {
  REFERENCE_REMAKE_LORA_ID,
  REFERENCE_REMAKE_MODEL_ID,
  REFERENCE_REMAKE_WORKFLOW_ID,
} from "../src/reference-remake-workflow.js";

const sha = "a".repeat(64);
const observedAt = "2026-07-28T12:00:00.000Z";

function loraManifest(status: "draft" | "testing" | "production" = "testing") {
  return {
    id: REFERENCE_REMAKE_LORA_ID,
    name: "Contract fixture only",
    version: "1.0.0",
    file_reference: "storage://generation-resources/lora/character.safetensors",
    sha256: sha,
    file_size_bytes: 1024,
    base_architecture: "flux",
    compatible_model_ids: [REFERENCE_REMAKE_MODEL_ID],
    trigger_words: ["character_token"],
    default_weight: 1,
    min_weight: 0.6,
    max_weight: 1.2,
    source: "user-supplied-contract-fixture",
    license: "test-only",
    status,
  };
}

function loraObservation() {
  return { exists: true, sha256: sha, size_bytes: 1024, verified_at: observedAt, verifier: "worker" as const };
}

function workflowImport() {
  const workflow = {
    "1": { class_type: "UnetLoaderGGUF", inputs: { unet_name: "model.gguf" } },
    "2": { class_type: "LoraLoader", inputs: { lora_name: "character.safetensors", strength_model: 1 } },
    "3": { class_type: "LoadImage", inputs: { image: "reference.png" } },
    "4": { class_type: "CLIPTextEncode", inputs: { text: "" } },
    "5": { class_type: "CLIPTextEncode", inputs: { text: "" } },
    "6": { class_type: "KSampler", inputs: { seed: 1 } },
    "7": { class_type: "EmptyLatentImage", inputs: { width: 768, height: 1024 } },
    "8": { class_type: "SaveImage", inputs: { filename_prefix: "output" } },
  };
  return {
    workflow_id: REFERENCE_REMAKE_WORKFLOW_ID,
    version: "1.0.0",
    model_id: REFERENCE_REMAKE_MODEL_ID,
    lora_id: REFERENCE_REMAKE_LORA_ID,
    workflow,
    node_mapping: {
      schema_version: "1.0",
      workflow_id: REFERENCE_REMAKE_WORKFLOW_ID,
      workflow_version: "1.0.0",
      nodes: {
        model: { node_id: "1", input_name: "unet_name", expected_class_type: "UnetLoaderGGUF" },
        lora_model: { node_id: "2", input_name: "lora_name", expected_class_type: "LoraLoader" },
        lora_strength: { node_id: "2", input_name: "strength_model", expected_class_type: "LoraLoader" },
        reference_image: { node_id: "3", input_name: "image", expected_class_type: "LoadImage" },
        positive_prompt: { node_id: "4", input_name: "text", expected_class_type: "CLIPTextEncode" },
        negative_prompt: { node_id: "5", input_name: "text", expected_class_type: "CLIPTextEncode" },
        seed: { node_id: "6", input_name: "seed", expected_class_type: "KSampler" },
        width: { node_id: "7", input_name: "width", expected_class_type: "EmptyLatentImage" },
        height: { node_id: "7", input_name: "height", expected_class_type: "EmptyLatentImage" },
        output: { node_id: "8", input_name: "filename_prefix", expected_class_type: "SaveImage" },
      },
    },
  };
}

function plan(): GenerationPlan {
  const analysis = analyzeReference({
    reference_asset_id: "reference_asset_1",
    observations: { people_count: 1, pose: "standing" },
  });
  const input = GenerationInputSchema.parse({
    media_type: "image",
    creation_mode: "image_to_image",
    prompt: "A private prompt that must never be returned in full.",
    structured_options: {
      people_count: 1,
      preserve_pose: true,
      preserve_composition: true,
      reference_analysis_confirmed: true,
      reference_analysis: analysis,
      seed: 42,
    },
    reference_assets: [{ asset_id: "reference_asset_1", mime_type: "image/png", size_bytes: 1024 }],
    character_id: "character_1",
    aspect_ratio: "3:4",
    output_count: 2,
    subject_age_confirmed_adult: true,
    client_context: { app: "open-video-studio" },
  });
  return {
    job_id: "job_phase3b",
    user_id: "11111111-1111-4111-8111-111111111111",
    input,
    brief: parseCreativeBrief(input),
    required_capabilities: {},
    selected_workflow_id: REFERENCE_REMAKE_WORKFLOW_ID,
    candidate_workflows: [],
    routing_reasons: [],
    fallback_workflow_ids: [],
    router_version: "phase3b-test",
    selected_model_id: REFERENCE_REMAKE_MODEL_ID,
    selected_lora_ids: [REFERENCE_REMAKE_LORA_ID],
    prompt_package: {
      positivePrompt: input.prompt,
      negativePrompt: "negative private prompt",
      structuredPrompt: {},
      templateIds: ["test"],
      templateVersions: { test: "1.0.0" },
      adapterId: "test",
    },
    reference_asset_id: "reference_asset_1",
    character_id: "character_1",
    lora_bindings: [{
      lora_id: REFERENCE_REMAKE_LORA_ID,
      version: "1.0.0",
      weight: 0.9,
      trigger_words: ["character_token"],
    }],
  };
}

test("LoRA import requires matching existence, SHA-256, size, architecture and model readiness", () => {
  const result = validateLoraImport(loraManifest(), loraObservation(), [{
    id: REFERENCE_REMAKE_MODEL_ID,
    base_architecture: "flux",
    ready: true,
  }]);
  assert.equal(result.valid, true);
});

test("LoRA import rejects a missing required field", () => {
  const manifest = loraManifest() as Record<string, unknown>;
  delete manifest.license;
  assert.equal(validateLoraImport(manifest, loraObservation()).valid, false);
});

test("LoRA import rejects observed SHA and size mismatches", () => {
  const result = validateLoraImport(loraManifest(), {
    ...loraObservation(),
    sha256: "b".repeat(64),
    size_bytes: 2048,
  });
  assert.deepEqual(result.issues.map((item) => item.code).sort(), ["LORA_FILE_SIZE_MISMATCH", "LORA_SHA256_MISMATCH", "LORA_MODEL_NOT_READY"].sort());
});

test("registry promotion fails closed when validated resource fields are absent", () => {
  assert.throws(
    () => assertLoraRegistryPromotionReady({ ...loraManifest(), status: "testing" }),
    (error: unknown) => error instanceof GatewayError && error.code === "LORA_RESOURCE_NOT_READY",
  );
});

test("Workflow import validates every required mapped node", () => {
  assert.equal(validateWorkflowImport(workflowImport()).valid, true);
});

test("Workflow import rejects duplicate mapping targets", () => {
  const input = workflowImport();
  input.node_mapping.nodes.negative_prompt = { ...input.node_mapping.nodes.positive_prompt };
  assert.equal(validateWorkflowImport(input).issues.some((item) => item.code === "WORKFLOW_MAPPING_DUPLICATE"), true);
});

test("Workflow import rejects missing nodes and local secret paths", () => {
  const input = workflowImport();
  input.node_mapping.nodes.reference_image.node_id = "404";
  input.workflow["1"]!.inputs.unet_name = "C:\\models\\private.gguf";
  const codes = validateWorkflowImport(input).issues.map((item) => item.code);
  assert.equal(codes.includes("WORKFLOW_NODE_MISSING"), true);
  assert.equal(codes.includes("WORKFLOW_LOCAL_SECRET_PATH"), true);
});

test("resource checklist stays READY_FOR_RESOURCES and blocks allowlist when resources are absent", () => {
  const checklist = buildPhase3BChecklist({
    models: [],
    loras: [],
    workflows: [],
    storageVerified: false,
  });
  assert.equal(checklist.status, "READY_FOR_RESOURCES");
  assert.equal(checklist.provider_allowlist_eligible, false);
  assert.equal(checklist.autodl_worker, "offline");
});

test("resource checklist can become READY_FOR_DRY_RUN from persisted validation evidence", () => {
  const mapping = workflowImport().node_mapping;
  const manifest = loraManifest();
  const checklist = buildPhase3BChecklist({
    targetModelId: REFERENCE_REMAKE_MODEL_ID,
    targetLoraId: REFERENCE_REMAKE_LORA_ID,
    targetWorkflowId: REFERENCE_REMAKE_WORKFLOW_ID,
    models: [{
      id: REFERENCE_REMAKE_MODEL_ID,
      base_architecture: "flux",
      status: "testing",
      checksum: "c".repeat(64),
      storage_path: "storage://generation-resources/models/base.gguf",
      license_metadata: { license_status: "ready" },
    }],
    loras: [{
      ...manifest,
      storage_path: manifest.file_reference,
      file_exists: true,
      observed_sha256: manifest.sha256,
      observed_size_bytes: manifest.file_size_bytes,
      validation_status: "ready",
      validation_verifier: "worker",
      validated_at: observedAt,
    }],
    workflows: [{
      id: REFERENCE_REMAKE_WORKFLOW_ID,
      workflow_import_status: "ready",
      workflow_json_sha256: "d".repeat(64),
      node_mapping: mapping,
      node_mapping_sha256: "e".repeat(64),
    }],
    workerHealth: { healthy: true },
    storageVerified: true,
  });
  assert.equal(checklist.status, "READY_FOR_DRY_RUN");
  assert.equal(checklist.provider_allowlist_eligible, true);
  assert.deepEqual(checklist.blocking_reasons, []);
});

test("configuration rejects the real reference allowlist without a completed resource attestation", () => {
  assert.throws(
    () => loadConfig({ REAL_PROVIDER_ALLOWLIST: REFERENCE_REMAKE_WORKFLOW_ID }),
    /cannot be allowlisted/,
  );
  assert.equal(loadConfig({
    REAL_PROVIDER_ALLOWLIST: REFERENCE_REMAKE_WORKFLOW_ID,
    PHASE3B_RESOURCES_READY: "true",
  }).PHASE3B_RESOURCES_READY, true);
});

test("dry run maps all nodes without submitting or returning prompts, URLs, secrets, or local paths", () => {
  const result = createPhase3BDryRun({
    plan: plan(),
    base_model: {
      id: REFERENCE_REMAKE_MODEL_ID,
      base_architecture: "flux",
      file_reference: "storage://generation-resources/models/base.gguf",
      sha256: "c".repeat(64),
      size_bytes: 4096,
      exists: true,
      license: "test-only",
      status: "testing",
    },
    lora: loraManifest(),
    lora_observation: loraObservation(),
    workflow_import: workflowImport(),
    worker: { provider_id: "autodl", health: "ready", checked_at: observedAt },
    storage: { bucket: "generation-results", upload_verified: true, verified_at: observedAt },
  });
  const serialized = JSON.stringify(result);
  assert.equal(result.submitted_to_provider, false);
  assert.equal(result.status, "DRY_RUN_COMPLETE");
  assert.equal(serialized.includes("A private prompt"), false);
  assert.equal(serialized.includes("signed"), false);
  assert.equal(serialized.includes("C:\\"), false);
  assert.equal(serialized.includes("/root/"), false);
  assert.equal(serialized.includes("service_role"), false);
});

test("dry run rejects mismatched GenerationPlan resources", () => {
  const input = {
    plan: { ...plan(), selected_model_id: "wrong-model" },
    base_model: {
      id: REFERENCE_REMAKE_MODEL_ID,
      base_architecture: "flux",
      file_reference: "storage://generation-resources/models/base.gguf",
      sha256: "c".repeat(64),
      size_bytes: 4096,
      exists: true,
      license: "test-only",
      status: "testing",
    },
    lora: loraManifest(),
    lora_observation: loraObservation(),
    workflow_import: workflowImport(),
    worker: { provider_id: "autodl", health: "ready", checked_at: observedAt },
    storage: { bucket: "generation-results", upload_verified: true, verified_at: observedAt },
  };
  assert.throws(
    () => createPhase3BDryRun(input),
    (error: unknown) => error instanceof GatewayError && error.code === "PHASE3B_DRY_RUN_BLOCKED",
  );
});
