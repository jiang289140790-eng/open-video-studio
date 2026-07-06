# Workspaces

| Field | Value |
|---|---|
| Unique ID | DB-WORKSPACES-001 |
| Version | 1.0.0 |
| Status | Active |
| Owner | Platform Data Owner |
| Dependencies | DB-USERS-001, PB-008 |
| Referenced By | DB-BIBLE-001, ADR-007 |
| Cross References | DB-PROJECTS-001, DB-PERMISSIONS-001, API-WORKSPACE-001 |

## Purpose

Represent top-level ownership, team, billing, permission, and project context for Open Video Studio.

## Owner

Platform Data Owner.

## Relationships

- Owned by a user.
- Has workspace members.
- Contains projects.
- Will later own billing, settings, brand systems, provider configuration, and team policies.

## Fields

- Workspace ID.
- Owner user reference.
- Name.
- Slug.
- Status.
- Created timestamp.
- Updated timestamp.
- Archived timestamp.

## Indexes

- Owner reference plus created timestamp.
- Status.
- Unique slug.

## Lifecycle

Workspaces are created by users, may add members, contain projects, and may later be archived or transferred.

## Permissions

Owners and admins manage workspace settings and members. Editors, viewers, publishers, and analysts receive scoped access through membership roles.

## Retention

Retain while billing, projects, assets, jobs, audit logs, or legal obligations exist.

## Future Expansion

Support teams, invitations, SSO, domain verification, workspace settings, enterprise hierarchy, and billing accounts.

## Acceptance Criteria

- Workspace ownership is explicit.
- Workspace membership can be enforced before project access.
- Existing single-user workflows remain compatible.

## AI Context

Workspaces are the top-level SaaS container. Do not attach enterprise permissions directly to individual assets without workspace context.
