import assert from "node:assert/strict";
import test from "node:test";
import { GenerationInputSchema, type GenerationPlan } from "../src/domain.js";
import { GatewayError } from "../src/errors.js";
import { parseCreativeBrief, validatePolicy } from "../src/planning.js";
import {
  analyzeReference,
  assertConfirmedSinglePersonReference,
  ReferenceAnalysisSchema,
} from "../src/reference-analysis.js";
import {
  mapReferenceRemakePlanToWorkerInput,
  REFERENCE_REMAKE_LORA_ID,
  REFERENCE_REMAKE_MODEL_ID,
  REFERENCE_REMAKE_WORKFLOW_ID,
  singleCharacterReferenceRemakeManifest,
} from "../src/reference-remake-workflow.js";

const userId = "11111111-1111-4111-8111-111111111111";
const assetId = "reference_asset_1";

function phase3Input() {
  const analysis = analyzeReference({
    reference_asset_id: assetId,
    observations: {
      people_count: 1,
      shot_type: "full_body",
      pose: "standing",
      camera_angle: "eye_level",
      composition: "centered",
      scene: "bedroom",
      lighting: "soft",
      expression: "neutral",
      outfit: "dress",
      visible_body_region: "full_body",
    },
  });
  return GenerationInputSchema.parse({
    media_type: "image",
    creation_mode: "image_to_image",
    prompt: "Replace the scene while retaining pose and composition.",
    structured_options: {
      execution_mode: "real_test",
      workflow_id: REFERENCE_REMAKE_WORKFLOW_ID,
      people_count: 1,
      preserve_pose: true,
      preserve_composition: true,
      reference_analysis_confirmed: true,
      reference_analysis: analysis,
      replace_scene: "studio",
    },
    reference_assets: [{
      asset_id: assetId,
      mime_type: "image/png",
      size_bytes: 1024,
      width: 768,
      height: 1024,
    }],
    character_id: "character_1",
    aspect_ratio: "3:4",
    output_count: 2,
    subject_age_confirmed_adult: true,
    client_context: { app: "open-video-studio" },
  });
}

function phase3Plan(): GenerationPlan {
  const input = phase3Input();
  return {
    job_id: "job_phase3",
    user_id: userId,
    input,
    brief: parseCreativeBrief(input),
    required_capabilities: {},
    selected_workflow_id: REFERENCE_REMAKE_WORKFLOW_ID,
    candidate_workflows: [],
    routing_reasons: [],
    fallback_workflow_ids: [],
    router_version: "test",
    selected_model_id: REFERENCE_REMAKE_MODEL_ID,
    selected_lora_ids: [REFERENCE_REMAKE_LORA_ID],
    reference_asset_id: assetId,
    character_id: "character_1",
    workflow_id: REFERENCE_REMAKE_WORKFLOW_ID,
    model_id: REFERENCE_REMAKE_MODEL_ID,
    lora_bindings: [{
      lora_id: REFERENCE_REMAKE_LORA_ID,
      version: "1.0.0",
      weight: 0.9,
      trigger_words: ["character_token"],
    }],
    preserve_pose: true,
    preserve_composition: true,
    replace_scene: "studio",
    outfit_override: null,
    expression_override: null,
    aspect_ratio: "3:4",
    output_count: 2,
    timeout_ms: 600_000,
    runtime: {
      reference_input_signed_url: "https://storage.example/signed-input?token=redacted",
    },
  } as GenerationPlan;
}

test("reference analyzer always returns the fixed runtime-validated schema", () => {
  const analysis = analyzeReference({
    reference_asset_id: assetId,
    observations: { people_count: 1, pose: "sitting" },
  });
  assert.equal(ReferenceAnalysisSchema.safeParse(analysis).success, true);
  assert.equal(analysis.analyzer_version, "rules-reference-analyzer/1.0.0");
  assert.equal(analysis.confidence, 0.35);
});

test("reference-remake policy requires exactly one confirmed adult person", () => {
  const input = phase3Input();
  validatePolicy({
    input,
    brief: parseCreativeBrief(input),
    userId,
    ownedAssetIds: new Set([assetId]),
  });
  assert.throws(
    () => assertConfirmedSinglePersonReference({
      ...input.structured_options.reference_analysis as ReturnType<typeof analyzeReference>,
      people_count: 2,
    }),
    (error: unknown) => error instanceof GatewayError && error.code === "REFERENCE_PEOPLE_COUNT_UNSUPPORTED",
  );
});

test("reference-remake manifest is testing-only, AutoDL-only and has no mock fallback", () => {
  assert.equal(singleCharacterReferenceRemakeManifest.status, "testing");
  assert.deepEqual(singleCharacterReferenceRemakeManifest.provider_ids, ["autodl"]);
  assert.deepEqual(singleCharacterReferenceRemakeManifest.model_binding_ids, [REFERENCE_REMAKE_MODEL_ID]);
  assert.deepEqual(singleCharacterReferenceRemakeManifest.lora_binding_ids, [REFERENCE_REMAKE_LORA_ID]);
  assert.equal(singleCharacterReferenceRemakeManifest.capability.supports_pose_preservation, true);
});

test("reference-remake worker contract keeps signed input transient and output user-isolated", () => {
  const mapped = mapReferenceRemakePlanToWorkerInput(phase3Plan(), {
    workflowRegistryRef: "registry://workflows/single-character-reference-remake-v1/1.0.0",
    storageBucket: "generation-results",
  });
  assert.equal(mapped.storage.input_signed_url.startsWith("https://"), true);
  assert.equal(mapped.storage.output_path_prefix, `generation-results/${userId}/job_phase3`);
  assert.equal(mapped.request.reference_asset_id, assetId);
  assert.equal(mapped.request.preserve_pose, true);
  assert.equal(mapped.request.preserve_composition, true);
  assert.equal(mapped.lora.lora_id, REFERENCE_REMAKE_LORA_ID);
  assert.equal(JSON.stringify(mapped).includes("/root/"), false);
});

test("reference-remake worker contract fails closed without a transient signed URL", () => {
  const plan = phase3Plan() as GenerationPlan & { runtime?: unknown };
  delete plan.runtime;
  assert.throws(
    () => mapReferenceRemakePlanToWorkerInput(plan, {
      workflowRegistryRef: "registry://workflows/single-character-reference-remake-v1/1.0.0",
      storageBucket: "generation-results",
    }),
    (error: unknown) => error instanceof GatewayError && error.code === "REFERENCE_REMAKE_RUNTIME_INCOMPLETE",
  );
});
