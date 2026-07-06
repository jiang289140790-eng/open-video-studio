import type { SqliteDatabase } from "../db/database.js";
import { AiCostTracker } from "./costTracker.js";
import { AiJobQueue, type AiJob } from "./jobQueue.js";
import type { AiOperation, AiProviderName } from "./provider.js";
import { AiProviderRegistry } from "./providers.js";
import { AiWorker } from "./worker.js";

export class AiEngine {
  readonly queue: AiJobQueue;
  readonly worker: AiWorker;
  readonly costs: AiCostTracker;

  constructor(
    db: SqliteDatabase,
    readonly providers = new AiProviderRegistry(),
  ) {
    this.queue = new AiJobQueue(db);
    this.worker = new AiWorker(db, this.queue, providers);
    this.costs = new AiCostTracker(db);
  }

  enqueue(input: {
    userId: string;
    operation: AiOperation;
    provider?: AiProviderName;
    model: string;
    request: Record<string, unknown>;
    generationJobId?: string;
    fallbackProvider?: AiProviderName;
  }): AiJob {
    return this.queue.enqueue({
      userId: input.userId,
      operation: input.operation,
      provider: input.provider ?? "local_api",
      model: input.model,
      request: input.request,
      generationJobId: input.generationJobId,
      fallbackProvider: input.fallbackProvider,
    });
  }
}
