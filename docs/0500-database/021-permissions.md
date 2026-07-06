# Permissions

| Field | Value |
|---|---|
| Unique ID | DB-PERMISSIONS-001 |
| Version | 1.0.0 |
| Status | Active |
| Owner | Security / Platform Data Owner |
| Dependencies | DB-WORKSPACES-001, DB-PROJECTS-001, SEC-INDEX-001 |
| Referenced By | DB-BIBLE-001, ADR-007 |
| Cross References | API-WORKSPACE-001, API-PROJECT-001, SEC-INDEX-001 |

## Purpose

Define the permission model foundation for workspace and project access.

## Owner

Security / Platform Data Owner.

## Relationships

- Workspace members bind users to workspaces with roles.
- Project access is derived from workspace membership in Sprint 1.
- Future permissions may include custom roles, project-level overrides, service accounts, and resource-level grants.

## Fields

Current membership fields:

- Workspace member ID.
- Workspace reference.
- User reference.
- Role.
- Status.
- Created timestamp.
- Updated timestamp.
- Removed timestamp.

## Indexes

- Workspace reference plus status.
- User reference plus status.
- Unique workspace and user pair.

## Lifecycle

Memberships are created, updated, removed, and audited. Removed members should lose future access while audit history remains.

## Permissions

Sprint 1 roles:

- Owner.
- Admin.
- Editor.
- Viewer.

Owner/admin can manage members. Owner/admin/editor can create projects. Viewers can read accessible projects.

## Retention

Retain removed membership history for audit and security review.

## Future Expansion

Add billing admin, publisher, analyst, reviewer, service account, custom roles, and policy-based permission checks.

## Acceptance Criteria

- Workspace membership gates project access.
- Write access is stricter than read access.
- Non-members cannot read projects.

## AI Context

Permissions are a platform safety boundary. Do not rely on frontend-only checks.
