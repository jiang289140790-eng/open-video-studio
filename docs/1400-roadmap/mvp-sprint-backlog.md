# MVP Sprint Backlog

| Field | Value |
|---|---|
| Unique ID | ROADMAP-MVP-SPRINTS-001 |
| Version | 1.19.0 |
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
- Status: In Progress.
- Estimated Time: 1 day.
- Dependencies: Sprint 1, API-AUTH-001, PAGE-AUTH-001.
- Acceptance Criteria: user can sign up/sign in with email or social OAuth entry points, see authenticated header state, and access protected product pages with a persisted local MVP session.
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
- Status: Completed.
- Estimated Time: 0.75 day.
- Dependencies: MVP-S3-001, API-CREDITS-001, API-PAYMENT-001.
- Acceptance Criteria: user sees credit balance, low-credit warning, local MVP purchase action, Stripe/PayPal checkout entry points, safe demo fallback while provider accounts are unconfigured, and updated balance after demo purchase.
- Related Documents: API-CREDITS-001, API-PAYMENT-001, DB-CREDITS-001, DB-ORDERS-001.

### MVP-S3-007 Dashboard And Generation History

- Priority: P1.
- Status: In Progress.
- Estimated Time: 1 day.
- Dependencies: MVP-S3-002, MVP-S3-004.
- Acceptance Criteria: user has a post-login dashboard showing recent jobs, recent assets, credits, and next action; generation history filters by status, provider, model, character, and prompt; remote tasks can be refreshed/cancelled; failed tasks show reason/refund state; completed outputs can be opened, shared, and downloaded.
- Related Documents: PAGE-DASHBOARD-001, DB-GENERATION-JOBS-001.

### MVP-S3-008 Mobile UX Repair

- Priority: P1.
- Status: Completed.
- Estimated Time: 0.5 day.
- Dependencies: MVP-S3-002, MVP-S3-004.
- Acceptance Criteria: Homepage, Gallery, Generate, Image to Video, Characters, Assets, History, Dashboard, Pricing, Free Coins, Sign In, Admin, and Share surfaces avoid horizontal overflow at 375px, 390px, 412px, and 768px widths; core CTAs remain reachable; checkout modal scrolls within the viewport; navigation labels wrap safely; dashboard rows and studio panels shrink correctly.
- Related Documents: DS-011, PAGE-GENERATE-001.

### MVP-S3-009 Product Analytics Events

- Priority: P1.
- Estimated Time: 0.5 day.
- Dependencies: MVP-S3-001 through MVP-S3-006.
- Acceptance Criteria: local/dev-safe events exist for signup, generation submit/complete, asset share, credit purchase, and pricing CTA click.
- Related Documents: ANALYTICS-INDEX-001, PAGE-GENERATE-001, PAGE-PRICING-001.

### MVP-S3-010 Technical SEO And Localized Route Surface

- Priority: P1.
- Status: Completed.
- Estimated Time: 0.5 day.
- Dependencies: MVP-S3-000, GROWTH-SEO-001, SEO-INDEX-001.
- Acceptance Criteria: public pages have canonical, hreflang, robots, Open Graph, and Twitter metadata; sitemap includes `zh-CN`, `en`, `ja`, `ko`, and `x-default` alternates; robots blocks private app routes; localized alias pages exist for indexed public routes; SEO generation is repeatable through `npm run seo:apply`.
- Related Documents: SEO-INDEX-001, GROWTH-SEO-001, PAGE-HOME-001, PAGE-GALLERY-001, PAGE-GENERATE-001, PAGE-PRICING-001.

### MVP-S3-011 Video Workflow Surface Consolidation

- Priority: P0.
- Status: Completed.
- Estimated Time: 0.5 day.
- Dependencies: MVP-S3-002, MVP-S3-004, PAGE-GENERATE-001, API-GEN-VIDEO-001.
- Acceptance Criteria: Video Tools explains distinct image-to-video, product teaser, and social reel workflows; each workflow shows model, ratio, duration, credit, and time expectations; each workflow routes to the Image to Video Studio with a preset; the generator applies preset-specific prompt, aspect ratio, duration, model preference, credit estimate, preview copy, mobile CTA, and generation payload while preserving the existing backend path.
- Related Documents: PAGE-GENERATE-001, API-GEN-VIDEO-001, DB-GENERATION-JOBS-001, DB-MEDIA-ASSETS-001, DS-011.

### MVP-S3-012 Image-to-Video Input And Output Loop

- Priority: P0.
- Status: Completed.
- Estimated Time: 0.5 day.
- Dependencies: MVP-S3-011, MVP-S3-002, BE-ARCH-STORAGE-001, API-GEN-VIDEO-001, DB-MEDIA-ASSETS-001.
- Acceptance Criteria: user can upload a reference image, choose an existing image asset without leaving the generator, use a demo reference, submit a generation with `sourceAssetId` / `sourceImageUrl` when available, see queued/running/retrying/failed/completed task progress, save Fake Worker fallback output to assets/history, open the Asset Library, download output metadata, and continue to share/reuse the result.
- Related Documents: PAGE-GENERATE-001, API-GEN-VIDEO-001, DB-GENERATION-JOBS-001, DB-MEDIA-ASSETS-001, BE-ARCH-STORAGE-001.

### MVP-S3-013 Generation Task And Share Download Loop

- Priority: P0.
- Status: Completed.
- Estimated Time: 0.5 day.
- Dependencies: MVP-S3-012, MVP-S3-005, MVP-S3-007, API-GEN-VIDEO-001, DB-GENERATION-JOBS-001, DB-MEDIA-ASSETS-001, DB-SHARE-LINKS-001.
- Acceptance Criteria: History supports search, status/type filters, all-job refresh, single-job refresh, cancellable remote jobs, visible failure reasons, refund messaging, progress bars, output links, share actions, and downloadable completed outputs; public Share pages resolve Supabase share tokens, show unavailable-link fallback states, display type/model/status metadata, and expose Storage-backed downloads when available.
- Related Documents: PAGE-GENERATE-001, PAGE-GALLERY-001, DB-GENERATION-JOBS-001, DB-MEDIA-ASSETS-001, DB-SHARE-LINKS-001, BE-ARCH-STORAGE-001.

### MVP-S3-014 Image-to-Video Preflight And Reference Guard

- Priority: P0.
- Status: Completed.
- Estimated Time: 0.25 day.
- Dependencies: MVP-S3-012, API-GEN-VIDEO-001, DB-MEDIA-ASSETS-001, BE-ARCH-STORAGE-001.
- Acceptance Criteria: before submitting an image-to-video job, the user can see the selected reference image, ratio, duration, provider/model, estimated time, output format, credit cost, and save destination; submitting without a reference image is blocked with a clear prompt to upload, choose from assets, or use a demo reference.
- Related Documents: PAGE-GENERATE-001, API-GEN-VIDEO-001, DB-MEDIA-ASSETS-001.

### MVP-S3-015 Generated Result Output Card

- Priority: P0.
- Status: Completed.
- Estimated Time: 0.25 day.
- Dependencies: MVP-S3-012, MVP-S3-013, DB-MEDIA-ASSETS-001, DB-SHARE-LINKS-001.
- Acceptance Criteria: completed generation results render as a player-style output card with saved-location copy, title, prompt, specification, provider/model, credits, status, download, share, regenerate, and continue-use actions; image outputs can be reused as the next image-to-video reference; video outputs can restart a similar video flow with the saved prompt.
- Related Documents: PAGE-GENERATE-001, PAGE-GALLERY-001, DB-MEDIA-ASSETS-001, DB-SHARE-LINKS-001.

### MVP-S3-016 Image-to-Video Reference Upload Controls

- Priority: P0.
- Status: Completed.
- Estimated Time: 0.25 day.
- Dependencies: MVP-S3-012, MVP-S3-014, BE-ARCH-STORAGE-001, DB-MEDIA-ASSETS-001.
- Acceptance Criteria: users can choose a reference image from gallery, capture from camera on mobile, replace the current reference, delete it, see file size/source metadata, and see local/uploading/ready/error upload states; failed Supabase uploads preserve local fallback generation instead of blocking the MVP loop.
- Related Documents: PAGE-GENERATE-001, BE-ARCH-STORAGE-001, DB-MEDIA-ASSETS-001.

### MVP-S3-017 Live Generation Task Card Actions

- Priority: P0.
- Status: Completed.
- Estimated Time: 0.25 day.
- Dependencies: MVP-S3-012, MVP-S3-013, MVP-S3-016, API-GEN-VIDEO-001, DB-GENERATION-JOBS-001.
- Acceptance Criteria: after submit, the Image-to-Video task card shows a visible task lifecycle, receives the remote job ID when Supabase creates a job, links to Generation Tasks, allows running remote jobs to refresh or cancel, keeps failed/retrying jobs connected to History, and exposes Assets, download, share, and regenerate actions when an output is available.
- Related Documents: PAGE-GENERATE-001, DB-GENERATION-JOBS-001, DB-MEDIA-ASSETS-001, DB-SHARE-LINKS-001.

### MVP-S3-018 Aspect-Ratio-Aware Video Preview

- Priority: P1.
- Status: Completed.
- Estimated Time: 0.25 day.
- Dependencies: MVP-S3-011, MVP-S3-015, MVP-S3-017, DS-011.
- Acceptance Criteria: Image-to-Video preview changes shape for 16:9, 9:16, and 1:1 output choices; completed generated-output cards preserve the selected aspect ratio; mobile vertical previews remain inspectable without horizontal overflow; local and remote asset/history mapping carries ratio and duration metadata where available.
- Related Documents: PAGE-GENERATE-001, DS-011, DB-GENERATION-JOBS-001, DB-MEDIA-ASSETS-001.

### MVP-S3-019 Auth Return Continuity

- Priority: P0.
- Status: Completed.
- Estimated Time: 0.25 day.
- Dependencies: MVP-S3-001, MVP-S3-011, MVP-S3-012, PAGE-AUTH-001.
- Acceptance Criteria: users who hit a login gate from a tool, generation submit, protected demo generation, or social/email login flow return to the intended same-origin product route after authentication; Image-to-Video preset/source query parameters are preserved; stale return targets are cleared after session restore; default header login still routes to Dashboard.
- Related Documents: PAGE-AUTH-001, PAGE-GENERATE-001, API-AUTH-001.

### MVP-S3-020 Image-to-Video Login Draft Restore

- Priority: P0.
- Status: Completed.
- Estimated Time: 0.25 day.
- Dependencies: MVP-S3-019, MVP-S3-014, MVP-S3-018, PAGE-AUTH-001.
- Acceptance Criteria: when an unauthenticated user has configured an Image-to-Video draft and then opens login, social OAuth, Telegram login, an unlock modal, or a real-generation auth gate, the current preset, prompt, ratio, duration, model, and safe reference metadata are stored locally; after returning from authentication the generator restores those choices; local blob/file references are never persisted and instead require re-upload; completed generations clear the temporary draft.
- Related Documents: PAGE-AUTH-001, PAGE-GENERATE-001, API-AUTH-001, DB-MEDIA-ASSETS-001.

### MVP-S3-021 Credit Ledger Visibility

- Priority: P0.
- Status: Completed.
- Estimated Time: 0.25 day.
- Dependencies: MVP-S3-013, MVP-S3-017, DB-CREDITS-001, API-CREDITS-001.
- Acceptance Criteria: Dashboard shows a recent credit ledger for purchases, rewards, generation debits, and refunds; History rows show job-linked credit impacts; remote Supabase sessions map current-user `credit_transactions` into the product surface; local MVP fallback actions record equivalent ledger entries so credit movement remains explainable before live provider/payment rollout.
- Related Documents: DB-CREDITS-001, PAGE-DASHBOARD-001, PAGE-HISTORY-001, API-CREDITS-001.

### MVP-S3-022 Generation Failure Recovery

- Priority: P0.
- Status: Completed.
- Estimated Time: 0.25 day.
- Dependencies: MVP-S3-013, MVP-S3-017, MVP-S3-020, MVP-S3-021, PAGE-GENERATE-001, PAGE-HISTORY-001.
- Acceptance Criteria: retrying a failed/cancelled job or generated asset preserves prompt, workflow type, preset, video ratio, duration, model, reference metadata, failure reason, and refund status; Generate/Image-to-Video restores that context with a visible recovery notice; History rows explain recoverable failed jobs; live task cards can expose a retry-job action after remote failure; recovery state expires and is cleared after use.
- Related Documents: PAGE-GENERATE-001, PAGE-HISTORY-001, DB-GENERATION-JOBS-001, DB-CREDITS-001.

### MVP-S3-023 Image-to-Video Asset Picker Usability

- Priority: P0.
- Status: Completed.
- Estimated Time: 0.25 day.
- Dependencies: MVP-S3-014, MVP-S3-016, MVP-S3-020, DB-MEDIA-ASSETS-001.
- Acceptance Criteria: the Image-to-Video reference asset picker supports search, favorite/public/recent image filters, visible asset source/status metadata, empty-result recovery actions, direct upload, demo-reference fallback, and a valid link to the full Asset Library without leaving users stuck in a modal dead end.
- Related Documents: PAGE-GENERATE-001, DB-MEDIA-ASSETS-001, BE-ARCH-STORAGE-001.

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
- MVP Backend Loop is completed with authenticated Supabase generation jobs, storage-backed assets, Gallery/History sync, failure/cancellation credit refunds, and server-side demo credit purchase records.
- Production backend smoke verification now passes for provider status, DeepSeek prompt enhancement, demo credit purchase, generation job creation, Fake Worker processing, Supabase Storage upload, and asset creation through the deployed `ai` Edge Function.
- Production refund smoke verification now passes for queued-job cancellation and confirms the consumed 8 credits are refunded.
- Qwen Vision is now included in production AI verification, but it currently fails with provider `Unauthenticated` until a valid Qwen Vision site API key is configured.
- Stripe and PayPal checkout creation are prewired through the server-side `ai` Edge Function, with browser-safe public configuration only. Real payment gateway fulfillment remains deferred until live provider accounts, Edge Function secrets, webhooks, PayPal capture, idempotency, refunds, tax, and reconciliation are configured. Current checkout can still create a non-charging demo order and grant credits for MVP operations testing.
- Admin Workflow Center can control eligible AI provider rollout without changing frontend generation code.
- Admin Workflow Center now shows live AI provider readiness and blocker reasons from the `ai` Edge Function, so operators can see Qwen Vision authorization failures before publishing or promoting workflows.
- OAuth remains a launch blocker until Supabase Auth Providers are enabled for Google, X/Twitter, and Discord and Telegram public login configuration is supplied.

## Future Plan

Move Phase 2 and Phase 3 concepts out of MVP execution until the MVP is usable.

## MVP Closure Plan From Product Review

The next execution phase should reduce surface complexity and complete one fully usable user loop before adding more tool categories.

### P0: Core Generation Loop

- Login or register.
- Upload or select an image asset.
- Select video preset, ratio, duration, and provider/model.
- Show expected credits, generation time, and output format before submission.
- Submit generation job.
- Show queue/running/completed/failed/cancelled states.
- Refund credits visibly when a charged job fails or is cancelled.
- Save successful output as a reusable asset.
- Preview, download, share, and reuse the output.

### P1: Workflow Differentiation

- Tool cards must either route to different workflows or pass distinct presets into one generator.
- Image-to-video, product teaser, and social reel should preserve different defaults for ratio, duration, prompt structure, credit estimate, and output intent.
- Rename user-facing concepts consistently: Asset Library, Generation Tasks, My Works, Daily Rewards, Credits.

### P1: Mobile Product Usability

- Mobile navigation should prioritize Logo, Credits, Account/Menu, and a sticky primary generation action.
- Tool filters should scroll horizontally and remain touch-safe.
- Upload should support gallery selection, camera capture, asset picker, replace, and remove flows.
- Video preview must respect vertical social formats and keep download/share controls reachable.

### P2: Commercial Readiness

- Add real provider health and fallback messaging where users submit jobs.
- Complete Stripe/PayPal live account configuration, webhook fulfillment, refund/reconciliation, and tax/invoice policy before paid traffic.
- Add content policy, privacy policy, terms, and moderation review gates before broad public sharing.

## AI Context

Use this backlog for delivery sequencing. Do not use it to add new architecture layers.
