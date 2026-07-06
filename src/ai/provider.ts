export type AiProviderName =
  | "openai"
  | "gemini"
  | "comfyui"
  | "fal"
  | "replicate"
  | "runpod"
  | "local_api";

export type AiOperation =
  | "generate_image"
  | "generate_video"
  | "generate_character"
  | "upscale"
  | "edit_image";

export type AiJobStatus =
  | "pending"
  | "queued"
  | "running"
  | "completed"
  | "failed"
  | "cancelled"
  | "retrying";

export interface AiProviderRequest {
  jobId: string;
  userId: string;
  prompt?: string;
  inputAssetKeys?: string[];
  characterId?: string;
  model: string;
  durationSeconds?: number;
  resolution?: string;
  aspectRatio?: string;
  metadata?: Record<string, unknown>;
}

export interface AiProviderResult {
  providerJobId: string;
  status: AiJobStatus;
  output: Record<string, unknown>;
  durationMs?: number;
  resolution?: string;
  estimatedCostCents: number;
  credits: number;
}

export interface AiProviderJobStatus {
  providerJobId: string;
  status: AiJobStatus;
  progress?: number;
  output?: Record<string, unknown>;
  errorCode?: string;
  errorMessage?: string;
}

export interface AiProvider {
  readonly name: AiProviderName;
  generateImage(request: AiProviderRequest): Promise<AiProviderResult>;
  generateVideo(request: AiProviderRequest): Promise<AiProviderResult>;
  generateCharacter(request: AiProviderRequest): Promise<AiProviderResult>;
  upscale(request: AiProviderRequest): Promise<AiProviderResult>;
  editImage(request: AiProviderRequest): Promise<AiProviderResult>;
  checkJobStatus(providerJobId: string): Promise<AiProviderJobStatus>;
  cancelJob(providerJobId: string): Promise<AiProviderJobStatus>;
}

export function operationToProviderMethod(operation: AiOperation): keyof Pick<
  AiProvider,
  "generateImage" | "generateVideo" | "generateCharacter" | "upscale" | "editImage"
> {
  switch (operation) {
    case "generate_image":
      return "generateImage";
    case "generate_video":
      return "generateVideo";
    case "generate_character":
      return "generateCharacter";
    case "upscale":
      return "upscale";
    case "edit_image":
      return "editImage";
  }
}
