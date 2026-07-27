import type { GenerationStatus } from "./domain.js";
import { GatewayError } from "./errors.js";

export const ALLOWED_TRANSITIONS: Readonly<Record<GenerationStatus, readonly GenerationStatus[]>> = {
  draft: ["parsing", "cancelled"],
  parsing: ["validating", "failed", "cancelled"],
  validating: ["planning", "failed", "cancelled"],
  planning: ["routing", "failed", "cancelled"],
  routing: ["queued", "failed", "cancelled"],
  queued: ["submitted", "running", "failed", "cancelled"],
  submitted: ["running", "failed", "cancelled"],
  running: ["post_processing", "failed", "cancelled"],
  post_processing: ["reviewing", "failed", "cancelled"],
  reviewing: ["completed", "failed", "cancelled"],
  completed: [],
  failed: [],
  cancelled: [],
};

export function assertTransition(from: GenerationStatus, to: GenerationStatus): void {
  if (!ALLOWED_TRANSITIONS[from].includes(to)) {
    throw new GatewayError(
      "ILLEGAL_STATUS_TRANSITION",
      `Generation job cannot transition from ${from} to ${to}.`,
      409,
      false,
      { from, to },
    );
  }
}

export const isTerminal = (status: GenerationStatus) =>
  status === "completed" || status === "failed" || status === "cancelled";
