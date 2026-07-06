# Credits

| Field | Value |
|---|---|
| Unique ID | DB-CREDITS-001 |
| Version | 1.0.0 |
| Status | Active |
| Owner | Billing / Monetization Data Owner |
| Dependencies | PB-006, DB-USERS-001, DB-ORDERS-001, DB-SUBSCRIPTIONS-001 |
| Referenced By | DB-IMAGES-001, DB-VIDEOS-001, DB-PROMPTS-001 |
| Cross References | PB-006, PB-010, DB-USERS-001, DB-AUDIT-LOGS-001 |

## Purpose

Represent metered usage entitlement for expensive AI, media, rendering, export, or automation operations.

## Requirements

- Track credit grants, consumption, expiration, reversals, and adjustments.
- Support transparent usage history and cost control.
- Avoid embedding pricing logic directly in usage records.

## Relationships

- Belongs to a user, workspace, subscription, order, or future billing account.
- May be consumed by image generation, video generation, render, transcription, export, prompt execution, or automation.
- Must be auditable through audit logs.

## Fields

- Credit transaction ID.
- Account or workspace reference.
- User reference when actor-specific.
- Source type.
- Source reference.
- Amount granted or consumed.
- Balance impact.
- Operation category.
- Expiration timestamp.
- Status.
- Reason or memo.
- Created timestamp.

## Indexes

- Account or workspace reference plus created timestamp.
- User reference plus created timestamp.
- Source reference for reconciliation.
- Operation category for cost analysis.
- Expiration timestamp for credit lifecycle jobs.

## Lifecycle

Credits are granted through subscription renewal, purchase, promotion, admin adjustment, or refund. Credits are consumed by eligible operations and may expire, reverse, or adjust based on policy.

## Permissions

Users may view their own credit balance and usage history. Admins may view workspace usage. Adjustments require elevated billing permission and audit logging.

## Retention

Retain credit transaction history for financial reconciliation, customer support, abuse analysis, and legal requirements.

## Future Expansion

Support multi-currency credit valuation, model-specific cost mapping, enterprise pooled credits, prepaid commitments, and usage alerts.

## Acceptance Criteria

- Credit usage is explainable to users and reconcilable by billing.
- Expensive operations can reference credit impact without duplicating billing rules.

## Future Plan

Create detailed billing PRD and API contracts before implementation.

## AI Context

Credits are financial-adjacent and trust-sensitive. Do not invent exact credit rates or pricing rules here.
