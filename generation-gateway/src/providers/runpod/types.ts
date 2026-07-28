import { z } from "zod";

export const RunPodJobStatusSchema = z.enum([
  "IN_QUEUE",
  "IN_PROGRESS",
  "RUNNING",
  "COMPLETED",
  "FAILED",
  "CANCELLED",
  "TIMED_OUT",
]);

export const RunPodAssetSchema = z.object({
  storage_path: z.string().min(1).max(1024),
  signed_url: z.string().url().max(4096),
  signed_url_expires_at: z.string().datetime(),
  mime_type: z.enum(["image/png", "image/jpeg", "image/webp"]),
  width: z.number().int().positive().max(8192),
  height: z.number().int().positive().max(8192),
  output_index: z.number().int().min(0).max(3),
  checksum_sha256: z.string().regex(/^[a-f0-9]{64}$/).optional(),
});

export const RunPodWorkerOutputSchema = z.object({
  schema_version: z.literal("1.0"),
  job_id: z.string().min(1),
  user_id: z.string().uuid(),
  assets: z.array(RunPodAssetSchema).min(1).max(4),
  metrics: z.object({
    gpu_type: z.string().min(1).max(120),
    generation_duration_ms: z.number().int().nonnegative(),
    estimated_cost: z.number().nonnegative().default(0),
    actual_cost: z.number().nonnegative().default(0),
  }),
});

export const RunPodResponseSchema = z.object({
  id: z.string().min(1),
  status: RunPodJobStatusSchema,
  output: z.unknown().optional(),
  error: z.unknown().optional(),
  executionTime: z.number().nonnegative().optional(),
  delayTime: z.number().nonnegative().optional(),
});

export type RunPodResponse = z.infer<typeof RunPodResponseSchema>;
export type RunPodWorkerOutput = z.infer<typeof RunPodWorkerOutputSchema>;

