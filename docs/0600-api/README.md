# API Bible

| Field | Value |
|---|---|
| ID | API-BIBLE-001 |
| Unique ID | API-BIBLE-001 |
| Version | 1.8.0 |
| Status | Active |
| Owner | API Platform Lead |
| Dependencies | PB-010, DB-BIBLE-001, SEC-INDEX-001 |
| Referenced By | DOC-002, API-INDEX-001 |
| Cross References | PB-010, DB-BIBLE-001, API-AUTH-001 |

## Purpose

Define the permanent API specification source of truth for Open Video Studio.

## Requirements

- This folder defines API specifications only.
- Do not implement code, controllers, routes, SDKs, OpenAPI files, or tests here.
- Every API document must define ID, purpose, business logic, authentication, permissions, request, response, error codes, rate limit, dependencies, future expansion, and AI context.
- Exact endpoint paths, schemas, and protocol details may be refined in later API contract work.
- Future API contracts must define contract tests, authorization tests, idempotency behavior, observability signals, versioning, rollback, and deprecation plan before implementation.
- Public or partner-facing APIs require security review, rate-limit strategy, abuse prevention, and compatibility policy.

## API Documents

- [API-AUTH-001 Authentication](001-authentication.md)
- [API-GEN-IMAGE-001 Generate Image](002-generate-image.md)
- [API-GEN-VIDEO-001 Generate Video](003-generate-video.md)
- [API-CHARACTER-001 Character](004-character.md)
- [API-GALLERY-001 Gallery](005-gallery.md)
- [API-CREDITS-001 Credits](006-credits.md)
- [API-PAYMENT-001 Payment](007-payment.md)
- [API-SUBSCRIPTION-001 Subscription](008-subscription.md)
- [API-ADMIN-001 Admin](009-admin.md)
- [API-ANALYTICS-001 Analytics](010-analytics.md)
- [API-WEBHOOK-001 Webhook](011-webhook.md)
- [API-WORKSPACE-001 Workspace](012-workspace.md)
- [API-PROJECT-001 Project](013-project.md)

## Current Implementation

Phase 1 implements backend service-layer behavior only. No HTTP API routes, controllers, SDKs, or OpenAPI files have been implemented yet. Future API work should wrap the service layers introduced by `ADR-002` and `ADR-004` and preserve the API Bible contracts.

`ADR-004` adds service-layer workflow behavior for local credit purchase completion, character management, generation queue/history, gallery review, and public sharing. These are not external API routes yet.

`ADR-005` adds provider-independent AI Engine services for AI job enqueueing, worker processing, cancellation, provider abstraction, storage abstraction, and cost tracking. These are not external API routes yet.

`REVIEW-PROVIDER-PLUGIN-001` and proposed `ADR-006` require API and business layers to remain provider-neutral during future package refactoring.

`ADR-007` adds service-layer workspace, membership, project, and permission behavior. External HTTP API routes for workspace and project are not implemented yet.

MVP Sprint 1 adds a minimal local HTTP API server through `createMvpApiServer`. Implemented routes cover health, signup, login, current user, profile update, credit balance/history, local credit purchase, and order listing. This is the first usable MVP API surface and remains backed by the existing service layer.

The MVP backend now includes a Supabase `ai` Edge Function with authenticated actions for image analysis, prompt enhancement, generation job creation, job processing, job status, cancellation, and provider status. This API is server-side only for third-party provider secrets and keeps frontend contracts provider-neutral.

Production verification now proves more than endpoint existence. `npm run verify:ai` creates an authenticated temporary admin probe, checks provider status, calls DeepSeek prompt enhancement, creates a demo credit purchase, creates a generation job, processes it through the Fake Worker route, uploads output metadata to Supabase Storage, and confirms the resulting `media_assets` record. It also creates and cancels a separate queued job to verify the cancellation refund response and credit amount. Real Qianwen image/video generation remains controlled by Admin Workflow rollout.

## Acceptance Criteria

- Future frontend, backend, AI, and billing work can reference stable API intent.
- API specifications remain separate from implementation.
- Security, permissions, and rate limits are explicit before code exists.
- API readiness includes testability, observability, compatibility, and rollback strategy.

## Future Plan

- Add exact endpoint paths.
- Add formal request and response schemas.
- Add API versioning and idempotency rules.
- Add OpenAPI generation policy after implementation architecture is approved.
- Add API contract testing and compatibility policy.

## AI Context

Use this folder before designing backend routes, frontend clients, SDKs, webhooks, or external integrations. Do not infer implementation from these specs without a dedicated API contract task.
