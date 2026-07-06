# Settings

| Field | Value |
|---|---|
| Unique ID | DB-SETTINGS-001 |
| Version | 1.0.0 |
| Status | Active |
| Owner | Platform Data Owner |
| Dependencies | DB-USERS-001, DB-SUBSCRIPTIONS-001, SEC-INDEX-001 |
| Referenced By | DB-NOTIFICATIONS-001, DB-VIDEOS-001 |
| Cross References | PB-008, PB-015, SEC-INDEX-001 |

## Purpose

Represent user, workspace, product, AI, notification, privacy, and operational preferences.

## Requirements

- Separate user preferences from workspace or admin-controlled settings.
- Support future settings versioning and policy enforcement.
- Avoid storing secrets in general settings records.

## Relationships

- Associated with users, workspaces, subscriptions, notifications, media workflows, AI settings, and audit logs.
- May affect generation defaults, brand defaults, export preferences, and notification behavior.

## Fields

- Settings ID.
- Scope type.
- Scope reference.
- Setting namespace.
- Setting key.
- Setting value reference.
- Policy source.
- Visibility.
- Updated by user reference.
- Created timestamp.
- Updated timestamp.

## Indexes

- Scope type plus scope reference.
- Setting namespace plus setting key.
- Updated timestamp.
- Policy source.

## Lifecycle

Settings are created through defaults, onboarding, admin configuration, user preference changes, or policy enforcement. They may be updated, reset, inherited, locked, or retired.

## Permissions

Users may update personal settings. Workspace admins may manage workspace settings. Policy-locked settings require admin or system authority.

## Retention

Retain active settings while the relevant user or workspace exists. Historical changes may be retained through audit logs rather than settings records.

## Future Expansion

Support inherited settings, feature flags, policy templates, enterprise controls, brand defaults, and settings history.

## Acceptance Criteria

- Settings can distinguish personal preference, workspace policy, and system default.
- Sensitive configuration is not stored casually.

## Future Plan

Define workspace and permissions architecture before implementing setting scopes.

## AI Context

Settings are not a dumping ground. If a value controls security, billing, or AI policy, it may need a dedicated governed table.
