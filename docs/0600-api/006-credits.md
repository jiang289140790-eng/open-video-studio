# Credits API

| Field | Value |
|---|---|
| ID | API-CREDITS-001 |
| Unique ID | API-CREDITS-001 |
| Version | 1.3.0 |
| Status | Active |
| Owner | Billing Platform Lead / API Platform Lead |
| Dependencies | API-AUTH-001, DB-CREDITS-001, DB-ORDERS-001, DB-SUBSCRIPTIONS-001 |
| Referenced By | API-GEN-IMAGE-001, API-GEN-VIDEO-001, API-PAYMENT-001 |
| Cross References | PB-006, DB-CREDITS-001, DB-AUDIT-LOGS-001 |

## Purpose

Define the API surface for reading credit balances, usage history, estimates, and credit-affecting operation summaries.

## Requirements

- Provide transparent credit balance and usage information.
- Keep adjustments permissioned and auditable.
- Avoid exposing internal cost models unless explicitly approved.

## Business Logic

The credits API helps users understand usage and cost. It must expose transparent balances and history while keeping financial adjustments controlled and auditable.

## Authentication

Requires authenticated user or authorized service account.

## Permissions

Users may view their personal or workspace-accessible credit information. Billing admins may view workspace credit history. Adjustments require elevated internal permissions.

## Request

Conceptual request inputs may include workspace reference, billing account reference, date range, operation category, pagination cursor, and estimate inputs for planned operations.

## Response

Responses may include current balance, expiring credits, usage history, transaction summaries, operation estimates, pagination cursor, and warning states.

## Error Codes

- `CREDITS_FORBIDDEN`
- `CREDITS_ACCOUNT_NOT_FOUND`
- `CREDITS_ESTIMATE_UNAVAILABLE`
- `CREDITS_INVALID_RANGE`
- `CREDITS_RATE_LIMITED`

## Rate Limit

Moderate limits for balance and history reads. Estimate endpoints may be more tightly limited if they depend on model or pricing calculations.

## Dependencies

Depends on credit ledger, billing account model, orders, subscriptions, generation APIs, audit logs, and pricing policy.

## Future Expansion

Support alerts, budget limits, credit reservations, pooled credits, enterprise commitments, and model-specific estimates.

## Acceptance Criteria

- Users can understand credit balance and usage without exposing internal cost models.
- Credit-affecting actions remain auditable.

## Current Implementation

`ADR-002` implements the local credit ledger. `ADR-004` extends workflow usage so local credit purchases grant credits through `BillingService`, and image/video generation jobs consume credits before they are queued.

Credit reservation, refunds, failed-job credit policy, provider reconciliation, and subscription entitlements remain future work.

MVP Sprint 1 exposes local HTTP routes for credit balance/history and local test credit purchase through `createMvpApiServer`.

MVP Backend Loop grants `40` starter credits on signup and consumes credits when generation jobs are created. Payment purchase remains out of scope for this loop.

## Future Plan

Create detailed credit policy and billing contracts before implementation.

## AI Context

Credit APIs are trust-sensitive. Prioritize transparency, reconciliation, and clear error states.
