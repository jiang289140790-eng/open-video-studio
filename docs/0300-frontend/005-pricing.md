# Pricing

| Field | Value |
|---|---|
| Unique ID | PAGE-PRICING-001 |
| Version | 1.1.0 |
| Status | Active |
| Owner | Growth Lead / Billing Product Lead |
| Dependencies | PB-006, DS-003, API-CREDITS-001, API-PAYMENT-001, API-SUBSCRIPTION-001 |
| Referenced By | FE-BIBLE-001, DOC-002 |
| Cross References | PB-006, API-PAYMENT-001, API-SUBSCRIPTION-001, DB-CREDITS-001 |

## Purpose

Define the pricing page for plans, credits, usage expectations, and conversion to checkout or subscription management.

## Requirements

- Communicate plan value and usage boundaries clearly.
- Avoid surprise billing.
- Support anonymous and authenticated pricing flows.

## Layout

The pricing page should provide clear plan comparison, usage explanation, credit education, FAQs, and conversion actions. It should feel trustworthy and simple.

## Sections

- Pricing header.
- Plan cards.
- Credit or usage explanation.
- Feature comparison.
- Team or enterprise prompt.
- FAQ.
- Billing trust and support notes.
- CTA to start, upgrade, or contact sales.

## Components

- Public or app header.
- Billing interval toggle.
- Plan card.
- Feature comparison table.
- Credit explanation panel.
- FAQ accordion.
- Checkout CTA.
- Enterprise contact CTA.

## State Flow

- Anonymous user views pricing and starts signup or checkout.
- Authenticated user sees current plan context where available.
- User selects plan or credit purchase.
- Payment flow begins through `API-PAYMENT-001`.
- Subscription state updates through `API-SUBSCRIPTION-001`.

## Navigation

Pricing is accessible from homepage, app shell, account settings, and upgrade prompts. Checkout and subscription flows must preserve selected plan.

## Responsive Rules

Desktop supports plan comparison and tables. Mobile should prioritize plan cards, key differences, credit clarity, and CTA without horizontal complexity.

## SEO

Pricing should be indexable and include clear metadata for AI video pricing, plans, credits, and team usage. Exact structured data requires SEO documentation.

## Analytics Events

- `pricing_viewed`
- `pricing_interval_toggled`
- `pricing_plan_selected`
- `pricing_credit_info_opened`
- `pricing_checkout_started`
- `pricing_enterprise_clicked`

## Acceptance Criteria

- Users understand plan differences and credit implications.
- Checkout entry points are clear and trust-building.
- Pricing page does not define exact billing logic outside `PB-006` and billing docs.

## Current Implementation

`ADR-003` implements the first MVP pricing preview at `apps/web/pricing.html`. The current surface communicates plan structure, credit transparency, billing trust principles, and conversion actions.

Displayed prices are preview copy for the MVP frontend and are not final billing logic. Final packaging, credit rates, checkout, payment, and subscription behavior must be approved through `PB-006`, `API-PAYMENT-001`, and `API-SUBSCRIPTION-001`.

## Future Plan

Add experiments, enterprise pricing, plan comparison personalization, and usage calculators.

## AI Context

Pricing UI must be transparent. Never obscure usage cost, renewal state, plan limits, or credit consumption.
