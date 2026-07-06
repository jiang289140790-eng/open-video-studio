import { AuditLog } from "../audit/auditLog.js";
import type { SqliteDatabase } from "../db/database.js";
import { AppError } from "../shared/errors.js";
import { AiCostTracker } from "./costTracker.js";
import { AiJobQueue, type AiJob } from "./jobQueue.js";
import { operationToProviderMethod, type AiProviderRequest } from "./provider.js";
import { AiProviderRegistry } from "./providers.js";

export interface AiWorkerResult {
  job?: AiJob;
  processed: boolean;
}

export class AiWorker {
  private readonly audit: AuditLog;
  private readonly costs: AiCostTracker;

  constructor(
    private readonly db: SqliteDatabase,
    private readonly queue: AiJobQueue,
    private readonly providers: AiProviderRegistry,
  ) {
    this.audit = new AuditLog(db);
    this.costs = new AiCostTracker(db);
  }

  async processNext(): Promise<AiWorkerResult> {
    const next = this.queue.nextQueued();
    if (!next) {
      return { processed: false };
    }
    return { processed: true, job: await this.processJob(next.id) };
  }

  async processJob(jobId: string): Promise<AiJob> {
    const running = this.queue.markRunning(jobId);
    try {
      const provider = this.providers.get(running.provider);
      const method = operationToProviderMethod(running.operation);
      const request = buildProviderRequest(running);
      const result = await provider[method](request);
      const completed = this.queue.complete(running.id, {
        output: result.output,
        credits: result.credits,
        estimatedCostCents: result.estimatedCostCents,
        durationMs: result.durationMs,
        resolution: result.resolution,
      });
      this.costs.record(completed);
      this.audit.record({
        actorType: "system",
        action: "ai.job_completed",
        targetType: "ai_job",
        targetId: completed.id,
        outcome: "success",
        riskClassification: "medium",
        metadata: {
          provider: completed.provider,
          model: completed.model,
          operation: completed.operation,
          credits: completed.credits,
          estimatedCostCents: completed.estimatedCostCents,
        },
      });
      return completed;
    } catch (error) {
      const failed = this.queue.fail(
        running.id,
        error instanceof AppError ? error.code : "AI_WORKER_FAILED",
        error instanceof Error ? error.message : "AI worker failed.",
      );
      this.audit.record({
        actorType: "system",
        action: "ai.job_failed",
        targetType: "ai_job",
        targetId: failed.id,
        outcome: "failure",
        riskClassification: "medium",
        metadata: { provider: failed.provider, status: failed.status },
      });
      return failed;
    }
  }
}

function buildProviderRequest(job: AiJob): AiProviderRequest {
  return {
    jobId: job.id,
    userId: job.userId,
    prompt: typeof job.input.prompt === "string" ? job.input.prompt : undefined,
    inputAssetKeys: Array.isArray(job.input.inputAssetKeys) ? job.input.inputAssetKeys.filter((value): value is string => typeof value === "string") : undefined,
    characterId: typeof job.input.characterId === "string" ? job.input.characterId : undefined,
    model: job.model,
    durationSeconds: typeof job.input.durationSeconds === "number" ? job.input.durationSeconds : undefined,
    resolution: typeof job.input.resolution === "string" ? job.input.resolution : undefined,
    aspectRatio: typeof job.input.aspectRatio === "string" ? job.input.aspectRatio : undefined,
    metadata: typeof job.input.metadata === "object" && job.input.metadata !== null ? job.input.metadata as Record<string, unknown> : undefined,
  };
}
