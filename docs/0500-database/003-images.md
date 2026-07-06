# Images

| Field | Value |
|---|---|
| Unique ID | DB-IMAGES-001 |
| Version | 1.2.0 |
| Status | Active |
| Owner | Media Data Owner |
| Dependencies | DB-USERS-001, DB-MEDIA-ASSETS-001, DB-PROMPTS-001, DB-CREDITS-001 |
| Referenced By | DB-VIDEOS-001, DB-CHARACTERS-001, DB-MEDIA-ASSETS-001 |
| Cross References | PB-010, AI-INDEX-001, DB-MEDIA-ASSETS-001 |

## Purpose

Represent generated, uploaded, edited, or imported image artifacts used in video production.

## Requirements

- Track ownership, source, generation context, storage reference, moderation state, and lifecycle.
- Support images as standalone assets or inputs to videos, characters, templates, and prompts.
- Preserve provenance for AI-generated media.

## Relationships

- Created by users or automations.
- May originate from prompts, media assets, characters, or external imports.
- May be used by videos, media assets, thumbnails, storyboards, or brand systems.

## Fields

- Image ID.
- Owner user or workspace reference.
- Project reference.
- Media asset reference.
- Generation job reference.
- Character reference.
- Prompt reference.
- Source type.
- Storage reference.
- Thumbnail reference.
- Dimensions and format metadata.
- Generation model metadata.
- Moderation status.
- Rights or license status.
- Visibility status.
- Created timestamp.
- Updated timestamp.
- Deleted timestamp.

## Indexes

- Owner reference plus created timestamp.
- Media asset reference.
- Prompt reference.
- Moderation status.
- Source type.

## Lifecycle

Images may be uploaded, generated, transformed, approved, used in videos, archived, deleted, or retained as provenance records.

## Permissions

Users can access images they own or that belong to their workspace. Shared project images follow project permissions. Moderated or restricted images require policy-aware access.

## Retention

Retain while referenced by projects, videos, characters, or audit requirements. Deletion may remove user-facing access while retaining minimal provenance when required.

## Future Expansion

Support image versioning, variants, embeddings, visual similarity search, rights metadata, and source attribution.

## Acceptance Criteria

- Image provenance and ownership are clear.
- Generated and uploaded images can be governed consistently.

## Current Implementation

`ADR-004` adds local image records for completed image generation jobs. Sprint 2 records owner, project, media asset, generation job, character, prompt, source type, moderation status, rights status, and timestamps.

## Future Plan

Define exact storage, transformation, and moderation architecture after AI and media pipelines are specified.

## AI Context

Do not treat images as only files. They are production artifacts with provenance, rights, moderation, and relationship context.
