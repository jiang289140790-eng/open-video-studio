# Numbering System

| Field | Value |
|---|---|
| Unique ID | ID-REG-001 |
| Version | 0.21.0 |
| Status | Active |
| Owner | CTO / Lead Software Architect |
| Dependencies | OVSB-001, DOC-STD-001, REF-001 |
| Referenced By | OVSB-001, DOC-STD-001, TASK-001, KNOW-001 |

## Purpose

Create a unified permanent ID system for documents, tasks, requirements, APIs, database objects, and architecture decisions.

## Requirements

IDs must never be renamed after assignment. If a concept changes substantially, create a new ID and mark the old document as superseded.

Reserved prefixes:

- `OVSB`: project foundation and business-level source of truth.
- `DOC`: documentation navigation and meta-documents.
- `CTX`: project context and onboarding context.
- `DOC-STD`: documentation standards.
- `DOC-LIFE`: documentation lifecycle standards.
- `ID-REG`: ID registry and numbering rules.
- `REF`: cross-reference standards.
- `OWNERS`: ownership and review responsibility.
- `KNOW`: knowledge management standards.
- `ADR`: architecture decision records.
- `TASK`: task workflow and task standards.
- `TASK-DONE-STD`: task completion standards.
- `CHANGELOG`: project changelog and history.
- `PRD`: product requirement documents.
- `PB`: Product Bible documents.
- `PAGE`: application pages and routes.
- `UX`: design, journeys, and interaction models.
- `DS`: Design System documents.
- `FE`: frontend architecture and components.
- `BE`: backend services and domain logic.
- `BE-ARCH`: backend architecture documents.
- `AI`: AI engine, model orchestration, prompts, and evaluation.
- `DB`: database schemas and data contracts.
- `API`: API contracts.
- `SEO`: SEO strategy and content systems.
- `GROWTH`: growth loops and acquisition systems.
- `AUTO`: automations, jobs, and agents.
- `DEVOPS`: infrastructure, deployment, and operations.
- `ANALYTICS`: metrics, events, and experiments.
- `SEC`: security, privacy, and compliance.
- `ROADMAP`: phases, milestones, and release sequencing.
- `REVIEW`: architecture, product, security, and readiness reviews.

ID format:

```text
PREFIX-001
PREFIX-SCOPE-001
```

Examples:

- `OVSB-001`
- `PRD-CREDITS-001`
- `PAGE-001`
- `API-001`
- `DB-001`
- `SEO-001`
- `GROWTH-001`
- `AUTO-001`

## Assigned IDs

- `OVSB-001`: Open Video Studio root README and operating vision.
- `DOC-001`: Documentation home.
- `DOC-002`: Documentation summary.
- `CTX-001`: Project context.
- `OVERVIEW-001`: Overview domain index.
- `DOC-STD-001`: Document standard.
- `ID-REG-001`: Numbering system.
- `TASK-001`: Task workflow.
- `TASK-DONE-STD-001`: Task completion standard.
- `CHANGELOG-001`: Project changelog.
- `ADR-001`: Architecture decision record standard.
- `ADR-002`: Phase 1 implementation foundation.
- `ADR-003`: MVP Frontend Reconstruction.
- `ADR-004`: Product Workflow Foundation.
- `ADR-005`: AI Engine Foundation.
- `ADR-006`: Provider Plugin Architecture.
- `ADR-007`: Platform V2 Ownership Foundation.
- `REF-001`: Cross-reference standard.
- `DOC-LIFE-001`: Document lifecycle.
- `OWNERS-001`: Ownership model.
- `KNOW-001`: Knowledge management.
- `PRD-INDEX-001`: Product domain index.
- `PB-001`: Product vision.
- `PB-002`: Product mission.
- `PB-003`: Target users.
- `PB-004`: Market analysis.
- `PB-005`: Competitor analysis.
- `PB-006`: Business model.
- `PB-007`: Product principles.
- `PB-008`: Information architecture.
- `PB-009`: User journeys.
- `PB-010`: Feature map.
- `PB-011`: Product roadmap.
- `PB-012`: Success metrics.
- `PB-013`: North-star metric.
- `PB-014`: Out of scope.
- `PB-015`: Product glossary.
- `UX-INDEX-001`: Design domain index.
- `DS-001`: Design philosophy.
- `DS-002`: Design principles.
- `DS-003`: Brand guidelines.
- `DS-004`: Color system.
- `DS-005`: Typography.
- `DS-006`: Spacing system.
- `DS-007`: Grid system.
- `DS-008`: Iconography.
- `DS-009`: Animation system.
- `DS-010`: Component library.
- `DS-011`: Responsive system.
- `DS-012`: Accessibility.
- `DS-013`: Dark mode.
- `DS-014`: Design tokens.
- `DS-015`: Design checklist.
- `FE-INDEX-001`: Frontend domain index.
- `FE-BIBLE-001`: Frontend Bible.
- `PAGE-HOME-001`: Homepage page specification.
- `PAGE-GALLERY-001`: Gallery page specification.
- `PAGE-GENERATE-001`: Generate page specification.
- `PAGE-PROMPT-LIBRARY-001`: Prompt Library page specification.
- `PAGE-PRICING-001`: Pricing page specification.
- `PAGE-DASHBOARD-001`: Dashboard page specification.
- `PAGE-PROFILE-001`: Profile page specification.
- `PAGE-ADMIN-001`: Admin page specification.
- `PAGE-SETTINGS-001`: Settings page specification.
- `PAGE-AUTH-001`: Authentication page specification.
- `BE-INDEX-001`: Backend domain index.
- `BE-ARCH-BIBLE-001`: Backend Architecture Bible.
- `BE-ARCH-AUTH-001`: Authentication backend architecture.
- `BE-ARCH-STORAGE-001`: Storage backend architecture.
- `BE-ARCH-QUEUE-001`: Queue backend architecture.
- `BE-ARCH-GPU-JOBS-001`: GPU Jobs backend architecture.
- `BE-ARCH-IMAGE-PROCESSING-001`: Image Processing backend architecture.
- `BE-ARCH-VIDEO-PROCESSING-001`: Video Processing backend architecture.
- `BE-ARCH-BILLING-001`: Billing backend architecture.
- `BE-ARCH-NOTIFICATION-001`: Notification backend architecture.
- `BE-ARCH-LOGGING-001`: Logging backend architecture.
- `BE-ARCH-MONITORING-001`: Monitoring backend architecture.
- `BE-ARCH-SECURITY-001`: Security backend architecture.
- `AI-INDEX-001`: AI engine domain index.
- `AI-PROVIDER-001`: AI provider interface.
- `AI-JOBS-001`: AI job queue and workers.
- `AI-STORAGE-001`: AI storage abstraction.
- `AI-COST-001`: AI cost tracking.
- `DB-INDEX-001`: Database domain index.
- `DB-BIBLE-001`: Database Bible.
- `DB-USERS-001`: Users table architecture.
- `DB-CREDITS-001`: Credits table architecture.
- `DB-IMAGES-001`: Images table architecture.
- `DB-VIDEOS-001`: Videos table architecture.
- `DB-CHARACTERS-001`: Characters table architecture.
- `DB-PROMPTS-001`: Prompts table architecture.
- `DB-ORDERS-001`: Orders table architecture.
- `DB-SUBSCRIPTIONS-001`: Subscriptions table architecture.
- `DB-AFFILIATE-001`: Affiliate table architecture.
- `DB-ANALYTICS-001`: Analytics table architecture.
- `DB-NOTIFICATIONS-001`: Notifications table architecture.
- `DB-SETTINGS-001`: Settings table architecture.
- `DB-AUDIT-LOGS-001`: Audit logs table architecture.
- `DB-MEDIA-ASSETS-001`: Media assets table architecture.
- `DB-GENERATION-JOBS-001`: Generation jobs table architecture.
- `DB-SHARE-LINKS-001`: Share links table architecture.
- `DB-AI-JOBS-001`: AI jobs table architecture.
- `DB-AI-COST-RECORDS-001`: AI cost records table architecture.
- `DB-WORKSPACES-001`: Workspaces table architecture.
- `DB-PROJECTS-001`: Projects table architecture.
- `DB-PERMISSIONS-001`: Permissions table architecture.
- `API-INDEX-001`: API domain index.
- `API-BIBLE-001`: API Bible.
- `API-AUTH-001`: Authentication API specification.
- `API-GEN-IMAGE-001`: Generate Image API specification.
- `API-GEN-VIDEO-001`: Generate Video API specification.
- `API-CHARACTER-001`: Character API specification.
- `API-GALLERY-001`: Gallery API specification.
- `API-CREDITS-001`: Credits API specification.
- `API-PAYMENT-001`: Payment API specification.
- `API-SUBSCRIPTION-001`: Subscription API specification.
- `API-ADMIN-001`: Admin API specification.
- `API-ANALYTICS-001`: Analytics API specification.
- `API-WEBHOOK-001`: Webhook API specification.
- `API-WORKSPACE-001`: Workspace API specification.
- `API-PROJECT-001`: Project API specification.
- `SEO-INDEX-001`: SEO domain index.
- `GROWTH-INDEX-001`: Growth domain index.
- `GROWTH-BIBLE-001`: Growth Bible.
- `GROWTH-SEO-001`: SEO growth strategy.
- `GROWTH-LANDING-001`: Landing pages growth strategy.
- `GROWTH-BLOG-001`: Blog system growth strategy.
- `GROWTH-PINTEREST-001`: Pinterest growth strategy.
- `GROWTH-TWITTER-001`: Twitter growth strategy.
- `GROWTH-INSTAGRAM-001`: Instagram growth strategy.
- `GROWTH-TIKTOK-001`: TikTok growth strategy.
- `GROWTH-YOUTUBE-001`: YouTube growth strategy.
- `GROWTH-REDDIT-001`: Reddit growth strategy.
- `GROWTH-AFFILIATE-001`: Affiliate growth strategy.
- `GROWTH-EMAIL-001`: Email growth strategy.
- `GROWTH-REFERRAL-001`: Referral growth strategy.
- `GROWTH-ANALYTICS-001`: Growth analytics.
- `GROWTH-NORTH-STAR-001`: Growth North Star metrics.
- `AUTO-INDEX-001`: Automation domain index.
- `DEVOPS-INDEX-001`: DevOps domain index.
- `ANALYTICS-INDEX-001`: Analytics domain index.
- `SEC-INDEX-001`: Security domain index.
- `ROADMAP-INDEX-001`: Roadmap domain index.
- `ROADMAP-MVP-SPRINTS-001`: MVP Sprint Backlog.
- `ROADMAP-PLATFORM-V2-001`: Platform Evolution Roadmap V2.
- `REVIEW-ARCH-001`: Architecture Review V1.
- `REVIEW-LEGACY-001`: Legacy Site Migration Review.
- `REVIEW-PROVIDER-PLUGIN-001`: Provider Plugin Architecture Review.
- `REVIEW-PLATFORM-EVOLUTION-001`: Platform Evolution Review V1.
- `REVIEW-MVP-PRODUCT-001`: MVP Product Review V1.

## Acceptance Criteria

- New documents can select a stable prefix.
- Existing IDs are discoverable.
- IDs are not reused.

## Future Plan

- Add an automated ID registry checker.
- Add domain-specific ranges if the project grows large enough.

## AI Context

Before creating a new document, inspect this registry and choose the next available ID in the correct prefix.
