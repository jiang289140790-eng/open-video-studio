# Payment API

| Field | Value |
|---|---|
| ID | API-PAYMENT-001 |
| Unique ID | API-PAYMENT-001 |
| Version | 1.4.0 |
| Status | Active |
| Owner | Billing Platform Lead / API Platform Lead |
| Dependencies | API-AUTH-001, DB-ORDERS-001, DB-CREDITS-001, SEC-INDEX-001 |
| Referenced By | API-SUBSCRIPTION-001, API-CREDITS-001, API-WEBHOOK-001 |
| Cross References | PB-006, DB-ORDERS-001, DB-AUDIT-LOGS-001 |

## Purpose

Define the API surface for checkout, payment initiation, order state, invoices, refunds, and billing provider handoff.

## Requirements

- Create payment flows without storing raw payment credentials.
- Use idempotency for payment-creating operations.
- Keep orders reconcilable with billing provider state.

## Business Logic

Payment APIs create or retrieve payment flows while avoiding direct storage of raw payment credentials. They coordinate orders, provider sessions, credits, subscriptions, invoices, and reconciliation.

## Authentication

Most payment actions require authenticated user or workspace billing admin. Provider callbacks are handled through webhook APIs.

## Permissions

Users may initiate allowed purchases. Workspace billing admins may manage workspace payments. Refunds, adjustments, and dispute operations require internal billing permissions.

## Request

Conceptual request inputs may include workspace reference, purchase type, plan reference, credit package reference, billing account reference, coupon or affiliate context, return destination, and idempotency key.

## Response

Responses may include order ID, payment session reference, provider redirect or client token reference, order status, invoice summary, and next required action.

## Error Codes

- `PAYMENT_FORBIDDEN`
- `PAYMENT_INVALID_PRODUCT`
- `PAYMENT_PROVIDER_UNAVAILABLE`
- `PAYMENT_ORDER_FAILED`
- `PAYMENT_IDEMPOTENCY_CONFLICT`
- `PAYMENT_RATE_LIMITED`

## Rate Limit

Strict limits apply to checkout/session creation, refund actions, and payment state polling. Idempotency is required for payment-creating operations.

## Dependencies

Depends on orders, subscriptions, credits, billing provider integration, audit logs, fraud checks, and security policy.

## Future Expansion

Support enterprise invoices, purchase orders, tax handling, coupons, refunds, reseller flows, prepaid commitments, and billing portal sessions.

## Acceptance Criteria

- Payment flows do not expose raw payment credentials.
- Orders are reconcilable with billing provider state.

## Current Implementation

`ADR-004` adds local credit purchase completion through `BillingService` and the `orders` table. This creates completed local order records and grants credits through the ledger for workflow testing.

No checkout provider, payment intent, subscription provider, webhook verification, refund, dispute, tax, or invoice integration is implemented yet.

MVP Sprint 1 exposes a local HTTP credit purchase route for MVP testing. It is not a real payment provider integration.

Production Supabase now exposes an MVP no-charge demo checkout path through the authenticated `ai` Edge Function action `demo-credit-purchase`. It creates a pending `orders` row first, writes the posted credit ledger grant second, and only marks the order `fulfilled` after the grant succeeds. If the ledger grant fails, the order is marked `failed` instead of silently granting credits without a reconcilable order. `npm run verify:payments` proves the action fails closed without authentication, then verifies order readback, credit ledger readback, and balance correctness for a temporary authenticated user.

Stripe and PayPal are now prewired through the authenticated `ai` Edge Function action `create-payment-checkout`. The frontend sends only purchase intent, selected provider, credit package, and return URLs. The Edge Function creates a pending `orders` row, calls Stripe Checkout Sessions or PayPal Orders from the server side, stores the provider reference, and returns a provider-hosted checkout URL. Browser code only uses public `VITE_*` provider configuration and never stores provider secret keys.

The `payment-provider-status` action exposes whether Stripe and PayPal server-side secrets are configured so Admin/System views can distinguish a visible checkout button from a live provider connection.

This does not yet complete real payment fulfillment. Real charges still require live Stripe/PayPal accounts, Supabase Edge Function secrets, webhook signature verification, PayPal capture after approval, idempotency keys, refund/reconciliation handling, tax/invoice policy, and fraud controls before credits can be granted automatically from paid provider events. Until those are configured, the demo checkout path remains the safe fallback.

## Future Plan

Select billing provider and define reconciliation architecture before implementation.

## AI Context

Payment is financial infrastructure. Favor idempotency, auditability, provider reconciliation, and minimal sensitive data exposure.
