# Backend Architecture Bible

| Field | Value |
|---|---|
| Unique ID | BE-ARCH-BIBLE-001 |
| Version | 1.4.0 |
| Status | Active |
| Owner | Backend Lead |
| Dependencies | PB-010, API-BIBLE-001, DB-BIBLE-001, SEC-INDEX-001, DEVOPS-INDEX-001 |
| Referenced By | DOC-002, BE-INDEX-001 |
| Cross References | API-BIBLE-001, DB-BIBLE-001, AI-INDEX-001, DEVOPS-INDEX-001 |

## Purpose

Define the permanent backend architecture source of truth for Open Video Studio.

## Requirements

- Document backend architecture before implementation.
- Keep backend architecture separate from API specifications, database schemas, and code.
- Define responsibilities, dependencies, failure recovery, scalability, and AI context for each major backend subsystem.

## Architecture

The backend should be a modular service-oriented platform with clear boundaries around identity, storage, queues, GPU work, media processing, billing, notifications, logging, monitoring, and security. Early implementation may be simpler, but architecture documents must preserve separation of responsibilities for long-term scale.

## Responsibilities

- Own server-side orchestration and domain execution.
- Enforce authorization before data or compute operations.
- Coordinate durable jobs, external providers, and side effects.
- Preserve auditability, observability, and failure recovery.

## Current Implementation

Phase 1 starts with a TypeScript Node.js backend core, documented in `ADR-002`. The current implementation includes service modules for authentication, users, credits, storage, and audit logging. `ADR-004` adds the product workflow foundation. `ADR-005` adds the provider-independent AI Engine foundation with local queue, worker, provider registry, storage abstraction, and cost tracking.

The current implementation intentionally does not include HTTP routes, a web framework, production queues, production deployment infrastructure, live AI providers, or payment provider integration yet.

`REVIEW-PROVIDER-PLUGIN-001` and proposed `ADR-006` define the next provider plugin refactoring plan. This plan is documentation-only until approved.

`ADR-007` starts Platform Architecture V2 with workspace, membership, project, and permission service-layer foundations.

## Dependencies

Depends on Product Bible, API Bible, Database Bible, AI Engine docs, Security docs, DevOps docs, and future service-specific PRDs.

## Failure Recovery

All backend subsystems must define retry behavior, idempotency expectations, dead-letter or manual recovery paths, and user-visible failure states where applicable.

## Scalability

Backend architecture must support incremental evolution from a small SaaS product to high-volume AI media workloads with separate scaling for API, queue, GPU, storage, and processing layers.

## Documents

- [BE-ARCH-AUTH-001 Authentication](001-authentication.md)
- [BE-ARCH-STORAGE-001 Storage](002-storage.md)
- [BE-ARCH-QUEUE-001 Queue](003-queue.md)
- [BE-ARCH-GPU-JOBS-001 GPU Jobs](004-gpu-jobs.md)
- [BE-ARCH-IMAGE-PROCESSING-001 Image Processing](005-image-processing.md)
- [BE-ARCH-VIDEO-PROCESSING-001 Video Processing](006-video-processing.md)
- [BE-ARCH-BILLING-001 Billing](007-billing.md)
- [BE-ARCH-NOTIFICATION-001 Notification](008-notification.md)
- [BE-ARCH-LOGGING-001 Logging](009-logging.md)
- [BE-ARCH-MONITORING-001 Monitoring](010-monitoring.md)
- [BE-ARCH-SECURITY-001 Security](011-security.md)

## Acceptance Criteria

- Backend implementation tasks can reference subsystem architecture documents.
- No backend code is required to understand service boundaries.
- Failure recovery and scalability are considered before implementation.

## Future Plan

Add service maps, sequence diagrams, deployment topology, worker architecture, and operational runbooks after implementation architecture is chosen.

## AI Context

Use this index before proposing backend implementation. Do not write backend code until the relevant subsystem architecture, API specs, database docs, and task acceptance criteria exist.
