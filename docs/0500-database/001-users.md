# Users

| Field | Value |
|---|---|
| Unique ID | DB-USERS-001 |
| Version | 1.0.0 |
| Status | Active |
| Owner | Identity / Platform Data Owner |
| Dependencies | PB-003, PB-008, SEC-INDEX-001 |
| Referenced By | DB-CREDITS-001, DB-VIDEOS-001, DB-ORDERS-001, DB-SUBSCRIPTIONS-001, DB-AUDIT-LOGS-001 |
| Cross References | PB-003, PB-008, PB-015, SEC-INDEX-001 |

## Purpose

Represent human accounts that access Open Video Studio.

## Requirements

- Store identity, profile, account state, and workspace participation references.
- Avoid storing sensitive authentication secrets directly unless a future security architecture explicitly defines it.
- Support individual creators, team members, admins, reviewers, and automation operators.

## Relationships

- Owns or participates in videos, images, prompts, characters, media assets, settings, notifications, analytics events, orders, subscriptions, and audit logs.
- May belong to future workspace, team, organization, or permission tables.
- May be associated with affiliate attribution and billing customer records.

## Fields

- User ID.
- Email or login identifier.
- Display name.
- Avatar reference.
- Account status.
- Role or default account type.
- Locale and timezone.
- Onboarding state.
- Last active timestamp.
- Created timestamp.
- Updated timestamp.
- Deleted or deactivated timestamp.

## Indexes

- User ID for primary lookup.
- Email or login identifier for authentication lookup.
- Account status for operational review.
- Last active timestamp for lifecycle and analytics.

## Lifecycle

Created during signup, invitation acceptance, SSO provisioning, or future enterprise import. Updated through profile, account, security, and workspace actions. Deactivated or deleted according to privacy and retention rules.

## Permissions

Users can read and update limited profile data. Admins may manage workspace-related user state. Security-sensitive account fields require elevated permission and audit logging.

## Retention

Retain active user records while account relationship exists. Deletion, anonymization, or retention exceptions must follow privacy and legal requirements.

## Future Expansion

Add workspace membership, identity providers, SSO, MFA state, user preferences, enterprise directory sync, and privacy export metadata in dedicated documents.

## Acceptance Criteria

- User identity can be referenced consistently by product, API, backend, analytics, and audit docs.
- Sensitive account data remains governed by security documents.

## Future Plan

Define workspace membership, roles, and authorization tables after the permissions model is approved.

## AI Context

Do not treat users as the same as workspaces or customers. Billing, workspace membership, and permissions may become separate entities.
