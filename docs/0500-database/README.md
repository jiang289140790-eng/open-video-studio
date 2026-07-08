# Database Bible

| Field | Value |
|---|---|
| Unique ID | DB-BIBLE-001 |
| Version | 1.15.0 |
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
- [DB-AI-WORKERS-001 AI Workers](022-ai-workers.md)
- [DB-WORKFLOW-CONFIGS-001 Workflow Configs](023-workflow-configs.md)
- [DB-TOOL-VERSIONS-001 Tool Versions](024-tool-versions.md)
- [DB-CONTENT-INTELLIGENCE-001 Content Intelligence](025-content-intelligence.md)
- [DB-AGENT-CONFIGS-001 Agent Configs](026-agent-configs.md)
- [DB-COST-ANALYTICS-001 Cost Analytics](027-cost-analytics.md)

## Current Implementation

Phase 1 uses a local SQLite schema at `src/db/schema.sql` for development and automated tests. This is an implementation foundation recorded in `ADR-002`.

The production database target is Supabase PostgreSQL. The repository includes environment-based Supabase client creation and live verification scripts.

Remote Supabase has been aligned with the current MVP schema using `supabase/migrations/202607080001_remote_mvp_schema_alignment.sql`. The migration preserves old rows, converts production generation/asset/credit IDs to text where needed, adds missing MVP columns, creates missing operational tables, and reapplies role-aware RLS policies. Remote migration history now marks `202607070001` and `202607080001` as applied.

Production AI verification now reads the core MVP backend tables after each smoke-test loop. `npm run verify:ai` confirms the generated job is readable from `generation_jobs`, the generated output is readable from `media_assets`, the generation debit is readable from `credit_transactions`, and the cancellation refund is readable from `credit_transactions` with `operation_category = 'refund'`.

`ADR-004` extends the local schema for the one-user product workflow with characters, generation jobs, images, videos, orders, and share links. Production database selection, migration policy, backup, restore, RTO, RPO, and storage growth controls remain future architecture work.

`ADR-005` adds local AI Engine tables for provider-level AI jobs and AI cost records. These support provider-independent orchestration and cost tracking before real AI model integration.

`REVIEW-PROVIDER-PLUGIN-001` and proposed `ADR-006` require future model registry, provider configuration, feature flags, and provider package refactors to preserve database ownership boundaries.

`ADR-007` adds local workspace, workspace member, project, and permission foundation tables for Platform Architecture V2 Sprint 1.

The imported AI Content Operating System guidance now has a local MVP-compatible service schema for content lifecycle foundations: `campaigns`, `content_items`, `content_pipeline_events`, `platform_post_variants`, `publishing_queue`, and `content_analytics`. These tables are intentionally minimal and local-first; they support Campaign → AI Studio mock output → Pipeline → Platform Variants → Queue without introducing real publishing integrations or enterprise workflow automation.

MVP Admin implementation extends `src/supabase/mvp-schema.sql` with Supabase PostgreSQL tables for `audit_logs`, `orders`, `characters`, `images`, `videos`, and `site_settings`, plus role-aware RLS policies. Admin operations use `profiles.role` for `admin` and `operator` access and must preserve auditability for high-risk writes.

The MVP homepage manager stores published public homepage configuration in `site_settings` under `homepage_config`. Page merchandising stores module composition in `page_builder_config`, and AI tool merchandising stores listing/provider/cost settings in `tool_catalog_config`. Public reads are allowed only for published settings; writes go through the admin backend and create audit logs.

The P0 Admin operations upgrade extends implementation schemas with `ai_workers` and richer `generation_jobs` detail fields: tool slug, workflow id/version, input params, output assets, credit charged, estimated cost, and latency. These fields support Worker Center, failure analysis, cost inspection, and future real provider telemetry without changing frontend contracts.

The P1 Admin operations upgrade adds Workflow Center, Prompt Library, and Tool Version management. MVP configuration is stored in `site_settings.workflow_center_config`, `site_settings.prompt_library_config`, and `site_settings.tool_catalog_config.tools[].versions`, while `workflow_configs`, `prompt_library`, and `tool_versions` are present in implementation schemas for future durable migration.

The P2 Admin operations upgrade adds Content Intelligence, Agent Center, and Cost Analytics readiness. MVP admin configuration stores content intelligence and agent settings in `site_settings`, while implementation schemas reserve `content_intelligence`, `agent_configs`, and `cost_analytics` for durable ingestion, agent governance, and provider margin reporting.

Tool Catalog configuration now includes an explicit per-tool `workflowId` binding in `site_settings.tool_catalog_config`, allowing public tool listings and future generation jobs to align with Workflow Center records without changing frontend contracts.

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
