# Admin API

| Field | Value |
|---|---|
| ID | API-ADMIN-001 |
| Unique ID | API-ADMIN-001 |
| Version | 1.4.0 |
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
- `list-workers`
- `list-share-links`
- `list-audit-logs`
- `get-homepage-config`
- `update-homepage-config`
- `get-page-builder-config`
- `update-page-builder-config`
- `get-tool-catalog-config`
- `update-tool-catalog-config`
- `adjust-credits`
- `update-order-status`
- `review-asset`
- `revoke-share-link`

Sensitive write actions require a non-empty `reason`. `update-homepage-config` accepts the MVP homepage configuration payload for hero copy, CTA links, trust signals, showcase cards, and gallery preview cards.

`update-page-builder-config` accepts `page_builder_config` payloads for page modules, enabled state, display style, card count, and module data source.

`update-tool-catalog-config` accepts `tool_catalog_config` payloads for AI tool listing status, category, provider, model, route, featured state, and credit cost.

`dashboard-summary` now returns MVP operating KPIs for daily users, paid users, revenue, image jobs, video jobs, failed jobs, weekly revenue trend, popular tools, high-failure tools, and credit consumption ranking.

`list-workers` returns provider/workflow worker status records with queue count, average latency, success rate, estimated cost per job, last heartbeat, and recent failure reason. Current data can be derived from generation jobs until persistent worker heartbeat records are connected.

`list-generation-jobs` returns normalized generation job detail fields for tool slug, workflow id/version, input params, output assets, credit charged, estimated cost, latency, status, and error message.

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

The MVP Admin surface now also supports configurable page merchandising. Operators may read homepage, page builder, and tool catalog settings; only admins may publish updates. Published settings are stored in `site_settings`, and admin publishes write audit logs such as `admin.update_homepage_config`, `admin.update_page_builder_config`, and `admin.update_tool_catalog_config`.

The Admin console has been upgraded from configuration-first to operations-first for P0 SaaS monitoring. It can inspect growth/revenue/generation KPIs, Worker Center status, and enriched generation job details without changing provider architecture or exposing service keys in the browser.

## AI Context

Admin APIs are high risk. Always assume least privilege, auditability, approval, and separation of duties.
