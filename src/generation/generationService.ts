import type { SqliteDatabase } from "../db/database.js";
import { AuditLog } from "../audit/auditLog.js";
import { CreditLedger } from "../credits/creditLedger.js";
import { AppError, assertNonEmpty } from "../shared/errors.js";
import { createId } from "../shared/id.js";
import { nowIso } from "../shared/time.js";
import { StorageService, type MediaAsset } from "../storage/storageService.js";
import { CharacterService } from "../characters/characterService.js";

export type GenerationMediaType = "image" | "video";
export type GenerationStatus = "queued" | "running" | "completed" | "failed" | "restricted" | "canceled";

export interface GenerationJob {
  id: string;
  userId: string;
  mediaType: GenerationMediaType;
  status: GenerationStatus;
  projectId?: string;
  prompt: string;
  provider: string;
  model: string;
  aspectRatio: string;
  resolution?: string;
  durationSeconds?: number;
  sourceAssetId?: string;
  characterId?: string;
  resultAssetId?: string;
  creditTransactionId?: string;
  costCredits: number;
  estimatedCostCents: number;
  progress: number;
  safetyStatus: string;
  errorCode?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

interface GenerationJobRow {
  id: string;
  user_id: string;
  media_type: GenerationMediaType;
  status: GenerationStatus;
  project_id: string | null;
  prompt: string;
  provider: string;
  model: string;
  aspect_ratio: string;
  resolution: string | null;
  duration_seconds: number | null;
  source_asset_id: string | null;
  character_id: string | null;
  result_asset_id: string | null;
  credit_transaction_id: string | null;
  cost_credits: number;
  estimated_cost_cents: number;
  progress: number;
  safety_status: string;
  error_code: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export class GenerationService {
  private readonly credits: CreditLedger;
  private readonly characters: CharacterService;
  private readonly audit: AuditLog;

  constructor(
    private readonly db: SqliteDatabase,
    private readonly storage: StorageService,
  ) {
    this.credits = new CreditLedger(db);
    this.characters = new CharacterService(db, storage);
    this.audit = new AuditLog(db);
  }

  estimateCredits(mediaType: GenerationMediaType, durationSeconds?: number): number {
    if (mediaType === "image") {
      return 8;
    }
    return Math.max(24, Math.ceil((durationSeconds ?? 8) / 4) * 12);
  }

  enqueue(input: {
    userId: string;
    projectId?: string;
    mediaType: GenerationMediaType;
    prompt: string;
    provider?: string;
    model?: string;
    aspectRatio?: string;
    resolution?: string;
    durationSeconds?: number;
    sourceAssetId?: string;
    characterId?: string;
  }): GenerationJob {
    assertNonEmpty(input.prompt, "GENERATION_PROMPT_REQUIRED", "Prompt is required.");
    if (input.mediaType !== "image" && input.mediaType !== "video") {
      throw new AppError("GENERATION_MEDIA_TYPE_INVALID", "Generation media type must be image or video.");
    }
    if (input.sourceAssetId) {
      this.storage.getAsset(input.sourceAssetId, input.userId);
    }
    if (input.characterId) {
      this.characters.getCharacter(input.characterId, input.userId);
    }

    const timestamp = nowIso();
    const id = createId("job");
    const costCredits = this.estimateCredits(input.mediaType, input.durationSeconds);
    const provider = input.provider ?? "local_api";
    const model = input.model ?? (input.mediaType === "image" ? "local-image-v0" : "local-video-v0");
    const estimatedCostCents = estimateCostCents(input.mediaType, costCredits);
    const transaction = this.credits.consume({
      accountId: input.userId,
      userId: input.userId,
      amount: costCredits,
      sourceType: "generation_job",
      sourceId: id,
      operationCategory: `${input.mediaType}_generation`,
      reason: `Queued ${input.mediaType} generation`,
    });

    this.db.prepare(`
      INSERT INTO generation_jobs (
        id, user_id, media_type, status, project_id, prompt, provider, model,
        aspect_ratio, resolution, duration_seconds, source_asset_id, character_id,
        credit_transaction_id, cost_credits, estimated_cost_cents, progress,
        safety_status, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      input.userId,
      input.mediaType,
      "queued",
      input.projectId ?? null,
      input.prompt.trim(),
      provider,
      model,
      input.aspectRatio ?? "16:9",
      input.resolution ?? null,
      input.durationSeconds ?? null,
      input.sourceAssetId ?? null,
      input.characterId ?? null,
      transaction.id,
      costCredits,
      estimatedCostCents,
      0,
      "pending_review",
      timestamp,
      timestamp,
    );

    this.audit.record({
      actorType: "user",
      actorId: input.userId,
      action: "generation.queued",
      targetType: "generation_job",
      targetId: id,
      outcome: "success",
      riskClassification: "medium",
      metadata: { mediaType: input.mediaType, costCredits, provider, model },
    });

    return this.getJob(id, input.userId);
  }

  startJob(jobId: string, userId: string): GenerationJob {
    const job = this.getJob(jobId, userId);
    if (job.status !== "queued") {
      throw new AppError("GENERATION_JOB_NOT_QUEUED", "Only queued jobs can start.");
    }
    return this.updateJob(jobId, userId, { status: "running", progress: 10 });
  }

  completeJob(input: {
    jobId: string;
    userId: string;
    data: Buffer | string;
    displayName?: string;
    metadata?: Record<string, unknown>;
  }): { job: GenerationJob; asset: MediaAsset } {
    const job = this.getJob(input.jobId, input.userId);
    if (job.status !== "queued" && job.status !== "running") {
      throw new AppError("GENERATION_JOB_NOT_COMPLETABLE", "Only queued or running jobs can complete.");
    }

    const asset = this.storage.saveAsset({
      ownerUserId: input.userId,
      projectId: job.projectId,
      characterId: job.characterId,
      generationJobId: job.id,
      assetType: job.mediaType,
      sourceType: "generation",
      displayName: input.displayName ?? `${job.mediaType}-${job.id}.txt`,
      data: input.data,
      metadata: {
        ...(input.metadata ?? {}),
        generationJobId: job.id,
        prompt: job.prompt,
        provider: job.provider,
        model: job.model,
        aspectRatio: job.aspectRatio,
        resolution: job.resolution,
        durationSeconds: job.durationSeconds,
        credits: job.costCredits,
        estimatedCostCents: job.estimatedCostCents,
      },
      rightsStatus: "generated",
      moderationStatus: "pending",
    });
    const timestamp = nowIso();

    if (job.mediaType === "image") {
      this.db.prepare(`
        INSERT INTO images (
          id, owner_user_id, project_id, media_asset_id, generation_job_id, character_id,
          prompt, source_type, format, moderation_status, rights_status, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        createId("image"),
        input.userId,
        job.projectId ?? null,
        asset.id,
        job.id,
        job.characterId ?? null,
        job.prompt,
        "ai_generation",
        "txt",
        "pending",
        "generated",
        timestamp,
        timestamp,
      );
    } else {
      this.db.prepare(`
        INSERT INTO videos (
          id, owner_user_id, project_id, media_asset_id, generation_job_id, character_id,
          title, status, duration_seconds, aspect_ratio, review_status, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        createId("video"),
        input.userId,
        job.projectId ?? null,
        asset.id,
        job.id,
        job.characterId ?? null,
        input.displayName ?? "Generated video",
        "draft",
        job.durationSeconds ?? null,
        job.aspectRatio,
        "pending",
        timestamp,
        timestamp,
      );
    }

    const completed = this.updateJob(job.id, input.userId, {
      status: "completed",
      progress: 100,
      resultAssetId: asset.id,
      completedAt: timestamp,
    });

    return { job: completed, asset };
  }

  failJob(jobId: string, userId: string, errorCode: string, errorMessage: string): GenerationJob {
    return this.updateJob(jobId, userId, {
      status: "failed",
      errorCode,
      errorMessage,
      progress: 100,
    });
  }

  getJob(id: string, userId: string): GenerationJob {
    const row = this.db.prepare(`
      SELECT *
      FROM generation_jobs
      WHERE id = ? AND user_id = ?
    `).get(id, userId) as GenerationJobRow | undefined;
    if (!row) {
      throw new AppError("GENERATION_JOB_NOT_FOUND", "Generation job not found.", 404);
    }
    return mapJob(row);
  }

  listHistory(userId: string, filters: {
    projectId?: string;
    characterId?: string;
    mediaType?: GenerationMediaType;
    status?: GenerationStatus;
    provider?: string;
    model?: string;
    query?: string;
  } = {}): GenerationJob[] {
    const conditions = ["user_id = ?"];
    const values: string[] = [userId];
    if (filters.projectId) {
      conditions.push("project_id = ?");
      values.push(filters.projectId);
    }
    if (filters.characterId) {
      conditions.push("character_id = ?");
      values.push(filters.characterId);
    }
    if (filters.mediaType) {
      conditions.push("media_type = ?");
      values.push(filters.mediaType);
    }
    if (filters.status) {
      conditions.push("status = ?");
      values.push(filters.status);
    }
    if (filters.provider) {
      conditions.push("provider = ?");
      values.push(filters.provider);
    }
    if (filters.model) {
      conditions.push("model = ?");
      values.push(filters.model);
    }
    if (filters.query?.trim()) {
      conditions.push("prompt LIKE ?");
      values.push(`%${filters.query.trim()}%`);
    }

    const rows = this.db.prepare(`
      SELECT *
      FROM generation_jobs
      WHERE ${conditions.join(" AND ")}
      ORDER BY created_at DESC
    `).all(...values) as unknown as GenerationJobRow[];
    return rows.map(mapJob);
  }

  private updateJob(
    jobId: string,
    userId: string,
    input: Partial<Pick<GenerationJob, "status" | "progress" | "resultAssetId" | "errorCode" | "errorMessage" | "completedAt">>,
  ): GenerationJob {
    const current = this.getJob(jobId, userId);
    this.db.prepare(`
      UPDATE generation_jobs
      SET status = ?, progress = ?, result_asset_id = ?, error_code = ?, error_message = ?, updated_at = ?, completed_at = ?
      WHERE id = ? AND user_id = ?
    `).run(
      input.status ?? current.status,
      input.progress ?? current.progress,
      input.resultAssetId ?? current.resultAssetId ?? null,
      input.errorCode ?? current.errorCode ?? null,
      input.errorMessage ?? current.errorMessage ?? null,
      nowIso(),
      input.completedAt ?? current.completedAt ?? null,
      jobId,
      userId,
    );
    return this.getJob(jobId, userId);
  }
}

function mapJob(row: GenerationJobRow): GenerationJob {
  return {
    id: row.id,
    userId: row.user_id,
    mediaType: row.media_type,
    status: row.status,
    projectId: row.project_id ?? undefined,
    prompt: row.prompt,
    provider: row.provider,
    model: row.model,
    aspectRatio: row.aspect_ratio,
    resolution: row.resolution ?? undefined,
    durationSeconds: row.duration_seconds ?? undefined,
    sourceAssetId: row.source_asset_id ?? undefined,
    characterId: row.character_id ?? undefined,
    resultAssetId: row.result_asset_id ?? undefined,
    creditTransactionId: row.credit_transaction_id ?? undefined,
    costCredits: row.cost_credits,
    estimatedCostCents: row.estimated_cost_cents,
    progress: row.progress,
    safetyStatus: row.safety_status,
    errorCode: row.error_code ?? undefined,
    errorMessage: row.error_message ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at ?? undefined,
  };
}

function estimateCostCents(mediaType: GenerationMediaType, credits: number): number {
  return mediaType === "image" ? Math.max(1, credits * 3) : Math.max(1, credits * 5);
}
