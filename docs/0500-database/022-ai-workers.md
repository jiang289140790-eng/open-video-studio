# AI Workers

| Field | Value |
|---|---|
| Unique ID | DB-AI-WORKERS-001 |
| Version | 1.0.0 |
| Status | Active |
| Owner | AI Platform Data Owner |
| Dependencies | DB-GENERATION-JOBS-001, BE-ARCH-MONITORING-001, BE-ARCH-QUEUE-001 |
| Referenced By | DB-BIBLE-001, API-ADMIN-001 |
| Cross References | DB-GENERATION-JOBS-001, BE-ARCH-MONITORING-001, API-ADMIN-001 |

## Purpose

Represent AI worker heartbeat and operating status for image, video, multimodal, and text generation capacity.

## Owner

AI Platform Data Owner.

## Relationships

- Summarizes execution capacity for generation jobs.
- References provider and workflow identifiers used by generation jobs.
- Feeds Admin Worker Center and future monitoring dashboards.

## Fields

- Worker ID.
- Provider.
- Workflow or model identifier.
- Worker type.
- Status.
- Queue count.
- Average latency.
- Success rate.
- Cost per job.
- Last heartbeat.
- Recent failure reason.
- Metadata JSON.
- Created and updated timestamps.

## Indexes

- Provider plus status.

## Lifecycle

Workers appear when a worker process reports heartbeat or when the Admin service derives status from generation jobs. Offline workers should remain visible long enough for incident review.

## Permissions

Admin and operator roles may read worker state. Writes must be server-side only and must not expose service keys to browsers.

## Retention

Retain current worker state and enough historical telemetry for incident review, cost analysis, and reliability reporting.

## Future Expansion

Add worker leases, region, GPU type, concurrency, queue partition, versioned workflow binding, deployment version, and structured health checks.

## Current Implementation

`src/supabase/mvp-schema.sql` and `src/db/schema.sql` define `ai_workers`. The MVP Admin service can derive Worker Center records from `generation_jobs` until real worker heartbeats are connected.

## Acceptance Criteria

- Admin can inspect provider, workflow, status, queue, latency, success rate, cost, heartbeat, and recent failure reason.
- Worker data can be connected to future ComfyUI, RunPod, Fal, OpenAI, Gemini, or local workers without frontend changes.

## AI Context

Worker data is operational telemetry, not content. Keep it isolated from provider credentials and user media.
