# Generation Jobs

| Field | Value |
|---|---|
| Unique ID | DB-GENERATION-JOBS-001 |
| Version | 1.2.0 |
| Status | Active |
| Owner | AI Platform Data Owner |
| Dependencies | DB-USERS-001, DB-CREDITS-001, DB-MEDIA-ASSETS-001, DB-CHARACTERS-001 |
| Referenced By | DB-BIBLE-001, ADR-004 |
| Cross References | API-GEN-IMAGE-001, API-GEN-VIDEO-001, BE-ARCH-QUEUE-001, DB-IMAGES-001, DB-VIDEOS-001 |

## Purpose

Represent durable asynchronous generation work for image and video outputs.

## Owner

AI Platform Data Owner.

## Relationships

- Belongs to a user.
- May belong to a project.
- May reference a source media asset.
- May reference a character.
- Consumes a credit transaction.
- May produce a result media asset, image record, or video record.

## Fields

- Generation job ID.
- User reference.
- Media type.
- Status.
- Project reference.
- Prompt.
- Provider.
- Model.
- Aspect ratio.
- Resolution.
- Duration seconds.
- Source asset reference.
- Character reference.
- Result asset reference.
- Credit transaction reference.
- Cost credits.
- Estimated provider cost.
- Progress.
- Safety status.
- Error code and message.
- Created, updated, and completed timestamps.

## Indexes

- User reference plus created timestamp.
- Project reference.
- Character reference.
- Status.
- Media type.
- Provider plus model.
- Result asset reference.

## Lifecycle

Jobs are queued, started, completed, failed, restricted, or canceled. Completion creates durable media asset and image or video records.

## Permissions

Users can inspect their own jobs. Admin and worker access must be permissioned, audited, and limited by job type.

## Retention

Retain generation jobs for billing reconciliation, provenance, support, audit, and product history.

## Future Expansion

Support retry counts, idempotency keys, provider references, queue priority, worker lease data, model metadata, refunds, and webhook delivery.

## Current Implementation

Sprint 2 records provider, model, project, resolution, estimated cost, character, source asset, result asset, duration, and prompt search context for the first reusable asset workflow.

MVP Backend Loop adds Supabase-compatible generation job persistence in `src/supabase/mvp-schema.sql`. Fake Worker completion updates jobs to `completed`, links `result_asset_id`, and keeps history queryable by user through RLS.

## Acceptance Criteria

- Generation jobs consume credits before queueing.
- Completed jobs link to generated media assets.
- Users can list only their own generation history.

## AI Context

Generation jobs are the durable bridge between user intent, credits, workers, and stored media. Do not model expensive AI generation as synchronous UI state.
