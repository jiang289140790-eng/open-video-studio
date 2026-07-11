# Billing Backend Architecture

| Field | Value |
|---|---|
| Unique ID | BE-ARCH-BILLING-001 |
| Version | 1.2.0 |
| Status | Active |
| Owner | Billing Platform Lead / Backend Lead |
| Dependencies | PB-006, API-PAYMENT-001, API-SUBSCRIPTION-001, API-CREDITS-001, DB-ORDERS-001, DB-SUBSCRIPTIONS-001, DB-CREDITS-001 |
| Referenced By | BE-ARCH-BIBLE-001 |
| Cross References | PB-006, DB-ORDERS-001, DB-SUBSCRIPTIONS-001, DB-CREDITS-001 |

## Purpose

Define backend architecture for payments, subscriptions, credits, entitlements, invoices, reconciliation, and billing provider integration.

## Requirements

- Keep financial state auditable and reconcilable.
- Separate payment orders, subscriptions, credits, and entitlements.
- Use idempotency for money-moving or entitlement-changing actions.

## Architecture

Billing should integrate with a payment provider through controlled APIs and verified webhooks. Internal records should preserve order state, subscription state, credit ledger entries, and entitlement state without storing raw payment credentials.

Phase 1 implements the credits ledger foundation, demo credit purchases, and server-side checkout prewiring for Stripe and PayPal. The `ai` Supabase Edge Function can create provider checkout/order sessions without exposing provider secrets to the browser. Orders are recorded before provider handoff so failed checkout creation remains auditable.

Provider fulfillment is still intentionally incomplete until live Stripe/PayPal accounts, webhook secrets, capture handling, refund policy, tax policy, and reconciliation jobs are configured.

## Responsibilities

- Create checkout or billing sessions.
- Process provider webhooks.
- Maintain subscriptions and entitlements.
- Grant and consume credits.
- Reconcile orders and invoices.
- Emit audit logs and user notifications.

## Dependencies

Depends on payment API, subscription API, credits API, billing provider, orders, subscriptions, credits, audit logs, webhooks, and notifications.

## Failure Recovery

Provider webhook failures must be retryable and idempotent. Reconciliation jobs should repair mismatched provider/internal state. Credit grants should avoid duplicate application.

## Scalability

Billing traffic is usually lower volume than media processing but higher risk. Architecture should prioritize correctness, idempotency, and provider reconciliation over raw throughput.

## Acceptance Criteria

- Billing state can be reconciled with provider state.
- Credit and subscription changes are auditable.
- Duplicate webhooks or retries do not duplicate entitlements.

## Future Plan

Complete Stripe webhook verification, PayPal capture after buyer approval, idempotency keys for checkout creation, refund/reconciliation jobs, tax/invoice handling, and dispute workflows.

## AI Context

Billing is trust infrastructure. Avoid clever shortcuts; prioritize correctness, idempotency, audit, and clear user-facing state.
