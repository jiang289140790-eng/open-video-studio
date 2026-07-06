import type { SqliteDatabase } from "../db/database.js";
import { AppError, assertNonEmpty } from "../shared/errors.js";
import { createId } from "../shared/id.js";
import { nowIso } from "../shared/time.js";
import type { AiJobStatus, AiOperation, AiProviderName } from "./provider.js";

export interface AiJob {
  id: string;
  userId: string;
  generationJobId?: string;
  provider: AiProviderName;
  model: string;
  operation: AiOperation;
  status: AiJobStatus;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  errorCode?: string;
  errorMessage?: string;
  attempts: number;
  maxAttempts: number;
  fallbackProvider?: AiProviderName;
  credits: number;
  estimatedCostCents: number;
  durationMs?: number;
  resolution?: string;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
}

interface AiJobRow {
  id: string;
  user_id: string;
  generation_job_id: string | null;
  provider: AiProviderName;
  model: string;
  operation: AiOperation;
  status: AiJobStatus;
  input_json: string;
  output_json: string;
  error_code: string | null;
  error_message: string | null;
  attempts: number;
  max_attempts: number;
  fallback_provider: AiProviderName | null;
  credits: number;
  estimated_cost_cents: number;
  duration_ms: number | null;
  resolution: string | null;
  created_at: string;
  updated_at: string;
  started_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
}

export class AiJobQueue {
  constructor(private readonly db: SqliteDatabase) {}

  enqueue(input: {
    userId: string;
    provider: AiProviderName;
    model: string;
    operation: AiOperation;
    request: Record<string, unknown>;
    generationJobId?: string;
    fallbackProvider?: AiProviderName;
    maxAttempts?: number;
    initialStatus?: AiJobStatus;
  }): AiJob {
    assertNonEmpty(input.model, "AI_MODEL_REQUIRED", "AI model is required.");
    const timestamp = nowIso();
    const id = createId("ai_job");
    const status = input.initialStatus ?? "queued";
    this.db.prepare(`
      INSERT INTO ai_jobs (
        id, user_id, generation_job_id, provider, model, operation, status,
        input_json, max_attempts, fallback_provider, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      input.userId,
      input.generationJobId ?? null,
      input.provider,
      input.model,
      input.operation,
      status,
      JSON.stringify(input.request),
      input.maxAttempts ?? 3,
      input.fallbackProvider ?? null,
      timestamp,
      timestamp,
    );
    return this.get(id);
  }

  get(id: string): AiJob {
    const row = this.db.prepare("SELECT * FROM ai_jobs WHERE id = ?").get(id) as AiJobRow | undefined;
    if (!row) {
      throw new AppError("AI_JOB_NOT_FOUND", "AI job not found.", 404);
    }
    return mapAiJob(row);
  }

  nextQueued(): AiJob | undefined {
    const row = this.db.prepare(`
      SELECT *
      FROM ai_jobs
      WHERE status IN ('queued', 'retrying')
      ORDER BY created_at ASC
      LIMIT 1
    `).get() as AiJobRow | undefined;
    return row ? mapAiJob(row) : undefined;
  }

  markRunning(id: string): AiJob {
    const job = this.get(id);
    if (job.status !== "queued" && job.status !== "retrying") {
      throw new AppError("AI_JOB_NOT_RUNNABLE", "Only queued or retrying AI jobs can run.");
    }
    this.db.prepare(`
      UPDATE ai_jobs
      SET status = 'running', attempts = attempts + 1, started_at = COALESCE(started_at, ?), updated_at = ?
      WHERE id = ?
    `).run(nowIso(), nowIso(), id);
    return this.get(id);
  }

  complete(id: string, input: {
    output: Record<string, unknown>;
    credits: number;
    estimatedCostCents: number;
    durationMs?: number;
    resolution?: string;
  }): AiJob {
    const timestamp = nowIso();
    this.db.prepare(`
      UPDATE ai_jobs
      SET status = 'completed', output_json = ?, credits = ?, estimated_cost_cents = ?,
          duration_ms = ?, resolution = ?, updated_at = ?, completed_at = ?
      WHERE id = ?
    `).run(
      JSON.stringify(input.output),
      input.credits,
      input.estimatedCostCents,
      input.durationMs ?? null,
      input.resolution ?? null,
      timestamp,
      timestamp,
      id,
    );
    return this.get(id);
  }

  fail(id: string, errorCode: string, errorMessage: string): AiJob {
    const job = this.get(id);
    const shouldRetry = job.attempts < job.maxAttempts;
    this.db.prepare(`
      UPDATE ai_jobs
      SET status = ?, error_code = ?, error_message = ?, updated_at = ?
      WHERE id = ?
    `).run(shouldRetry ? "retrying" : "failed", errorCode, errorMessage, nowIso(), id);
    return this.get(id);
  }

  cancel(id: string): AiJob {
    const timestamp = nowIso();
    this.db.prepare(`
      UPDATE ai_jobs
      SET status = 'cancelled', updated_at = ?, cancelled_at = ?
      WHERE id = ? AND status NOT IN ('completed', 'failed', 'cancelled')
    `).run(timestamp, timestamp, id);
    return this.get(id);
  }

  listByUser(userId: string): AiJob[] {
    const rows = this.db.prepare(`
      SELECT *
      FROM ai_jobs
      WHERE user_id = ?
      ORDER BY created_at DESC
    `).all(userId) as unknown as AiJobRow[];
    return rows.map(mapAiJob);
  }
}

function mapAiJob(row: AiJobRow): AiJob {
  return {
    id: row.id,
    userId: row.user_id,
    generationJobId: row.generation_job_id ?? undefined,
    provider: row.provider,
    model: row.model,
    operation: row.operation,
    status: row.status,
    input: JSON.parse(row.input_json) as Record<string, unknown>,
    output: JSON.parse(row.output_json) as Record<string, unknown>,
    errorCode: row.error_code ?? undefined,
    errorMessage: row.error_message ?? undefined,
    attempts: row.attempts,
    maxAttempts: row.max_attempts,
    fallbackProvider: row.fallback_provider ?? undefined,
    credits: row.credits,
    estimatedCostCents: row.estimated_cost_cents,
    durationMs: row.duration_ms ?? undefined,
    resolution: row.resolution ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    startedAt: row.started_at ?? undefined,
    completedAt: row.completed_at ?? undefined,
    cancelledAt: row.cancelled_at ?? undefined,
  };
}
