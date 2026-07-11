# 1200 Analytics

| Field | Value |
|---|---|
| Unique ID | ANALYTICS-INDEX-001 |
| Version | 0.3.0 |
| Status | Active |
| Owner | Analytics Lead |
| Dependencies | OVSB-001, DOC-STD-001, PRD-INDEX-001, DB-INDEX-001, SEC-INDEX-001 |
| Referenced By | DOC-002 |

## Purpose

Own metrics, event taxonomy, funnels, dashboards, experiments, attribution, data quality, and decision reporting.

## Requirements

- Product features must define analytics events where measurement matters.
- Events must include owner, trigger, properties, privacy classification, and downstream use.
- Experiments must define success metrics before launch.
- Analytics implementation must define event quality checks, data freshness expectations, attribution limits, and privacy review.
- Metrics used for decisions must have owner, definition, source, refresh cadence, and known caveats.
- Operational observability metrics must not be mixed with product analytics unless clearly labeled.

## Acceptance Criteria

- Teams can measure product health, growth, reliability, and AI quality.
- Analytics work respects privacy and data minimization.
- Decision-critical metrics are governed, auditable, and explainable.

## Current Implementation

The MVP frontend includes a local product-event recorder for the first conversion loop. Events are stored in browser local storage under `ovs_product_events_v1`, capped at 250 rows, and do not leave the browser. Recording is enabled when the user accepts analytics cookies or when the site runs in local development / file preview mode for QA.

Tracked MVP events include:

- `signup_completed`
- `signin_completed`
- `password_reset_requested`
- `password_updated`
- `pricing_cta_clicked`
- `credit_purchase_started`
- `credit_purchase_confirmed`
- `payment_checkout_created`
- `credit_purchase_completed`
- `generation_submitted`
- `generation_blocked`
- `generation_failed`
- `generation_completed`
- `asset_shared`

Event properties must stay non-sensitive. Do not store prompt text, email addresses, tokens, third-party keys, payment details, or raw provider payloads in product analytics.

## Future Plan

- Add north-star metric.
- Add dashboard registry.
- Add experimentation standard.
- Add event quality standard.
- Add metric definition registry.
- Add attribution and privacy policy.

## AI Context

Use this folder whenever work affects tracking, metrics, experimentation, dashboards, or reporting.
