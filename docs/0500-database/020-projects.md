# Projects

| Field | Value |
|---|---|
| Unique ID | DB-PROJECTS-001 |
| Version | 1.0.0 |
| Status | Active |
| Owner | Platform Data Owner |
| Dependencies | DB-WORKSPACES-001, DB-USERS-001, PB-008 |
| Referenced By | DB-BIBLE-001, ADR-007 |
| Cross References | DB-MEDIA-ASSETS-001, DB-GENERATION-JOBS-001, DB-PERMISSIONS-001, API-PROJECT-001 |

## Purpose

Represent a campaign, initiative, or deliverable container that groups assets, jobs, workflows, publishing, analytics, and review.

## Owner

Platform Data Owner.

## Relationships

- Belongs to a workspace.
- Owned by a user.
- Will contain assets, generation jobs, workflow runs, calendar items, publishing jobs, analytics, and approvals.

## Fields

- Project ID.
- Workspace reference.
- Owner user reference.
- Name.
- Description.
- Status.
- Created timestamp.
- Updated timestamp.
- Archived timestamp.

## Indexes

- Workspace reference plus updated timestamp.
- Owner reference plus updated timestamp.
- Status.

## Lifecycle

Projects are created, used for content production, reviewed, published, measured, archived, and retained for history.

## Permissions

Access follows workspace membership and future project-level overrides. Write actions require owner, admin, or editor role in Sprint 1.

## Retention

Retain projects while assets, jobs, workflows, billing, analytics, or audit requirements exist.

## Future Expansion

Support project templates, campaigns, folders, budgets, review state, version history, and publishing calendars.

## Acceptance Criteria

- Project ownership is explicit.
- Projects can be listed by workspace.
- Project access can be enforced through workspace roles.

## AI Context

Projects are the operating container for content lifecycle. Future jobs, assets, workflows, publishing, and analytics should attach to projects.
