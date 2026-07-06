# Project API

| Field | Value |
|---|---|
| ID | API-PROJECT-001 |
| Unique ID | API-PROJECT-001 |
| Version | 1.0.0 |
| Status | Active |
| Owner | API Platform Lead / Platform Lead |
| Dependencies | API-AUTH-001, DB-PROJECTS-001, DB-WORKSPACES-001, DB-PERMISSIONS-001 |
| Referenced By | API-BIBLE-001, ADR-007 |
| Cross References | DB-PROJECTS-001, DB-WORKSPACES-001, DB-PERMISSIONS-001 |

## Purpose

Define the API surface for project creation, listing, retrieval, and access checks.

## Business Logic

Projects group the content lifecycle: assets, generation jobs, workflows, publishing, analytics, and review.

## Authentication

Requires authenticated user.

## Permissions

Workspace members may read projects. Owners, admins, and editors may create or modify projects in Sprint 1.

## Request

Conceptual request inputs may include workspace reference, project name, description, lifecycle status, filters, and pagination.

## Response

Responses may include project metadata, workspace reference, owner reference, status, timestamps, and future activity summaries.

## Error Codes

- `PROJECT_NAME_REQUIRED`
- `PROJECT_NOT_FOUND`
- `PROJECT_FORBIDDEN`
- `WORKSPACE_FORBIDDEN`

## Rate Limit

Moderate limits apply to project creation and listing.

## Dependencies

Depends on workspace membership, permissions, audit logs, and future asset/workflow APIs.

## Future Expansion

Support project templates, campaigns, folders, budgets, activity feed, publishing calendar, and analytics summary.

## Acceptance Criteria

- Project APIs preserve workspace permission boundaries.
- Projects can become the canonical container for content lifecycle objects.

## AI Context

Projects are not folders only. They are the operating context for content production and optimization.
