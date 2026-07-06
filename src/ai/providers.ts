import { AppError } from "../shared/errors.js";
import type {
  AiJobStatus,
  AiOperation,
  AiProvider,
  AiProviderJobStatus,
  AiProviderName,
  AiProviderRequest,
  AiProviderResult,
} from "./provider.js";

export class LocalStubAiProvider implements AiProvider {
  readonly name: AiProviderName = "local_api";
  private readonly statuses = new Map<string, AiProviderJobStatus>();

  async generateImage(request: AiProviderRequest): Promise<AiProviderResult> {
    return this.complete("generate_image", request, 8, 30);
  }

  async generateVideo(request: AiProviderRequest): Promise<AiProviderResult> {
    return this.complete("generate_video", request, 24, 160);
  }

  async generateCharacter(request: AiProviderRequest): Promise<AiProviderResult> {
    return this.complete("generate_character", request, 12, 50);
  }

  async upscale(request: AiProviderRequest): Promise<AiProviderResult> {
    return this.complete("upscale", request, 6, 20);
  }

  async editImage(request: AiProviderRequest): Promise<AiProviderResult> {
    return this.complete("edit_image", request, 10, 45);
  }

  async checkJobStatus(providerJobId: string): Promise<AiProviderJobStatus> {
    const status = this.statuses.get(providerJobId);
    if (!status) {
      throw new AppError("AI_PROVIDER_JOB_NOT_FOUND", "Provider job not found.", 404);
    }
    return status;
  }

  async cancelJob(providerJobId: string): Promise<AiProviderJobStatus> {
    const current = await this.checkJobStatus(providerJobId);
    const cancelled: AiProviderJobStatus = { ...current, status: "cancelled" };
    this.statuses.set(providerJobId, cancelled);
    return cancelled;
  }

  private complete(operation: AiOperation, request: AiProviderRequest, credits: number, estimatedCostCents: number): AiProviderResult {
    const providerJobId = `${this.name}_${request.jobId}`;
    const durationMs = operation === "generate_video" ? 900 : 240;
    const resolution = request.resolution ?? (operation === "generate_video" ? "1280x720" : "1024x1024");
    const output = {
      provider: this.name,
      operation,
      model: request.model,
      synthetic: true,
      assetKey: `${request.userId}/${request.jobId}/${operation}.txt`,
    };
    const status: AiProviderJobStatus = {
      providerJobId,
      status: "completed",
      progress: 100,
      output,
    };
    this.statuses.set(providerJobId, status);
    return {
      providerJobId,
      status: "completed",
      output,
      durationMs,
      resolution,
      estimatedCostCents,
      credits,
    };
  }
}

export class NotConfiguredAiProvider implements AiProvider {
  constructor(readonly name: AiProviderName) {}

  async generateImage(): Promise<AiProviderResult> {
    return this.notConfigured();
  }

  async generateVideo(): Promise<AiProviderResult> {
    return this.notConfigured();
  }

  async generateCharacter(): Promise<AiProviderResult> {
    return this.notConfigured();
  }

  async upscale(): Promise<AiProviderResult> {
    return this.notConfigured();
  }

  async editImage(): Promise<AiProviderResult> {
    return this.notConfigured();
  }

  async checkJobStatus(providerJobId: string): Promise<AiProviderJobStatus> {
    return { providerJobId, status: "failed", errorCode: "AI_PROVIDER_NOT_CONFIGURED", errorMessage: `${this.name} is not configured.` };
  }

  async cancelJob(providerJobId: string): Promise<AiProviderJobStatus> {
    return { providerJobId, status: "cancelled" };
  }

  private notConfigured(): never {
    throw new AppError("AI_PROVIDER_NOT_CONFIGURED", `${this.name} is not configured.`);
  }
}

export class AiProviderRegistry {
  private readonly providers = new Map<AiProviderName, AiProvider>();

  constructor(providers: AiProvider[] = defaultProviders()) {
    for (const provider of providers) {
      this.providers.set(provider.name, provider);
    }
  }

  get(name: AiProviderName): AiProvider {
    const provider = this.providers.get(name);
    if (!provider) {
      throw new AppError("AI_PROVIDER_UNKNOWN", `Unknown AI provider: ${name}.`);
    }
    return provider;
  }

  list(): AiProviderName[] {
    return [...this.providers.keys()];
  }
}

export function defaultProviders(): AiProvider[] {
  return [
    new NotConfiguredAiProvider("openai"),
    new NotConfiguredAiProvider("gemini"),
    new NotConfiguredAiProvider("comfyui"),
    new NotConfiguredAiProvider("fal"),
    new NotConfiguredAiProvider("replicate"),
    new NotConfiguredAiProvider("runpod"),
    new LocalStubAiProvider(),
  ];
}

export function isTerminalAiStatus(status: AiJobStatus): boolean {
  return status === "completed" || status === "failed" || status === "cancelled";
}
