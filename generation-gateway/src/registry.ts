import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { WorkflowManifest } from "./domain.js";
import { RegistryStatusSchema, WorkflowManifestSchema } from "./domain.js";
import { GatewayError, newId } from "./errors.js";
import { listWorkflowManifests } from "./planning.js";
import type { ReferenceAnalysis } from "./reference-analysis.js";
import { ReferenceAnalysisSchema } from "./reference-analysis.js";
import {
  MOCK_REFERENCE_LORA_ID,
  MOCK_REFERENCE_MODEL_ID,
} from "./mock-reference-workflow.js";
import { assertLoraRegistryPromotionReady } from "./phase3b-resource-integration.js";

const SemverSchema = z.string().regex(/^\d+\.\d+\.\d+$/);
export const LoraRegistryPatchSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  version: SemverSchema.optional(),
  status: RegistryStatusSchema.optional(),
  compatible_model_ids: z.array(z.string().trim().min(1)).max(20).optional(),
  trigger_words: z.array(z.string().trim().min(1).max(100)).max(20).optional(),
  default_weight: z.number().min(-2).max(2).optional(),
  min_weight: z.number().min(-2).max(2).optional(),
  max_weight: z.number().min(-2).max(2).optional(),
  filename: z.string().trim().min(1).max(500).nullable().optional(),
  storage_path: z.string().trim().min(1).max(1000).nullable().optional(),
  sha256: z.string().regex(/^[a-f0-9]{64}$/).nullable().optional(),
  file_size_bytes: z.number().int().positive().max(100 * 1024 * 1024 * 1024).nullable().optional(),
  file_exists: z.boolean().optional(),
  observed_sha256: z.string().regex(/^[a-f0-9]{64}$/).nullable().optional(),
  observed_size_bytes: z.number().int().positive().max(100 * 1024 * 1024 * 1024).nullable().optional(),
  validation_status: z.enum(["missing", "validating", "invalid", "ready"]).optional(),
  validation_verifier: z.enum(["storage", "worker"]).nullable().optional(),
  validation_errors: z.array(z.string().trim().min(1).max(500)).max(50).optional(),
  validated_at: z.string().datetime().nullable().optional(),
  license: z.string().trim().min(1).max(500).nullable().optional(),
  source: z.string().trim().min(1).max(1000).nullable().optional(),
  preview_assets: z.array(z.string().trim().min(1).max(500)).max(20).optional(),
  benchmark_score: z.number().min(0).max(1).nullable().optional(),
}).strict();

export type LoraRegistryPatch = z.infer<typeof LoraRegistryPatchSchema>;

export interface ReferenceAnalysisRecord {
  id: string;
  owner_user_id: string;
  reference_asset_id: string;
  analysis: ReferenceAnalysis;
  analyzer_version: string;
  confirmed_analysis: ReferenceAnalysis | null;
  confirmed_at: string | null;
}

export interface RegistryStore {
  listWorkflows(): Promise<WorkflowManifest[]>;
  getWorkflowResource(id: string): Promise<Record<string, unknown> | null>;
  createWorkflow(manifest: WorkflowManifest, actorId: string): Promise<WorkflowManifest>;
  patchWorkflow(id: string, patch: Partial<WorkflowManifest>, actorId?: string): Promise<WorkflowManifest>;
  listWorkflowVersions(id: string): Promise<Record<string, unknown>[]>;
  listModels(): Promise<Record<string, unknown>[]>;
  listLoras(): Promise<Record<string, unknown>[]>;
  patchLora(id: string, patch: LoraRegistryPatch, actorId: string): Promise<Record<string, unknown>>;
  listLoraVersions(id: string): Promise<Record<string, unknown>[]>;
  listWorkflowLoraCompatibility(): Promise<Record<string, unknown>[]>;
  listProviders(): Promise<Record<string, unknown>[]>;
  getCharacterForUser(characterId: string, userId: string): Promise<CharacterBinding | null>;
  listCharactersForUser(userId: string): Promise<CharacterBinding[]>;
  ensureMockCharacter(userId: string): Promise<CharacterBinding>;
  createReferenceAnalysis(userId: string, referenceAssetId: string, analysis: ReferenceAnalysis): Promise<ReferenceAnalysisRecord>;
  confirmReferenceAnalysis(id: string, userId: string, analysis: ReferenceAnalysis): Promise<ReferenceAnalysisRecord>;
  getReferenceAnalysis(id: string, userId: string): Promise<ReferenceAnalysisRecord | null>;
}

export interface CharacterBinding {
  id: string;
  owner_user_id: string;
  display_name: string;
  description: string;
  is_adult: boolean;
  declared_age: number;
  base_model_id: string;
  lora_id: string;
  lora_version: string;
  default_lora_weight: number;
  min_lora_weight: number;
  max_lora_weight: number;
  trigger_words: string[];
  reference_asset_ids: string[];
  cover_asset_id: string | null;
  status: "draft" | "testing" | "production" | "deprecated" | "disabled";
}

const mockLora = {
  id: MOCK_REFERENCE_LORA_ID,
  name: "Phase 3A mock character binding",
  category: "character",
  base_architecture: "mock",
  version: "1.0.0",
  trigger_words: ["phase3a_mock_character"],
  default_weight: 1,
  min_weight: 0.6,
  max_weight: 1.2,
  compatible_model_ids: [MOCK_REFERENCE_MODEL_ID],
  status: "testing",
  filename: null,
  storage_path: null,
  sha256: null,
  license: "not-applicable-mock",
  source: "phase3a-mock-only",
  preview_assets: ["mock-preview-1", "mock-preview-2", "mock-preview-3"],
  benchmark_score: null,
};

export class MemoryRegistryStore implements RegistryStore {
  private readonly workflows = new Map(listWorkflowManifests().map((item) => [item.id, item]));
  private readonly workflowVersions = new Map<string, Record<string, unknown>[]>();
  private readonly loras = new Map<string, Record<string, unknown>>([[MOCK_REFERENCE_LORA_ID, structuredClone(mockLora)]]);
  private readonly loraVersions = new Map<string, Record<string, unknown>[]>();
  private readonly characters = new Map<string, CharacterBinding>();
  private readonly analyses = new Map<string, ReferenceAnalysisRecord>();

  async listWorkflows(): Promise<WorkflowManifest[]> { return [...this.workflows.values()].map((item) => structuredClone(item)); }
  async getWorkflowResource(id: string) {
    const manifest = this.workflows.get(id);
    return manifest ? {
      ...structuredClone(manifest),
      workflow_import_status: "missing",
      workflow_json_sha256: null,
      node_mapping: null,
      node_mapping_sha256: null,
    } : null;
  }
  async createWorkflow(manifest: WorkflowManifest): Promise<WorkflowManifest> {
    if (this.workflows.has(manifest.id)) throw new GatewayError("WORKFLOW_ALREADY_EXISTS", "Workflow already exists.", 409);
    this.workflows.set(manifest.id, structuredClone(manifest));
    return structuredClone(manifest);
  }
  async patchWorkflow(id: string, patch: Partial<WorkflowManifest>, actorId = "system"): Promise<WorkflowManifest> {
    const current = this.workflows.get(id);
    if (!current) throw new GatewayError("WORKFLOW_NOT_FOUND", "Workflow was not found.", 404);
    const next = WorkflowManifestSchema.parse({
      ...current,
      ...patch,
      capability: patch.capability ? { ...current.capability, ...patch.capability } : current.capability,
      id,
    });
    archiveMemory(this.workflowVersions, id, current, actorId);
    this.workflows.set(id, next);
    return structuredClone(next);
  }
  async listWorkflowVersions(id: string) { return structuredClone(this.workflowVersions.get(id) ?? []); }
  async listModels() { return [{ id: MOCK_REFERENCE_MODEL_ID, status: "testing", model_type: "placeholder" }]; }
  async listLoras() { return [...this.loras.values()].map((item) => structuredClone(item)); }
  async patchLora(id: string, patch: LoraRegistryPatch, actorId: string) {
    const current = this.loras.get(id);
    if (!current) throw new GatewayError("LORA_NOT_FOUND", "LoRA was not found.", 404);
    const next = validateLoraPatch(current, patch);
    archiveMemory(this.loraVersions, id, current, actorId);
    this.loras.set(id, next);
    return structuredClone(next);
  }
  async listLoraVersions(id: string) { return structuredClone(this.loraVersions.get(id) ?? []); }
  async listWorkflowLoraCompatibility() {
    return [{
      workflow_id: "mock-character-reference-remake-v1",
      lora_id: MOCK_REFERENCE_LORA_ID,
      status: "testing",
      constraints_json: { mock_only: true, compatible_model_ids: [MOCK_REFERENCE_MODEL_ID] },
    }];
  }
  async listProviders() { return [{ id: "mock", provider_type: "mock", status: "production", capabilities: { image: true, video: true } }]; }
  async getCharacterForUser(characterId: string, userId: string) {
    const value = this.characters.get(characterId);
    return value?.owner_user_id === userId ? structuredClone(value) : null;
  }
  async listCharactersForUser(userId: string) {
    return [...this.characters.values()].filter((item) => item.owner_user_id === userId).map((item) => structuredClone(item));
  }
  async ensureMockCharacter(userId: string) {
    const id = `phase3a-mock-${userId}`;
    const existing = this.characters.get(id);
    if (existing) return structuredClone(existing);
    const value = mockCharacter(id, userId);
    this.characters.set(id, value);
    return structuredClone(value);
  }
  async createReferenceAnalysis(userId: string, referenceAssetId: string, analysis: ReferenceAnalysis) {
    const id = newId("analysis");
    const value: ReferenceAnalysisRecord = {
      id,
      owner_user_id: userId,
      reference_asset_id: referenceAssetId,
      analysis,
      analyzer_version: analysis.analyzer_version,
      confirmed_analysis: null,
      confirmed_at: null,
    };
    this.analyses.set(id, structuredClone(value));
    return structuredClone(value);
  }
  async confirmReferenceAnalysis(id: string, userId: string, analysis: ReferenceAnalysis) {
    const current = this.analyses.get(id);
    if (!current || current.owner_user_id !== userId) throw new GatewayError("REFERENCE_ANALYSIS_NOT_FOUND", "Reference analysis was not found.", 404);
    const next = { ...current, confirmed_analysis: ReferenceAnalysisSchema.parse(analysis), confirmed_at: new Date().toISOString() };
    this.analyses.set(id, next);
    return structuredClone(next);
  }
  async getReferenceAnalysis(id: string, userId: string) {
    const value = this.analyses.get(id);
    return value?.owner_user_id === userId ? structuredClone(value) : null;
  }
}

export class SupabaseRegistryStore implements RegistryStore {
  private readonly client: SupabaseClient;
  constructor(url: string, serviceRoleKey: string) {
    this.client = createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
  }
  async listWorkflows(): Promise<WorkflowManifest[]> {
    const { data, error } = await this.client.from("workflow_registry").select("manifest").order("priority");
    if (error) throw databaseError("list workflows");
    return (data ?? []).map((row) => WorkflowManifestSchema.parse(row.manifest));
  }
  async getWorkflowResource(id: string) {
    const { data, error } = await this.client.from("workflow_registry").select("*").eq("id", id).maybeSingle();
    if (error) throw databaseError("read workflow resource");
    return data as Record<string, unknown> | null;
  }
  async createWorkflow(manifest: WorkflowManifest, actorId: string): Promise<WorkflowManifest> {
    const { error } = await this.client.from("workflow_registry").insert(toWorkflowRow(manifest, actorId));
    if (error?.code === "23505") throw new GatewayError("WORKFLOW_ALREADY_EXISTS", "Workflow already exists.", 409);
    if (error) throw databaseError("create workflow");
    return manifest;
  }
  async patchWorkflow(id: string, patch: Partial<WorkflowManifest>, actorId = "system"): Promise<WorkflowManifest> {
    const { data: currentRow, error: readError } = await this.client.from("workflow_registry").select("manifest").eq("id", id).maybeSingle();
    if (readError) throw databaseError("read workflow");
    if (!currentRow) throw new GatewayError("WORKFLOW_NOT_FOUND", "Workflow was not found.", 404);
    const current = WorkflowManifestSchema.parse(currentRow.manifest);
    const next = WorkflowManifestSchema.parse({
      ...current,
      ...patch,
      capability: patch.capability ? { ...current.capability, ...patch.capability } : current.capability,
      id,
    });
    await this.archiveVersion("workflow_registry_versions", id, current.version, current, actorId);
    const { error } = await this.client.from("workflow_registry").update({
      version: next.version,
      status: next.status,
      manifest: next,
      capability: next.capability,
      provider_ids: next.provider_ids,
      model_binding_ids: next.model_binding_ids,
      lora_binding_ids: next.lora_binding_ids,
      priority: next.priority,
      updated_at: new Date().toISOString(),
    }).eq("id", id);
    if (error) throw databaseError("update workflow");
    return next;
  }
  async listWorkflowVersions(id: string) {
    return this.listTableWhere("workflow_registry_versions", "workflow_id", id);
  }
  async listModels() { return this.listTable("model_registry"); }
  async listLoras() { return this.listTable("lora_registry"); }
  async patchLora(id: string, patch: LoraRegistryPatch, actorId: string) {
    const { data: current, error: readError } = await this.client.from("lora_registry").select("*").eq("id", id).maybeSingle();
    if (readError) throw databaseError("read LoRA");
    if (!current) throw new GatewayError("LORA_NOT_FOUND", "LoRA was not found.", 404);
    const next = validateLoraPatch(current as Record<string, unknown>, patch);
    await this.archiveVersion("lora_registry_versions", id, String(current.version), current as Record<string, unknown>, actorId);
    const { id: _id, created_at: _created, updated_at: _updated, ...mutable } = next;
    const { data, error } = await this.client.from("lora_registry").update({
      ...mutable,
      updated_at: new Date().toISOString(),
    }).eq("id", id).select("*").single();
    if (error) throw databaseError("update LoRA");
    return data as Record<string, unknown>;
  }
  async listLoraVersions(id: string) {
    return this.listTableWhere("lora_registry_versions", "lora_id", id);
  }
  async listWorkflowLoraCompatibility() {
    return this.listTable("workflow_lora_compatibility");
  }
  async listProviders() { return this.listTable("provider_configs", "id,provider_type,display_name,status,capabilities,public_config"); }
  async getCharacterForUser(characterId: string, userId: string): Promise<CharacterBinding | null> {
    const { data, error } = await this.client
      .from("characters")
      .select(characterColumns)
      .eq("id", characterId)
      .eq("owner_user_id", userId)
      .maybeSingle();
    if (error) throw databaseError("read character");
    return data ? normalizeCharacter(data) : null;
  }
  async listCharactersForUser(userId: string): Promise<CharacterBinding[]> {
    const { data, error } = await this.client
      .from("characters")
      .select(characterColumns)
      .eq("owner_user_id", userId)
      .in("status", ["testing", "production"])
      .order("updated_at", { ascending: false });
    if (error) throw databaseError("list characters");
    return (data ?? []).map(normalizeCharacter);
  }
  async ensureMockCharacter(userId: string): Promise<CharacterBinding> {
    const value = mockCharacter(`phase3a-mock-${userId}`, userId);
    const { data, error } = await this.client.from("characters").upsert({
      id: value.id,
      owner_user_id: value.owner_user_id,
      name: value.display_name,
      display_name: value.display_name,
      description: value.description,
      character_type: "phase3a_mock",
      is_adult: value.is_adult,
      declared_age: value.declared_age,
      base_model_id: value.base_model_id,
      lora_id: value.lora_id,
      lora_version: value.lora_version,
      default_lora_weight: value.default_lora_weight,
      min_lora_weight: value.min_lora_weight,
      max_lora_weight: value.max_lora_weight,
      trigger_words: value.trigger_words,
      reference_asset_ids: [],
      status: value.status,
      consistency_status: "experimental",
      rights_status: "mock_only",
      safety_status: "mock_only",
    }, { onConflict: "id" }).select(characterColumns).single();
    if (error) throw databaseError("create mock character");
    return normalizeCharacter(data);
  }
  async createReferenceAnalysis(userId: string, referenceAssetId: string, analysis: ReferenceAnalysis) {
    const row = {
      id: newId("analysis"),
      owner_user_id: userId,
      reference_asset_id: referenceAssetId,
      analysis,
      analyzer_version: analysis.analyzer_version,
    };
    const { data, error } = await this.client.from("reference_analyses").insert(row).select("*").single();
    if (error) throw databaseError("save reference analysis");
    return normalizeAnalysis(data);
  }
  async confirmReferenceAnalysis(id: string, userId: string, analysis: ReferenceAnalysis) {
    const confirmed = ReferenceAnalysisSchema.parse(analysis);
    const { data, error } = await this.client.from("reference_analyses").update({
      confirmed_analysis: confirmed,
      confirmed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq("id", id).eq("owner_user_id", userId).select("*").maybeSingle();
    if (error) throw databaseError("confirm reference analysis");
    if (!data) throw new GatewayError("REFERENCE_ANALYSIS_NOT_FOUND", "Reference analysis was not found.", 404);
    return normalizeAnalysis(data);
  }
  async getReferenceAnalysis(id: string, userId: string) {
    const { data, error } = await this.client.from("reference_analyses").select("*")
      .eq("id", id).eq("owner_user_id", userId).maybeSingle();
    if (error) throw databaseError("read reference analysis");
    return data ? normalizeAnalysis(data) : null;
  }
  private async archiveVersion(table: string, registryId: string, version: string, snapshot: unknown, actorId: string) {
    const key = table === "workflow_registry_versions" ? "workflow_id" : "lora_id";
    const { error } = await this.client.from(table).insert({
      id: newId("revision"),
      [key]: registryId,
      version,
      snapshot,
      changed_by: actorId,
    });
    if (error) throw databaseError(`archive ${registryId}`);
  }
  private async listTable(table: string, columns = "*"): Promise<Record<string, unknown>[]> {
    const { data, error } = await this.client.from(table).select(columns);
    if (error) throw databaseError(`list ${table}`);
    return (data ?? []) as unknown as Record<string, unknown>[];
  }
  private async listTableWhere(table: string, column: string, value: string) {
    const { data, error } = await this.client.from(table).select("*").eq(column, value).order("created_at", { ascending: false });
    if (error) throw databaseError(`list ${table}`);
    return (data ?? []) as Record<string, unknown>[];
  }
}

const characterColumns = "id,owner_user_id,display_name,description,is_adult,declared_age,base_model_id,lora_id,lora_version,default_lora_weight,min_lora_weight,max_lora_weight,trigger_words,reference_asset_ids,cover_asset_id,status";

function mockCharacter(id: string, userId: string): CharacterBinding {
  return {
    id,
    owner_user_id: userId,
    display_name: "Phase 3A Mock Character",
    description: "Mock-only adult character metadata for the reference pipeline acceptance flow.",
    is_adult: true,
    declared_age: 25,
    base_model_id: MOCK_REFERENCE_MODEL_ID,
    lora_id: MOCK_REFERENCE_LORA_ID,
    lora_version: "1.0.0",
    default_lora_weight: 1,
    min_lora_weight: 0.6,
    max_lora_weight: 1.2,
    trigger_words: ["phase3a_mock_character"],
    reference_asset_ids: [],
    cover_asset_id: null,
    status: "testing",
  };
}

function normalizeCharacter(value: Record<string, unknown>): CharacterBinding {
  return {
    id: String(value.id),
    owner_user_id: String(value.owner_user_id),
    display_name: String(value.display_name),
    description: String(value.description ?? ""),
    is_adult: Boolean(value.is_adult),
    declared_age: Number(value.declared_age),
    base_model_id: String(value.base_model_id),
    lora_id: String(value.lora_id),
    lora_version: String(value.lora_version),
    default_lora_weight: Number(value.default_lora_weight),
    min_lora_weight: Number(value.min_lora_weight),
    max_lora_weight: Number(value.max_lora_weight),
    trigger_words: Array.isArray(value.trigger_words) ? value.trigger_words.map(String) : [],
    reference_asset_ids: Array.isArray(value.reference_asset_ids) ? value.reference_asset_ids.map(String) : [],
    cover_asset_id: value.cover_asset_id ? String(value.cover_asset_id) : null,
    status: value.status as CharacterBinding["status"],
  };
}

function normalizeAnalysis(value: Record<string, unknown>): ReferenceAnalysisRecord {
  return {
    id: String(value.id),
    owner_user_id: String(value.owner_user_id),
    reference_asset_id: String(value.reference_asset_id),
    analysis: ReferenceAnalysisSchema.parse(value.analysis),
    analyzer_version: String(value.analyzer_version),
    confirmed_analysis: value.confirmed_analysis ? ReferenceAnalysisSchema.parse(value.confirmed_analysis) : null,
    confirmed_at: value.confirmed_at ? String(value.confirmed_at) : null,
  };
}

function validateLoraPatch(current: Record<string, unknown>, patch: LoraRegistryPatch): Record<string, unknown> {
  const next = { ...current, ...patch };
  const min = Number(next.min_weight);
  const value = Number(next.default_weight);
  const max = Number(next.max_weight);
  if (![min, value, max].every(Number.isFinite) || min > value || value > max) {
    throw new GatewayError("LORA_WEIGHT_RANGE_INVALID", "LoRA weights must satisfy min <= default <= max.", 422);
  }
  if (patch.status && !allowedStatusTransition(String(current.status), patch.status)) {
    throw new GatewayError("REGISTRY_STATUS_TRANSITION_INVALID", "The requested registry status transition is not allowed.", 409);
  }
  assertLoraRegistryPromotionReady(next);
  return next;
}

function allowedStatusTransition(from: string, to: string): boolean {
  if (from === to) return true;
  const transitions: Record<string, string[]> = {
    draft: ["testing", "disabled"],
    testing: ["production", "deprecated", "disabled", "draft"],
    production: ["deprecated", "disabled"],
    deprecated: ["testing", "disabled"],
    disabled: ["draft"],
  };
  return (transitions[from] ?? []).includes(to);
}

function archiveMemory(target: Map<string, Record<string, unknown>[]>, id: string, snapshot: unknown, actorId: string) {
  const versions = target.get(id) ?? [];
  versions.unshift({
    id: newId("revision"),
    version: String((snapshot as Record<string, unknown>).version ?? "0.0.0"),
    snapshot: structuredClone(snapshot),
    changed_by: actorId,
    created_at: new Date().toISOString(),
  });
  target.set(id, versions);
}

function toWorkflowRow(manifest: WorkflowManifest, actorId: string) {
  return {
    id: manifest.id,
    version: manifest.version,
    status: manifest.status,
    manifest,
    capability: manifest.capability,
    provider_ids: manifest.provider_ids,
    model_binding_ids: manifest.model_binding_ids,
    lora_binding_ids: manifest.lora_binding_ids,
    priority: manifest.priority,
    created_by: actorId,
  };
}

function databaseError(operation: string): GatewayError {
  return new GatewayError("REGISTRY_DATABASE_FAILED", `Could not ${operation}.`, 503, true);
}
