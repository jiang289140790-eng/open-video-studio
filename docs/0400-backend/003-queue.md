# Queue Backend Architecture

| Field | Value |
|---|---|
| Unique ID | BE-ARCH-QUEUE-001 |
| Version | 1.2.0 |
| Status | Active |
| Owner | Backend Lead / Infrastructure Lead |
| Dependencies | AUTO-INDEX-001, BE-ARCH-GPU-JOBS-001, DEVOPS-INDEX-001 |
| Referenced By | BE-ARCH-BIBLE-001, BE-ARCH-GPU-JOBS-001, BE-ARCH-VIDEO-PROCESSING-001 |
| Cross References | AUTO-INDEX-001, DEVOPS-INDEX-001, DB-AUDIT-LOGS-001 |

## Purpose

Define backend architecture for asynchronous work, retries, background jobs, and workflow decoupling.

## Requirements

- Move long-running and unreliable work out of request-response paths.
- Support retries, idempotency, dead-letter handling, and observability.
- Separate job categories by cost, priority, and resource requirements.

## Architecture

The queue layer should receive durable job requests from APIs and backend services, route them to specialized workers, track job state, and expose progress to product surfaces. Queue design must distinguish lightweight background jobs from GPU-intensive jobs.

## Responsibilities

- Enqueue media processing, generation, billing sync, notification, analytics, and webhook work.
- Track job status and retry state.
- Support priorities, delays, deduplication, and cancellation where required.
- Provide dead-letter and manual recovery paths.

## Dependencies

Depends on job storage, workers, monitoring, logging, notification system, GPU job architecture, and automation standards.

## Failure Recovery

Failed jobs should retry based on error type. Poison jobs should move to dead-letter queues. Idempotency keys should prevent duplicate side effects. Critical job failures should alert operators.

## Scalability

Queue workers should scale independently by job type. High-cost jobs need concurrency limits and backpressure. Low-latency jobs should not be blocked by GPU or video workloads.

## Acceptance Criteria

- Long-running work has durable state and recovery behavior.
- Queues protect user-facing APIs from slow provider or processing work.
- Operations can inspect and recover failed jobs.

## Current Implementation

`ADR-004` implements a local service-layer generation queue foundation through `GenerationService` and the `generation_jobs` table. Jobs can be queued, started, completed, failed, and listed as user history.

`ADR-005` adds a provider-level AI job queue through `AiJobQueue` and `ai_jobs`, with statuses pending, queued, running, completed, failed, cancelled, and retrying.

These are durable local workflow models, not a production queue provider, worker lease system, dead-letter queue, or GPU worker deployment.

## Future Plan

Define queue provider, job taxonomy, priority rules, retry policies, dead-letter process, and worker deployment model.

## AI Context

Assume AI media work is asynchronous. Do not design generation, rendering, or provider calls as fragile synchronous API requests.
