import type { WorkflowManifest } from "./domain.js";

export const MOCK_REFERENCE_WORKFLOW_ID = "mock-character-reference-remake-v1";
export const MOCK_REFERENCE_WORKFLOW_VERSION = "1.0.0";
export const MOCK_REFERENCE_MODEL_ID = "model-placeholder-v1";
export const MOCK_REFERENCE_LORA_ID = "phase3a-mock-character-lora-v1";

/**
 * Phase 3A uses a separate, explicitly named workflow so that the real Phase 3
 * workflow remains fail-closed and AutoDL-only.
 */
export const mockCharacterReferenceRemakeManifest: WorkflowManifest = {
  id: MOCK_REFERENCE_WORKFLOW_ID,
  version: MOCK_REFERENCE_WORKFLOW_VERSION,
  status: "production",
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
  provider_ids: ["mock"],
  model_binding_ids: [MOCK_REFERENCE_MODEL_ID],
  lora_binding_ids: [MOCK_REFERENCE_LORA_ID],
  priority: 0,
};
