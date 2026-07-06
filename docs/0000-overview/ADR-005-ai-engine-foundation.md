# AI Engine Foundation

| Field | Value |
|---|---|
| Unique ID | ADR-005 |
| Version | 1.0.0 |
| Status | Active |
| Owner | CTO / AI Engineering Lead |
| Dependencies | AI-INDEX-001, BE-ARCH-QUEUE-001, BE-ARCH-GPU-JOBS-001, BE-ARCH-STORAGE-001, API-GEN-IMAGE-001, API-GEN-VIDEO-001, DB-GENERATION-JOBS-001 |
| Referenced By | DOC-002, CHANGELOG-001, AI-INDEX-001, DB-BIBLE-001 |

## Purpose

Record the provider-independent AI Engine foundation for future image, video, character, upscale, and edit workflows.

## Requirements

- Do not connect to real AI models yet.
- Define one provider interface for OpenAI, Gemini, ComfyUI, Fal.ai, Replicate, RunPod, and Local API.
- Support queue status states: pending, queued, running, completed, failed, cancelled, and retrying.
- Keep workers independent and scalable.
- Support future storage adapters for local, Cloudflare R2, S3, and Supabase Storage.
- Track provider, model, credits, estimated cost, duration, resolution, user, and job ID.
- Support switching providers, multiple providers, and fallback providers without frontend changes.

## Decision

Add an AI Engine foundation under `src/ai/`:

- `AiProvider` interface with generate image, generate video, generate character, upscale, edit image, check job status, and cancel job operations.
- Provider registry with uniform adapters for OpenAI, Gemini, ComfyUI, Fal.ai, Replicate, RunPod, and Local API.
- Local deterministic stub provider for tests.
- Not-configured provider adapters for future providers that intentionally reject execution until credentials and provider-specific policies exist.
- `AiJobQueue` for durable local AI job state.
- `AiWorker` for independent worker execution.
- `AiCostTracker` for local cost records.
- AI storage adapter interface with local implementation and future provider placeholders.

Add local schema tables:

- `ai_jobs`.
- `ai_cost_records`.

## Consequences

- Frontend and product workflow can route through provider-neutral job IDs later.
- Providers can be swapped or run concurrently through registry configuration.
- Worker execution is separated from request flow.
- Cost tracking exists before real provider spend begins.
- Real provider SDKs, credentials, webhooks, signed URLs, rate limits, and safety integrations remain future work.

## Rollback or Migration Plan

The provider interface and local queue can be wrapped by future HTTP APIs and production queue providers. The local SQLite schema remains a development foundation and must be migrated through production database and DevOps decisions before launch.

## Security Impact

No provider credentials or network calls are introduced. Future provider integration must add secret management, request signing, provider-specific safety policies, data retention controls, and audit review.

## Observability Impact

AI job state and cost records are persisted locally. Production metrics, traces, provider latency, error budgets, queue dashboards, and alerting remain future observability work.

## Cost Impact

The local stub has no external cost. Cost records capture estimated provider cost and credits so real provider usage can be instrumented before spend begins.

## Disaster Recovery Impact

No production queue or storage provider is introduced. AI jobs and cost records currently use local SQLite only.

## Acceptance Criteria

- All future provider adapters implement the same interface.
- Local stub jobs can queue, run, complete, cancel, and retry through the worker layer.
- AI cost records include provider, model, credits, estimated cost, duration, resolution, user, and job ID.
- Storage abstraction supports local implementation and future adapter placeholders.

## Future Plan

- Add HTTP API routes for AI job enqueue, status, cancellation, and history.
- Add provider-specific adapters after safety, cost, credential, and evaluation policies exist.
- Add production queue provider and worker deployment topology.
- Add fallback routing policy and provider health checks.
- Add provider-specific evaluation datasets and quality gates.

## AI Context

This ADR approves the AI Engine abstraction, not real AI provider integration. Do not add provider SDKs, API keys, or live model calls without a dedicated provider integration task and safety/cost review.
