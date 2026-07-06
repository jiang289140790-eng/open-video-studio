# AI Cost Records

| Field | Value |
|---|---|
| Unique ID | DB-AI-COST-RECORDS-001 |
| Version | 1.0.0 |
| Status | Active |
| Owner | AI Platform Data Owner / Billing Data Owner |
| Dependencies | DB-USERS-001, DB-AI-JOBS-001, DB-GENERATION-JOBS-001 |
| Referenced By | DB-BIBLE-001, ADR-005, AI-COST-001 |
| Cross References | API-CREDITS-001, DB-CREDITS-001, AI-COST-001 |

## Purpose

Represent estimated AI provider cost and usage details for completed AI work.

## Owner

AI Platform Data Owner / Billing Data Owner.

## Relationships

- Belongs to a user.
- References an AI job.
- May reference a product generation job.
- Complements but does not replace the credit ledger.

## Fields

- AI cost record ID.
- User reference.
- AI job reference.
- Generation job reference.
- Provider.
- Model.
- Operation.
- Credits.
- Estimated cost.
- Duration.
- Resolution.
- Created timestamp.

## Indexes

- User reference plus created timestamp.
- AI job reference.
- Provider plus model.

## Lifecycle

Cost records are created when AI jobs complete. Future provider reconciliation may update or add settlement records without mutating the original estimate.

## Permissions

Users may see product-safe usage summaries. Internal billing, finance, and AI operations may inspect detailed provider cost records.

## Retention

Retain for billing reconciliation, cost analysis, support, audit, and margin reporting.

## Future Expansion

Add provider invoice references, actual cost, currency, token/frame counts, GPU seconds, storage/bandwidth impact, and margin attribution.

## Acceptance Criteria

- AI usage can be inspected by provider, model, operation, user, and job.
- Estimated provider cost remains distinct from user-facing credits.
- Cost records can support future reconciliation and margin reporting.

## Future Plan

Add actual provider cost reconciliation, currency, provider invoice references, usage-unit breakdowns, failed-job cost handling, and billing analytics exports.

## AI Context

Keep estimated provider cost separate from credits charged to users. Both are needed for trust and margin control.
