import { randomUUID } from "node:crypto";
import { ZodError } from "zod";

export class GatewayError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status = 400,
    public readonly retryable = false,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
  }
}

export function normalizeError(error: unknown): GatewayError {
  if (error instanceof GatewayError) return error;
  if (error instanceof ZodError) {
    return new GatewayError("INPUT_SCHEMA_INVALID", "Request payload failed validation.", 422, false, {
      issues: error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
    });
  }
  return new GatewayError("INTERNAL_ERROR", "The generation service could not complete the request.", 500, true);
}

export function errorBody(error: GatewayError, requestId: string, jobId?: string) {
  return {
    error: {
      code: error.code,
      message: error.message,
      retryable: error.retryable,
      ...(error.details ? { details: error.details } : {}),
    },
    request_id: requestId,
    ...(jobId ? { job_id: jobId } : {}),
  };
}

export const newId = (prefix: string) => `${prefix}_${randomUUID()}`;
