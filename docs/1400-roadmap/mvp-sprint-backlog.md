# MVP Sprint Backlog

| Field | Value |
|---|---|
| Unique ID | ROADMAP-MVP-SPRINTS-001 |
| Version | 1.5.0 |
| Status | Active |
| Owner | Product / Engineering |
| Dependencies | PB-010, PAGE-GENERATE-001, API-BIBLE-001, DB-BIBLE-001, ADR-004, ADR-005, REVIEW-MVP-PRODUCT-001 |
| Referenced By | DOC-002, CHANGELOG-001 |

## Purpose

Define the four-sprint MVP delivery backlog. Architecture expansion is frozen; the goal is to ship a usable product quickly.

## MVP Scope

- User Authentication.
- Character Management.
- Image Generation.
- Video Generation.
- Asset Library / Gallery.
- Credits.
- Payments.
- Share.
- User Profile.
- Admin.

## Sprint 1: API Foundation, Auth, Profile, Credits

Status: Completed.

### MVP-S1-001 Minimal API Server

- Priority: P0.
- Status: Completed.
- Estimated Time: 0.5 day.
- Dependencies: API-AUTH-001, ADR-002.
- Acceptance Criteria: local HTTP API can respond to health, JSON requests, errors, and authenticated requests.
- Related Documents: API-BIBLE-001, BE-ARCH-BIBLE-001.

### MVP-S1-002 Authentication API

- Priority: P0.
- Status: Completed.
- Estimated Time: 0.5 day.
- Dependencies: MVP-S1-001, API-AUTH-001.
- Acceptance Criteria: signup, login, and current user endpoints work with bearer token auth.
- Related Documents: API-AUTH-001, DB-USERS-001.

### MVP-S1-003 User Profile API

- Priority: P0.
- Status: Completed.
- Estimated Time: 0.5 day.
- Dependencies: MVP-S1-002.
- Acceptance Criteria: authenticated user can read and update profile fields.
- Related Documents: PAGE-PROFILE-001, DB-USERS-001.

### MVP-S1-004 Credits And Local Purchase API

- Priority: P0.
- Status: Completed.
- Estimated Time: 0.5 day.
- Dependencies: MVP-S1-002, API-CREDITS-001, API-PAYMENT-001.
- Acceptance Criteria: authenticated user can read balance/history and complete a local test credit purchase.
- Related Documents: DB-CREDITS-001, DB-ORDERS-001.

## Sprint 2: Characters, Assets, Gallery, Share

Status: Completed.

### MVP-S2-001 Character API

- Priority: P0.
- Status: Completed.
- Estimated Time: 1 day.
- Dependencies: Sprint 1, API-CHARACTER-001.
- Acceptance Criteria: create, edit, list, and retrieve characters with profile, cover, tags, memory, status, and consistency fields.
- Related Documents: DB-CHARACTERS-001.

### MVP-S2-002 Asset Upload And Gallery API

- Priority: P0.
- Status: Completed.
- Estimated Time: 1 day.
- Dependencies: Sprint 1, API-GALLERY-001.
- Acceptance Criteria: create local asset records, list/search/filter gallery assets, favorite assets, archive assets, and preserve project, character, and generation job relationships.
- Related Documents: DB-MEDIA-ASSETS-001.

### MVP-S2-003 Share API

- Priority: P1.
- Status: Completed.
- Estimated Time: 0.5 day.
- Dependencies: MVP-S2-002.
- Acceptance Criteria: approved asset can be shared and public share can be resolved.
- Related Documents: DB-SHARE-LINKS-001.

### MVP-S2-004 Local Stub Image And Video Generation API

- Priority: P0.
- Status: Completed.
- Estimated Time: 1 day.
- Dependencies: MVP-S2-001, MVP-S2-002, API-GEN-IMAGE-001, API-GEN-VIDEO-001.
- Acceptance Criteria: authenticated user can generate local-stub image and video assets with credits consumed, provider/model metadata recorded, and durable media assets created.
- Related Documents: DB-GENERATION-JOBS-001, DB-IMAGES-001, DB-VIDEOS-001.

### MVP-S2-005 Generation History Search API

- Priority: P0.
- Status: Completed.
- Estimated Time: 0.5 day.
- Dependencies: MVP-S2-004.
- Acceptance Criteria: authenticated user can search generation history by character, provider, model, media type, status, prompt, and project.
- Related Documents: DB-GENERATION-JOBS-001.

## Sprint 3: Browser Product Activation

Product basis: `REVIEW-MVP-PRODUCT-001`.

### MVP-S3-BE-001 MVP Backend Loop

- Priority: P0.
- Status: Completed.
- Estimated Time: 1 day.
- Dependencies: Sprint 1, Sprint 2, API-AUTH-001, API-CREDITS-001, API-GEN-IMAGE-001, API-GEN-VIDEO-001, API-GALLERY-001, DB-USERS-001, DB-CREDITS-001, DB-GENERATION-JOBS-001, DB-MEDIA-ASSETS-001, DB-SHARE-LINKS-001.
- Acceptance Criteria: Supabase Auth integration exists, signup grants starter credits, generation jobs consume credits, Fake Worker writes output metadata to Supabase Storage, generated outputs become assets, gallery/history read real records, share links resolve public assets, and tests/build pass.
- Related Documents: BE-ARCH-AUTH-001, BE-ARCH-STORAGE-001, DB-USERS-001, DB-CREDITS-001, DB-GENERATION-JOBS-001, DB-MEDIA-ASSETS-001, DB-SHARE-LINKS-001, API-AUTH-001, API-GALLERY-001.

### MVP-S3-000 Product Surface Direction Correction

- Priority: P0.
- Status: Completed.
- Estimated Time: 1 day.
- Dependencies: REVIEW-MVP-PRODUCT-001, PAGE-HOME-001, PAGE-GALLERY-001, PAGE-GENERATE-001, PAGE-PRICING-001.
- Acceptance Criteria: MVP frontend moves from internal workflow style to a premium AI creation platform surface with expanded navigation, visual-first homepage, gallery-first Explore, Generate Studio, Characters, Assets, Dashboard, History, Account, Pricing, and Share pages.
- Related Documents: FE-BIBLE-001, DS-001, DS-003, DS-004.

### MVP-S3-001 Auth UI And Session State

- Priority: P0.
- Estimated Time: 1 day.
- Dependencies: Sprint 1, API-AUTH-001, PAGE-AUTH-001.
- Acceptance Criteria: user can sign up, sign in, see authenticated header state, and access protected product pages with a persisted local MVP session.
- Related Documents: API-AUTH-001, PAGE-AUTH-001, DB-USERS-001.

### MVP-S3-002 Connected Generate Flow

- Priority: P0.
- Estimated Time: 1.5 days.
- Dependencies: MVP-S3-001, Sprint 2, API-GEN-IMAGE-001, API-GEN-VIDEO-001.
- Acceptance Criteria: Generate page submits to the MVP API, creates real image/video generation jobs, consumes credits, shows loading/success/failure states, and links completed results to Gallery and History.
- Related Documents: PAGE-GENERATE-001, API-GEN-IMAGE-001, API-GEN-VIDEO-001, DB-GENERATION-JOBS-001.

### MVP-S3-003 Character Management UI

- Priority: P0.
- Estimated Time: 1 day.
- Dependencies: MVP-S3-001, API-CHARACTER-001.
- Acceptance Criteria: user can create, edit, list, and select a character with cover/reference asset, tags, memory, and consistency status.
- Related Documents: API-CHARACTER-001, DB-CHARACTERS-001, PAGE-GENERATE-001.

### MVP-S3-004 Connected Asset Library

- Priority: P0.
- Estimated Time: 1 day.
- Dependencies: MVP-S3-002, API-GALLERY-001.
- Acceptance Criteria: Gallery loads authenticated user assets from the API, supports search/filter/favorites/recent/status/visibility, and displays loading, empty, and error states.
- Related Documents: PAGE-GALLERY-001, API-GALLERY-001, DB-MEDIA-ASSETS-001.

### MVP-S3-005 Share And Public Asset Page

- Priority: P0.
- Estimated Time: 0.75 day.
- Dependencies: MVP-S3-004, API-GALLERY-001.
- Acceptance Criteria: user can approve/share an asset from Gallery, open a public share page, and see unavailable-share fallback state.
- Related Documents: API-GALLERY-001, DB-SHARE-LINKS-001, GROWTH-SEO-001.

### MVP-S3-006 Credits Balance And Purchase Entry

- Priority: P0.
- Estimated Time: 0.75 day.
- Dependencies: MVP-S3-001, API-CREDITS-001, API-PAYMENT-001.
- Acceptance Criteria: user sees credit balance, low-credit warning, local MVP purchase action, and updated balance after purchase.
- Related Documents: API-CREDITS-001, API-PAYMENT-001, DB-CREDITS-001, DB-ORDERS-001.

### MVP-S3-007 Dashboard And Generation History

- Priority: P1.
- Estimated Time: 1 day.
- Dependencies: MVP-S3-002, MVP-S3-004.
- Acceptance Criteria: user has a post-login dashboard showing recent jobs, recent assets, credits, and next action; generation history filters by status, provider, model, character, and prompt.
- Related Documents: PAGE-DASHBOARD-001, DB-GENERATION-JOBS-001.

### MVP-S3-008 Mobile UX Repair

- Priority: P1.
- Estimated Time: 0.5 day.
- Dependencies: MVP-S3-002, MVP-S3-004.
- Acceptance Criteria: Generate page has no horizontal overflow at 390px width, core CTA remains reachable, and forms/cards fit without overlap.
- Related Documents: DS-011, PAGE-GENERATE-001.

### MVP-S3-009 Product Analytics Events

- Priority: P1.
- Estimated Time: 0.5 day.
- Dependencies: MVP-S3-001 through MVP-S3-006.
- Acceptance Criteria: local/dev-safe events exist for signup, generation submit/complete, asset share, credit purchase, and pricing CTA click.
- Related Documents: ANALYTICS-INDEX-001, PAGE-GENERATE-001, PAGE-PRICING-001.

## Sprint 4: Admin And MVP Integration

### MVP-S4-001 Admin Read APIs

- Priority: P1.
- Estimated Time: 1 day.
- Dependencies: Sprint 1, Sprint 2, Sprint 3.
- Acceptance Criteria: admin can inspect users, jobs, providers, costs, and audit basics.
- Related Documents: API-ADMIN-001, DB-AUDIT-LOGS-001.

### MVP-S4-002 Frontend API Wiring

- Priority: P0.
- Estimated Time: 2 days.
- Dependencies: Sprint 1, Sprint 2, Sprint 3.
- Acceptance Criteria: MVP frontend can use auth, profile, credits, characters, gallery, generation, share, and local purchase APIs.
- Related Documents: FE-BIBLE-001.

### MVP-S4-003 MVP Smoke Test

- Priority: P0.
- Estimated Time: 0.5 day.
- Dependencies: MVP-S4-002.
- Acceptance Criteria: one user can register, purchase credits, create character, generate image/video, store, review, share, and view profile/admin basics.
- Related Documents: ADR-004, ADR-005.

## Acceptance Criteria

- MVP work is limited to the approved 10 product areas.
- Platform and enterprise expansion are deferred.
- Sprint 1 and Sprint 2 are completed.
- MVP Backend Loop is completed without adding payment or real AI provider execution.

## Future Plan

Move Phase 2 and Phase 3 concepts out of MVP execution until the MVP is usable.

## AI Context

Use this backlog for delivery sequencing. Do not use it to add new architecture layers.
