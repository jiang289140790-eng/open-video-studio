import type {
  GenerationPlan,
  GenerationResult,
  ProviderJobStatus,
  ProviderSubmitResult,
} from "./domain.js";
import { GatewayError, newId } from "./errors.js";

export interface ProviderHealth {
  provider_id: string;
  healthy: boolean;
  checked_at: string;
  details?: Record<string, unknown>;
}

export interface GenerationProvider {
  readonly id: string;
  submit(plan: GenerationPlan): Promise<ProviderSubmitResult>;
  getStatus(providerJobId: string): Promise<ProviderJobStatus>;
  cancel(providerJobId: string): Promise<void>;
  normalizeResult(raw: unknown): Promise<GenerationResult>;
  healthCheck(): Promise<ProviderHealth>;
}

interface MockRecord {
  plan: GenerationPlan;
  status: ProviderJobStatus;
  submittedAt: number;
  cancelled: boolean;
}

export interface MockProviderOptions {
  latencyMs: number;
  failureRate: number;
  timeoutRate: number;
  assetBaseUrl: string;
  duplicateWebhook?: boolean;
  random?: () => number;
}

export class MockProvider implements GenerationProvider {
  readonly id = "mock";
  private readonly jobs = new Map<string, MockRecord>();
  private readonly random: () => number;

  constructor(private readonly options: MockProviderOptions) {
    this.random = options.random ?? Math.random;
  }

  async submit(plan: GenerationPlan): Promise<ProviderSubmitResult> {
    const providerJobId = newId("mock");
    const now = Date.now();
    this.jobs.set(providerJobId, {
      plan,
      submittedAt: now,
      cancelled: false,
      status: { provider_job_id: providerJobId, status: "queued", progress: 0 },
    });
    return {
      provider_job_id: providerJobId,
      status: "queued",
      estimated_cost: plan.input.media_type === "image" ? 1 : 3,
      submitted_at: new Date(now).toISOString(),
    };
  }

  async getStatus(providerJobId: string): Promise<ProviderJobStatus> {
    const record = this.jobs.get(providerJobId);
    if (!record) throw new GatewayError("PROVIDER_JOB_NOT_FOUND", "Mock provider job was not found.", 404);
    if (record.cancelled) return { provider_job_id: providerJobId, status: "cancelled", progress: 100 };
    const elapsed = Date.now() - record.submittedAt;
    if (elapsed < this.options.latencyMs / 2) {
      return { provider_job_id: providerJobId, status: "queued", progress: 10 };
    }
    if (elapsed < this.options.latencyMs) {
      return { provider_job_id: providerJobId, status: "running", progress: 60 };
    }
    const bucket = deterministicBucket(providerJobId, this.random);
    if (bucket < this.options.timeoutRate) {
      return {
        provider_job_id: providerJobId,
        status: "failed",
        progress: 100,
        error_code: "PROVIDER_TIMEOUT",
        error_message: "Mock provider simulated a timeout.",
      };
    }
    if (bucket < this.options.timeoutRate + this.options.failureRate) {
      return {
        provider_job_id: providerJobId,
        status: "failed",
        progress: 100,
        error_code: "PROVIDER_FAILED",
        error_message: "Mock provider simulated a failure.",
      };
    }
    const result = this.resultFor(record.plan, providerJobId);
    return { provider_job_id: providerJobId, status: "completed", progress: 100, result };
  }

  async cancel(providerJobId: string): Promise<void> {
    const record = this.jobs.get(providerJobId);
    if (!record) return;
    record.cancelled = true;
  }

  async normalizeResult(raw: unknown): Promise<GenerationResult> {
    if (!raw || typeof raw !== "object" || !("assets" in raw)) {
      throw new GatewayError("PROVIDER_RESULT_INVALID", "Provider result could not be normalized.", 502, true);
    }
    return raw as GenerationResult;
  }

  async healthCheck(): Promise<ProviderHealth> {
    return { provider_id: this.id, healthy: true, checked_at: new Date().toISOString(), details: { mode: "mock" } };
  }

  private resultFor(plan: GenerationPlan, providerJobId: string): GenerationResult {
    const assets = Array.from({ length: plan.input.output_count }, (_, index) => {
      const id = newId("asset");
      const assetPath = `${this.options.assetBaseUrl}/v1/mock-assets/${encodeURIComponent(plan.job_id)}/${index + 1}.svg`;
      return {
        id,
        job_id: plan.job_id,
        media_type: plan.input.media_type,
        url: assetPath,
        preview_url: assetPath,
        mime_type: plan.input.media_type === "image" ? "image/svg+xml" : "video/mp4",
        ...(plan.input.media_type === "image"
          ? { width: 1024, height: 1024 }
          : { duration_seconds: plan.input.duration_seconds ?? 6 }),
        metadata: { mock: true, output_index: index, workflow_id: plan.selected_workflow_id },
      };
    });
    return {
      provider_job_id: providerJobId,
      assets,
      cost: plan.input.media_type === "image" ? 1 : 3,
      raw_redacted: { mock: true, duplicate_webhook_simulated: Boolean(this.options.duplicateWebhook) },
    };
  }
}

function deterministicBucket(value: string, fallback: () => number): number {
  let hash = 0;
  for (const character of value) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  const deterministic = (hash % 10_000) / 10_000;
  return Number.isFinite(deterministic) ? deterministic : fallback();
}

export class RunPodProviderPlaceholder implements GenerationProvider {
  readonly id = "runpod-placeholder";
  private unavailable(): never {
    throw new GatewayError("PROVIDER_NOT_CONFIGURED", "RunPod is intentionally disabled in the mock phase.", 503, false);
  }
  submit(): Promise<ProviderSubmitResult> { return Promise.reject(this.unavailable()); }
  getStatus(): Promise<ProviderJobStatus> { return Promise.reject(this.unavailable()); }
  cancel(): Promise<void> { return Promise.reject(this.unavailable()); }
  normalizeResult(): Promise<GenerationResult> { return Promise.reject(this.unavailable()); }
  async healthCheck(): Promise<ProviderHealth> {
    return { provider_id: this.id, healthy: false, checked_at: new Date().toISOString(), details: { phase: "placeholder" } };
  }
}
