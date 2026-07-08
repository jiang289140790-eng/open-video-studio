# Tool Versions

| Field | Value |
|---|---|
| Unique ID | DB-TOOL-VERSIONS-001 |
| Version | 1.0.0 |
| Status | Active |
| Owner | Product Platform Data Owner |
| Dependencies | DB-WORKFLOW-CONFIGS-001, DB-PROMPTS-001 |
| Referenced By | DB-BIBLE-001, API-ADMIN-001 |
| Cross References | DB-WORKFLOW-CONFIGS-001, DB-PROMPTS-001, API-ADMIN-001 |

## Purpose

Track version history for AI tools so published frontend tools can evolve without losing model, workflow, prompt, or changelog provenance.

## Owner

Product Platform Data Owner.

## Relationships

- Belongs to a tool slug.
- References model version, workflow version, and prompt version.
- May be used by generation jobs for provenance.

## Fields

- Tool version ID.
- Tool slug.
- Version.
- Changelog.
- Model version.
- Workflow version.
- Prompt version.
- Status.
- Created and updated timestamps.

## Indexes

- Tool slug plus status.
- Unique tool slug plus version.

## Lifecycle

Versions move through draft, testing, published, and deprecated. Frontend tools should default to the published version.

## Permissions

Operators may read version history. Admins may publish version changes through audited backend actions.

## Retention

Retain historical versions for rollback, generated asset provenance, support review, and cost analysis.

## Future Expansion

Add rollout percentages, A/B tests, quality score, cost score, safety score, release owner, rollback target, and evaluation evidence.

## Current Implementation

MVP P1 stores tool versions inside `site_settings.tool_catalog_config.tools[].versions` and defines `tool_versions` in local and Supabase schemas as the future durable table.

## Acceptance Criteria

- Every tool can expose one or more versions.
- Admin can see historical versions and their model, workflow, prompt, changelog, and status.

## AI Context

Tool versions are how the product changes safely. Never overwrite production behavior without retaining previous version context.
