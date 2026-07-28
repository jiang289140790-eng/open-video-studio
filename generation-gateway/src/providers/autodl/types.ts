import { z } from "zod";
import { RunPodWorkerOutputSchema } from "../runpod/types.js";

export const AutoDLJobStatusSchema = z.enum([
  "queued",
  "running",
  "completed",
  "failed",
  "cancelled",
  "timeout",
]);

export const AutoDLJobResponseSchema = z.object({
  id: z.string().min(1),
  status: AutoDLJobStatusSchema,
  output: RunPodWorkerOutputSchema.optional(),
  error: z.unknown().optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

export type AutoDLJobResponse = z.infer<typeof AutoDLJobResponseSchema>;

