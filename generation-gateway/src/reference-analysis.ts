import { z } from "zod";
import { GatewayError } from "./errors.js";

const ShortLabel = z.string().trim().min(1).max(200);

export const ReferenceAnalysisSchema = z.object({
  people_count: z.number().int().min(0).max(20),
  shot_type: ShortLabel,
  pose: z.string().trim().min(1).max(500),
  camera_angle: z.string().trim().min(1).max(500),
  composition: z.string().trim().min(1).max(1000),
  scene: z.string().trim().min(1).max(1000),
  lighting: z.string().trim().min(1).max(500),
  expression: z.string().trim().min(1).max(500),
  outfit: z.string().trim().min(1).max(500),
  visible_body_region: ShortLabel,
  preserve_candidates: z.array(z.enum([
    "pose",
    "composition",
    "camera_angle",
    "shot_type",
    "lighting",
    "expression",
    "outfit",
  ])).max(7),
  confidence: z.number().min(0).max(1),
  analyzer_version: z.string().trim().min(1).max(100),
});

export const ReferenceAnalysisRequestSchema = z.object({
  reference_asset_id: z.string().trim().min(1).max(500),
  observations: z.object({
    people_count: z.number().int().min(0).max(20).optional(),
    shot_type: ShortLabel.optional(),
    pose: z.string().trim().min(1).max(500).optional(),
    camera_angle: z.string().trim().min(1).max(500).optional(),
    composition: z.string().trim().min(1).max(1000).optional(),
    scene: z.string().trim().min(1).max(1000).optional(),
    lighting: z.string().trim().min(1).max(500).optional(),
    expression: z.string().trim().min(1).max(500).optional(),
    outfit: z.string().trim().min(1).max(500).optional(),
    visible_body_region: ShortLabel.optional(),
  }).default({}),
});

export const ReferenceAnalysisConfirmationSchema = z.object({
  reference_asset_id: z.string().trim().min(1).max(500),
  analysis: ReferenceAnalysisSchema,
});

export type ReferenceAnalysis = z.infer<typeof ReferenceAnalysisSchema>;
export type ReferenceAnalysisRequest = z.infer<typeof ReferenceAnalysisRequestSchema>;

/**
 * Phase 3 rules analyzer. It deliberately does not inspect provider configuration
 * or select a GPU endpoint. Low-confidence defaults must be confirmed by the user
 * before they can be copied into a generation request.
 */
export function analyzeReference(input: ReferenceAnalysisRequest): ReferenceAnalysis {
  const value = input.observations;
  const peopleCount = value.people_count ?? 1;
  const result: ReferenceAnalysis = {
    people_count: peopleCount,
    shot_type: value.shot_type ?? "unknown",
    pose: value.pose ?? "unknown",
    camera_angle: value.camera_angle ?? "unknown",
    composition: value.composition ?? "unknown",
    scene: value.scene ?? "unknown",
    lighting: value.lighting ?? "unknown",
    expression: value.expression ?? "unknown",
    outfit: value.outfit ?? "unknown",
    visible_body_region: value.visible_body_region ?? "unknown",
    preserve_candidates: ["pose", "composition", "camera_angle", "shot_type"],
    confidence: Object.keys(value).length >= 6 ? 0.8 : 0.35,
    analyzer_version: "rules-reference-analyzer/1.0.0",
  };
  return ReferenceAnalysisSchema.parse(result);
}

export function assertConfirmedSinglePersonReference(analysis: ReferenceAnalysis): void {
  const parsed = ReferenceAnalysisSchema.parse(analysis);
  if (parsed.people_count !== 1) {
    throw new GatewayError(
      "REFERENCE_PEOPLE_COUNT_UNSUPPORTED",
      "The enabled reference-remake workflow requires exactly one adult person.",
      422,
      false,
    );
  }
}
