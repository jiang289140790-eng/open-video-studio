# GPU Jobs Backend Architecture

| Field | Value |
|---|---|
| Unique ID | BE-ARCH-GPU-JOBS-001 |
| Version | 1.3.0 |
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

The repository now includes an optional Compshare lifecycle controller in the Supabase `ai` Edge Function. When `COMPSHARE_INSTANCE_ID` and server-only API credentials are configured, a Zealman job checks instance state, starts a stopped instance, waits for the headless gateway health endpoint, renews a long safety shutdown window during the job, and schedules a shorter idle shutdown after success or failure. Compshare enforces a five-minute minimum scheduled shutdown; GPU compute stops after shutdown, while image, disk, and storage charges may remain.

`templates/comfyui-headless/` provides a portable, token-protected gateway that preserves the existing Zealman API contract. Models, workflow exports, custom nodes, inputs, and outputs remain private mounted assets rather than Git content. `scripts/prepare-comfyui-headless.mjs` creates an ignored deployment bundle from the six qualified AutoDL exports: A01, C16, D14, G01, G03, and J11.

AutoDL remains the workflow discovery and qualification environment. The known-good AutoDL Art instance was stopped after inventory collection. Compshare is the intended first production runtime, and RunPod remains an optional fallback.

The original `A01-compshare.json` Qwen Image 2512 baseline has passed both direct gateway generation and the full Supabase loop: authenticated temporary user, credit grant and debit, generation job, provider/model provenance, output download, Supabase Storage persistence, `media_assets` and history readback, and cleanup. Whole-instance stop/start recovery also passed without manual Jupyter startup. G01, G03, and J11 remain disabled until each passes the same evidence set.

Production Edge Function Secrets must use a trusted HTTPS hostname. A rotated one-time token was used for the isolated HTTP qualification and removed immediately afterward. The instance contains a pinned Caddy runtime, but permanent activation waits for `gpu.luravyn.com` or another owned hostname to resolve to the fixed public IP; the temporary `sslip.io` host failed secondary ACME validation and is not accepted as production infrastructure.

## Future Plan

Define model routing, provider fallback, GPU pool strategy, cost estimation, cancellation, and quota enforcement.

## AI Context

GPU jobs are the economic and reliability center of AI media products. Design for scarcity, observability, idempotency, and graceful failure.
