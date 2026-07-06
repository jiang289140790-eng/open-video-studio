# Gallery

| Field | Value |
|---|---|
| Unique ID | PAGE-GALLERY-001 |
| Version | 1.1.0 |
| Status | Active |
| Owner | Frontend Lead / Media Product Lead |
| Dependencies | PB-008, PB-010, DS-007, DS-010, API-GALLERY-001, DB-MEDIA-ASSETS-001 |
| Referenced By | FE-BIBLE-001, DOC-002 |
| Cross References | API-GALLERY-001, DB-MEDIA-ASSETS-001, DB-IMAGES-001, DB-VIDEOS-001 |

## Purpose

Define the gallery page where users browse, search, filter, inspect, and manage media assets.

## Requirements

- Show only assets the user is allowed to access.
- Support images, videos, generated outputs, uploads, and future asset types.
- Preserve processing, rights, moderation, and lifecycle states.

## Layout

The page should use an application layout with filtering controls, a media grid or list, selection state, and an inspector or detail panel. Creative assets should be visually prominent while operational metadata remains scannable.

## Sections

- Page header with title, search, upload or create action.
- Filter and sort controls.
- Media grid or list.
- Empty state.
- Selection toolbar.
- Asset detail inspector.
- Processing and error states.

## Components

- App shell.
- Search input.
- Filter menu.
- Sort control.
- Asset card.
- Media preview.
- Selection toolbar.
- Inspector panel.
- Pagination or infinite-load control.
- Empty state.

## State Flow

- Load gallery assets from `API-GALLERY-001`.
- Apply filters, search, and sort.
- Select asset to inspect.
- Perform allowed actions such as open, rename, archive, delete, or use in generation.
- Handle loading, empty, processing, restricted, and error states.

## Navigation

Users can navigate to generate, video detail, asset detail, prompt library, dashboard, and project contexts. Deep links should preserve asset identity and workspace context.

## Responsive Rules

Desktop supports grid plus inspector. Tablet may collapse inspector into a side sheet. Mobile should prioritize browsing, preview, lightweight actions, and avoid dense multi-column management.

## SEO

Authenticated gallery is generally not indexable. Public gallery examples, if introduced later, require separate SEO specs and rights controls.

## Analytics Events

- `gallery_viewed`
- `gallery_search_submitted`
- `gallery_filter_applied`
- `gallery_asset_opened`
- `gallery_asset_action_clicked`
- `gallery_empty_state_viewed`

## Acceptance Criteria

- Users can find and inspect assets without losing context.
- Restricted or processing assets are clearly labeled.
- Page behavior references API and database documents instead of redefining backend rules.

## Current Implementation

`ADR-003` implements the first MVP gallery at `apps/web/gallery.html`. The current surface includes an application shell, search/filter controls, static media asset cards, visible processing and rights states, and navigation into Generate.

The implementation uses safe static examples until `API-GALLERY-001`, `DB-MEDIA-ASSETS-001`, authentication, permissions, and storage integration are wired.

## Future Plan

Add folders, tags, semantic search, bulk actions, and external storage integrations.

## AI Context

Treat gallery as an access-controlled media operations surface, not a simple image grid.
