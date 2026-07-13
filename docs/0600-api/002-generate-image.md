# Generate Image API

| Field | Value |
|---|---|
| ID | API-GEN-IMAGE-001 |
| Unique ID | API-GEN-IMAGE-001 |
| Version | 1.6.0 |
| Status | Active |
| Owner | AI Platform Lead / API Platform Lead |
| Dependencies | API-AUTH-001, DB-IMAGES-001, DB-PROMPTS-001, DB-CREDITS-001, AI-INDEX-001 |
| Referenced By | API-GALLERY-001, API-CREDITS-001 |
| Cross References | DB-IMAGES-001, DB-PROMPTS-001, DB-CREDITS-001, PB-010 |

## Purpose

Define the API surface for generating, transforming, or creating image artifacts through AI workflows.

## Requirements

- Validate prompt, permission, credit, safety, and reference asset context before generation.
- Record provenance for generated image artifacts.
- Support asynchronous generation behavior where needed.

## Business Logic

The API accepts user intent, prompt context, optional references, style constraints, and output requirements. It validates permissions, estimates credit impact, submits generation work, records provenance, and returns generation status or resulting image references.

## Authentication

Requires authenticated user or authorized service account.

## Permissions

Caller must have permission to generate images in the target workspace or project and sufficient credits or entitlement. Reference assets must be accessible to the caller.

## Request

Conceptual request inputs may include prompt text, prompt template reference, reference image IDs, character reference, style constraints, aspect ratio, output count, safety settings, project reference, and idempotency key.

## Response

Responses may include generation request ID, status, estimated or consumed credits, image IDs, media asset references, moderation state, warnings, and retry guidance.

## Error Codes

- `IMAGE_PROMPT_REQUIRED`
- `IMAGE_REFERENCE_FORBIDDEN`
- `IMAGE_UNSAFE_REQUEST`
- `IMAGE_INSUFFICIENT_CREDITS`
- `IMAGE_GENERATION_FAILED`
- `IMAGE_RATE_LIMITED`
- `IMAGE_PROVIDER_UNAVAILABLE`

## Rate Limit

Limits should consider user, workspace, plan, credit balance, concurrent jobs, model cost, and abuse risk. High-cost generations require stricter concurrency control.

## Dependencies

Depends on image storage, prompt registry, credit ledger, AI orchestration, moderation, audit logging, and media asset records.

## Future Expansion

Support batch generation, image editing, inpainting, style libraries, brand constraints, model selection, quality tiers, and asynchronous webhooks.

## Acceptance Criteria

- Generated image records have provenance, ownership, and credit traceability.
- Unsafe or unauthorized reference use is blocked.

## Current Implementation

Sprint 2 adds the MVP HTTP route `POST /generate/image`. The route uses local stub completion only: it creates a generation job, consumes credits, records provider/model/resolution/cost metadata, stores the generated result as a media asset, creates an image record, and makes the job visible in generation history.

MVP Backend Loop adds a Supabase-compatible path that creates a generation job, consumes credits, keeps the Fake Worker, writes simulated output metadata to Supabase Storage, and records the output as a real asset. No external AI provider, OpenAPI contract, production model routing, or independent worker execution is connected yet.

The current Supabase `ai` Edge Function now routes image generation through Workflow Center provider selection. `fake_worker` remains the safe fallback, `qianwen_generation` is reserved for Qianwen image generation, `liblib_generation` is reserved for Liblib template-based image generation, and `zealman_workflow` routes image jobs to the configured A01 Zealman / ComfyUI workflow when server-side Zealman secrets are configured.

When Compshare lifecycle secrets are configured, the same A01 request can start a stopped GPU instance, wait for the token-protected headless gateway, run the existing Zealman-compatible workflow contract, copy the output into Supabase Storage, and schedule GPU shutdown. Frontend request and response contracts do not change.

The Qwen Image 2512 `A01-compshare.json` baseline has passed a cost-bearing end-to-end probe through the deployed Supabase function. The probe created and authenticated a temporary user, granted and consumed credits, completed the generation job, created a Storage-backed asset with provider/model provenance, exposed it in history, and removed all verifier records. Production rollout remains disabled until the gateway uses a stable trusted HTTPS hostname.

Generation jobs are inserted before credit debit. If the credit debit fails, the job is marked failed with `credit_charged = 0`; if provider execution fails after debit, the refund path writes a duplicate-protected `generation_refund` ledger entry.

## Future Plan

Create exact schema and job lifecycle contract after AI generation pipeline architecture is approved.

## AI Context

Image generation is expensive and policy-sensitive. Always include credit, moderation, provenance, and rights considerations.
