# AI Jobs

| Field | Value |
|---|---|
| Unique ID | DB-AI-JOBS-001 |
| Version | 1.0.0 |
| Status | Active |
| Owner | AI Platform Data Owner |
| Dependencies | DB-USERS-001, DB-GENERATION-JOBS-001 |
| Referenced By | DB-BIBLE-001, ADR-005, AI-JOBS-001 |
| Cross References | AI-PROVIDER-001, AI-JOBS-001, DB-AI-COST-RECORDS-001 |

## Purpose

Represent provider-level AI work items independent from product-facing generation jobs.

## Owner

AI Platform Data Owner.

## Relationships

- Belongs to a user.
- May reference a product generation job.
- Produces cost records.
- Is executed by an AI worker through a provider adapter.

## Fields

- AI job ID.
- User reference.
- Generation job reference.
- Provider.
- Model.
- Operation.
- Status.
- Input JSON.
- Output JSON.
- Error code and message.
- Attempts and maximum attempts.
- Fallback provider.
- Credits.
- Estimated cost.
- Duration.
- Resolution.
- Created, updated, started, completed, and cancelled timestamps.

## Indexes

- User reference plus created timestamp.
- Status.
- Provider plus model.
- Generation job reference.

## Lifecycle

AI jobs move through pending, queued, running, completed, failed, cancelled, or retrying states.

## Permissions

Users may inspect their own AI jobs through product APIs. Workers and admins require scoped permissions and auditability.

## Retention

Retain for provenance, billing, support, cost reconciliation, and model quality analysis.

## Future Expansion

Add provider job IDs, leases, priority, queue partition, idempotency keys, cancellation propagation, webhook references, and safety artifacts.

## Acceptance Criteria

- Provider-level AI execution can be tracked independently from product-facing generation history.
- AI job status, provider, model, operation, and attempts are durable.
- Failed and retrying jobs preserve enough context for worker recovery.

## Future Plan

Add production queue leases, provider job references, cancellation propagation, idempotency, fallback routing, and worker ownership metadata.

## AI Context

AI jobs are provider-level execution records. Keep them separate from user-facing generation history when possible.
