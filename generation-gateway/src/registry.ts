import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { WorkflowManifest } from "./domain.js";
import { WorkflowManifestSchema } from "./domain.js";
import { GatewayError } from "./errors.js";
import { listWorkflowManifests } from "./planning.js";

export interface RegistryStore {
  listWorkflows(): Promise<WorkflowManifest[]>;
  createWorkflow(manifest: WorkflowManifest, actorId: string): Promise<WorkflowManifest>;
  patchWorkflow(id: string, patch: Partial<WorkflowManifest>): Promise<WorkflowManifest>;
  listModels(): Promise<Record<string, unknown>[]>;
  listLoras(): Promise<Record<string, unknown>[]>;
  listProviders(): Promise<Record<string, unknown>[]>;
}

export class MemoryRegistryStore implements RegistryStore {
  private readonly workflows = new Map(listWorkflowManifests().map((item) => [item.id, item]));
  async listWorkflows(): Promise<WorkflowManifest[]> { return [...this.workflows.values()].map((item) => structuredClone(item)); }
  async createWorkflow(manifest: WorkflowManifest): Promise<WorkflowManifest> {
    if (this.workflows.has(manifest.id)) throw new GatewayError("WORKFLOW_ALREADY_EXISTS", "Workflow already exists.", 409);
    this.workflows.set(manifest.id, structuredClone(manifest));
    return structuredClone(manifest);
  }
  async patchWorkflow(id: string, patch: Partial<WorkflowManifest>): Promise<WorkflowManifest> {
    const current = this.workflows.get(id);
    if (!current) throw new GatewayError("WORKFLOW_NOT_FOUND", "Workflow was not found.", 404);
    const next = WorkflowManifestSchema.parse({
      ...current,
      ...patch,
      capability: patch.capability ? { ...current.capability, ...patch.capability } : current.capability,
      id,
    });
    this.workflows.set(id, next);
    return structuredClone(next);
  }
  async listModels() { return [{ id: "model-placeholder-v1", status: "testing", model_type: "placeholder" }]; }
  async listLoras() { return []; }
  async listProviders() { return [{ id: "mock", provider_type: "mock", status: "production", capabilities: { image: true, video: true } }]; }
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
  async createWorkflow(manifest: WorkflowManifest, actorId: string): Promise<WorkflowManifest> {
    const { error } = await this.client.from("workflow_registry").insert(toWorkflowRow(manifest, actorId));
    if (error?.code === "23505") throw new GatewayError("WORKFLOW_ALREADY_EXISTS", "Workflow already exists.", 409);
    if (error) throw databaseError("create workflow");
    return manifest;
  }
  async patchWorkflow(id: string, patch: Partial<WorkflowManifest>): Promise<WorkflowManifest> {
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
  async listModels() { return this.listTable("model_registry"); }
  async listLoras() { return this.listTable("lora_registry"); }
  async listProviders() { return this.listTable("provider_configs", "id,provider_type,display_name,status,capabilities,public_config"); }
  private async listTable(table: string, columns = "*"): Promise<Record<string, unknown>[]> {
    const { data, error } = await this.client.from(table).select(columns);
    if (error) throw databaseError(`list ${table}`);
    return (data ?? []) as unknown as Record<string, unknown>[];
  }
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
