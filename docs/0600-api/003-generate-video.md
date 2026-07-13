# Generate Video API

| Field | Value |
|---|---|
| ID | API-GEN-VIDEO-001 |
| Unique ID | API-GEN-VIDEO-001 |
| Version | 1.6.0 |
| Status | Active |
| Owner | AI Video Platform Lead / API Platform Lead |
| Dependencies | API-AUTH-001, DB-VIDEOS-001, DB-PROMPTS-001, DB-CREDITS-001, DB-MEDIA-ASSETS-001, AI-INDEX-001 |
| Referenced By | API-GALLERY-001, API-WEBHOOK-001, API-CREDITS-001 |
| Cross References | DB-VIDEOS-001, DB-MEDIA-ASSETS-001, DB-CREDITS-001, PB-009 |

## Purpose

Define the API surface for AI video generation, transformation, and draft creation workflows.

## Requirements

- Validate prompt, permission, credit, safety, reference media, and character rights before generation.
- Treat video generation as a long-running job.
- Preserve status, provenance, and failure recovery context.

## Business Logic

The API converts user intent, prompts, scripts, references, characters, assets, and generation settings into video jobs. It validates access, estimates credit impact, creates durable job and video records, orchestrates AI generation, and returns status or video references.

## Authentication

Requires authenticated user or authorized service account.

## Permissions

Caller must have generation permission in the workspace or project, access to referenced media, and sufficient entitlement or credits. Character and likeness use may require additional rights checks.

## Request

Conceptual request inputs may include prompt, script, storyboard, reference media asset IDs, character IDs, target duration, aspect ratio, style constraints, voice or audio options, output quality, project reference, and idempotency key.

## Response

Responses may include generation job ID, video ID, status, estimated or consumed credits, queue state, expected next state, warnings, moderation state, and webhook eligibility.

## Error Codes

- `VIDEO_PROMPT_REQUIRED`
- `VIDEO_REFERENCE_FORBIDDEN`
- `VIDEO_CHARACTER_RESTRICTED`
- `VIDEO_UNSAFE_REQUEST`
- `VIDEO_INSUFFICIENT_CREDITS`
- `VIDEO_GENERATION_FAILED`
- `VIDEO_RATE_LIMITED`
- `VIDEO_PROVIDER_UNAVAILABLE`

## Rate Limit

Strict limits apply because video generation is high-cost. Limits should consider concurrency, duration, quality tier, workspace plan, credit balance, abuse risk, and provider capacity.

## Dependencies

Depends on video records, media assets, prompt registry, character governance, credits, AI orchestration, job processing, storage, moderation, notifications, analytics, and webhooks.

## Future Expansion

Support batch generation, timeline-aware generation, scene regeneration, brand templates, model selection, render pipelines, review workflows, and webhook delivery.

## Acceptance Criteria

- Generated video jobs are traceable from request to credit usage to durable video record.
- Rights, safety, and permission checks occur before expensive generation begins.

## Current Implementation

Sprint 2 adds the MVP HTTP route `POST /generate/video`. The route uses local stub completion only: it creates a generation job, consumes credits, records provider/model/resolution/duration/cost metadata, stores the generated result as a media asset, creates a video record, and makes the job visible in generation history.

MVP Backend Loop adds a Supabase-compatible path that creates a generation job, consumes credits, keeps the Fake Worker, writes simulated output metadata to Supabase Storage, and records the output as a real asset. No external video model, render pipeline, webhook, production model routing, or independent worker execution is connected yet.

The current Supabase `ai` Edge Function now supports `zealman_workflow` as a server-side video provider. Workflow IDs select G01 standard image-to-video, G03 smoother social-video, or J11 digital-human/product-video generation. Provider outputs are downloaded by the backend and persisted as Supabase Storage-backed `media_assets`; browser code never calls Zealman, ComfyUI, AutoDL, or SeetaCloud directly.

The optional Compshare lifecycle controller starts a stopped GPU instance before these workflows, waits for the compatible headless gateway, applies a safety shutdown timer during execution, and schedules the configured idle shutdown afterward. G01, G03, and J11 stay unpublished until each workflow passes its own reference upload, output persistence, timeout, credit, refund, and shutdown tests.

The shared runtime and whole-instance recovery are now qualified by the A01 image flow. This proves provider selection, lifecycle, gateway recovery, credits, output transfer, and Storage persistence, but it does not qualify video inference. G01 is the next required cost-bearing workflow; G03 and J11 remain later gates.

## Future Plan

Create dedicated video generation job lifecycle and render/export APIs before implementation.

## AI Context

Do not treat video generation as synchronous. Design around long-running jobs, status polling, webhooks, credits, and failure recovery.
