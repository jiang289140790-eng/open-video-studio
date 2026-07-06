# Subscriptions

| Field | Value |
|---|---|
| Unique ID | DB-SUBSCRIPTIONS-001 |
| Version | 1.0.0 |
| Status | Active |
| Owner | Billing / Entitlements Data Owner |
| Dependencies | DB-USERS-001, DB-ORDERS-001, DB-CREDITS-001, PB-006 |
| Referenced By | DB-CREDITS-001, DB-ORDERS-001, DB-SETTINGS-001 |
| Cross References | PB-006, DB-USERS-001, DB-CREDITS-001 |

## Purpose

Represent recurring plans, entitlements, billing periods, and subscription states.

## Requirements

- Track plan, billing status, renewal period, entitlement state, and provider references.
- Support individual, team, enterprise, and future usage-based models.
- Separate subscription state from actual credit transaction history.

## Relationships

- Associated with user, workspace, billing account, orders, credits, settings, notifications, and audit logs.
- May define entitlements used by permissions and product limits.

## Fields

- Subscription ID.
- Customer or billing account reference.
- User or workspace reference.
- Plan reference.
- Status.
- Billing period start.
- Billing period end.
- Renewal state.
- External provider reference.
- Entitlement summary.
- Trial state.
- Cancellation timestamp.
- Created timestamp.
- Updated timestamp.

## Indexes

- Customer or billing account reference.
- User or workspace reference.
- Status.
- Plan reference.
- Billing period end.
- External provider reference.

## Lifecycle

Subscriptions may start as trial, active, past due, canceled, expired, paused, upgraded, downgraded, or renewed.

## Permissions

Workspace admins and billing owners may view or manage subscriptions. Entitlement checks may be read by backend services but must not expose unnecessary financial detail.

## Retention

Retain subscription history for support, finance, analytics, and compliance. Canceled subscriptions may be retained with reduced operational access.

## Future Expansion

Support enterprise contracts, seat-based billing, usage commitments, plan migrations, add-ons, custom entitlements, and procurement metadata.

## Acceptance Criteria

- Subscription state can drive entitlements without duplicating credit transactions.
- Billing history remains auditable.

## Future Plan

Define entitlement model and billing provider contracts before implementation.

## AI Context

Do not equate subscription with credits. Subscriptions define recurring access; credits represent metered usage changes.
