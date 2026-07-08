# Product Workflow Foundation

| Field | Value |
|---|---|
| Unique ID | ADR-004 |
| Version | 1.0.0 |
| Status | Active |
| Owner | CTO / Lead Software Architect |
| Dependencies | ADR-002, API-AUTH-001, API-CREDITS-001, API-GEN-IMAGE-001, API-GEN-VIDEO-001, API-GALLERY-001, DB-USERS-001, DB-CREDITS-001, DB-MEDIA-ASSETS-001, DB-IMAGES-001, DB-VIDEOS-001, DB-CHARACTERS-001, DB-ORDERS-001 |
| Referenced By | DOC-002, CHANGELOG-001, DB-BIBLE-001, API-BIBLE-001 |

## Purpose

Record the backend service-layer foundation for the core product workflow: register, purchase credits, generate, store, review, share, and inspect generation history.

## Requirements

- Prioritize business workflow over marketing-page optimization.
- Preserve backend ownership of credits, storage, generation queue, generation history, gallery sharing, and billing records.
- Keep external AI providers and payment providers replaceable.
- Maintain test coverage for the one-user product journey.

## Context

The MVP frontend reconstruction is sufficient for the current phase. The next priority is the product workflow that lets one user register, generate, store, review, share, and purchase credits.

Phase 1 already implemented authentication, users, credits, storage, and audit logging. This ADR extends that foundation with service-layer workflow modules and durable local schema support.

## Decision

Add backend service-layer modules for user profile updates, local credit purchase completion, character creation, generation queue/history, gallery review, public sharing, and public asset lookup.

Add local schema tables for characters, generation jobs, images, videos, orders, and share links.

Add an end-to-end automated test that verifies one user can register, update profile, purchase credits, upload a reference asset, create a character, queue image and video generation, store outputs, approve an asset, share it publicly, inspect generation history, inspect gallery assets, and inspect billing orders.

## Consequences

- Product workflow behavior is now testable without a web framework.
- API routes can later wrap the workflow services.
- Generation is modeled as asynchronous queue state rather than synchronous provider calls.
- Credit consumption happens before generation jobs are queued.
- Generated outputs become media assets and image or video records.
- Public sharing is gated by asset approval.
- Purchases are local workflow records only; no payment provider is integrated yet.

## Rollback or Migration Plan

The service-layer modules can be wrapped by future HTTP APIs or replaced by provider-backed adapters. Local SQLite tables remain a development foundation and must be migrated through a production database decision before launch.

## Security Impact

Owner checks are enforced for media assets, characters, jobs, and gallery sharing. Public share links require approved media assets. Future production work still needs hardened authorization, rate limits, abuse prevention, signed URLs, share revocation UI, and provider secret management.

## Observability Impact

Audit logs are recorded for billing purchase completion, character creation, generation queueing, asset approval, and asset sharing. Production metrics, tracing, alerts, and job dashboards remain future work.

## Cost Impact

Credit estimates are fixed local policy values for now. MVP Supabase execution refunds failed or cancelled non-completed generation jobs through `generation_refund` credit ledger entries. Real provider cost reconciliation, reservations, retry pricing, payment-provider refunds, and margin controls remain future billing and AI platform work.

## Disaster Recovery Impact

No production persistence or backup system is introduced. Local SQLite and filesystem storage remain development foundations only.

## Acceptance Criteria

- One-user workflow test passes from registration through generation, storage, review, sharing, purchase credits, and history.
- Credits are debited when generation jobs are queued.
- Gallery sharing requires approved assets.
- Image and video generation jobs create durable history.

## Future Plan

- Add HTTP API routes for authentication, profile, credits, storage, generation, gallery, characters, and billing.
- Add real AI provider adapters and worker execution.
- Add payment provider checkout and webhook reconciliation.
- Add advanced credit reservation, retry pricing, provider reconciliation, and payment refund policy.
- Add production authorization, rate limits, observability, and deployment readiness.

## AI Context

Treat this as the current product workflow foundation. Do not infer that local payment completion, fixed credit costs, fake media bytes, SQLite, or filesystem storage are production decisions.
