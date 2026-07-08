# Workflow Configs

| Field | Value |
|---|---|
| Unique ID | DB-WORKFLOW-CONFIGS-001 |
| Version | 1.0.0 |
| Status | Active |
| Owner | AI Platform Data Owner |
| Dependencies | DB-AI-WORKERS-001, DB-GENERATION-JOBS-001, DB-PROMPTS-001 |
| Referenced By | DB-BIBLE-001, API-ADMIN-001 |
| Cross References | DB-AI-WORKERS-001, DB-GENERATION-JOBS-001, API-ADMIN-001 |

## Purpose

Represent configurable AI workflows such as ComfyUI workflows, n8n workflows, API chains, and AI agent chains.

## Owner

AI Platform Data Owner.

## Relationships

- May bind to tools, prompts, providers, workers, and generation jobs.
- Provides workflow version provenance for generated assets.

## Fields

- Workflow ID.
- Name.
- Type.
- Provider.
- JSON config.
- Required models.
- Required inputs.
- Output type.
- Credit price.
- Version.
- Status.
- Description.
- Created and updated timestamps.

## Indexes

- Status plus provider.

## Lifecycle

Workflows move through draft, testing, published, and deprecated states. Published workflows can be selected by tools and future generation jobs.

## Permissions

Operators may read workflow configuration. Admins may publish workflow changes through audited server-side operations.

## Retention

Retain deprecated workflows for provenance, rollback, support, and cost analysis.

## Future Expansion

Add structured workflow graph validation, dependency checks, environment requirements, rollback pointers, evaluation results, and release approval.

## Current Implementation

MVP P1 stores published configuration in `site_settings.workflow_center_config` for fast admin iteration and defines `workflow_configs` in local and Supabase schemas as the future durable table.

## Acceptance Criteria

- Admin can inspect and publish workflow records.
- Workflow records include provider, version, required inputs, output type, credit price, status, and description.

## AI Context

Workflow configuration is production behavior. Keep it versioned, auditable, and decoupled from frontend pages.
