import type { GenerationInput, GenerationJob, GenerationReview } from "./domain.js";
import { GatewayError, newId } from "./errors.js";
import { buildPromptPackage, listWorkflowManifests, parseCreativeBrief, routeWorkflow, validatePolicy } from "./planning.js";
import type { GenerationProvider } from "./provider.js";
import type { GenerationRepository, ProviderCostMetrics } from "./repository.js";
import type { CharacterBinding, RegistryStore } from "./registry.js";
import { isTerminal } from "./state-machine.js";
import { REFERENCE_REMAKE_LORA_ID, REFERENCE_REMAKE_WORKFLOW_ID } from "./reference-remake-workflow.js";
import {
  analyzeReference,
  ReferenceAnalysisSchema,
  type ReferenceAnalysis,
  type ReferenceAnalysisRequest,
} from "./reference-analysis.js";
import {
  MOCK_REFERENCE_LORA_ID,
  MOCK_REFERENCE_MODEL_ID,
  MOCK_REFERENCE_WORKFLOW_ID,
} from "./mock-reference-workflow.js";

export interface EngineOptions {
  pollIntervalMs: number;
  maxExecutionMs: number;
  testingWorkflowsEnabled?: boolean;
  testingWorkflowId?: string;
  testingWorkflowIds?: readonly string[];
}

export class GenerationEngine {
  private readonly running = new Set<string>();
  private readonly submissionBarriers = new Map<string, Promise<void>>();

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
      await this.validateMockReferenceConfirmation(userId, input);
      validatePolicy({ input, brief, userId, ownedAssetIds });
      const character = input.character_id
        ? await this.validateCharacter(userId, input.character_id, input, brief.people_count)
        : null;
      job = await this.repository.transition(job.id, "planning");
      job = await this.repository.transition(job.id, "routing");
      const availableManifests = await this.availableManifests();
      const plan = this.route(job.id, userId, input, brief, availableManifests);
      this.bindCharacter(plan, character, input);
      plan.prompt_package = buildPromptPackage(plan);
      const providerId = await this.selectProvider(plan.selected_workflow_id!, availableManifests);
      plan.provider = providerId;
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

  async analyzeReference(userId: string, request: ReferenceAnalysisRequest) {
    const owned = await this.repository.ownedAssetIds(userId, [request.reference_asset_id]);
    if (!owned.has(request.reference_asset_id)) {
      throw new GatewayError("INPUT_ASSET_NOT_OWNED", "The reference asset is not owned by the authenticated user.", 403);
    }
    const analysis = analyzeReference(request);
    if (!this.registry) throw new GatewayError("REFERENCE_ANALYSIS_REGISTRY_UNAVAILABLE", "Reference analysis persistence is unavailable.", 503, true);
    return this.registry.createReferenceAnalysis(userId, request.reference_asset_id, analysis);
  }

  async confirmReferenceAnalysis(userId: string, analysisId: string, referenceAssetId: string, analysis: ReferenceAnalysis) {
    if (!this.registry) throw new GatewayError("REFERENCE_ANALYSIS_REGISTRY_UNAVAILABLE", "Reference analysis persistence is unavailable.", 503, true);
    const current = await this.registry.getReferenceAnalysis(analysisId, userId);
    if (!current || current.reference_asset_id !== referenceAssetId) {
      throw new GatewayError("REFERENCE_ANALYSIS_ASSET_MISMATCH", "The confirmation references a different asset.", 422);
    }
    return this.registry.confirmReferenceAnalysis(analysisId, userId, ReferenceAnalysisSchema.parse(analysis));
  }

  async cancel(userId: string, jobId: string): Promise<GenerationJob> {
    let job = await this.required(jobId);
    this.assertOwner(job, userId);
    if (job.status === "cancelled") return job;
    if (job.status === "completed" || job.status === "failed") {
      throw new GatewayError("JOB_NOT_CANCELLABLE", "A terminal generation job cannot be cancelled.", 409);
    }
    const submissionBarrier = this.submissionBarriers.get(job.id);
    if (job.provider && !job.provider_job_id && submissionBarrier) {
      await submissionBarrier;
      job = await this.required(jobId);
      if (job.status === "cancelled") return job;
      if (job.status === "completed" || job.status === "failed") {
        throw new GatewayError("JOB_NOT_CANCELLABLE", "A terminal generation job cannot be cancelled.", 409);
      }
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
    // A duplicate callback can be the recovery signal after a process restart or
    // a transient database failure. Completion writes are idempotent, so always
    // resume a non-terminal job while preserving duplicate-event reporting.
    if (!isTerminal(job.status)) this.run(job.id);
    return { duplicate: !inserted };
  }

  private async createRetry(userId: string, input: GenerationInput, retryOf: string): Promise<GenerationJob> {
    const job = await this.repository.createJob(userId, input, retryOf);
    let current = await this.repository.transition(job.id, "parsing");
    const brief = parseCreativeBrief(input);
    current = await this.repository.transition(job.id, "validating", { parsed_brief: brief });
    const owned = await this.repository.ownedAssetIds(userId, input.reference_assets.map((item) => item.asset_id));
    await this.validateMockReferenceConfirmation(userId, input);
    validatePolicy({ input, brief, userId, ownedAssetIds: owned });
    const character = input.character_id
      ? await this.validateCharacter(userId, input.character_id, input, brief.people_count)
      : null;
    current = await this.repository.transition(job.id, "planning");
    current = await this.repository.transition(job.id, "routing");
    const availableManifests = await this.availableManifests();
    const plan = this.route(job.id, userId, input, brief, availableManifests);
    this.bindCharacter(plan, character, input);
    plan.prompt_package = buildPromptPackage(plan);
    const providerId = await this.selectProvider(plan.selected_workflow_id!, availableManifests);
    plan.provider = providerId;
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
    let resolveSubmission!: () => void;
    let submissionSettled = false;
    const barrier = new Promise<void>((resolve) => {
      resolveSubmission = resolve;
    });
    const markSubmissionSettled = () => {
      if (submissionSettled) return;
      submissionSettled = true;
      resolveSubmission();
    };
    this.submissionBarriers.set(jobId, barrier);
    void this.execute(jobId, markSubmissionSettled).finally(() => {
      markSubmissionSettled();
      this.submissionBarriers.delete(jobId);
      this.running.delete(jobId);
    });
  }

  private async execute(jobId: string, markSubmissionSettled: () => void): Promise<void> {
    let job = await this.required(jobId);
    if (isTerminal(job.status)) {
      markSubmissionSettled();
      return;
    }
    const provider = this.providers.get(job.provider ?? "mock");
    if (!provider || !job.generation_plan) {
      markSubmissionSettled();
      await this.fail(job, "PROVIDER_UNAVAILABLE", "No configured provider can execute this plan.");
      return;
    }
    try {
      if (!job.provider_job_id) {
        let submissionPlan = job.generation_plan;
        if (submissionPlan.selected_workflow_id === REFERENCE_REMAKE_WORKFLOW_ID && submissionPlan.reference_asset_id) {
          const referenceInputSignedUrl = await this.repository.createReferenceSignedUrl(
            job.user_id,
            submissionPlan.reference_asset_id,
            900,
          );
          submissionPlan = {
            ...submissionPlan,
            runtime: { reference_input_signed_url: referenceInputSignedUrl },
          } as typeof submissionPlan;
        }
        const submitted = await provider.submit(submissionPlan);
        await this.repository.addAttempt(job.id, job.user_id, provider.id, submitted.provider_job_id, submitted.estimated_cost);
        job = await this.repository.transition(job.id, "submitted", {
          provider: provider.id,
          provider_job_id: submitted.provider_job_id,
          estimated_cost: submitted.estimated_cost,
        });
      }
      markSubmissionSettled();
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
          if (job.status === "submitted" || job.status === "queued") {
            job = await this.repository.transition(job.id, "running", { started_at: new Date().toISOString() });
          }
          if (job.status === "running") {
            job = await this.repository.transition(job.id, "post_processing");
          }
          await this.repository.saveAssets(job.user_id, status.result.assets);
          if (job.status === "post_processing") {
            job = await this.repository.transition(job.id, "reviewing");
          }
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
    const mockReferenceRequested = input.structured_options.execution_mode === "mock_reference";
    const enabledIds = this.options.testingWorkflowIds?.length
      ? [...this.options.testingWorkflowIds]
      : this.options.testingWorkflowId
        ? [this.options.testingWorkflowId]
        : [];
    const requestedWorkflowId = typeof input.structured_options.workflow_id === "string"
      ? input.structured_options.workflow_id
      : enabledIds[0];
    if (realTestRequested && (!this.options.testingWorkflowsEnabled || !requestedWorkflowId || !enabledIds.includes(requestedWorkflowId))) {
      throw new GatewayError("REAL_PROVIDER_NOT_ENABLED", "Real image testing is not enabled in this environment.", 503, false);
    }
    if (mockReferenceRequested) {
      return routeWorkflow(jobId, userId, input, brief, manifests, {
        allowedStatuses: ["production"],
        requiredWorkflowId: MOCK_REFERENCE_WORKFLOW_ID,
      });
    }
    return routeWorkflow(jobId, userId, input, brief, manifests, realTestRequested ? {
      allowedStatuses: ["testing"],
      requiredWorkflowId: requestedWorkflowId,
    } : undefined);
  }

  private async validateCharacter(
    userId: string,
    characterId: string,
    input: GenerationInput,
    peopleCount: number,
  ) {
    if (!this.registry) {
      throw new GatewayError("CHARACTER_REGISTRY_UNAVAILABLE", "Character validation is unavailable.", 503, true);
    }
    const character = await this.registry.getCharacterForUser(characterId, userId);
    if (!character) throw new GatewayError("CHARACTER_NOT_FOUND", "The selected character was not found.", 404);
    if (!character.is_adult || character.declared_age < 18 || !input.subject_age_confirmed_adult || peopleCount !== 1) {
      throw new GatewayError(
        "CHARACTER_ADULT_VALIDATION_FAILED",
        "Only a verified adult single-person character can enter this workflow.",
        422,
        false,
      );
    }
    if (!["testing", "production"].includes(character.status)) {
      throw new GatewayError("CHARACTER_NOT_ACTIVE", "The selected character is not enabled for generation.", 409);
    }
    return character;
  }

  private bindCharacter(
    plan: ReturnType<typeof routeWorkflow>,
    character: CharacterBinding | null,
    input: GenerationInput,
  ): void {
    if (![REFERENCE_REMAKE_WORKFLOW_ID, MOCK_REFERENCE_WORKFLOW_ID].includes(plan.selected_workflow_id ?? "")) return;
    if (!character) {
      throw new GatewayError("CHARACTER_REQUIRED", "The reference-remake workflow requires a verified character.", 422);
    }
    const requestedWeight = Number(input.structured_options.lora_weight ?? character.default_lora_weight);
    if (!Number.isFinite(requestedWeight) ||
        requestedWeight < character.min_lora_weight ||
        requestedWeight > character.max_lora_weight) {
      throw new GatewayError("CHARACTER_LORA_WEIGHT_INVALID", "The requested character LoRA weight is outside its tested range.", 422);
    }
    const isMockReference = plan.selected_workflow_id === MOCK_REFERENCE_WORKFLOW_ID;
    const expectedModelId = isMockReference ? MOCK_REFERENCE_MODEL_ID : plan.selected_model_id;
    const expectedLoraId = isMockReference ? MOCK_REFERENCE_LORA_ID : REFERENCE_REMAKE_LORA_ID;
    if (character.base_model_id !== expectedModelId || character.lora_id !== expectedLoraId) {
      throw new GatewayError("CHARACTER_LORA_INCOMPATIBLE", "The selected character LoRA is not compatible with this workflow.", 422);
    }
    plan.selected_lora_ids = [character.lora_id];
    plan.lora_bindings = [{
      lora_id: character.lora_id,
      version: character.lora_version,
      weight: requestedWeight,
      trigger_words: character.trigger_words,
    }];
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

  private async validateMockReferenceConfirmation(userId: string, input: GenerationInput): Promise<void> {
    if (input.structured_options.execution_mode !== "mock_reference") return;
    if (!this.registry) throw new GatewayError("REFERENCE_ANALYSIS_REGISTRY_UNAVAILABLE", "Reference analysis persistence is unavailable.", 503, true);
    const analysisId = typeof input.structured_options.reference_analysis_id === "string"
      ? input.structured_options.reference_analysis_id
      : "";
    const referenceAssetId = input.reference_assets[0]?.asset_id;
    const suppliedAnalysis = ReferenceAnalysisSchema.safeParse(input.structured_options.reference_analysis);
    if (!analysisId || !referenceAssetId || !suppliedAnalysis.success) {
      throw new GatewayError("REFERENCE_ANALYSIS_CONFIRMATION_REQUIRED", "A persisted and confirmed reference analysis is required.", 422);
    }
    const record = await this.registry.getReferenceAnalysis(analysisId, userId);
    if (
      !record?.confirmed_at ||
      !record.confirmed_analysis ||
      record.reference_asset_id !== referenceAssetId ||
      JSON.stringify(record.confirmed_analysis) !== JSON.stringify(suppliedAnalysis.data)
    ) {
      throw new GatewayError("REFERENCE_ANALYSIS_CONFIRMATION_MISMATCH", "The confirmed reference analysis does not match this request.", 422);
    }
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
