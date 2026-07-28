import type {
  GenerationInput,
  GenerationPlan,
  ParsedCreativeBrief,
  PromptPackage,
  WorkflowManifest,
} from "./domain.js";
import { GatewayError } from "./errors.js";
import { singlePersonTextToImageManifest } from "./providers/runpod/workflow.js";

const unsafePatterns = [
  /\b(child|minor|underage|schoolgirl|schoolboy)\b/i,
  /未成年|幼女|幼男|儿童色情|萝莉色情/i,
];
const illegalPatterns = [
  /\b(CSAM|bestiality|non[- ]consensual)\b/i,
  /兽交|强奸实录|儿童性内容/i,
];
const adultPatterns = [/\b(nude|nudity|explicit|porn|sexual)\b/i, /裸体|色情|成人|性行为/i];

export function parseCreativeBrief(input: GenerationInput): ParsedCreativeBrief {
  const options = input.structured_options;
  const text = input.prompt;
  const peopleMatch = text.match(/(\d+)\s*(?:people|persons|人)/i);
  const peopleCount = Number(options.people_count ?? peopleMatch?.[1] ?? (/(person|woman|man|人物|角色)/i.test(text) ? 1 : 0));
  const hasReference = input.reference_assets.length > 0;
  const value = (key: string, fallback = "") => String(options[key] ?? fallback).slice(0, 1000);
  return {
    media_type: input.media_type,
    input_type: hasReference ? (text ? "text_and_image" : "image") : "text",
    people_count: Math.max(0, Math.min(20, Number.isFinite(peopleCount) ? peopleCount : 0)),
    character_ids: input.character_id ? [input.character_id] : [],
    scene: value("scene", text),
    pose: value("pose"),
    outfit: value("outfit"),
    expression: value("expression"),
    shot_type: value("shot_type", /\b(close[- ]?up|portrait)\b|特写|肖像/i.test(text) ? "closeup" : "auto"),
    camera: value("camera", "auto"),
    lighting: value("lighting", "auto"),
    visual_style: value("visual_style", "auto"),
    aspect_ratio: input.aspect_ratio,
    ...(input.duration_seconds ? { duration_seconds: input.duration_seconds } : {}),
    preserve_pose: Boolean(options.preserve_pose),
    preserve_face: Boolean(options.preserve_face),
    preserve_composition: Boolean(options.preserve_composition),
    replace_character: Boolean(options.replace_character),
    replace_background: Boolean(options.replace_background),
    output_count: input.output_count,
  };
}

export interface PolicyContext {
  input: GenerationInput;
  brief: ParsedCreativeBrief;
  userId: string;
  ownedAssetIds: ReadonlySet<string>;
}

export function validatePolicy(context: PolicyContext): void {
  const { input, brief, ownedAssetIds } = context;
  const prompt = input.prompt;
  for (const asset of input.reference_assets) {
    if (!ownedAssetIds.has(asset.asset_id)) {
      throw new GatewayError("INPUT_ASSET_NOT_OWNED", "A reference asset is not owned by the authenticated user.", 403);
    }
  }
  if (input.media_type === "image" && input.duration_seconds !== undefined) {
    throw new GatewayError("DURATION_NOT_ALLOWED", "Image jobs cannot specify a duration.", 422);
  }
  if (input.media_type === "video" && !input.duration_seconds) {
    throw new GatewayError("DURATION_REQUIRED", "Video jobs require duration_seconds.", 422);
  }
  if (input.creation_mode.startsWith("image_to") || input.creation_mode === "image_edit") {
    if (input.reference_assets.length === 0) {
      throw new GatewayError("REFERENCE_IMAGE_REQUIRED", "This creation mode requires a reference image.", 422);
    }
  }
  if (illegalPatterns.some((pattern) => pattern.test(prompt))) {
    throw new GatewayError("CONTENT_POLICY_ILLEGAL", "The request contains prohibited content.", 422);
  }
  if (unsafePatterns.some((pattern) => pattern.test(prompt))) {
    throw new GatewayError("CONTENT_POLICY_MINOR", "Minors or age-ambiguous subjects cannot enter an adult-oriented workflow.", 422);
  }
  if ((adultPatterns.some((pattern) => pattern.test(prompt)) || Boolean(input.structured_options.adult_content)) &&
      (!input.subject_age_confirmed_adult || brief.people_count === 0)) {
    throw new GatewayError(
      "ADULT_AGE_CONFIRMATION_REQUIRED",
      "Adult-oriented requests require explicit adult-age confirmation for every depicted person.",
      422,
    );
  }
  if (input.output_count > 4) {
    throw new GatewayError("OUTPUT_COUNT_EXCEEDED", "A job may request at most four outputs.", 422);
  }
}

const commonRatios = ["1:1", "4:5", "3:4", "16:9", "9:16", "21:9"];
const manifests: WorkflowManifest[] = [
  manifest("mock-image-single-closeup-v1", ["text_to_image", "image_to_image"], false, false, 10),
  manifest("mock-image-single-fullbody-v1", ["text_to_image", "image_to_image"], false, false, 20),
  manifest("mock-image-reference-pose-v1", ["image_to_image"], true, true, 5),
  manifest("mock-image-edit-v1", ["image_edit"], true, false, 5),
  videoManifest("mock-video-text-to-video-v1", ["text_to_video"], false, 10),
  videoManifest("mock-video-image-to-video-v1", ["image_to_video"], true, 5),
  manifest("mock-effect-preset-v1", ["effect_preset"], true, false, 5, ["image", "video"]),
  singlePersonTextToImageManifest,
];

function manifest(
  id: string,
  modes: WorkflowManifest["capability"]["creation_modes"],
  acceptsReference: boolean,
  pose: boolean,
  priority: number,
  mediaTypes: WorkflowManifest["capability"]["media_types"] = ["image"],
): WorkflowManifest {
  return {
    id,
    version: "1.0.0",
    status: "production",
    capability: {
      media_types: mediaTypes,
      creation_modes: modes,
      accepts_reference_image: acceptsReference,
      supports_character: true,
      supports_pose_preservation: pose,
      supports_face_preservation: true,
      supported_aspect_ratios: commonRatios,
      max_output_count: 4,
    },
    provider_ids: ["mock"],
    model_binding_ids: ["model-placeholder-v1"],
    lora_binding_ids: [],
    priority,
  };
}

function videoManifest(
  id: string,
  modes: WorkflowManifest["capability"]["creation_modes"],
  acceptsReference: boolean,
  priority: number,
): WorkflowManifest {
  const value = manifest(id, modes, acceptsReference, false, priority, ["video"]);
  return { ...value, capability: { ...value.capability, max_duration_seconds: 60 } };
}

export function listWorkflowManifests(): WorkflowManifest[] {
  return structuredClone(manifests);
}

export function routeWorkflow(
  jobId: string,
  userId: string,
  input: GenerationInput,
  brief: ParsedCreativeBrief,
  availableManifests: readonly WorkflowManifest[] = manifests,
  options: {
    allowedStatuses?: readonly WorkflowManifest["status"][];
    requiredWorkflowId?: string;
  } = {},
): GenerationPlan {
  const allowedStatuses = options.allowedStatuses ?? ["production"];
  const candidates = availableManifests
    .filter((item) => allowedStatuses.includes(item.status))
    .filter((item) => !options.requiredWorkflowId || item.id === options.requiredWorkflowId)
    .map((item) => scoreManifest(item, input, brief))
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .sort((a, b) => b.score - a.score || a.priority - b.priority);
  const selected = candidates[0];
  if (!selected) {
    throw new GatewayError("NO_MATCHING_WORKFLOW", "No active workflow satisfies the requested capabilities.", 422, true);
  }
  return {
    job_id: jobId,
    user_id: userId,
    input,
    brief,
    required_capabilities: {
      media_types: [input.media_type],
      creation_modes: [input.creation_mode],
      accepts_reference_image: input.reference_assets.length > 0,
      supports_character: Boolean(input.character_id),
      supports_pose_preservation: brief.preserve_pose,
      supports_face_preservation: brief.preserve_face,
      supported_aspect_ratios: [input.aspect_ratio],
      max_output_count: input.output_count,
      ...(input.duration_seconds ? { max_duration_seconds: input.duration_seconds } : {}),
    },
    selected_workflow_id: selected.workflow.id,
    candidate_workflows: candidates.map(({ workflow, score, reasons }) => ({
      workflow_id: workflow.id,
      score,
      reasons,
    })),
    routing_reasons: selected.reasons,
    fallback_workflow_ids: candidates.slice(1).map((item) => item.workflow.id),
    router_version: "capability-router/1.1.0",
    selected_model_id: selected.workflow.model_binding_ids[0],
    selected_lora_ids: [],
  };
}

function scoreManifest(workflow: WorkflowManifest, input: GenerationInput, brief: ParsedCreativeBrief) {
  const capability = workflow.capability;
  if (!capability.media_types.includes(input.media_type) ||
      !capability.creation_modes.includes(input.creation_mode) ||
      !capability.supported_aspect_ratios.includes(input.aspect_ratio) ||
      capability.max_output_count < input.output_count ||
      (input.duration_seconds && (!capability.max_duration_seconds || capability.max_duration_seconds < input.duration_seconds)) ||
      (input.reference_assets.length > 0 && !capability.accepts_reference_image) ||
      (brief.preserve_pose && !capability.supports_pose_preservation)) {
    return null;
  }
  let score = 1000 - workflow.priority;
  const reasons = [`supports ${input.media_type}/${input.creation_mode}`, `supports ${input.aspect_ratio}`];
  if (brief.shot_type === "closeup" && workflow.id.includes("closeup")) {
    score += 50;
    reasons.push("closeup intent matched");
  }
  if (brief.shot_type !== "closeup" && workflow.id.includes("fullbody")) {
    score += 20;
    reasons.push("general composition matched");
  }
  if (brief.preserve_pose && workflow.capability.supports_pose_preservation) {
    score += 80;
    reasons.push("pose preservation matched");
  }
  return { workflow, score, reasons, priority: workflow.priority };
}

const templateVersions: Record<string, string> = {
  system: "1.0.0",
  character: "1.0.0",
  scene: "1.0.0",
  pose: "1.0.0",
  outfit: "1.0.0",
  expression: "1.0.0",
  camera: "1.0.0",
  lighting: "1.0.0",
  style: "1.0.0",
  platform: "1.0.0",
  model: "mock-1.0.0",
  negative: "1.0.0",
};

export function buildPromptPackage(plan: GenerationPlan): PromptPackage {
  const { brief, input } = plan;
  const structuredPrompt = {
    intent: input.prompt,
    character_ids: brief.character_ids,
    scene: brief.scene,
    pose: brief.pose,
    outfit: brief.outfit,
    expression: brief.expression,
    shot_type: brief.shot_type,
    camera: brief.camera,
    lighting: brief.lighting,
    visual_style: brief.visual_style,
    aspect_ratio: brief.aspect_ratio,
    platform: input.client_context.platform ?? "generic",
  };
  const positivePrompt = Object.entries(structuredPrompt)
    .filter(([, value]) => Array.isArray(value) ? value.length > 0 : Boolean(value))
    .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : String(value)}`)
    .join("\n");
  return {
    positivePrompt,
    negativePrompt: "minor, age ambiguous, illegal content, watermark, corrupted output",
    structuredPrompt,
    templateIds: Object.keys(templateVersions).map((name) => `prompt-${name}-v1`),
    templateVersions,
    adapterId: "mock-model-adapter-v1",
  };
}
