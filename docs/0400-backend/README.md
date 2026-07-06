# 0400 Backend

| Field | Value |
|---|---|
| Unique ID | BE-INDEX-001 |
| Version | 0.3.0 |
| Status | Active |
| Owner | Backend Lead |
| Dependencies | OVSB-001, DOC-STD-001, PRD-INDEX-001, DB-INDEX-001, API-INDEX-001, BE-ARCH-BIBLE-001 |
| Referenced By | DOC-002 |

## Purpose

Own backend service architecture, domain logic, authorization, billing integration, queues, background processing, and third-party integrations.

## Requirements

- Backend behavior must reference product requirements.
- Persistent data must reference database documents.
- External or client-facing behavior must reference API contracts.
- Long-running work must reference automation or AI engine documents where applicable.
- Backend implementation tasks must reference the relevant Backend Architecture Bible documents before code begins.
- Backend implementation must define test strategy, deployment impact, rollback path, observability signals, failure recovery, and cost impact before production work starts.

## Backend Architecture Bible

- [BE-ARCH-BIBLE-001 Backend Architecture Bible](000-backend-architecture-bible.md)
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

- Service boundaries and ownership are clear before implementation.
- Backend logic is traceable to product, API, and database documents.
- Backend production readiness can be evaluated without reading code.

## Future Plan

- Add service map.
- Add authorization model.
- Add queue and job processing standard.
- Add integration strategy.
- Add backend testing strategy.
- Add service observability and SLO standards.

## AI Context

Use this folder for server-side behavior and domain rules. Do not duplicate API or database contracts here.
