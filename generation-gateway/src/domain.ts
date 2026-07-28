import { z } from "zod";

export const MediaTypeSchema = z.enum(["image", "video"]);
export const CreationModeSchema = z.enum([
  "text_to_image",
  "image_to_image",
  "text_to_video",
  "image_to_video",
  "image_edit",
  "effect_preset",
]);
export const GenerationStatusSchema = z.enum([
  "draft",
  "queued",
  "parsing",
  "validating",
  "planning",
  "routing",
  "submitted",
  "running",
  "post_processing",
  "reviewing",
  "completed",
  "failed",
  "cancelled",
]);
export const RegistryStatusSchema = z.enum(["draft", "testing", "production", "deprecated", "disabled"]);

const OptionalString = z.string().trim().min(1).max(500).optional();
const AssetReferenceSchema = z.object({
  asset_id: z.string().trim().min(1),
  mime_type: z.enum(["image/jpeg", "image/png", "image/webp"]),
  size_bytes: z.number().int().positive().max(10 * 1024 * 1024),
  width: z.number().int().positive().max(8192).optional(),
  height: z.number().int().positive().max(8192).optional(),
});

export const GenerationInputSchema = z.object({
  media_type: MediaTypeSchema,
  creation_mode: CreationModeSchema,
  prompt: z.string().trim().min(1).max(8000),
  structured_options: z.record(z.string(), z.unknown()).default({}),
  reference_assets: z.array(AssetReferenceSchema).max(4).default([]),
  character_id: OptionalString,
  preset_id: OptionalString,
  aspect_ratio: z.enum(["1:1", "4:5", "3:4", "16:9", "9:16", "21:9"]).default("1:1"),
  duration_seconds: z.number().int().min(1).max(60).optional(),
  output_count: z.number().int().min(1).max(4).default(1),
  subject_age_confirmed_adult: z.boolean().default(false),
  idempotency_key: z.string().trim().min(8).max(200).optional(),
  client_context: z.object({
    app: z.enum(["open-video-studio", "ai-marketing-studio"]),
    platform: z.string().trim().max(80).optional(),
    content_id: z.string().trim().max(200).optional(),
  }),
});

export const ParsedCreativeBriefSchema = z.object({
  media_type: MediaTypeSchema,
  input_type: z.enum(["text", "image", "text_and_image"]),
  people_count: z.number().int().min(0).max(20),
  character_ids: z.array(z.string()).max(10),
  scene: z.string().max(1000),
  pose: z.string().max(500),
  outfit: z.string().max(500),
  expression: z.string().max(500),
  shot_type: z.string().max(200),
  camera: z.string().max(500),
  lighting: z.string().max(500),
  visual_style: z.string().max(500),
  aspect_ratio: z.string(),
  duration_seconds: z.number().int().positive().optional(),
  preserve_pose: z.boolean(),
  preserve_face: z.boolean(),
  preserve_composition: z.boolean(),
  replace_character: z.boolean(),
  replace_background: z.boolean(),
  output_count: z.number().int().min(1).max(4),
});

export const WorkflowCapabilitySchema = z.object({
  media_types: z.array(MediaTypeSchema).min(1),
  creation_modes: z.array(CreationModeSchema).min(1),
  accepts_reference_image: z.boolean(),
  supports_character: z.boolean(),
  supports_pose_preservation: z.boolean(),
  supports_face_preservation: z.boolean(),
  supported_aspect_ratios: z.array(z.string()).min(1),
  max_duration_seconds: z.number().int().positive().optional(),
  max_output_count: z.number().int().min(1).max(8),
});

export const WorkflowManifestSchema = z.object({
  id: z.string().regex(/^[a-z0-9][a-z0-9-]+$/),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  status: RegistryStatusSchema,
  capability: WorkflowCapabilitySchema,
  provider_ids: z.array(z.string()).min(1),
  model_binding_ids: z.array(z.string()).default([]),
  lora_binding_ids: z.array(z.string()).default([]),
  priority: z.number().int().min(0).max(1000).default(100),
});

export const ModelBindingSchema = z.object({
  id: z.string(),
  registry_id: z.string(),
  base_architecture: z.string(),
  provider_id: z.string(),
  status: RegistryStatusSchema,
});

export const LoraBindingSchema = z.object({
  id: z.string(),
  registry_id: z.string(),
  base_architecture: z.string(),
  weight: z.number().min(-2).max(2),
  status: RegistryStatusSchema,
});

export const PromptPackageSchema = z.object({
  positivePrompt: z.string().min(1).max(16000),
  negativePrompt: z.string().max(8000),
  structuredPrompt: z.record(z.string(), z.unknown()),
  templateIds: z.array(z.string()).min(1),
  templateVersions: z.record(z.string(), z.string()),
  adapterId: z.string(),
});

export const GenerationPlanSchema = z.object({
  job_id: z.string(),
  user_id: z.string().uuid(),
  input: GenerationInputSchema,
  brief: ParsedCreativeBriefSchema,
  required_capabilities: WorkflowCapabilitySchema.partial(),
  selected_workflow_id: z.string().optional(),
  candidate_workflows: z.array(z.object({
    workflow_id: z.string(),
    score: z.number(),
    reasons: z.array(z.string()),
  })).default([]),
  routing_reasons: z.array(z.string()).default([]),
  fallback_workflow_ids: z.array(z.string()).default([]),
  router_version: z.string(),
  selected_model_id: z.string().optional(),
  selected_lora_ids: z.array(z.string()).default([]),
  prompt_package: PromptPackageSchema.optional(),
  reference_asset_id: z.string().optional(),
  character_id: z.string().optional(),
  workflow_id: z.string().optional(),
  model_id: z.string().optional(),
  lora_bindings: z.array(z.object({
    lora_id: z.string(),
    version: z.string(),
    weight: z.number().min(-2).max(2),
    trigger_words: z.array(z.string()),
  })).optional(),
  preserve_pose: z.boolean().optional(),
  preserve_composition: z.boolean().optional(),
  replace_scene: z.string().max(1000).nullable().optional(),
  outfit_override: z.string().max(500).nullable().optional(),
  expression_override: z.string().max(500).nullable().optional(),
  aspect_ratio: z.string().optional(),
  output_count: z.number().int().min(1).max(4).optional(),
  provider: z.string().optional(),
  timeout_ms: z.number().int().positive().optional(),
});

export const ProviderSubmitResultSchema = z.object({
  provider_job_id: z.string(),
  status: z.enum(["queued", "running"]),
  estimated_cost: z.number().nonnegative(),
  submitted_at: z.string().datetime(),
});
export const GenerationAssetSchema = z.object({
  id: z.string(),
  job_id: z.string(),
  media_type: MediaTypeSchema,
  url: z.string(),
  preview_url: z.string().optional(),
  mime_type: z.string(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  duration_seconds: z.number().positive().optional(),
  metadata: z.record(z.string(), z.unknown()).default({}),
});
export const GenerationResultSchema = z.object({
  provider_job_id: z.string(),
  assets: z.array(GenerationAssetSchema),
  cost: z.number().nonnegative(),
  raw_redacted: z.record(z.string(), z.unknown()).default({}),
});
export const ProviderJobStatusSchema = z.object({
  provider_job_id: z.string(),
  status: z.enum(["queued", "running", "completed", "failed", "cancelled"]),
  progress: z.number().min(0).max(100),
  result: GenerationResultSchema.optional(),
  error_code: z.string().optional(),
  error_message: z.string().optional(),
});
export const GenerationReviewSchema = z.object({
  id: z.string(),
  job_id: z.string(),
  status: z.enum(["approved", "rejected", "needs_review"]),
  score: z.number().min(0).max(1),
  checks: z.record(z.string(), z.boolean()),
  notes: z.array(z.string()),
});
export const GenerationErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  retryable: z.boolean(),
  details: z.record(z.string(), z.unknown()).optional(),
});
export const GenerationEventSchema = z.object({
  id: z.string(),
  job_id: z.string(),
  event_type: z.string(),
  from_status: GenerationStatusSchema.optional(),
  to_status: GenerationStatusSchema.optional(),
  payload: z.record(z.string(), z.unknown()).default({}),
  idempotency_key: z.string().optional(),
  created_at: z.string().datetime(),
});

export type MediaType = z.infer<typeof MediaTypeSchema>;
export type CreationMode = z.infer<typeof CreationModeSchema>;
export type GenerationStatus = z.infer<typeof GenerationStatusSchema>;
export type GenerationInput = z.infer<typeof GenerationInputSchema>;
export type ParsedCreativeBrief = z.infer<typeof ParsedCreativeBriefSchema>;
export type WorkflowCapability = z.infer<typeof WorkflowCapabilitySchema>;
export type WorkflowManifest = z.infer<typeof WorkflowManifestSchema>;
export type GenerationPlan = z.infer<typeof GenerationPlanSchema>;
export type PromptPackage = z.infer<typeof PromptPackageSchema>;
export type ProviderSubmitResult = z.infer<typeof ProviderSubmitResultSchema>;
export type ProviderJobStatus = z.infer<typeof ProviderJobStatusSchema>;
export type GenerationResult = z.infer<typeof GenerationResultSchema>;
export type GenerationAsset = z.infer<typeof GenerationAssetSchema>;
export type GenerationReview = z.infer<typeof GenerationReviewSchema>;
export type GenerationEvent = z.infer<typeof GenerationEventSchema>;

export interface GenerationJob {
  id: string;
  user_id: string;
  status: GenerationStatus;
  input: GenerationInput;
  parsed_brief?: ParsedCreativeBrief;
  generation_plan?: GenerationPlan;
  selected_workflow_id?: string;
  selected_model_id?: string;
  provider?: string;
  provider_job_id?: string;
  output_count: number;
  estimated_cost: number;
  final_cost?: number;
  error_code?: string;
  error_message?: string;
  idempotency_key?: string;
  retry_of_job_id?: string;
  attempt_count: number;
  assets: GenerationAsset[];
  review?: GenerationReview;
  created_at: string;
  updated_at: string;
  started_at?: string;
  completed_at?: string;
  cancelled_at?: string;
}
