# Gallery API

| Field | Value |
|---|---|
| ID | API-GALLERY-001 |
| Unique ID | API-GALLERY-001 |
| Version | 1.2.0 |
| Status | Active |
| Owner | Media Platform Lead / API Platform Lead |
| Dependencies | API-AUTH-001, DB-MEDIA-ASSETS-001, DB-IMAGES-001, DB-VIDEOS-001 |
| Referenced By | API-GEN-IMAGE-001, API-GEN-VIDEO-001 |
| Cross References | DB-MEDIA-ASSETS-001, DB-IMAGES-001, DB-VIDEOS-001, PB-008 |

## Purpose

Define the API surface for browsing, filtering, retrieving, organizing, and managing media gallery items.

## Requirements

- Return only assets the caller is allowed to access.
- Support consistent browsing across images, videos, and media assets.
- Respect moderation, rights, lifecycle, and processing state.

## Business Logic

The gallery exposes user and workspace media assets such as images, videos, generated outputs, uploads, references, and thumbnails. It must respect ownership, project scope, visibility, rights, moderation, and lifecycle state.

## Authentication

Requires authenticated user or authorized service account.

## Permissions

Caller can access assets they own or that are shared through workspace, project, review, or admin permissions. Restricted assets require policy checks.

## Request

Conceptual request inputs may include workspace reference, project reference, asset type, source type, search query, tags, status filters, pagination cursor, sort order, and visibility filters.

## Response

Responses may include paginated gallery items, media asset references, thumbnails, metadata summaries, ownership context, rights status, processing state, and next cursor.

## Error Codes

- `GALLERY_FORBIDDEN`
- `GALLERY_INVALID_FILTER`
- `GALLERY_ASSET_NOT_FOUND`
- `GALLERY_CURSOR_INVALID`
- `GALLERY_RATE_LIMITED`

## Rate Limit

Read limits should protect search, filtering, and metadata-heavy requests. Asset download or preview generation may have separate limits.

## Dependencies

Depends on media asset records, image records, video records, storage metadata, permissions, processing status, and search/indexing services.

## Future Expansion

Support folders, tags, collections, semantic search, visual similarity, bulk actions, brand libraries, external storage sync, and asset sharing links.

## Acceptance Criteria

- Gallery responses never expose inaccessible or restricted assets.
- Asset browsing remains consistent across images, videos, and media assets.

## Current Implementation

Sprint 2 adds MVP HTTP routes for assets, gallery filtering, review, favorites, archive, share links, and public share resolution:

- `POST /assets`.
- `GET /assets`.
- `POST /assets/review`.
- `POST /assets/favorite`.
- `POST /assets/archive`.
- `POST /assets/share`.
- `GET /share?token={shareToken}`.

Current filters support project, character, asset type, source type, visibility, processing state, moderation state, favorite state, query, and tags.

Public sharing still needs production signed URL, revocation, abuse, and analytics controls before launch.

## Future Plan

Create exact pagination, filtering, and search contracts before implementation.

## AI Context

Gallery is an access-controlled media surface, not just a file listing. Respect permissions, rights, lifecycle, and moderation state.
