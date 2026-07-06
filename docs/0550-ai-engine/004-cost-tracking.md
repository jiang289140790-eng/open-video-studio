# AI Cost Tracking

| Field | Value |
|---|---|
| Unique ID | AI-COST-001 |
| Version | 1.0.0 |
| Status | Active |
| Owner | AI Platform Lead / Billing Platform Lead |
| Dependencies | ADR-005, DB-AI-COST-RECORDS-001, API-CREDITS-001 |
| Referenced By | AI-INDEX-001 |

## Purpose

Define cost tracking expectations for AI jobs before real provider spend begins.

## Requirements

Every AI generation must record:

- Provider.
- Model.
- Credits.
- Estimated cost.
- Duration.
- Resolution.
- User.
- Job ID.

## Architecture

The local foundation records AI cost data in `ai_cost_records` when an AI job completes. This is separate from user-facing credit ledger entries and provider invoices.

## Acceptance Criteria

- Cost records can be listed by user.
- Cost records connect to AI job IDs and generation job IDs where available.
- Estimated provider cost remains distinct from user-facing credits.

## Future Plan

Add real provider usage reconciliation, margin reporting, budget alerts, per-model pricing, reservation/refund policies, and failed-job cost treatment.

## AI Context

Cost tracking is not optional. AI media products must track spend before scaling real provider usage.
