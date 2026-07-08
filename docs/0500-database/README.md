# Database Bible

| Field | Value |
|---|---|
| Unique ID | DB-BIBLE-001 |
| Version | 1.9.0 |
| Status | Active |
| Owner | Data Architecture Lead |
| Dependencies | PB-008, PB-010, SEC-INDEX-001, ANALYTICS-INDEX-001 |
| Referenced By | DOC-002, DB-INDEX-001 |
| Cross References | PB-008, PB-015, DB-USERS-001, DB-AUDIT-LOGS-001 |

## Purpose

Define the permanent database architecture source of truth for Open Video Studio at the table and entity level.

## Requirements

- This folder defines database architecture only.
- Do not write SQL, migrations, ORM models, or implementation code here.
- Each table document defines purpose, owner, relationships, fields, indexes, lifecycle, permissions, retention, future expansion, AI context, and cross references.
- Field definitions are conceptual and must be refined before implementation.
- Sensitive data and permission rules must reference security documents.
- Future schema work must define migration plan, rollback limitations, backup and restore behavior, data quality checks, privacy classification, and storage cost growth.
- Durable data documents must identify disaster recovery and retention expectations before implementation.

## Tables

- [DB-USERS-001 Users](001-users.md)
- [DB-CREDITS-001 Credits](002-credits.md)
- [DB-IMAGES-001 Images](003-images.md)
- [DB-VIDEOS-001 Videos](004-videos.md)
- [DB-CHARACTERS-001 Characters](005-characters.md)
- [DB-PROMPTS-001 Prompts](006-prompts.md)
- [DB-ORDERS-001 Orders](007-orders.md)
- [DB-SUBSCRIPTIONS-001 Subscriptions](008-subscriptions.md)
- [DB-AFFILIATE-001 Affiliate](009-affiliate.md)
- [DB-ANALYTICS-001 Analytics](010-analytics.md)
- [DB-NOTIFICATIONS-001 Notifications](011-notifications.md)
- [DB-SETTINGS-001 Settings](012-settings.md)
- [DB-AUDIT-LOGS-001 Audit Logs](013-audit-logs.md)
- [DB-MEDIA-ASSETS-001 Media Assets](014-media-assets.md)
- [DB-GENERATION-JOBS-001 Generation Jobs](015-generation-jobs.md)
- [DB-SHARE-LINKS-001 Share Links](016-share-links.md)
- [DB-AI-JOBS-001 AI Jobs](017-ai-jobs.md)
- [DB-AI-COST-RECORDS-001 AI Cost Records](018-ai-cost-records.md)
- [DB-WORKSPACES-001 Workspaces](019-workspaces.md)
- [DB-PROJECTS-001 Projects](020-projects.md)
- [DB-PERMISSIONS-001 Permissions](021-permissions.md)

## Current Implementation

Phase 1 uses a local SQLite schema at `src/db/schema.sql` for development and automated tests. This is an implementation foundation recorded in `ADR-002`.

The production database target is Supabase PostgreSQL. The repository includes environment-based Supabase client creation and a live verification script. Exact PostgreSQL migrations are not generated yet and must be created before replacing the local SQLite test schema in production workflows.

`ADR-004` extends the local schema for the one-user product workflow with characters, generation jobs, images, videos, orders, and share links. Production database selection, migration policy, backup, restore, RTO, RPO, and storage growth controls remain future architecture work.

`ADR-005` adds local AI Engine tables for provider-level AI jobs and AI cost records. These support provider-independent orchestration and cost tracking before real AI model integration.

`REVIEW-PROVIDER-PLUGIN-001` and proposed `ADR-006` require future model registry, provider configuration, feature flags, and provider package refactors to preserve database ownership boundaries.

`ADR-007` adds local workspace, workspace member, project, and permission foundation tables for Platform Architecture V2 Sprint 1.

MVP Admin implementation extends `src/supabase/mvp-schema.sql` with Supabase PostgreSQL tables for `audit_logs`, `orders`, `characters`, `images`, `videos`, and `site_settings`, plus role-aware RLS policies. Admin operations use `profiles.role` for `admin` and `operator` access and must preserve auditability for high-risk writes.

The MVP homepage manager stores published public homepage configuration in `site_settings` under `homepage_config`. Page merchandising stores module composition in `page_builder_config`, and AI tool merchandising stores listing/provider/cost settings in `tool_catalog_config`. Public reads are allowed only for published settings; writes go through the admin backend and create audit logs.

## Acceptance Criteria

- Future engineering work can identify canonical table ownership and relationships.
- API and backend documents can reference database architecture by permanent ID.
- No implementation-specific SQL exists in this folder.
- Database readiness includes recovery, migration, data quality, privacy, and cost-growth considerations.

## Future Plan

- Add entity relationship diagrams.
- Add migration policy.
- Add exact schema docs after product and backend contracts are approved.
- Add data classification and privacy matrix.
- Add backup and restore policy.
- Add storage growth and cost model.

## AI Context

Use this folder before designing APIs, backend services, analytics events, or storage behavior. Do not infer implementation schemas from these documents without a dedicated schema design task.
