import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import type {
  GenerationPlan,
  GenerationResult,
  ProviderJobStatus,
  ProviderSubmitResult,
} from "../../domain.js";
import { GatewayError } from "../../errors.js";
import type { ProviderHealth, WebhookVerifyingProvider } from "../../provider.js";
import { RunPodResponseSchema, RunPodWorkerOutputSchema, type RunPodResponse } from "./types.js";
import {
  mapPlanToWorkerInput,
  REAL_IMAGE_STORAGE_PREFIX,
  REAL_IMAGE_WORKFLOW_ID,
  type RunPodWorkflowConfig,
} from "./workflow.js";

export interface RunPodProviderOptions extends RunPodWorkflowConfig {
  apiKey?: string;
  endpointId?: string;
  webhookSecret?: string;
  requestTimeoutMs: number;
  maxPollDurationMs: number;
  enabled: boolean;
  workflowAllowlist: readonly string[];
  publicWebhookBaseUrl?: string;
  apiBaseUrl?: string;
  fetchImpl?: typeof fetch;
  now?: () => number;
}

export class RunPodProvider implements WebhookVerifyingProvider {
  readonly id = "runpod";
  private readonly fetchImpl: typeof fetch;
  private readonly now: () => number;
  private readonly apiBaseUrl: string;

  constructor(private readonly options: RunPodProviderOptions) {
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.now = options.now ?? Date.now;
    this.apiBaseUrl = options.apiBaseUrl ?? "https://api.runpod.ai/v2";
  }

  async submit(plan: GenerationPlan): Promise<ProviderSubmitResult> {
    this.assertConfigured();
    if (!this.options.workflowAllowlist.includes(REAL_IMAGE_WORKFLOW_ID)) {
      throw new GatewayError("REAL_WORKFLOW_NOT_ALLOWED", "The requested real workflow is not allowlisted.", 403);
    }
    const input = mapPlanToWorkerInput(plan, this.options);
    const callbackUrl = this.options.publicWebhookBaseUrl
      ? `${this.options.publicWebhookBaseUrl.replace(/\/$/, "")}/v1/provider-webhooks/runpod`
      : undefined;
    const response = await this.request("/run", {
      method: "POST",
      body: JSON.stringify({
        input: {
          ...input,
          ...(callbackUrl ? {
            callback: {
              url: callbackUrl,
              signature_algorithm: "hmac-sha256",
              signature_header: "x-webhook-signature",
            },
          } : {}),
        },
        policy: {
          executionTimeout: this.options.maxPollDurationMs,
          ttl: this.options.maxPollDurationMs,
        },
      }),
    });
    return {
      provider_job_id: response.id,
      status: response.status === "IN_PROGRESS" || response.status === "RUNNING" ? "running" : "queued",
      estimated_cost: 0,
      submitted_at: new Date(this.now()).toISOString(),
    };
  }

  async getStatus(providerJobId: string): Promise<ProviderJobStatus> {
    this.assertConfigured();
    const response = await this.request(`/status/${encodeURIComponent(providerJobId)}`, { method: "GET" });
    if (response.status === "IN_QUEUE") return status(providerJobId, "queued", 10);
    if (response.status === "IN_PROGRESS" || response.status === "RUNNING") {
      return status(providerJobId, "running", 60);
    }
    if (response.status === "CANCELLED") return status(providerJobId, "cancelled", 100);
    if (response.status === "TIMED_OUT") {
      return failed(providerJobId, "PROVIDER_TIMEOUT", "The real image provider exceeded its execution timeout.");
    }
    if (response.status === "FAILED") {
      const error = this.mapError(response.error);
      return failed(providerJobId, error.code, error.message);
    }
    const result = await this.normalizeResult({ provider_job_id: providerJobId, output: response.output });
    return { provider_job_id: providerJobId, status: "completed", progress: 100, result };
  }

  async cancel(providerJobId: string): Promise<void> {
    this.assertConfigured();
    await this.request(`/cancel/${encodeURIComponent(providerJobId)}`, { method: "POST" });
  }

  async normalizeResult(raw: unknown): Promise<GenerationResult> {
    const wrapper = raw && typeof raw === "object" ? raw as Record<string, unknown> : {};
    const providerJobId = typeof wrapper.provider_job_id === "string" ? wrapper.provider_job_id : "";
    const parsed = RunPodWorkerOutputSchema.safeParse(wrapper.output ?? raw);
    if (!providerJobId || !parsed.success) {
      throw new GatewayError("PROVIDER_RESULT_INVALID", "The real image provider returned an invalid result.", 502, true);
    }
    const output = parsed.data;
    const expectedPrefix = `${REAL_IMAGE_STORAGE_PREFIX}/${output.user_id}/${output.job_id}/`;
    const indexes = new Set<number>();
    for (const asset of output.assets) {
      if (!asset.storage_path.startsWith(expectedPrefix) ||
          asset.signed_url.startsWith("data:") ||
          asset.signed_url.startsWith("blob:") ||
          new Date(asset.signed_url_expires_at).getTime() <= this.now() ||
          indexes.has(asset.output_index)) {
        throw new GatewayError(
          "PROVIDER_RESULT_OWNERSHIP_INVALID",
          "The provider result failed storage ownership validation.",
          502,
          false,
        );
      }
      indexes.add(asset.output_index);
    }
    return {
      provider_job_id: providerJobId,
      assets: output.assets.map((asset) => ({
        id: `asset_${createHash("sha256").update(`${output.job_id}:${asset.storage_path}`).digest("hex").slice(0, 32)}`,
        job_id: output.job_id,
        media_type: "image",
        url: asset.signed_url,
        preview_url: asset.signed_url,
        mime_type: asset.mime_type,
        width: asset.width,
        height: asset.height,
        metadata: {
          storage_path: asset.storage_path,
          signed_url_expires_at: asset.signed_url_expires_at,
          output_index: asset.output_index,
          ...(asset.checksum_sha256 ? { checksum_sha256: asset.checksum_sha256 } : {}),
        },
      })),
      cost: output.metrics.actual_cost,
      raw_redacted: {
        provider: this.id,
        gpu_type: output.metrics.gpu_type,
        generation_duration_ms: output.metrics.generation_duration_ms,
        estimated_cost: output.metrics.estimated_cost,
        actual_cost: output.metrics.actual_cost,
        output_count: output.assets.length,
        cost_per_output: output.assets.length > 0 ? output.metrics.actual_cost / output.assets.length : 0,
        provider_attempt_id: providerJobId,
      },
    };
  }

  async healthCheck(): Promise<ProviderHealth> {
    if (!this.isConfigured()) {
      return {
        provider_id: this.id,
        healthy: false,
        checked_at: new Date(this.now()).toISOString(),
        details: { enabled: this.options.enabled, configured: false },
      };
    }
    try {
      const response = await this.fetchWithTimeout(this.endpointUrl("/health"), {
        method: "GET",
        headers: this.headers(),
      });
      return {
        provider_id: this.id,
        healthy: response.ok,
        checked_at: new Date(this.now()).toISOString(),
        details: { enabled: true, configured: true, status: response.status },
      };
    } catch {
      return {
        provider_id: this.id,
        healthy: false,
        checked_at: new Date(this.now()).toISOString(),
        details: { enabled: true, configured: true, reachable: false },
      };
    }
  }

  validateResultForPlan(result: GenerationResult, plan: GenerationPlan): void {
    const expectedPrefix = `${REAL_IMAGE_STORAGE_PREFIX}/${plan.user_id}/${plan.job_id}/`;
    if (result.assets.length !== plan.input.output_count ||
        result.assets.some((asset) =>
          asset.job_id !== plan.job_id ||
          typeof asset.metadata.storage_path !== "string" ||
          !asset.metadata.storage_path.startsWith(expectedPrefix))) {
      throw new GatewayError(
        "PROVIDER_RESULT_OWNERSHIP_INVALID",
        "The provider result does not belong to the submitted user and job.",
        502,
        false,
      );
    }
  }

  verifyWebhook(rawBody: string, signature: string | undefined): boolean {
    if (!this.options.webhookSecret || !signature) return false;
    const normalized = signature.startsWith("sha256=") ? signature.slice(7) : signature;
    if (!/^[a-f0-9]{64}$/i.test(normalized)) return false;
    const expected = createHmac("sha256", this.options.webhookSecret).update(rawBody).digest();
    const actual = Buffer.from(normalized, "hex");
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  }

  parseWebhook(rawBody: string): { eventId: string; providerJobId: string } {
    let raw: unknown;
    try {
      raw = JSON.parse(rawBody);
    } catch {
      throw new GatewayError("INVALID_JSON", "Webhook body must be valid JSON.", 400);
    }
    const parsed = RunPodResponseSchema.safeParse(raw);
    if (!parsed.success) {
      throw new GatewayError("PROVIDER_WEBHOOK_INVALID", "The provider webhook payload is invalid.", 422);
    }
    return {
      eventId: `runpod_${createHash("sha256").update(rawBody).digest("hex")}`,
      providerJobId: parsed.data.id,
    };
  }

  mapError(raw: unknown): GatewayError {
    const text = typeof raw === "string"
      ? raw
      : raw && typeof raw === "object" && "message" in raw
        ? String((raw as { message: unknown }).message)
        : "";
    const lower = text.toLowerCase();
    if (lower.includes("timeout") || lower.includes("timed out")) {
      return new GatewayError("PROVIDER_TIMEOUT", "The real image provider timed out.", 504, true);
    }
    if (lower.includes("out of memory") || lower.includes("cuda")) {
      return new GatewayError("PROVIDER_GPU_CAPACITY", "The real image provider did not have enough GPU capacity.", 503, true);
    }
    if (lower.includes("workflow") || lower.includes("model")) {
      return new GatewayError("PROVIDER_WORKFLOW_FAILED", "The configured real image workflow could not execute.", 502, false);
    }
    return new GatewayError("PROVIDER_FAILED", "The real image provider failed to complete the request.", 502, true);
  }

  private async request(path: string, init: RequestInit): Promise<RunPodResponse> {
    let response: Response;
    try {
      response = await this.fetchWithTimeout(this.endpointUrl(path), {
        ...init,
        headers: { ...this.headers(), ...(init.body ? { "content-type": "application/json" } : {}) },
      });
    } catch (error) {
      if (error instanceof GatewayError) throw error;
      throw new GatewayError("PROVIDER_UNAVAILABLE", "The real image provider endpoint is unavailable.", 503, true);
    }
    if (!response.ok) throw await this.httpError(response);
    let json: unknown;
    try {
      json = await response.json();
    } catch {
      throw new GatewayError("PROVIDER_RESPONSE_INVALID", "The real image provider returned an invalid response.", 502, true);
    }
    const parsed = RunPodResponseSchema.safeParse(json);
    if (!parsed.success) {
      throw new GatewayError("PROVIDER_RESPONSE_INVALID", "The real image provider returned an invalid response.", 502, true);
    }
    return parsed.data;
  }

  private async httpError(response: Response): Promise<GatewayError> {
    if (response.status === 401 || response.status === 403) {
      return new GatewayError("PROVIDER_AUTH_FAILED", "The real image provider rejected its server credential.", 503, false);
    }
    if (response.status === 404) {
      return new GatewayError("PROVIDER_ENDPOINT_NOT_FOUND", "The configured real image endpoint was not found.", 503, false);
    }
    if (response.status === 429) {
      return new GatewayError("PROVIDER_RATE_LIMITED", "The real image provider is temporarily rate limited.", 503, true);
    }
    return new GatewayError("PROVIDER_UNAVAILABLE", "The real image provider endpoint is unavailable.", 503, true);
  }

  private async fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.options.requestTimeoutMs);
    try {
      return await this.fetchImpl(url, { ...init, signal: controller.signal });
    } catch (error) {
      if (controller.signal.aborted) {
        throw new GatewayError("PROVIDER_REQUEST_TIMEOUT", "The real image provider request timed out.", 504, true);
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }

  private endpointUrl(path: string): string {
    return `${this.apiBaseUrl.replace(/\/$/, "")}/${encodeURIComponent(this.options.endpointId ?? "")}${path}`;
  }

  private headers(): Record<string, string> {
    return { authorization: `Bearer ${this.options.apiKey}` };
  }

  private isConfigured(): boolean {
    return Boolean(
      this.options.enabled &&
      this.options.apiKey &&
      this.options.endpointId &&
      this.options.webhookSecret &&
      this.options.comfyuiWorkflowRef &&
      this.options.modelManifestRef &&
      this.options.storageBucket,
    );
  }

  private assertConfigured(): void {
    if (!this.isConfigured()) {
      throw new GatewayError("PROVIDER_NOT_CONFIGURED", "The real image provider is disabled or incomplete.", 503, false);
    }
  }
}

function status(providerJobId: string, value: "queued" | "running" | "cancelled", progress: number): ProviderJobStatus {
  return { provider_job_id: providerJobId, status: value, progress };
}

function failed(providerJobId: string, errorCode: string, errorMessage: string): ProviderJobStatus {
  return {
    provider_job_id: providerJobId,
    status: "failed",
    progress: 100,
    error_code: errorCode,
    error_message: errorMessage,
  };
}
