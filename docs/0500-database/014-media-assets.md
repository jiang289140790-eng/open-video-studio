# Media Assets

| Field | Value |
|---|---|
| Unique ID | DB-MEDIA-ASSETS-001 |
| Version | 1.3.0 |
| Status | Active |
| Owner | Media Platform Data Owner |
| Dependencies | PB-008, PB-010, DB-USERS-001 |
| Referenced By | DB-IMAGES-001, DB-VIDEOS-001, DB-CHARACTERS-001 |
| Cross References | PB-008, PB-015, DB-IMAGES-001, DB-VIDEOS-001 |

## Purpose

Represent reusable media and production assets, including uploaded files, generated media, references, audio, footage, thumbnails, templates, and brand materials.

## Requirements

- Track ownership, storage, media type, provenance, rights, processing status, and relationships to production objects.
- Support asset libraries, project assets, brand systems, and AI workflows.
- Separate asset metadata from raw binary storage.

## Relationships

- Owned by user or workspace.
- May reference images, videos, prompts, characters, settings, analytics events, and audit logs.
- May become inputs to video timelines, generations, exports, templates, and automations.

## Fields

- Media asset ID.
- Owner user or workspace reference.
- Project reference.
- Character reference.
- Generation job reference.
- Asset type.
- Source type.
- Storage reference.
- Preview or thumbnail reference.
- Filename or display name.
- Tags.
- Metadata reference.
- Favorite flag.
- Processing status.
- Rights or license status.
- Moderation status.
- Visibility status.
- Created timestamp.
- Updated timestamp.
- Archived or deleted timestamp.

## Indexes

- Owner reference plus updated timestamp.
- Project reference.
- Character reference.
- Generation job reference.
- Asset type.
- Processing status.
- Rights or license status.
- Moderation status.
- Visibility status.
- Favorite flag.

## Lifecycle

Assets may be uploaded, imported, generated, processed, linked to projects, reused, transformed, archived, deleted, or retained for provenance.

## Permissions

Access follows owner, workspace, project, and asset visibility permissions. Rights-restricted assets require additional policy checks.

## Retention

Retain assets while referenced by active projects, videos, templates, or audit requirements. Large assets may move across storage tiers based on lifecycle state.

## Future Expansion

Support asset versions, folders, tags, search embeddings, rights management, deduplication, storage tiers, external library sync, and brand asset governance.

## Acceptance Criteria

- Media assets can serve as reusable production primitives.
- Storage, rights, processing, and ownership metadata are separated from raw files.
- Generated MVP outputs are addressable by storage key, generation job, owner, and visibility state.

## Current Implementation

`ADR-002` adds local filesystem-backed media asset persistence for development and tests. `ADR-004` extends media assets into the generation workflow so generated image and video outputs are stored as media assets before gallery review and sharing.

Sprint 2 records project, character, generation job, tags, favorite state, visibility, moderation, and processing status directly on media assets so generated outputs can become reusable library assets.

MVP Backend Loop stores Fake Worker outputs in Supabase Storage and records each generated output as a `media_assets` row. Gallery, history, and share APIs read from these real asset records instead of static demo data.

## Future Plan

Define storage architecture, processing pipeline, and asset library UX before implementation.

## AI Context

Media assets are more than files. Treat them as governed production objects with ownership, provenance, rights, and lifecycle.
