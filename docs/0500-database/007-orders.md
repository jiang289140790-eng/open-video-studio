# Orders

| Field | Value |
|---|---|
| Unique ID | DB-ORDERS-001 |
| Version | 1.2.0 |
| Status | Active |
| Owner | Billing Data Owner |
| Dependencies | DB-USERS-001, DB-CREDITS-001, PB-006 |
| Referenced By | DB-SUBSCRIPTIONS-001, DB-AFFILIATE-001, DB-AUDIT-LOGS-001 |
| Cross References | PB-006, DB-CREDITS-001, DB-USERS-001 |

## Purpose

Represent purchase events, invoices, upgrades, renewals, credit purchases, and other billable transactions.

## Requirements

- Track transaction state, customer reference, billing provider reference, product or plan context, and financial reconciliation metadata.
- Avoid storing raw payment secrets.
- Support refunds, failures, disputes, and adjustments.

## Relationships

- Associated with users, workspaces, subscriptions, credits, affiliate attribution, audit logs, and external payment providers.
- May create or modify credit balances and subscription entitlements.

## Fields

- Order ID.
- Customer or billing account reference.
- User or workspace reference.
- External provider reference.
- Order type.
- Status.
- Currency.
- Amount summary.
- Tax or invoice reference.
- Subscription reference.
- Credit transaction reference.
- Affiliate attribution reference.
- Created timestamp.
- Updated timestamp.
- Completed timestamp.

## Indexes

- Customer or billing account reference plus created timestamp.
- External provider reference.
- Status.
- Subscription reference.
- Affiliate attribution reference.

## Lifecycle

Orders are created when checkout, renewal, upgrade, credit purchase, or invoice actions occur. They may complete, fail, refund, dispute, cancel, or reconcile.

## Permissions

Users and workspace admins may view relevant billing history. Financial adjustments require billing admin permission and audit logging.

## Retention

Retain according to finance, tax, legal, dispute, and customer support requirements.

## Future Expansion

Support enterprise invoices, purchase orders, tax handling, credits bundles, coupons, promotions, and reseller channels.

## Acceptance Criteria

- Billing transactions can be reconciled without exposing payment secrets.
- Orders can connect subscription, credit, and affiliate systems.

## Current Implementation

`ADR-004` adds local order records for completed credit purchases through `BillingService`. These records are workflow foundations only and do not represent production payment provider reconciliation.

Production Supabase now supports MVP no-charge demo checkout records through the `demo-credit-purchase` server action. `npm run verify:payments` creates a temporary authenticated user, writes a fulfilled `orders` record, verifies the linked posted `credit_transactions` grant, confirms the readable credit balance, and removes the temporary records. These records prove the purchase-to-credit path but are not real payment-provider settlement records.

## Future Plan

Create detailed billing architecture and provider integration docs before implementation.

## AI Context

Orders are financial records. Treat accuracy, immutability, audit, and provider reconciliation as primary concerns.
