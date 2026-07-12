# GPU Jobs Backend Architecture

| Field | Value |
|---|---|
| Unique ID | BE-ARCH-GPU-JOBS-001 |
| Version | 1.1.0 |
| Status | Active |
| Owner | AI Infrastructure Lead / Backend Lead |
| Dependencies | BE-ARCH-QUEUE-001, AI-INDEX-001, API-GEN-IMAGE-001, API-GEN-VIDEO-001, DB-CREDITS-001 |
| Referenced By | BE-ARCH-BIBLE-001, BE-ARCH-IMAGE-PROCESSING-001, BE-ARCH-VIDEO-PROCESSING-001 |
| Cross References | AI-INDEX-001, DB-CREDITS-001, DEVOPS-INDEX-001 |

## Purpose

Define backend architecture for GPU-backed generation, inference, rendering assistance, and AI media jobs.

## Requirements

- Treat GPU work as expensive, scarce, and failure-prone.
- Support scheduling, capacity control, job state, credit impact, and provider fallback.
- Keep user-visible progress and recovery paths clear.

## Architecture

GPU jobs should be scheduled through queues and executed by specialized workers or external AI providers. The backend should record job intent, resource class, model/provider, cost estimate, status, outputs, and failure context.

## Responsibilities

- Validate job eligibility before resource allocation.
- Reserve or estimate credits where appropriate.
- Schedule GPU jobs with concurrency controls.
- Track progress, outputs, failures, and provider metadata.
- Route completed assets into storage and database records.

## Dependencies

Depends on queue architecture, AI model orchestration, credit system, storage, image/video processing, monitoring, and provider integrations.

## Failure Recovery

Jobs should support retry when provider or infrastructure failures are transient. Non-retryable failures should release reservations, record failure reason, notify users, and preserve enough context for support.

## Scalability

GPU capacity must scale separately from API servers and regular workers. Workloads should be categorized by cost, duration, memory requirement, priority, and customer plan.

## Acceptance Criteria

- GPU work is never hidden inside normal request handling.
- Credit impact, job state, and outputs are traceable.
- Capacity limits protect platform reliability and margin.

## Current Implementation

`ADR-005` adds the AI Engine abstraction for provider-level jobs, workers, provider registry, and cost tracking. The current implementation keeps `fake_worker` as the deterministic rollback provider and adds `zealman_workflow` as the first server-side GPU workflow provider.

Zealman / ComfyUI jobs are invoked only by the Supabase `ai` Edge Function. The browser sends generation intent, while the backend downloads the configured workflow, injects prompt/reference input, submits to Zealman, polls ComfyUI history, downloads the output, stores it in Supabase Storage, records `media_assets`, and refunds credits on provider failure.

Live GPU lifecycle automation is still operator-controlled. AutoDL start/stop scripts exist outside the web app, but the runtime does not automatically power GPU instances on or off yet.

## Future Plan

Define model routing, provider fallback, GPU pool strategy, cost estimation, cancellation, and quota enforcement.

## AI Context

GPU jobs are the economic and reliability center of AI media products. Design for scarcity, observability, idempotency, and graceful failure.
