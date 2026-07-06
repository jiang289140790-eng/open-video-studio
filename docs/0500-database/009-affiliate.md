# Affiliate

| Field | Value |
|---|---|
| Unique ID | DB-AFFILIATE-001 |
| Version | 1.0.0 |
| Status | Active |
| Owner | Growth / Revenue Data Owner |
| Dependencies | PB-006, DB-USERS-001, DB-ORDERS-001 |
| Referenced By | DB-ANALYTICS-001, DB-ORDERS-001 |
| Cross References | GROWTH-INDEX-001, ANALYTICS-INDEX-001, DB-ORDERS-001 |

## Purpose

Represent affiliate, referral, partner, or attribution relationships that influence acquisition and revenue sharing.

## Requirements

- Track affiliate identities, referrals, attribution state, conversion events, payout eligibility, and fraud review.
- Avoid mixing raw analytics events with financial payout records.
- Support growth measurement and revenue reconciliation.

## Relationships

- Associated with users, orders, subscriptions, analytics events, notifications, and audit logs.
- May link to future partner, campaign, coupon, or payout tables.

## Fields

- Affiliate record ID.
- Affiliate user or partner reference.
- Referred user or workspace reference.
- Attribution source.
- Campaign reference.
- Referral code or link reference.
- Conversion status.
- Eligible order reference.
- Payout status.
- Fraud review status.
- Created timestamp.
- Updated timestamp.

## Indexes

- Affiliate reference plus created timestamp.
- Referred user or workspace reference.
- Referral code or link reference.
- Conversion status.
- Payout status.

## Lifecycle

Affiliate records begin at referral click, signup, invite, or attribution event. They may convert, expire, become payout-eligible, be rejected, or be reconciled.

## Permissions

Affiliates may view approved referral and payout summaries. Internal growth and finance roles may view detailed attribution and fraud review data.

## Retention

Retain attribution and payout-related records for financial reconciliation, abuse prevention, and partner reporting.

## Future Expansion

Support tiers, partner portals, payout batches, coupon attribution, reseller programs, and multi-touch attribution.

## Acceptance Criteria

- Referral attribution can be analyzed without corrupting financial records.
- Payout-related data is auditable and permissioned.

## Future Plan

Create affiliate product and finance requirements before implementation.

## AI Context

Affiliate data is both growth and financial-adjacent. Treat attribution, fraud prevention, and payout integrity carefully.
