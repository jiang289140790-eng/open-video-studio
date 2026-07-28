import { createHash } from "node:crypto";
import { z } from "zod";
import { GenerationPlanSchema, RegistryStatusSchema, type GenerationPlan } from "./domain.js";
import { GatewayError } from "./errors.js";

const IdentifierSchema = z.string().trim().regex(/^[a-z0-9][a-z0-9._-]{1,199}$/);
const SemverSchema = z.string().regex(/^\d+\.\d+\.\d+$/);
const Sha256Schema = z.string().regex(/^[a-f0-9]{64}$/);
const SafeResourceReferenceSchema = z.string().trim().min(1).max(1000).refine(
  (value) => /^(registry|storage):\/\/[a-zA-Z0-9._/-]+$/.test(value) && !hasForbiddenLocalPath(value),
  "Resource references must use registry:// or storage:// and cannot contain a local path.",
);

export const LoraResourceObservationSchema = z.object({
  exists: z.literal(true),
  sha256: Sha256Schema,
  size_bytes: z.number().int().positive().max(100 * 1024 * 1024 * 1024),
  verified_at: z.string().datetime(),
  verifier: z.enum(["storage", "worker"]),
}).strict();

export const LoraImportManifestSchema = z.object({
  id: IdentifierSchema,
  name: z.string().trim().min(1).max(200),
  version: SemverSchema,
  file_reference: SafeResourceReferenceSchema,
  sha256: Sha256Schema,
  file_size_bytes: z.number().int().positive().max(100 * 1024 * 1024 * 1024),
  base_architecture: z.string().trim().min(1).max(100),
  compatible_model_ids: z.array(IdentifierSchema).min(1).max(20),
  trigger_words: z.array(z.string().trim().min(1).max(100)).min(1).max(20),
  default_weight: z.number().min(-2).max(2),
  min_weight: z.number().min(-2).max(2),
  max_weight: z.number().min(-2).max(2),
  source: z.string().trim().min(1).max(1000),
  license: z.string().trim().min(1).max(500),
  status: RegistryStatusSchema,
}).strict();

export type LoraImportManifest = z.infer<typeof LoraImportManifestSchema>;
export type LoraResourceObservation = z.infer<typeof LoraResourceObservationSchema>;

const NodeTargetSchema = z.object({
  node_id: z.string().trim().regex(/^[a-zA-Z0-9_-]+$/),
  input_name: z.string().trim().regex(/^[a-zA-Z0-9_.-]+$/),
  expected_class_type: z.string().trim().min(1).max(200),
}).strict();

export const ComfyUINodeMappingSchema = z.object({
  schema_version: z.literal("1.0"),
  workflow_id: IdentifierSchema,
  workflow_version: SemverSchema,
  nodes: z.object({
    model: NodeTargetSchema,
    lora_model: NodeTargetSchema,
    lora_strength: NodeTargetSchema,
    reference_image: NodeTargetSchema,
    positive_prompt: NodeTargetSchema,
    negative_prompt: NodeTargetSchema,
    seed: NodeTargetSchema,
    width: NodeTargetSchema,
    height: NodeTargetSchema,
    output: NodeTargetSchema,
  }).strict(),
}).strict();

export type ComfyUINodeMapping = z.infer<typeof ComfyUINodeMappingSchema>;

const ComfyUINodeSchema = z.object({
  class_type: z.string().trim().min(1).max(200),
  inputs: z.record(z.string(), z.unknown()),
  _meta: z.record(z.string(), z.unknown()).optional(),
}).passthrough();

export const ComfyUIApiWorkflowSchema = z.record(
  z.string().regex(/^[a-zA-Z0-9_-]+$/),
  ComfyUINodeSchema,
).refine((workflow) => Object.keys(workflow).length > 0, "Workflow must contain at least one node.");

export const WorkflowImportRequestSchema = z.object({
  workflow_id: IdentifierSchema,
  version: SemverSchema,
  model_id: IdentifierSchema,
  lora_id: IdentifierSchema,
  workflow: ComfyUIApiWorkflowSchema,
  node_mapping: ComfyUINodeMappingSchema,
}).strict();

export type WorkflowImportRequest = z.infer<typeof WorkflowImportRequestSchema>;

const BaseModelResourceSchema = z.object({
  id: IdentifierSchema,
  base_architecture: z.string().trim().min(1).max(100),
  file_reference: SafeResourceReferenceSchema,
  sha256: Sha256Schema,
  size_bytes: z.number().int().positive(),
  exists: z.literal(true),
  license: z.string().trim().min(1).max(500),
  status: z.enum(["testing", "production"]),
}).strict();

const StorageVerificationSchema = z.object({
  bucket: IdentifierSchema,
  upload_verified: z.literal(true),
  verified_at: z.string().datetime(),
}).strict();

const WorkerVerificationSchema = z.object({
  provider_id: z.literal("autodl"),
  health: z.literal("ready"),
  checked_at: z.string().datetime(),
}).strict();

export const Phase3BDryRunRequestSchema = z.object({
  plan: GenerationPlanSchema,
  base_model: BaseModelResourceSchema,
  lora: LoraImportManifestSchema,
  lora_observation: LoraResourceObservationSchema,
  workflow_import: WorkflowImportRequestSchema,
  worker: WorkerVerificationSchema,
  storage: StorageVerificationSchema,
}).strict();

export type Phase3BDryRunRequest = z.infer<typeof Phase3BDryRunRequestSchema>;

export interface ValidationIssue {
  code: string;
  path: string;
  message: string;
}

export interface ValidationResult<T> {
  valid: boolean;
  value?: T;
  issues: ValidationIssue[];
}

export type ChecklistStatus =
  | "missing"
  | "validating"
  | "invalid"
  | "ready"
  | "offline"
  | "unhealthy"
  | "unverified";

export interface Phase3BChecklist {
  status: "READY_FOR_RESOURCES" | "READY_FOR_DRY_RUN";
  base_model: ChecklistStatus;
  character_lora: ChecklistStatus;
  workflow_json: ChecklistStatus;
  node_mapping: ChecklistStatus;
  autodl_worker: ChecklistStatus;
  storage_upload: ChecklistStatus;
  provider_allowlist_eligible: boolean;
  blocking_reasons: string[];
}

export function validateLoraImport(
  rawManifest: unknown,
  rawObservation: unknown,
  availableModels: Array<{ id: string; base_architecture: string; ready: boolean }> = [],
): ValidationResult<LoraImportManifest> {
  const manifest = LoraImportManifestSchema.safeParse(rawManifest);
  const observation = LoraResourceObservationSchema.safeParse(rawObservation);
  const issues = [
    ...zodIssues(manifest.success ? [] : manifest.error.issues, "manifest"),
    ...zodIssues(observation.success ? [] : observation.error.issues, "observation"),
  ];
  if (!manifest.success || !observation.success) return { valid: false, issues };
  const value = manifest.data;
  const observed = observation.data;
  if (value.min_weight > value.default_weight || value.default_weight > value.max_weight) {
    issues.push(issue("LORA_WEIGHT_RANGE_INVALID", "manifest.default_weight", "Weights must satisfy min <= default <= max."));
  }
  if (value.sha256 !== observed.sha256) {
    issues.push(issue("LORA_SHA256_MISMATCH", "observation.sha256", "Observed SHA-256 does not match the manifest."));
  }
  if (value.file_size_bytes !== observed.size_bytes) {
    issues.push(issue("LORA_FILE_SIZE_MISMATCH", "observation.size_bytes", "Observed file size does not match the manifest."));
  }
  if (["testing", "production"].includes(value.status)) {
    for (const modelId of value.compatible_model_ids) {
      const model = availableModels.find((item) => item.id === modelId);
      if (!model?.ready) {
        issues.push(issue("LORA_MODEL_NOT_READY", "manifest.compatible_model_ids", `Compatible model ${modelId} is not ready.`));
      } else if (model.base_architecture.toLowerCase() !== value.base_architecture.toLowerCase()) {
        issues.push(issue("LORA_ARCHITECTURE_MISMATCH", "manifest.base_architecture", `LoRA architecture does not match ${modelId}.`));
      }
    }
  }
  return issues.length ? { valid: false, issues } : { valid: true, value, issues: [] };
}

export function validateWorkflowImport(raw: unknown): ValidationResult<WorkflowImportRequest> {
  const parsed = WorkflowImportRequestSchema.safeParse(raw);
  if (!parsed.success) return { valid: false, issues: zodIssues(parsed.error.issues, "workflow_import") };
  const value = parsed.data;
  const issues: ValidationIssue[] = [];
  if (value.node_mapping.workflow_id !== value.workflow_id || value.node_mapping.workflow_version !== value.version) {
    issues.push(issue("WORKFLOW_MAPPING_ID_MISMATCH", "node_mapping", "Mapping workflow ID/version does not match the import."));
  }
  const targets = Object.entries(value.node_mapping.nodes);
  const seenTargets = new Set<string>();
  for (const [role, target] of targets) {
    const key = `${target.node_id}:${target.input_name}`;
    if (seenTargets.has(key)) {
      issues.push(issue("WORKFLOW_MAPPING_DUPLICATE", `node_mapping.nodes.${role}`, `Duplicate target ${key}.`));
    }
    seenTargets.add(key);
    const node = value.workflow[target.node_id];
    if (!node) {
      issues.push(issue("WORKFLOW_NODE_MISSING", `node_mapping.nodes.${role}.node_id`, `Node ${target.node_id} does not exist.`));
      continue;
    }
    if (node.class_type !== target.expected_class_type) {
      issues.push(issue("WORKFLOW_NODE_CLASS_MISMATCH", `node_mapping.nodes.${role}.expected_class_type`, `Node ${target.node_id} class does not match.`));
    }
    if (!(target.input_name in node.inputs)) {
      issues.push(issue("WORKFLOW_NODE_INPUT_MISSING", `node_mapping.nodes.${role}.input_name`, `Input ${target.input_name} does not exist on node ${target.node_id}.`));
    }
    if (!roleClassMatches(role, node.class_type)) {
      issues.push(issue("WORKFLOW_NODE_ROLE_INVALID", `node_mapping.nodes.${role}`, `Node class ${node.class_type} is not valid for ${role}.`));
    }
  }
  const forbidden = findForbiddenValues(value.workflow);
  for (const path of forbidden) {
    issues.push(issue("WORKFLOW_LOCAL_SECRET_PATH", `workflow.${path}`, "Workflow contains a local path, local endpoint, or secret-like value."));
  }
  return issues.length ? { valid: false, issues } : { valid: true, value, issues: [] };
}

export function buildPhase3BChecklist(input: {
  models: Record<string, unknown>[];
  loras: Record<string, unknown>[];
  workflows: Record<string, unknown>[];
  workerHealth?: { healthy: boolean; details?: Record<string, unknown> };
  storageVerified?: boolean;
  workflowImport?: unknown;
  targetModelId?: string;
  targetLoraId?: string;
  targetWorkflowId?: string;
}): Phase3BChecklist {
  const model = input.models.find((item) => item.id === input.targetModelId);
  const lora = input.loras.find((item) => item.id === input.targetLoraId);
  const workflow = input.workflows.find((item) => item.id === input.targetWorkflowId);
  const modelReady = isModelReady(model);
  const loraReady = isRegistryLoraReady(lora, modelReady ? [{
    id: String(model!.id),
    base_architecture: String(model!.base_architecture),
    ready: true,
  }] : []);
  const workflowValidation = input.workflowImport === undefined ? null : validateWorkflowImport(input.workflowImport);
  const persistedWorkflowStatus = workflow?.workflow_import_status;
  const persistedWorkflowReady = persistedWorkflowStatus === "ready"
    && Sha256Schema.safeParse(workflow?.workflow_json_sha256).success;
  const persistedMappingReady = persistedWorkflowReady
    && ComfyUINodeMappingSchema.safeParse(workflow?.node_mapping).success
    && Sha256Schema.safeParse(workflow?.node_mapping_sha256).success;
  const workflowJson = workflowValidation
    ? workflowValidation.valid ? "ready" : "invalid"
    : persistedWorkflowReady ? "ready"
      : persistedWorkflowStatus === "validating" ? "validating"
        : persistedWorkflowStatus === "invalid" ? "invalid" : "missing";
  const nodeMapping = workflowValidation
    ? workflowValidation.valid ? "ready" : "invalid"
    : persistedMappingReady ? "ready"
      : persistedWorkflowStatus === "validating" ? "validating"
        : persistedWorkflowStatus === "invalid" ? "invalid" : "missing";
  const worker = input.workerHealth
    ? input.workerHealth.healthy ? "ready" : input.workerHealth.details?.reason === "disabled" ? "offline" : "unhealthy"
    : "offline";
  const checklist: Phase3BChecklist = {
    status: "READY_FOR_RESOURCES",
    base_model: modelReady ? "ready" : "missing",
    character_lora: loraReady ? "ready"
      : lora?.validation_status === "validating" ? "validating"
        : lora?.validation_status === "invalid" ? "invalid" : "missing",
    workflow_json: workflowJson,
    node_mapping: nodeMapping,
    autodl_worker: worker,
    storage_upload: input.storageVerified ? "ready" : "unverified",
    provider_allowlist_eligible: false,
    blocking_reasons: [],
  };
  const required = [
    ["base_model", checklist.base_model],
    ["character_lora", checklist.character_lora],
    ["workflow_json", checklist.workflow_json],
    ["node_mapping", checklist.node_mapping],
    ["autodl_worker", checklist.autodl_worker],
    ["storage_upload", checklist.storage_upload],
  ] as const;
  checklist.blocking_reasons = required.filter(([, status]) => status !== "ready").map(([name, status]) => `${name}:${status}`);
  checklist.provider_allowlist_eligible = checklist.blocking_reasons.length === 0;
  checklist.status = checklist.provider_allowlist_eligible ? "READY_FOR_DRY_RUN" : "READY_FOR_RESOURCES";
  return checklist;
}

export function createPhase3BDryRun(raw: unknown): {
  status: "DRY_RUN_COMPLETE";
  submitted_to_provider: false;
  payload_summary: Record<string, unknown>;
} {
  const parsed = Phase3BDryRunRequestSchema.safeParse(raw);
  if (!parsed.success) {
    throw new GatewayError("PHASE3B_DRY_RUN_INVALID", "Dry-run resources or GenerationPlan are incomplete.", 422, false, {
      issues: zodIssues(parsed.error.issues, "dry_run"),
    });
  }
  const input = parsed.data;
  const lora = validateLoraImport(input.lora, input.lora_observation, [{
    id: input.base_model.id,
    base_architecture: input.base_model.base_architecture,
    ready: true,
  }]);
  const workflow = validateWorkflowImport(input.workflow_import);
  const planIssues = validateDryRunPlan(input.plan, input);
  const issues = [...lora.issues, ...workflow.issues, ...planIssues];
  if (issues.length) {
    throw new GatewayError("PHASE3B_DRY_RUN_BLOCKED", "Dry run is blocked by resource validation.", 422, false, { issues });
  }
  const mapping = input.workflow_import.node_mapping.nodes;
  const ratio = input.plan.input.aspect_ratio;
  const [width, height] = ratio === "1:1" ? [1024, 1024] : [768, 1024];
  const seed = integerOrNull(input.plan.input.structured_options.seed);
  return {
    status: "DRY_RUN_COMPLETE",
    submitted_to_provider: false,
    payload_summary: {
      schema_version: "phase3b-dry-run/1.0",
      workflow: {
        id: input.workflow_import.workflow_id,
        version: input.workflow_import.version,
        workflow_sha256: hashJson(input.workflow_import.workflow),
        node_mapping_sha256: hashJson(input.workflow_import.node_mapping),
      },
      bindings: {
        model_id: input.base_model.id,
        lora_id: input.lora.id,
        lora_version: input.lora.version,
        lora_weight: input.plan.lora_bindings?.[0]?.weight,
        trigger_word_count: input.lora.trigger_words.length,
      },
      replacements: {
        model: redactedTarget(mapping.model, input.base_model.id),
        lora_model: redactedTarget(mapping.lora_model, input.lora.id),
        lora_strength: redactedTarget(mapping.lora_strength, input.plan.lora_bindings?.[0]?.weight),
        reference_image: redactedTarget(mapping.reference_image, opaqueId(input.plan.reference_asset_id)),
        positive_prompt: redactedTarget(mapping.positive_prompt, textSummary(input.plan.prompt_package?.positivePrompt ?? input.plan.input.prompt)),
        negative_prompt: redactedTarget(mapping.negative_prompt, textSummary(input.plan.prompt_package?.negativePrompt ?? "")),
        seed: redactedTarget(mapping.seed, seed === null ? "runtime-generated" : seed),
        width: redactedTarget(mapping.width, width),
        height: redactedTarget(mapping.height, height),
        output: redactedTarget(mapping.output, {
          bucket: input.storage.bucket,
          owner_ref: opaqueId(input.plan.user_id),
          job_ref: opaqueId(input.plan.job_id),
          output_count: input.plan.input.output_count,
        }),
      },
    },
  };
}

export function assertLoraRegistryPromotionReady(value: Record<string, unknown>): void {
  if (!["testing", "production"].includes(String(value.status))) return;
  if (value.base_architecture === "mock" && value.source === "phase3a-mock-only") return;
  const manifest = {
    id: value.id,
    name: value.name,
    version: value.version,
    file_reference: value.storage_path,
    sha256: value.sha256,
    file_size_bytes: value.file_size_bytes,
    base_architecture: value.base_architecture,
    compatible_model_ids: value.compatible_model_ids,
    trigger_words: value.trigger_words,
    default_weight: value.default_weight,
    min_weight: value.min_weight,
    max_weight: value.max_weight,
    source: value.source,
    license: value.license,
    status: value.status,
  };
  const observation = {
    exists: value.file_exists,
    sha256: value.observed_sha256,
    size_bytes: value.observed_size_bytes,
    verified_at: value.validated_at,
    verifier: value.validation_verifier,
  };
  const result = validateLoraImport(manifest, observation);
  if (!result.valid || value.validation_status !== "ready") {
    throw new GatewayError("LORA_RESOURCE_NOT_READY", "LoRA cannot enter testing or production until every required resource field is validated.", 422, false, {
      issues: result.issues,
    });
  }
}

function validateDryRunPlan(plan: GenerationPlan, input: Phase3BDryRunRequest): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (plan.selected_workflow_id !== input.workflow_import.workflow_id) {
    issues.push(issue("DRY_RUN_WORKFLOW_MISMATCH", "plan.selected_workflow_id", "Plan workflow does not match imported workflow."));
  }
  if (plan.selected_model_id !== input.base_model.id) {
    issues.push(issue("DRY_RUN_MODEL_MISMATCH", "plan.selected_model_id", "Plan model does not match imported model."));
  }
  if (!plan.selected_lora_ids.includes(input.lora.id) || plan.lora_bindings?.[0]?.lora_id !== input.lora.id) {
    issues.push(issue("DRY_RUN_LORA_MISMATCH", "plan.selected_lora_ids", "Plan LoRA does not match imported LoRA."));
  }
  if (!plan.reference_asset_id || !plan.character_id || plan.input.reference_assets.length !== 1) {
    issues.push(issue("DRY_RUN_REFERENCE_INCOMPLETE", "plan", "Plan requires one reference asset and one character."));
  }
  if (plan.input.creation_mode !== "image_to_image" || plan.input.media_type !== "image") {
    issues.push(issue("DRY_RUN_MODE_UNSUPPORTED", "plan.input", "Only image reference remake plans are supported."));
  }
  return issues;
}

function isModelReady(value: Record<string, unknown> | undefined): boolean {
  if (!value) return false;
  const license = value.license_metadata as Record<string, unknown> | undefined;
  return ["testing", "production"].includes(String(value.status))
    && Sha256Schema.safeParse(value.checksum).success
    && SafeResourceReferenceSchema.safeParse(value.storage_path).success
    && Boolean(license?.license_status === "ready");
}

function isRegistryLoraReady(value: Record<string, unknown> | undefined, models: Array<{ id: string; base_architecture: string; ready: boolean }>): boolean {
  if (!value) return false;
  const result = validateLoraImport({
    id: value.id,
    name: value.name,
    version: value.version,
    file_reference: value.storage_path,
    sha256: value.sha256,
    file_size_bytes: value.file_size_bytes,
    base_architecture: value.base_architecture,
    compatible_model_ids: value.compatible_model_ids,
    trigger_words: value.trigger_words,
    default_weight: value.default_weight,
    min_weight: value.min_weight,
    max_weight: value.max_weight,
    source: value.source,
    license: value.license,
    status: value.status,
  }, {
    exists: value.file_exists,
    sha256: value.observed_sha256,
    size_bytes: value.observed_size_bytes,
    verified_at: value.validated_at,
    verifier: value.validation_verifier,
  }, models);
  return result.valid && value.validation_status === "ready";
}

function roleClassMatches(role: string, classType: string): boolean {
  const rules: Record<string, RegExp> = {
    model: /(model|unet|checkpoint).*loader/i,
    lora_model: /lora.*loader/i,
    lora_strength: /lora.*loader/i,
    reference_image: /(load.*image|image.*loader)/i,
    positive_prompt: /(clip.*text|text.*encode|prompt)/i,
    negative_prompt: /(clip.*text|text.*encode|prompt)/i,
    seed: /(sampler|seed)/i,
    width: /(latent|empty.*image|size)/i,
    height: /(latent|empty.*image|size)/i,
    output: /(save.*image|image.*save)/i,
  };
  return rules[role]?.test(classType) ?? false;
}

function findForbiddenValues(value: unknown, path = ""): string[] {
  if (typeof value === "string") return hasForbiddenLocalPath(value) || secretLike(value) ? [path || "$"] : [];
  if (Array.isArray(value)) return value.flatMap((item, index) => findForbiddenValues(item, `${path}[${index}]`));
  if (value && typeof value === "object") {
    return Object.entries(value as Record<string, unknown>).flatMap(([key, item]) =>
      findForbiddenValues(item, path ? `${path}.${key}` : key));
  }
  return [];
}

function hasForbiddenLocalPath(value: string): boolean {
  return /(^|[\s"'=])(?:[a-zA-Z]:[\\/]|\/(?:root|home|Users|var\/run|etc)\/|~\/)|(?:127\.0\.0\.1|localhost):\d+/i.test(value);
}

function secretLike(value: string): boolean {
  return /(sb_secret_|service_role|api[_-]?key\s*[:=]|bearer\s+[a-z0-9._-]{12,}|webhook[_-]?secret)/i.test(value);
}

function zodIssues(issues: z.core.$ZodIssue[], prefix: string): ValidationIssue[] {
  return issues.map((item) => issue("SCHEMA_INVALID", [prefix, ...item.path.map(String)].join("."), item.message));
}

function issue(code: string, path: string, message: string): ValidationIssue {
  return { code, path, message };
}

function hashJson(value: unknown): string {
  return createHash("sha256").update(stableJson(value)).digest("hex");
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b))
      .map(([key, item]) => `${JSON.stringify(key)}:${stableJson(item)}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function textSummary(value: string): { sha256: string; length: number } {
  return { sha256: createHash("sha256").update(value).digest("hex"), length: value.length };
}

function opaqueId(value: string | undefined): string {
  return value ? `sha256:${createHash("sha256").update(value).digest("hex").slice(0, 16)}` : "missing";
}

function redactedTarget(target: z.infer<typeof NodeTargetSchema>, value: unknown) {
  return { node_id: target.node_id, input_name: target.input_name, value };
}

function integerOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isSafeInteger(value) ? value : null;
}
