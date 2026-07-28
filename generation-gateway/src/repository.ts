import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type {
  GenerationAsset,
  GenerationEvent,
  GenerationInput,
  GenerationJob,
  GenerationPlan,
  GenerationReview,
  GenerationStatus,
  ParsedCreativeBrief,
} from "./domain.js";
import { GatewayError, newId } from "./errors.js";
import { assertTransition } from "./state-machine.js";

export interface ListJobsOptions {
  status?: GenerationStatus;
  limit: number;
  offset: number;
}

export interface ProviderCostMetrics {
  provider_attempt_id?: string;
  gpu_type?: string;
  generation_duration_ms?: number;
  output_count?: number;
  cost_per_output?: number;
}

export interface GenerationRepository {
  createJob(userId: string, input: GenerationInput, retryOfJobId?: string): Promise<GenerationJob>;
  findByIdempotencyKey(userId: string, key: string): Promise<GenerationJob | null>;
  findByProviderJobId(providerJobId: string): Promise<GenerationJob | null>;
  getJob(jobId: string): Promise<GenerationJob | null>;
  listJobs(userId: string, options: ListJobsOptions): Promise<GenerationJob[]>;
  transition(jobId: string, to: GenerationStatus, patch?: Partial<GenerationJob>): Promise<GenerationJob>;
  patchJob(jobId: string, patch: Partial<GenerationJob>): Promise<GenerationJob>;
  appendEvent(event: Omit<GenerationEvent, "id" | "created_at">): Promise<boolean>;
  addAttempt(jobId: string, userId: string, provider: string, providerJobId: string, estimatedCost: number): Promise<void>;
  completeAttempt(providerJobId: string, status: "completed" | "failed" | "cancelled", cost: number, errorCode?: string, metrics?: ProviderCostMetrics): Promise<void>;
  saveAssets(userId: string, assets: GenerationAsset[]): Promise<void>;
  saveReview(userId: string, review: GenerationReview): Promise<void>;
  recordBilling(userId: string, jobId: string, operation: "estimate" | "reserve" | "capture" | "release" | "refund", amount: number, idempotencyKey: string, provider?: string, metrics?: ProviderCostMetrics): Promise<boolean>;
  ownedAssetIds(userId: string, ids: string[]): Promise<ReadonlySet<string>>;
  createReferenceSignedUrl(userId: string, assetId: string, expiresInSeconds: number): Promise<string>;
  listEvents(jobId: string): Promise<GenerationEvent[]>;
  ready(): Promise<boolean>;
}

export class MemoryGenerationRepository implements GenerationRepository {
  private readonly jobs = new Map<string, GenerationJob>();
  private readonly events: GenerationEvent[] = [];
  private readonly eventKeys = new Set<string>();
  private readonly billingKeys = new Set<string>();
  private readonly ownedAssets = new Map<string, Set<string>>();

  seedOwnedAsset(userId: string, assetId: string): void {
    const values = this.ownedAssets.get(userId) ?? new Set<string>();
    values.add(assetId);
    this.ownedAssets.set(userId, values);
  }

  async createJob(userId: string, input: GenerationInput, retryOfJobId?: string): Promise<GenerationJob> {
    const now = new Date().toISOString();
    const job: GenerationJob = {
      id: newId("job"),
      user_id: userId,
      status: "draft",
      input,
      output_count: input.output_count,
      estimated_cost: 0,
      attempt_count: 0,
      assets: [],
      created_at: now,
      updated_at: now,
      ...(input.idempotency_key ? { idempotency_key: input.idempotency_key } : {}),
      ...(retryOfJobId ? { retry_of_job_id: retryOfJobId } : {}),
    };
    this.jobs.set(job.id, structuredClone(job));
    return structuredClone(job);
  }

  async findByIdempotencyKey(userId: string, key: string): Promise<GenerationJob | null> {
    const match = [...this.jobs.values()].find((job) => job.user_id === userId && job.idempotency_key === key);
    return match ? structuredClone(match) : null;
  }

  async findByProviderJobId(providerJobId: string): Promise<GenerationJob | null> {
    const match = [...this.jobs.values()].find((job) => job.provider_job_id === providerJobId);
    return match ? structuredClone(match) : null;
  }

  async getJob(jobId: string): Promise<GenerationJob | null> {
    const job = this.jobs.get(jobId);
    return job ? structuredClone(job) : null;
  }

  async listJobs(userId: string, options: ListJobsOptions): Promise<GenerationJob[]> {
    return [...this.jobs.values()]
      .filter((job) => job.user_id === userId && (!options.status || job.status === options.status))
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(options.offset, options.offset + options.limit)
      .map((job) => structuredClone(job));
  }

  async transition(jobId: string, to: GenerationStatus, patch: Partial<GenerationJob> = {}): Promise<GenerationJob> {
    const current = this.jobs.get(jobId);
    if (!current) throw new GatewayError("GENERATION_JOB_NOT_FOUND", "Generation job was not found.", 404);
    assertTransition(current.status, to);
    const now = new Date().toISOString();
    const next = { ...current, ...patch, status: to, updated_at: now };
    this.jobs.set(jobId, structuredClone(next));
    await this.appendEvent({
      job_id: jobId,
      event_type: "status.changed",
      from_status: current.status,
      to_status: to,
      payload: {},
      idempotency_key: `transition:${jobId}:${current.status}:${to}:${now}`,
    });
    return structuredClone(next);
  }

  async patchJob(jobId: string, patch: Partial<GenerationJob>): Promise<GenerationJob> {
    const current = this.jobs.get(jobId);
    if (!current) throw new GatewayError("GENERATION_JOB_NOT_FOUND", "Generation job was not found.", 404);
    const next = { ...current, ...patch, updated_at: new Date().toISOString() };
    this.jobs.set(jobId, structuredClone(next));
    return structuredClone(next);
  }

  async appendEvent(event: Omit<GenerationEvent, "id" | "created_at">): Promise<boolean> {
    if (event.idempotency_key && this.eventKeys.has(event.idempotency_key)) return false;
    if (event.idempotency_key) this.eventKeys.add(event.idempotency_key);
    this.events.push({ ...event, id: newId("evt"), created_at: new Date().toISOString() });
    return true;
  }

  async addAttempt(jobId: string): Promise<void> {
    const job = await this.getRequired(jobId);
    await this.patchJob(jobId, { attempt_count: job.attempt_count + 1 });
  }
  async completeAttempt(): Promise<void> {}
  async saveAssets(userId: string, assets: GenerationAsset[]): Promise<void> {
    const values = this.ownedAssets.get(userId) ?? new Set<string>();
    assets.forEach((asset) => values.add(asset.id));
    this.ownedAssets.set(userId, values);
  }
  async saveReview(_userId: string, review: GenerationReview): Promise<void> {
    await this.patchJob(review.job_id, { review });
  }
  async recordBilling(_userId: string, _jobId: string, _operation: "estimate" | "reserve" | "capture" | "release" | "refund", _amount: number, idempotencyKey: string, _provider?: string, _metrics?: ProviderCostMetrics): Promise<boolean> {
    if (this.billingKeys.has(idempotencyKey)) return false;
    this.billingKeys.add(idempotencyKey);
    return true;
  }
  async ownedAssetIds(userId: string, ids: string[]): Promise<ReadonlySet<string>> {
    const values = this.ownedAssets.get(userId) ?? new Set<string>();
    return new Set(ids.filter((id) => values.has(id)));
  }
  async createReferenceSignedUrl(userId: string, assetId: string): Promise<string> {
    const owned = this.ownedAssets.get(userId);
    if (!owned?.has(assetId)) throw new GatewayError("INPUT_ASSET_NOT_OWNED", "The reference asset is not owned by the authenticated user.", 403);
    return `https://storage.invalid/signed/${encodeURIComponent(userId)}/${encodeURIComponent(assetId)}`;
  }
  async listEvents(jobId: string): Promise<GenerationEvent[]> {
    return this.events.filter((event) => event.job_id === jobId).map((event) => structuredClone(event));
  }
  async ready(): Promise<boolean> { return true; }

  private async getRequired(jobId: string): Promise<GenerationJob> {
    const job = await this.getJob(jobId);
    if (!job) throw new GatewayError("GENERATION_JOB_NOT_FOUND", "Generation job was not found.", 404);
    return job;
  }
}

export class SupabaseGenerationRepository implements GenerationRepository {
  private readonly client: SupabaseClient;

  constructor(url: string, serviceRoleKey: string) {
    this.client = createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
  }

  async createJob(userId: string, input: GenerationInput, retryOfJobId?: string): Promise<GenerationJob> {
    const id = newId("job");
    const row = {
      id,
      user_id: userId,
      media_type: input.media_type,
      creation_mode: input.creation_mode,
      prompt: input.prompt,
      original_prompt: input.prompt,
      status: "draft",
      input_params: input,
      output_count: input.output_count,
      estimated_cost: 0,
      idempotency_key: input.idempotency_key ?? null,
      retry_of_job_id: retryOfJobId ?? null,
      attempt_count: 0,
      provider: "mock",
      model: "registry-placeholder",
      aspect_ratio: input.aspect_ratio,
      cost_credits: 0,
      estimated_cost_cents: 0,
      progress: 0,
      safety_status: "pending_review",
    };
    const { data, error } = await this.client.from("generation_jobs").insert(row).select("*").single();
    if (error) {
      if (error.code === "23505" && input.idempotency_key) {
        const existing = await this.findByIdempotencyKey(userId, input.idempotency_key);
        if (existing) return existing;
      }
      throw new GatewayError("DATABASE_WRITE_FAILED", "Could not create generation job.", 503, true);
    }
    return mapSupabaseJob(data);
  }

  async findByIdempotencyKey(userId: string, key: string): Promise<GenerationJob | null> {
    const { data, error } = await this.client.from("generation_jobs").select("*")
      .eq("user_id", userId).eq("idempotency_key", key).maybeSingle();
    if (error) throw new GatewayError("DATABASE_READ_FAILED", "Could not read generation job.", 503, true);
    return data ? mapSupabaseJob(data) : null;
  }

  async findByProviderJobId(providerJobId: string): Promise<GenerationJob | null> {
    const { data, error } = await this.client.from("generation_jobs").select("*")
      .eq("provider_job_id", providerJobId).maybeSingle();
    if (error) throw new GatewayError("DATABASE_READ_FAILED", "Could not read provider job.", 503, true);
    return data ? mapSupabaseJob(data) : null;
  }

  async getJob(jobId: string): Promise<GenerationJob | null> {
    const { data, error } = await this.client.from("generation_jobs").select("*,generation_assets(*)")
      .eq("id", jobId).maybeSingle();
    if (error) throw new GatewayError("DATABASE_READ_FAILED", "Could not read generation job.", 503, true);
    return data ? this.mapJobWithFreshAssetUrls(data) : null;
  }

  async listJobs(userId: string, options: ListJobsOptions): Promise<GenerationJob[]> {
    let query = this.client.from("generation_jobs").select("*,generation_assets(*)")
      .eq("user_id", userId).order("created_at", { ascending: false })
      .range(options.offset, options.offset + options.limit - 1);
    if (options.status) query = query.eq("status", options.status);
    const { data, error } = await query;
    if (error) throw new GatewayError("DATABASE_READ_FAILED", "Could not list generation jobs.", 503, true);
    return Promise.all((data ?? []).map((row) => this.mapJobWithFreshAssetUrls(row)));
  }

  async transition(jobId: string, to: GenerationStatus, patch: Partial<GenerationJob> = {}): Promise<GenerationJob> {
    const current = await this.getJob(jobId);
    if (!current) throw new GatewayError("GENERATION_JOB_NOT_FOUND", "Generation job was not found.", 404);
    assertTransition(current.status, to);
    const from = current.status;
    const dataPatch = jobPatchToRow(patch);
    const { data, error } = await this.client.from("generation_jobs")
      .update({ ...dataPatch, status: to, updated_at: new Date().toISOString() })
      .eq("id", jobId).eq("status", from).select("*").maybeSingle();
    if (error || !data) throw new GatewayError("JOB_STATE_CONFLICT", "Generation job changed concurrently.", 409, true);
    await this.appendEvent({
      job_id: jobId,
      event_type: "status.changed",
      from_status: from,
      to_status: to,
      payload: {},
      idempotency_key: `transition:${jobId}:${from}:${to}:${data.updated_at}`,
    });
    return mapSupabaseJob(data);
  }

  async patchJob(jobId: string, patch: Partial<GenerationJob>): Promise<GenerationJob> {
    const { data, error } = await this.client.from("generation_jobs")
      .update({ ...jobPatchToRow(patch), updated_at: new Date().toISOString() })
      .eq("id", jobId).select("*").single();
    if (error) throw new GatewayError("DATABASE_WRITE_FAILED", "Could not update generation job.", 503, true);
    return mapSupabaseJob(data);
  }

  async appendEvent(event: Omit<GenerationEvent, "id" | "created_at">): Promise<boolean> {
    const job = await this.getJob(event.job_id);
    if (!job) return false;
    const { error } = await this.client.from("generation_events").insert({
      id: newId("evt"),
      job_id: event.job_id,
      user_id: job.user_id,
      event_type: event.event_type,
      from_status: event.from_status ?? null,
      to_status: event.to_status ?? null,
      payload: event.payload,
      idempotency_key: event.idempotency_key ?? null,
    });
    if (error?.code === "23505") return false;
    if (error) throw new GatewayError("DATABASE_WRITE_FAILED", "Could not append generation event.", 503, true);
    return true;
  }

  async addAttempt(jobId: string, userId: string, provider: string, providerJobId: string, estimatedCost: number): Promise<void> {
    const job = await this.getJob(jobId);
    const attemptNumber = (job?.attempt_count ?? 0) + 1;
    const { error } = await this.client.from("generation_attempts").insert({
      id: newId("attempt"), job_id: jobId, user_id: userId, attempt_number: attemptNumber,
      provider, provider_job_id: providerJobId, provider_attempt_id: providerJobId,
      status: "submitted", estimated_cost: estimatedCost,
    });
    if (error) throw new GatewayError("DATABASE_WRITE_FAILED", "Could not record provider attempt.", 503, true);
    await this.patchJob(jobId, { attempt_count: attemptNumber });
  }

  async completeAttempt(providerJobId: string, status: "completed" | "failed" | "cancelled", cost: number, errorCode?: string, metrics: ProviderCostMetrics = {}): Promise<void> {
    const { error } = await this.client.from("generation_attempts").update({
      status, final_cost: cost, error_code: errorCode ?? null, completed_at: new Date().toISOString(),
      provider_attempt_id: metrics.provider_attempt_id ?? providerJobId,
      gpu_type: metrics.gpu_type ?? null,
      generation_duration_ms: metrics.generation_duration_ms ?? null,
      output_count: metrics.output_count ?? null,
      cost_per_output: metrics.cost_per_output ?? null,
    }).eq("provider_job_id", providerJobId);
    if (error) throw new GatewayError("DATABASE_WRITE_FAILED", "Could not update provider attempt.", 503, true);
  }

  async saveAssets(userId: string, assets: GenerationAsset[]): Promise<void> {
    if (assets.length === 0) return;
    const { error } = await this.client.from("generation_assets").upsert(
      assets.map((asset) => ({
        id: asset.id, job_id: asset.job_id, user_id: userId, media_type: asset.media_type,
        storage_bucket: asset.metadata.storage_path ? "generation-results" : null,
        storage_path: asset.metadata.storage_path ?? null,
        signed_url_expires_at: asset.metadata.signed_url_expires_at ?? null,
        checksum_sha256: asset.metadata.checksum_sha256 ?? null,
        public_url: asset.url, preview_url: asset.preview_url ?? null, mime_type: asset.mime_type,
        width: asset.width ?? null, height: asset.height ?? null, duration_seconds: asset.duration_seconds ?? null,
        metadata: asset.metadata,
      })),
      { onConflict: "id", ignoreDuplicates: true },
    );
    if (error) throw new GatewayError("DATABASE_WRITE_FAILED", "Could not save generation assets.", 503, true);
  }

  async saveReview(userId: string, review: GenerationReview): Promise<void> {
    const { error } = await this.client.from("generation_reviews").upsert({
      id: review.id, job_id: review.job_id, user_id: userId, status: review.status,
      score: review.score, checks: review.checks, notes: review.notes,
    }, { onConflict: "id" });
    if (error) throw new GatewayError("DATABASE_WRITE_FAILED", "Could not save generation review.", 503, true);
  }

  async recordBilling(userId: string, jobId: string, operation: "estimate" | "reserve" | "capture" | "release" | "refund", amount: number, idempotencyKey: string, provider = "mock", metrics: ProviderCostMetrics = {}): Promise<boolean> {
    const { error } = await this.client.from("generation_billing_events").insert({
      id: newId("billing"), user_id: userId, job_id: jobId, operation, amount, provider,
      idempotency_key: idempotencyKey,
      provider_attempt_id: metrics.provider_attempt_id ?? null,
      gpu_type: metrics.gpu_type ?? null,
      generation_duration_ms: metrics.generation_duration_ms ?? null,
      output_count: metrics.output_count ?? null,
      cost_per_output: metrics.cost_per_output ?? null,
      metadata: metrics,
    });
    if (error?.code === "23505") return false;
    if (error) throw new GatewayError("DATABASE_WRITE_FAILED", "Could not record billing event.", 503, true);
    return true;
  }

  async ownedAssetIds(userId: string, ids: string[]): Promise<ReadonlySet<string>> {
    if (ids.length === 0) return new Set();
    const [generation, media] = await Promise.all([
      this.client.from("generation_assets").select("id").eq("user_id", userId).in("id", ids),
      this.client.from("media_assets").select("id").eq("owner_user_id", userId).in("id", ids),
    ]);
    if (generation.error || media.error) throw new GatewayError("DATABASE_READ_FAILED", "Could not validate reference asset ownership.", 503, true);
    return new Set([...(generation.data ?? []), ...(media.data ?? [])].map((row) => String(row.id)));
  }

  async createReferenceSignedUrl(userId: string, assetId: string, expiresInSeconds: number): Promise<string> {
    const [generation, media] = await Promise.all([
      this.client.from("generation_assets")
        .select("storage_bucket,storage_path")
        .eq("id", assetId)
        .eq("user_id", userId)
        .maybeSingle(),
      this.client.from("media_assets")
        .select("storage_key,metadata_json")
        .eq("id", assetId)
        .eq("owner_user_id", userId)
        .maybeSingle(),
    ]);
    if (generation.error || media.error) {
      throw new GatewayError("DATABASE_READ_FAILED", "Could not resolve the reference asset.", 503, true);
    }
    const generationBucket = generation.data?.storage_bucket ? String(generation.data.storage_bucket) : "";
    const generationPath = generation.data?.storage_path ? String(generation.data.storage_path) : "";
    const metadata = media.data?.metadata_json && typeof media.data.metadata_json === "object"
      ? media.data.metadata_json as Record<string, unknown>
      : {};
    const mediaBucket = typeof metadata.storage_bucket === "string" ? metadata.storage_bucket : "generation-inputs";
    const mediaPath = media.data?.storage_key ? String(media.data.storage_key) : "";
    const bucket = generationBucket || mediaBucket;
    const rawPath = generationPath || mediaPath;
    if (!bucket || !rawPath) throw new GatewayError("REFERENCE_ASSET_STORAGE_MISSING", "The reference asset has no private storage object.", 422);
    const objectPath = rawPath.startsWith(`${bucket}/`) ? rawPath.slice(bucket.length + 1) : rawPath;
    if (!objectPath.startsWith(`${userId}/`)) {
      throw new GatewayError("REFERENCE_ASSET_PATH_INVALID", "The reference asset path is outside the authenticated user's storage prefix.", 403);
    }
    const { data, error } = await this.client.storage.from(bucket).createSignedUrl(objectPath, expiresInSeconds);
    if (error || !data?.signedUrl) {
      throw new GatewayError("ASSET_SIGNING_FAILED", "Could not create a signed reference URL.", 503, true);
    }
    return data.signedUrl;
  }

  async listEvents(jobId: string): Promise<GenerationEvent[]> {
    const { data, error } = await this.client.from("generation_events").select("*")
      .eq("job_id", jobId).order("created_at", { ascending: true });
    if (error) throw new GatewayError("DATABASE_READ_FAILED", "Could not list generation events.", 503, true);
    return (data ?? []).map((row) => ({
      id: String(row.id), job_id: String(row.job_id), event_type: String(row.event_type),
      ...(row.from_status ? { from_status: row.from_status as GenerationStatus } : {}),
      ...(row.to_status ? { to_status: row.to_status as GenerationStatus } : {}),
      payload: (row.payload ?? {}) as Record<string, unknown>,
      ...(row.idempotency_key ? { idempotency_key: String(row.idempotency_key) } : {}),
      created_at: String(row.created_at),
    }));
  }

  async ready(): Promise<boolean> {
    const { error } = await this.client.from("workflow_registry").select("id", { head: true, count: "exact" }).limit(1);
    return !error;
  }

  private async mapJobWithFreshAssetUrls(row: Record<string, any>): Promise<GenerationJob> {
    const job = mapSupabaseJob(row);
    const storedAssets = (row.generation_assets ?? []) as Record<string, any>[];
    await Promise.all(job.assets.map(async (asset) => {
      const stored = storedAssets.find((item) => String(item.id) === asset.id);
      if (!stored?.storage_bucket || !stored?.storage_path) return;
      const bucket = String(stored.storage_bucket);
      const storedPath = String(stored.storage_path);
      const objectPath = storedPath.startsWith(`${bucket}/`)
        ? storedPath.slice(bucket.length + 1)
        : storedPath;
      const { data, error } = await this.client.storage
        .from(bucket)
        .createSignedUrl(objectPath, 900);
      if (error || !data?.signedUrl) {
        throw new GatewayError("ASSET_SIGNING_FAILED", "Could not create a fresh result URL.", 503, true);
      }
      asset.url = data.signedUrl;
      asset.preview_url = data.signedUrl;
      asset.metadata = {
        ...asset.metadata,
        signed_url_expires_at: new Date(Date.now() + 900_000).toISOString(),
      };
    }));
    return job;
  }
}

function jobPatchToRow(patch: Partial<GenerationJob>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (patch.parsed_brief !== undefined) row.parsed_brief = patch.parsed_brief;
  if (patch.generation_plan !== undefined) row.generation_plan = patch.generation_plan;
  if (patch.selected_workflow_id !== undefined) row.selected_workflow_id = patch.selected_workflow_id;
  if (patch.selected_model_id !== undefined) row.selected_model_id = patch.selected_model_id;
  if (patch.provider !== undefined) row.provider = patch.provider;
  if (patch.provider_job_id !== undefined) row.provider_job_id = patch.provider_job_id;
  if (patch.estimated_cost !== undefined) row.estimated_cost = patch.estimated_cost;
  if (patch.final_cost !== undefined) row.final_cost = patch.final_cost;
  if (patch.error_code !== undefined) row.error_code = patch.error_code;
  if (patch.error_message !== undefined) row.error_message = patch.error_message;
  if (patch.attempt_count !== undefined) row.attempt_count = patch.attempt_count;
  if (patch.started_at !== undefined) row.started_at = patch.started_at;
  if (patch.completed_at !== undefined) row.completed_at = patch.completed_at;
  if (patch.cancelled_at !== undefined) row.cancelled_at = patch.cancelled_at;
  return row;
}

function mapSupabaseJob(row: Record<string, any>): GenerationJob {
  const input = (row.input_params ?? {
    media_type: row.media_type,
    creation_mode: row.creation_mode ?? (row.media_type === "video" ? "text_to_video" : "text_to_image"),
    prompt: row.original_prompt ?? row.prompt,
    structured_options: {},
    reference_assets: [],
    aspect_ratio: row.aspect_ratio ?? "1:1",
    output_count: row.output_count ?? 1,
    subject_age_confirmed_adult: false,
    client_context: { app: "open-video-studio" },
  }) as GenerationInput;
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    status: row.status as GenerationStatus,
    input,
    ...(row.parsed_brief ? { parsed_brief: row.parsed_brief as ParsedCreativeBrief } : {}),
    ...(row.generation_plan ? { generation_plan: row.generation_plan as GenerationPlan } : {}),
    ...(row.selected_workflow_id ? { selected_workflow_id: String(row.selected_workflow_id) } : {}),
    ...(row.selected_model_id ? { selected_model_id: String(row.selected_model_id) } : {}),
    ...(row.provider ? { provider: String(row.provider) } : {}),
    ...(row.provider_job_id ? { provider_job_id: String(row.provider_job_id) } : {}),
    output_count: Number(row.output_count ?? 1),
    estimated_cost: Number(row.estimated_cost ?? 0),
    ...(row.final_cost !== null && row.final_cost !== undefined ? { final_cost: Number(row.final_cost) } : {}),
    ...(row.error_code ? { error_code: String(row.error_code) } : {}),
    ...(row.error_message ? { error_message: String(row.error_message) } : {}),
    ...(row.idempotency_key ? { idempotency_key: String(row.idempotency_key) } : {}),
    ...(row.retry_of_job_id ? { retry_of_job_id: String(row.retry_of_job_id) } : {}),
    attempt_count: Number(row.attempt_count ?? 0),
    assets: (row.generation_assets ?? []).map((asset: Record<string, any>) => ({
      id: String(asset.id), job_id: String(asset.job_id), media_type: asset.media_type,
      url: String(asset.public_url), ...(asset.preview_url ? { preview_url: String(asset.preview_url) } : {}),
      mime_type: String(asset.mime_type), ...(asset.width ? { width: Number(asset.width) } : {}),
      ...(asset.height ? { height: Number(asset.height) } : {}),
      ...(asset.duration_seconds ? { duration_seconds: Number(asset.duration_seconds) } : {}),
      metadata: {
        ...(asset.metadata ?? {}),
        ...(asset.storage_path ? { storage_path: String(asset.storage_path) } : {}),
        ...(asset.signed_url_expires_at ? { signed_url_expires_at: String(asset.signed_url_expires_at) } : {}),
        ...(asset.checksum_sha256 ? { checksum_sha256: String(asset.checksum_sha256) } : {}),
      },
    })),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    ...(row.started_at ? { started_at: String(row.started_at) } : {}),
    ...(row.completed_at ? { completed_at: String(row.completed_at) } : {}),
    ...(row.cancelled_at ? { cancelled_at: String(row.cancelled_at) } : {}),
  };
}
