import type { SqliteDatabase } from "../db/database.js";
import { AppError } from "../shared/errors.js";
import { createId } from "../shared/id.js";
import { nowIso } from "../shared/time.js";
import type { AiJob } from "./jobQueue.js";

export interface AiCostRecord {
  id: string;
  userId: string;
  aiJobId: string;
  generationJobId?: string;
  provider: string;
  model: string;
  operation: string;
  credits: number;
  estimatedCostCents: number;
  durationMs?: number;
  resolution?: string;
  createdAt: string;
}

interface AiCostRecordRow {
  id: string;
  user_id: string;
  ai_job_id: string;
  generation_job_id: string | null;
  provider: string;
  model: string;
  operation: string;
  credits: number;
  estimated_cost_cents: number;
  duration_ms: number | null;
  resolution: string | null;
  created_at: string;
}

export class AiCostTracker {
  constructor(private readonly db: SqliteDatabase) {}

  record(job: AiJob): AiCostRecord {
    const id = createId("ai_cost");
    const timestamp = nowIso();
    this.db.prepare(`
      INSERT INTO ai_cost_records (
        id, user_id, ai_job_id, generation_job_id, provider, model, operation,
        credits, estimated_cost_cents, duration_ms, resolution, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      job.userId,
      job.id,
      job.generationJobId ?? null,
      job.provider,
      job.model,
      job.operation,
      job.credits,
      job.estimatedCostCents,
      job.durationMs ?? null,
      job.resolution ?? null,
      timestamp,
    );
    return this.get(id);
  }

  listByUser(userId: string): AiCostRecord[] {
    const rows = this.db.prepare(`
      SELECT *
      FROM ai_cost_records
      WHERE user_id = ?
      ORDER BY created_at DESC
    `).all(userId) as unknown as AiCostRecordRow[];
    return rows.map(mapCostRecord);
  }

  private get(id: string): AiCostRecord {
    const row = this.db.prepare("SELECT * FROM ai_cost_records WHERE id = ?").get(id) as unknown as AiCostRecordRow | undefined;
    if (!row) {
      throw new AppError("AI_COST_RECORD_NOT_FOUND", "AI cost record not found.", 404);
    }
    return mapCostRecord(row);
  }
}

function mapCostRecord(row: AiCostRecordRow): AiCostRecord {
  return {
    id: row.id,
    userId: row.user_id,
    aiJobId: row.ai_job_id,
    generationJobId: row.generation_job_id ?? undefined,
    provider: row.provider,
    model: row.model,
    operation: row.operation,
    credits: row.credits,
    estimatedCostCents: row.estimated_cost_cents,
    durationMs: row.duration_ms ?? undefined,
    resolution: row.resolution ?? undefined,
    createdAt: row.created_at,
  };
}
