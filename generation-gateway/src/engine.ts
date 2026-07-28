import type { GenerationInput, GenerationJob, GenerationReview } from "./domain.js";
import { GatewayError, newId } from "./errors.js";
import { buildPromptPackage, listWorkflowManifests, parseCreativeBrief, routeWorkflow, validatePolicy } from "./planning.js";
import type { GenerationProvider } from "./provider.js";
import type { GenerationRepository, ProviderCostMetrics } from "./repository.js";
import type { RegistryStore } from "./registry.js";
import { isTerminal } from "./state-machine.js";

export interface EngineOptions {
  pollIntervalMs: number;
  maxExecutionMs: number;
  testingWorkflowsEnabled?: boolean;
  testingWorkflowId?: string;
}

export class GenerationEngine {
  private readonly running = new Set<string>();

  constructor(
    private readonly repository: GenerationRepository,
    private readonly providers: ReadonlyMap<string, GenerationProvider>,
    private readonly options: EngineOptions = { pollIntervalMs: 50, maxExecutionMs: 120_000 },
    private readonly registry?: RegistryStore,
  ) {}

  async create(userId: string, input: GenerationInput): Promise<{ job: GenerationJob; duplicate: boolean }> {
    if (input.idempotency_key) {
      const existing = await this.repository.findByIdempotencyKey(userId, input.idempotency_key);
      if (existing) return { job: existing, duplicate: true };
    }
    let job = await this.repository.createJob(userId, input);
    try {
      job = await this.repository.transition(job.id, "parsing");
      const brief = parseCreativeBrief(input);
      job = await this.repository.transition(job.id, "validating", { parsed_brief: brief });
      const requestedIds = input.reference_assets.map((asset) => asset.asset_id);
      const ownedAssetIds = await this.repository.ownedAssetIds(userId, requestedIds);
      validatePolicy({ input, brief, userId, ownedAssetIds });
      job = await this.repository.transition(job.id, "planning");
      job = await this.repository.transition(job.id, "routing");
      const availableManifests = await this.availableManifests();
      const plan = this.route(job.id, userId, input, brief, availableManifests);
      plan.prompt_package = buildPromptPackage(plan);
      const providerId = await this.selectProvider(plan.selected_workflow_id!, availableManifests);
      const estimate = input.media_type === "image" ? input.output_count : input.output_count * 3;
      await this.repository.recordBilling(userId, job.id, "estimate", estimate, `billing:${job.id}:estimate`);
      await this.repository.recordBilling(userId, job.id, "reserve", estimate, `billing:${job.id}:reserve`);
      job = await this.repository.transition(job.id, "queued", {
        generation_plan: plan,
        selected_workflow_id: plan.selected_workflow_id,
        selected_model_id: plan.selected_model_id,
        provider: providerId,
        estimated_cost: estimate,
      });
      this.run(job.id);
      return { job, duplicate: false };
    } catch (error) {
      const current = await this.repository.getJob(job.id);
      if (current && !isTerminal(current.status) && current.status !== "draft") {
        const normalized = error instanceof GatewayError ? error : new GatewayError("PLANNING_FAILED", "Generation planning failed.", 500, true);
        await this.repository.transition(job.id, "failed", {
          error_code: normalized.code,
          error_message: normalized.message,
          completed_at: new Date().toISOString(),
        });
        await this.repository.recordBilling(userId, job.id, "release", job.estimated_cost, `billing:${job.id}:release`);
      }
      throw error;
    }
  }

  async get(userId: string, jobId: string): Promise<GenerationJob> {
    const job = await this.required(jobId);
    this.assertOwner(job, userId);
    return job;
  }

  async list(userId: string, options: Parameters<GenerationRepository["listJobs"]>[1]): Promise<GenerationJob[]> {
    return this.repository.listJobs(userId, options);
  }

  async cancel(userId: string, jobId: string): Promise<GenerationJob> {
    const job = await this.required(jobId);
    this.assertOwner(job, userId);
    if (job.status === "cancelled") return job;
    if (job.status === "completed" || job.status === "failed") {
      throw new GatewayError("JOB_NOT_CANCELLABLE", "A terminal generation job cannot be cancelled.", 409);
    }
    if (job.provider && job.provider_job_id) await this.providers.get(job.provider)?.cancel(job.provider_job_id);
    const cancelled = await this.repository.transition(job.id, "cancelled", {
      cancelled_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    });
    await this.repository.recordBilling(userId, job.id, "release", job.estimated_cost, `billing:${job.id}:release`);
    if (job.provider_job_id) await this.repository.completeAttempt(job.provider_job_id, "cancelled", 0);
    return cancelled;
  }

  async retry(userId: string, jobId: string): Promise<GenerationJob> {
    const job = await this.required(jobId);
    this.assertOwner(job, userId);
    if (job.status !== "failed" && job.status !== "cancelled") {
      throw new GatewayError("JOB_NOT_RETRYABLE", "Only failed or cancelled jobs can be retried.", 409);
    }
    const input = {
      ...job.input,
      idempotency_key: `${job.input.idempotency_key ?? job.id}:retry:${job.attempt_count + 1}`,
    };
    const existing = await this.repository.findByIdempotencyKey(userId, input.idempotency_key);
    if (existing) return existing;
    const created = await this.createRetry(userId, input, job.id);
    return created;
  }

  async events(userId: string, jobId: string) {
    const job = await this.required(jobId);
    this.assertOwner(job, userId);
    return this.repository.listEvents(jobId);
  }

  async adminEvents(jobId: string) {
    await this.required(jobId);
    return this.repository.listEvents(jobId);
  }

  async handleProviderWebhook(providerId: string, eventId: string, providerJobId: string): Promise<{ duplicate: boolean }> {
    const provider = this.providers.get(providerId);
    if (!provider) throw new GatewayError("PROVIDER_NOT_FOUND", "Provider is not registered.", 404);
    const job = await this.repository.findByProviderJobId(providerJobId);
    if (!job) throw new GatewayError("PROVIDER_JOB_NOT_FOUND", "Provider job was not found.", 404);
    const inserted = await this.repository.appendEvent({
      job_id: job.id,
      event_type: "provider.webhook",
      payload: { provider: providerId, provider_job_id: providerJobId },
      idempotency_key: `webhook:${providerId}:${eventId}`,
    });
    if (inserted && !isTerminal(job.status)) this.run(job.id);
    return { duplicate: !inserted };
  }

  private async createRetry(userId: string, input: GenerationInput, retryOf: string): Promise<GenerationJob> {
    const job = await this.repository.createJob(userId, input, retryOf);
    let current = await this.repository.transition(job.id, "parsing");
    const brief = parseCreativeBrief(input);
    current = await this.repository.transition(job.id, "validating", { parsed_brief: brief });
    const owned = await this.repository.ownedAssetIds(userId, input.reference_assets.map((item) => item.asset_id));
    validatePolicy({ input, brief, userId, ownedAssetIds: owned });
    current = await this.repository.transition(job.id, "planning");
    current = await this.repository.transition(job.id, "routing");
    const availableManifests = await this.availableManifests();
    const plan = this.route(job.id, userId, input, brief, availableManifests);
    plan.prompt_package = buildPromptPackage(plan);
    const providerId = await this.selectProvider(plan.selected_workflow_id!, availableManifests);
    const estimate = input.media_type === "image" ? input.output_count : input.output_count * 3;
    await this.repository.recordBilling(userId, retryOf, "reserve", estimate, `billing:${retryOf}:reserve`);
    current = await this.repository.transition(job.id, "queued", {
      generation_plan: plan,
      selected_workflow_id: plan.selected_workflow_id,
      selected_model_id: plan.selected_model_id,
      provider: providerId,
      estimated_cost: estimate,
    });
    this.run(job.id);
    return current;
  }

  private run(jobId: string): void {
    if (this.running.has(jobId)) return;
    this.running.add(jobId);
    void this.execute(jobId).finally(() => this.running.delete(jobId));
  }

  private async execute(jobId: string): Promise<void> {
    let job = await this.required(jobId);
    if (isTerminal(job.status)) return;
    const provider = this.providers.get(job.provider ?? "mock");
    if (!provider || !job.generation_plan) {
      await this.fail(job, "PROVIDER_UNAVAILABLE", "No configured provider can execute this plan.");
      return;
    }
    try {
      if (!job.provider_job_id) {
        const submitted = await provider.submit(job.generation_plan);
        await this.repository.addAttempt(job.id, job.user_id, provider.id, submitted.provider_job_id, submitted.estimated_cost);
        job = await this.repository.transition(job.id, "submitted", {
          provider: provider.id,
          provider_job_id: submitted.provider_job_id,
          estimated_cost: submitted.estimated_cost,
        });
      }
      const deadline = Date.now() + this.options.maxExecutionMs;
      while (Date.now() < deadline) {
        job = await this.required(jobId);
        if (isTerminal(job.status)) return;
        const status = await provider.getStatus(job.provider_job_id!);
        if (status.status === "queued") {
          await delay(this.options.pollIntervalMs);
          continue;
        }
        if (status.status === "running") {
          if (job.status === "submitted" || job.status === "queued") job = await this.repository.transition(job.id, "running", { started_at: new Date().toISOString() });
          await delay(this.options.pollIntervalMs);
          continue;
        }
        if (status.status === "cancelled") {
          await this.cancel(job.user_id, job.id);
          return;
        }
        if (status.status === "failed") {
          await this.repository.completeAttempt(status.provider_job_id, "failed", 0, status.error_code);
          await this.fail(job, status.error_code ?? "PROVIDER_FAILED", status.error_message ?? "Provider execution failed.");
          return;
        }
        if (status.status === "completed" && status.result) {
          provider.validateResultForPlan?.(status.result, job.generation_plan!);
          if (job.status === "submitted") job = await this.repository.transition(job.id, "running", { started_at: new Date().toISOString() });
          job = await this.repository.transition(job.id, "post_processing");
          await this.repository.saveAssets(job.user_id, status.result.assets);
          job = await this.repository.transition(job.id, "reviewing");
          const review = reviewResult(job.id, status.result.assets.length === job.output_count);
          await this.repository.saveReview(job.user_id, review);
          const metrics = costMetrics(status.result.raw_redacted);
          await this.repository.completeAttempt(status.provider_job_id, "completed", status.result.cost, undefined, metrics);
          await this.repository.recordBilling(
            job.user_id,
            job.id,
            "capture",
            status.result.cost,
            `billing:${job.id}:capture`,
            provider.id,
            metrics,
          );
          await this.repository.transition(job.id, "completed", {
            assets: status.result.assets,
            review,
            final_cost: status.result.cost,
            completed_at: new Date().toISOString(),
          });
          return;
        }
        await delay(this.options.pollIntervalMs);
      }
      await this.fail(job, "PROVIDER_TIMEOUT", "Provider execution exceeded the gateway timeout.");
    } catch (error) {
      const normalized = error instanceof GatewayError ? error : new GatewayError("PROVIDER_EXECUTION_FAILED", "Provider execution failed.", 502, true);
      const latest = await this.required(jobId);
      if (!isTerminal(latest.status)) await this.fail(latest, normalized.code, normalized.message);
    }
  }

  private async fail(job: GenerationJob, code: string, message: string): Promise<void> {
    if (isTerminal(job.status)) return;
    await this.repository.recordBilling(job.user_id, job.id, "release", job.estimated_cost, `billing:${job.id}:release`);
    await this.repository.transition(job.id, "failed", {
      error_code: code,
      error_message: message,
      completed_at: new Date().toISOString(),
    });
  }

  private async required(jobId: string): Promise<GenerationJob> {
    const job = await this.repository.getJob(jobId);
    if (!job) throw new GatewayError("GENERATION_JOB_NOT_FOUND", "Generation job was not found.", 404);
    return job;
  }

  private async availableManifests() {
    return this.registry ? this.registry.listWorkflows() : listWorkflowManifests();
  }

  private route(
    jobId: string,
    userId: string,
    input: GenerationInput,
    brief: ReturnType<typeof parseCreativeBrief>,
    manifests: Awaited<ReturnType<RegistryStore["listWorkflows"]>>,
  ) {
    const realTestRequested = input.structured_options.execution_mode === "real_test";
    if (realTestRequested && (!this.options.testingWorkflowsEnabled || !this.options.testingWorkflowId)) {
      throw new GatewayError("REAL_PROVIDER_NOT_ENABLED", "Real image testing is not enabled in this environment.", 503, false);
    }
    return routeWorkflow(jobId, userId, input, brief, manifests, realTestRequested ? {
      allowedStatuses: ["testing"],
      requiredWorkflowId: this.options.testingWorkflowId,
    } : undefined);
  }

  private async selectProvider(workflowId: string, manifests: Awaited<ReturnType<RegistryStore["listWorkflows"]>>): Promise<string> {
    const manifest = manifests.find((item) => item.id === workflowId);
    if (!manifest) throw new GatewayError("WORKFLOW_NOT_FOUND", "Selected workflow is no longer registered.", 409, true);
    for (const providerId of manifest.provider_ids) {
      const provider = this.providers.get(providerId);
      if (!provider) continue;
      const health = await provider.healthCheck();
      if (health.healthy) return providerId;
    }
    throw new GatewayError("PROVIDER_UNAVAILABLE", "No healthy provider is available for the selected workflow.", 503, true);
  }

  private assertOwner(job: GenerationJob, userId: string): void {
    if (job.user_id !== userId) throw new GatewayError("GENERATION_JOB_NOT_FOUND", "Generation job was not found.", 404);
  }

}

function reviewResult(jobId: string, outputCountMatches: boolean): GenerationReview {
  return {
    id: newId("review"),
    job_id: jobId,
    status: outputCountMatches ? "approved" : "needs_review",
    score: outputCountMatches ? 1 : 0.5,
    checks: {
      output_count_matches: outputCountMatches,
      mock_asset_metadata_present: true,
      provider_result_normalized: true,
    },
    notes: outputCountMatches ? ["Mock quality checks passed."] : ["Output count requires operator review."],
  };
}

const delay = (milliseconds: number) => new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

function costMetrics(value: Record<string, unknown>): ProviderCostMetrics {
  return {
    ...(typeof value.provider_attempt_id === "string" ? { provider_attempt_id: value.provider_attempt_id } : {}),
    ...(typeof value.gpu_type === "string" ? { gpu_type: value.gpu_type } : {}),
    ...(typeof value.generation_duration_ms === "number" ? { generation_duration_ms: value.generation_duration_ms } : {}),
    ...(typeof value.output_count === "number" ? { output_count: value.output_count } : {}),
    ...(typeof value.cost_per_output === "number" ? { cost_per_output: value.cost_per_output } : {}),
  };
}
