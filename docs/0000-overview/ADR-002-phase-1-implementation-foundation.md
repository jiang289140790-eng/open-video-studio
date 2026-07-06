# Phase 1 Implementation Foundation

| Field | Value |
|---|---|
| Unique ID | ADR-002 |
| Version | 1.0.0 |
| Status | Active |
| Owner | CTO / Lead Software Architect |
| Dependencies | REVIEW-ARCH-001, BE-ARCH-BIBLE-001, DB-BIBLE-001, API-BIBLE-001, SEC-INDEX-001 |
| Referenced By | DOC-002, CHANGELOG-001 |

## Purpose

Record the first implementation foundation decision for Phase 1 authentication, user system, database, credits, and storage.

## Requirements

- Start implementation with a small, testable backend core.
- Avoid UI and frontend implementation.
- Preserve clean boundaries between API specs, backend services, database records, and storage.
- Keep the implementation replaceable as production infrastructure decisions mature.

## Context

Architecture Review V1 identified that the repository had strong documentation but no selected implementation runtime, database, queue, storage provider, deployment platform, or observability stack.

The first implementation needs a safe local foundation that can validate domain behavior without prematurely committing to full production infrastructure.

## Options Considered

- Full production stack immediately: too much irreversible surface area before detailed DevOps, security, and deployment standards exist.
- Framework-first web API: useful later, but premature before core service behavior is tested.
- Local backend core first: smaller, testable, and aligned with Phase 1 priorities.

## Decision

Use a TypeScript Node.js backend core for Phase 1, with:

- Node.js built-in test runner.
- TypeScript strict mode.
- Node SQLite for local development and tests.
- SQL schema stored in `src/db/schema.sql`.
- Core service modules for authentication, users, credits, storage, and audit logging.
- Local filesystem-backed storage service for development and tests.

## Consequences

- Phase 1 behavior can be tested without introducing a web framework.
- API routes can later wrap the service layer instead of owning business logic.
- SQLite is treated as a local implementation foundation, not a final production database decision.
- The local filesystem storage implementation is a development adapter, not the final production media storage architecture.

## Rollback or Migration Plan

The service layer should remain independent from HTTP framework and production infrastructure choices. Future migration can replace SQLite and local storage adapters while preserving service behavior and tests.

## Security Impact

Authentication uses password hashing and session token hashing. This is sufficient for local foundation tests but does not replace future identity provider, session hardening, SSO, MFA, rate limiting, or production secret management.

## Observability Impact

No production observability stack is implemented yet. Audit logging exists as a database-backed foundation. Production logging, tracing, metrics, and alerting remain future DevOps work.

## Cost Impact

The implementation has minimal local cost. Production cost controls for GPU, media storage, AI providers, analytics, and billing providers remain future work.

## Disaster Recovery Impact

SQLite and local filesystem storage do not provide production disaster recovery. Backup, restore, RTO, RPO, and media durability remain future DevOps and database work.

## Acceptance Criteria

- Phase 1 core services build successfully.
- Authentication, credits, and storage behaviors are covered by automated tests.
- No UI or frontend implementation is introduced.
- Documentation records that current database and storage choices are local foundations, not final production infrastructure.

## Future Plan

- Add HTTP API layer after service contracts stabilize.
- Add production database decision and migration strategy.
- Add production storage provider strategy.
- Add deployment, observability, backup, and disaster recovery standards before production launch.

## AI Context

Treat this ADR as the current implementation foundation, not the final production architecture. Do not infer that SQLite or local filesystem storage are approved for production.
