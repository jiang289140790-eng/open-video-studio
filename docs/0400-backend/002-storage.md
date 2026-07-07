# Storage Backend Architecture

| Field | Value |
|---|---|
| Unique ID | BE-ARCH-STORAGE-001 |
| Version | 1.4.0 |
| Status | Active |
| Owner | Backend Lead / Media Platform Lead |
| Dependencies | DB-MEDIA-ASSETS-001, DB-IMAGES-001, DB-VIDEOS-001, SEC-INDEX-001 |
| Referenced By | BE-ARCH-BIBLE-001, BE-ARCH-IMAGE-PROCESSING-001, BE-ARCH-VIDEO-PROCESSING-001 |
| Cross References | DB-MEDIA-ASSETS-001, DB-IMAGES-001, DB-VIDEOS-001, DEVOPS-INDEX-001 |

## Purpose

Define backend architecture for storing, retrieving, securing, and lifecycle-managing media and metadata-backed files.

## Requirements

- Separate binary storage from database metadata.
- Preserve ownership, rights, processing state, and retention controls.
- Support large AI media assets and future storage tiers.

## Architecture

Storage should use object storage or equivalent durable media storage for binary assets, with database records holding metadata, permissions, provenance, and lifecycle state. Access should be mediated through backend authorization and time-limited access patterns where appropriate.

Phase 1 implements a local filesystem storage adapter plus media asset metadata records. This validates storage boundaries locally and is not a production media storage decision.

`ADR-005` adds an AI-specific storage adapter interface with local implementation and future placeholders for Cloudflare R2, S3, and Supabase Storage. The production target is now Supabase Storage, configured through `SUPABASE_STORAGE_BUCKET` and verified by `npm run verify:supabase`.

MVP Backend Loop adds Supabase Storage output-path support through `SupabaseMvpBackendLoop.completeFakeWorkerJob`. The Fake Worker writes simulated JSON output to the configured Supabase Storage bucket under `userId/assetId/fileName`, then stores metadata in `media_assets`.

## Responsibilities

- Store uploads, generated images, generated videos, thumbnails, previews, exports, and references.
- Generate safe upload and download flows.
- Track processing, moderation, and rights state through database records.
- Support archival, deletion, and retention workflows.

## Dependencies

Depends on media asset records, image records, video records, authorization, security policy, storage provider, processing workers, and audit logs.

## Failure Recovery

Failed uploads should be resumable or cleanly abandoned. Missing binaries and orphan metadata must be detected. Processing failures should preserve source files where possible for retry.

## Scalability

Storage must support high-volume uploads, generated media, thumbnails, previews, and exports. Large objects should avoid passing through API servers when direct-to-storage flows are safer and more efficient.

## Acceptance Criteria

- Media binaries and metadata have clear separation.
- Access to stored media is permissioned.
- Storage lifecycle can support archive, delete, and retention policies.
- Generated MVP outputs have a durable storage key and asset metadata record.

## Future Plan

Define storage provider, upload strategy, CDN strategy, lifecycle tiers, encryption policy, and media deduplication.

## AI Context

Do not store media as database blobs. Treat media as governed objects with metadata, permissions, provenance, and lifecycle.
