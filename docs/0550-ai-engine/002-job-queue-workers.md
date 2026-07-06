# AI Job Queue And Workers

| Field | Value |
|---|---|
| Unique ID | AI-JOBS-001 |
| Version | 1.0.0 |
| Status | Active |
| Owner | AI Infrastructure Lead |
| Dependencies | ADR-005, BE-ARCH-QUEUE-001, BE-ARCH-GPU-JOBS-001 |
| Referenced By | AI-INDEX-001, DB-AI-JOBS-001 |

## Purpose

Define the AI job queue and independent worker foundation.

## Requirements

- AI jobs must be asynchronous.
- Supported statuses are pending, queued, running, completed, failed, cancelled, and retrying.
- Workers must operate independently from API request handling.
- Multiple workers and provider-specific workers must be supported later.

## Architecture

The local foundation stores AI jobs in `ai_jobs`, processes queued or retrying jobs through `AiWorker`, calls provider adapters through `AiProviderRegistry`, records completion or retry state, and writes cost records through `AiCostTracker`.

## Acceptance Criteria

- Jobs can be queued, run, completed, failed, retried, and cancelled.
- Worker processing is independent from job creation.
- Provider failure does not corrupt job state.

## Future Plan

Add production queue provider, worker leases, provider-specific queues, dead-letter handling, cancellation propagation, concurrency controls, and provider health checks.

## AI Context

Never run expensive AI generation inside request-response paths. Treat AI jobs as durable work items.
