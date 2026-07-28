import type { GenerationPlan, WorkflowManifest } from "./domain.js";
import { GatewayError } from "./errors.js";
import {
  assertConfirmedSinglePersonReference,
  ReferenceAnalysisSchema,
  type ReferenceAnalysis,
} from "./reference-analysis.js";

export const REFERENCE_REMAKE_WORKFLOW_ID = "single-character-reference-remake-v1";
export const REFERENCE_REMAKE_WORKFLOW_VERSION = "1.0.0";
export const REFERENCE_REMAKE_MODEL_ID = "persephone-flux-2-q8-v1";
export const REFERENCE_REMAKE_LORA_ID = "phase3-character-lora-v1";
export const REFERENCE_INPUT_STORAGE_PREFIX = "generation-inputs";

export const singleCharacterReferenceRemakeManifest: WorkflowManifest = {
  id: REFERENCE_REMAKE_WORKFLOW_ID,
  version: REFERENCE_REMAKE_WORKFLOW_VERSION,
  status: "testing",
  capability: {
    media_types: ["image"],
    creation_modes: ["image_to_image"],
    accepts_reference_image: true,
    supports_character: true,
    supports_pose_preservation: true,
    supports_face_preservation: true,
    supported_aspect_ratios: ["1:1", "3:4"],
    max_output_count: 4,
  },
  provider_ids: ["autodl"],
  model_binding_ids: [REFERENCE_REMAKE_MODEL_ID],
  lora_binding_ids: [REFERENCE_REMAKE_LORA_ID],
  priority: 1,
};

export interface ReferenceRemakeWorkerInput {
  schema_version: "1.0";
  workflow: {
    id: typeof REFERENCE_REMAKE_WORKFLOW_ID;
    version: typeof REFERENCE_REMAKE_WORKFLOW_VERSION;
    registry_ref: string;
  };
  request: {
    job_id: string;
    user_id: string;
    reference_asset_id: string;
    character_id: string;
    prompt: string;
    negative_prompt: string;
    preserve_pose: boolean;
    preserve_composition: boolean;
    replace_scene: string | null;
    outfit_override: string | null;
    expression_override: string | null;
    aspect_ratio: "1:1" | "3:4";
    output_count: number;
    seed: number | null;
    reference_analysis: ReferenceAnalysis;
  };
  lora: {
    lora_id: string;
    version: string;
    weight: number;
    trigger_words: string[];
  };
  storage: {
    input_signed_url: string;
    output_bucket: string;
    output_path_prefix: string;
  };
}

export function assertReferenceRemakePlan(plan: GenerationPlan): void {
  const options = plan.input.structured_options;
  const analysis = ReferenceAnalysisSchema.safeParse(options.reference_analysis);
  if (
    plan.selected_workflow_id !== REFERENCE_REMAKE_WORKFLOW_ID ||
    plan.input.media_type !== "image" ||
    plan.input.creation_mode !== "image_to_image" ||
    plan.input.reference_assets.length !== 1 ||
    !plan.input.character_id ||
    plan.brief.people_count !== 1 ||
    !plan.brief.preserve_pose ||
    !plan.brief.preserve_composition ||
    !analysis.success ||
    options.reference_analysis_confirmed !== true ||
    !["1:1", "3:4"].includes(plan.input.aspect_ratio) ||
    plan.input.output_count < 1 ||
    plan.input.output_count > 4
  ) {
    throw new GatewayError(
      "REFERENCE_REMAKE_INPUT_UNSUPPORTED",
      "The request is outside the enabled single-character reference-remake contract.",
      422,
      false,
    );
  }
  assertConfirmedSinglePersonReference(analysis.data);
}

export function mapReferenceRemakePlanToWorkerInput(
  plan: GenerationPlan,
  config: { workflowRegistryRef: string; storageBucket: string },
): ReferenceRemakeWorkerInput {
  assertReferenceRemakePlan(plan);
  const analysis = ReferenceAnalysisSchema.parse(plan.input.structured_options.reference_analysis);
  const runtime = (plan as GenerationPlan & {
    runtime?: { reference_input_signed_url?: string };
  }).runtime;
  const signedUrl = runtime?.reference_input_signed_url;
  const binding = plan.lora_bindings?.[0];
  if (!signedUrl || !binding || binding.lora_id !== REFERENCE_REMAKE_LORA_ID) {
    throw new GatewayError(
      "REFERENCE_REMAKE_RUNTIME_INCOMPLETE",
      "The reference-remake plan is missing its signed input or tested LoRA binding.",
      503,
      false,
    );
  }
  return {
    schema_version: "1.0",
    workflow: {
      id: REFERENCE_REMAKE_WORKFLOW_ID,
      version: REFERENCE_REMAKE_WORKFLOW_VERSION,
      registry_ref: config.workflowRegistryRef,
    },
    request: {
      job_id: plan.job_id,
      user_id: plan.user_id,
      reference_asset_id: plan.reference_asset_id!,
      character_id: plan.character_id!,
      prompt: plan.prompt_package?.positivePrompt ?? plan.input.prompt,
      negative_prompt: plan.prompt_package?.negativePrompt ?? "",
      preserve_pose: true,
      preserve_composition: true,
      replace_scene: plan.replace_scene ?? null,
      outfit_override: plan.outfit_override ?? null,
      expression_override: plan.expression_override ?? null,
      aspect_ratio: plan.input.aspect_ratio as "1:1" | "3:4",
      output_count: plan.input.output_count,
      seed: integerOrNull(plan.input.structured_options.seed),
      reference_analysis: analysis,
    },
    lora: binding,
    storage: {
      input_signed_url: signedUrl,
      output_bucket: config.storageBucket,
      output_path_prefix: `generation-results/${plan.user_id}/${plan.job_id}`,
    },
  };
}

function integerOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isSafeInteger(value) ? value : null;
}
