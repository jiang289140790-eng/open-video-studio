# Admin API

| Field | Value |
|---|---|
| ID | API-ADMIN-001 |
| Unique ID | API-ADMIN-001 |
| Version | 1.1.0 |
| Status | Active |
| Owner | Platform Admin Lead / Security Lead |
| Dependencies | API-AUTH-001, DB-USERS-001, DB-AUDIT-LOGS-001, SEC-INDEX-001 |
| Referenced By | API-SUBSCRIPTION-001, API-CREDITS-001, API-ANALYTICS-001 |
| Cross References | DB-AUDIT-LOGS-001, SEC-INDEX-001, DB-USERS-001 |

## Purpose

Define the API surface for internal or workspace administrative operations.

## Requirements

- Enforce least-privilege administrative access.
- Audit every high-risk administrative action.
- Keep internal support, billing, security, and workspace admin capabilities distinct.

## Business Logic

Admin APIs manage sensitive operations such as user state, workspace controls, billing support, moderation, feature access, audit review, and operational remediation. Admin actions must be permissioned, logged, and minimized.

## Authentication

Requires authenticated admin identity, service account, or internal operator context with strong session controls.

## Permissions

Permissions must be role-specific and least-privilege. Workspace admins, internal support, billing admins, security admins, and system operators must have distinct capabilities.

## Request

Conceptual request inputs may include target object type, target object reference, action, reason, scope, admin note, idempotency key, and optional approval reference.

MVP implementation uses one Supabase Edge Function named `admin` with an `action` field:

- `dashboard-summary`
- `list-users`
- `list-orders`
- `list-assets`
- `list-generation-jobs`
- `list-share-links`
- `list-audit-logs`
- `adjust-credits`
- `update-order-status`
- `review-asset`
- `revoke-share-link`

Sensitive write actions require a non-empty `reason`.

## Response

Responses may include action result, target state summary, audit log reference, required follow-up, and failure or partial-completion details.

## Error Codes

- `ADMIN_FORBIDDEN`
- `ADMIN_SCOPE_REQUIRED`
- `ADMIN_ACTION_NOT_ALLOWED`
- `ADMIN_APPROVAL_REQUIRED`
- `ADMIN_TARGET_NOT_FOUND`
- `ADMIN_RATE_LIMITED`

## Rate Limit

Strict limits apply to sensitive write operations. Bulk admin actions require additional controls, audit records, and possibly approval workflows.

## Dependencies

Depends on authentication, authorization, audit logs, security policy, user records, billing records, moderation state, and operational runbooks.

## Future Expansion

Support admin console APIs, approval workflows, break-glass access, enterprise admin APIs, compliance exports, and support impersonation controls.

## Acceptance Criteria

- Every high-risk admin action is permissioned and auditable.
- Admin APIs cannot be treated as generic unrestricted backdoors.

## Future Plan

Define role-based access control and admin audit taxonomy before implementation.

## Current Implementation

`SupabaseAdminBackend` and the Supabase `admin` Edge Function implement the MVP operations console. `profiles.role = 'operator'` can read operational data and review non-archival content. `profiles.role = 'admin'` can perform high-risk writes such as credit adjustment, order status update, audit reads, and share revocation. The browser never receives a service role key.

## AI Context

Admin APIs are high risk. Always assume least privilege, auditability, approval, and separation of duties.
