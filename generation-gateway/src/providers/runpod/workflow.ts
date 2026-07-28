import type { GenerationPlan, WorkflowManifest } from "../../domain.js";
import { GatewayError } from "../../errors.js";

export const REAL_IMAGE_WORKFLOW_ID = "single-person-text-to-image-v1";
export const REAL_IMAGE_WORKFLOW_VERSION = "1.0.0";
export const REAL_IMAGE_MODEL_BINDING_ID = "single-person-photorealistic-model-v1";
export const REAL_IMAGE_STORAGE_PREFIX = "generation-results";

export const singlePersonTextToImageManifest: WorkflowManifest = {
  id: REAL_IMAGE_WORKFLOW_ID,
  version: REAL_IMAGE_WORKFLOW_VERSION,
  status: "testing",
  capability: {
    media_types: ["image"],
    creation_modes: ["text_to_image"],
    accepts_reference_image: false,
    supports_character: false,
    supports_pose_preservation: false,
    supports_face_preservation: false,
    supported_aspect_ratios: ["1:1", "4:5"],
    max_output_count: 4,
  },
  provider_ids: ["autodl", "runpod"],
  model_binding_ids: [REAL_IMAGE_MODEL_BINDING_ID],
  lora_binding_ids: [],
  priority: 1,
};

export interface RunPodWorkerInput {
  schema_version: "1.0";
  workflow: {
    id: typeof REAL_IMAGE_WORKFLOW_ID;
    version: typeof REAL_IMAGE_WORKFLOW_VERSION;
    comfyui_workflow_ref: string;
    model_manifest_ref: string;
  };
  request: {
    job_id: string;
    user_id: string;
    prompt: string;
    negative_prompt: string;
    aspect_ratio: "1:1" | "4:5";
    output_count: number;
    seed: number | null;
  };
  storage: {
    bucket: string;
    path_prefix: string;
  };
}

export interface RunPodWorkflowConfig {
  comfyuiWorkflowRef: string;
  modelManifestRef: string;
  storageBucket: string;
}

export function mapPlanToWorkerInput(plan: GenerationPlan, config: RunPodWorkflowConfig): RunPodWorkerInput {
  if (plan.selected_workflow_id !== REAL_IMAGE_WORKFLOW_ID ||
      plan.input.media_type !== "image" ||
      plan.input.creation_mode !== "text_to_image" ||
      plan.input.reference_assets.length > 0 ||
      plan.input.character_id ||
      plan.brief.people_count !== 1 ||
      plan.brief.visual_style.toLowerCase() !== "photorealistic" ||
      !["1:1", "4:5"].includes(plan.input.aspect_ratio) ||
      plan.input.output_count < 1 ||
      plan.input.output_count > 4) {
    throw new GatewayError(
      "REAL_WORKFLOW_INPUT_UNSUPPORTED",
      "The request is outside the enabled real-image workflow contract.",
      422,
      false,
    );
  }
  return {
    schema_version: "1.0",
    workflow: {
      id: REAL_IMAGE_WORKFLOW_ID,
      version: REAL_IMAGE_WORKFLOW_VERSION,
      comfyui_workflow_ref: config.comfyuiWorkflowRef,
      model_manifest_ref: config.modelManifestRef,
    },
    request: {
      job_id: plan.job_id,
      user_id: plan.user_id,
      prompt: plan.prompt_package?.positivePrompt ?? plan.input.prompt,
      negative_prompt: plan.prompt_package?.negativePrompt ?? "",
      aspect_ratio: plan.input.aspect_ratio as "1:1" | "4:5",
      output_count: plan.input.output_count,
      seed: integerOrNull(plan.input.structured_options.seed),
    },
    storage: {
      bucket: config.storageBucket,
      path_prefix: `${REAL_IMAGE_STORAGE_PREFIX}/${plan.user_id}/${plan.job_id}`,
    },
  };
}

export function withMockFallbackForContractTest(manifest: WorkflowManifest): WorkflowManifest {
  return { ...structuredClone(manifest), provider_ids: [...manifest.provider_ids, "mock"] };
}

function integerOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isSafeInteger(value) ? value : null;
}
