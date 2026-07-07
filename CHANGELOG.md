# Changelog

| Field | Value |
|---|---|
| Unique ID | CHANGELOG-001 |
| Version | 0.22.0 |
| Status | Active |
| Owner | Engineering Operations |
| Dependencies | DOC-STD-001, TASK-DONE-STD-001 |
| Referenced By | OVSB-001, TASK-DONE-STD-001, REVIEW-ARCH-001 |

## Purpose

Record meaningful changes to the Open Video Studio workspace, documentation, architecture, and future product implementation.

## Requirements

- Update this file every time a task is completed.
- Use reverse chronological order.
- Include documentation changes, architecture changes, validation performed, and known follow-ups.
- Reference relevant document IDs, task IDs, and decision records.
- Do not use the changelog as the source of truth for requirements; link to the owning document instead.

## 2026-07-07

### Changed

- Replaced the account page social options with the requested four-provider set: Google, X, Telegram, and Discord.
- Removed GitHub and Apple login options from the frontend and Supabase OAuth provider type.
- Updated Supabase OAuth support to use Google, X/Twitter, and Discord; Telegram is wired through Telegram Login Widget configuration and requires a backend signed-hash callback.
- Added Telegram public configuration variables to environment templates and the GitHub Pages deployment workflow.
- Rebuilt the frontend static test file as clean UTF-8 and added coverage for the four required social login options.

### Validation

- Ran production build and full test suite after the social login provider update; 26 tests passed.

### Added

- Added `REVIEW-TARGET-FEATURE-MAP-001` to document the referenced tool site's page map, feature checklist, and Open Video Studio implementation mapping.
- Added pricing trust metrics, creator quotes, and example creation cards to strengthen the credit purchase flow.
- Added referral task cards, a My Creations empty-state creation prompt, and an Image to Video workflow explainer.

### Changed

- Expanded page modules to better match mature AI tool-site information architecture while keeping original Open Video Studio copy and safe AI creation categories.

### Validation

- Ran production build, full test suite, and Markdown link check after the module expansion; 26 tests passed.

### Changed

- Localized the primary MVP product surface to Chinese across Home, Generate, Gallery, Characters, Assets, Dashboard, History, Sign in, Share, Image to Video, Pricing, Referral, and My Creations pages.
- Tuned global typography, title scale, panel colors, controls, and tool-page styling toward the referenced black / charcoal / pink visual direction.
- Localized visible dynamic interaction messages for auth configuration, credit purchase, generation results, asset lists, history rows, and share prompts.
- Updated frontend static tests to enforce the Chinese product surface and localized CTA/navigation expectations.

### Validation

- Ran production build and full test suite after localization and typography changes; 26 tests passed.

### Added

- Added a global site footer module through `apps/web/app.js` so pages share the same footer navigation, tool links, contact details, and copyright block.
- Added the global footer to the homepage by loading the shared product script from `apps/web/index.html`.

### Changed

- Rebuilt Pricing, Free Credits / Referral, My Creations, and Image to Video pages toward the target tool-site structure with Chinese navigation, compact black / pink styling, action-focused cards, and reusable page sections.
- Updated frontend static tests to accept localized conversion CTAs while preserving route, auth, gallery, dashboard, and encoding checks.

### Validation

- Ran production build and full test suite after multi-page layout alignment; 26 tests passed.

### Changed

- Rebuilt `apps/web/app.html` into a target-style AI tool homepage with a fixed left navigation rail, compact top navigation, two large featured tool banners, quick tool cards, categorized horizontal tool rows, and footer link groups.
- Updated the product shell color direction toward the referenced black / charcoal / pink tool-site style while keeping Open Video Studio-safe AI creation categories.
- Updated frontend static encoding coverage to allow intentional UTF-8 Chinese interface text while still blocking mojibake markers.

### Validation

- Ran production build and full test suite after the tool homepage rebuild; 26 tests passed.

### Added

- Added target-style product application shell with a left tool rail, compact dark top navigation, referral and upgrade actions, and tool-first navigation across MVP product pages.
- Added real Supabase browser Auth integration for email signup, email signin, and OAuth redirects for Google, GitHub, Discord, and Apple using `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- Added frontend environment examples for browser-safe Supabase public configuration.
- Added GitHub Pages build environment wiring for browser Supabase Auth variables without committing credentials.

### Changed

- Replaced fake email/social auth redirects on `signin.html` with Supabase Auth calls and visible configuration/error states.
- Updated static frontend tests to prevent regression to local-only fake registration and to verify the target-style product shell hooks.

### Validation

- Ran production build and full test suite after auth/layout changes; 26 tests passed.

### Added

- Added target-site-style routes for Tools, Image to Video, Free Credits / Referral, and My Creations.
- Added local MVP browser-state interactions for social/email login, credit purchase, character creation, generation, asset listing, history listing, and public share pages.
- Added Vite build entries and frontend static coverage for the expanded product route set and core interaction hooks.

### Changed

- Updated homepage navigation toward mature AI SaaS acquisition paths: Tools, Buy Credits, Free Credits, My Creations, and Login.
- Updated Frontend Summary documentation to reflect the expanded route surface and local MVP interaction loop.

### Validation

- Ran production build and full test suite after route/function expansion; 26 tests passed.
- Browser-tested the local MVP flow: Google login, credit purchase, character creation, generation, assets, history, my creations, and share page.
- Checked Markdown links after documentation updates.

## 2026-07-06

### Added

- Added Supabase OAuth URL support for Google, GitHub, Discord, and Apple sign-in.
- Added social authentication options to the account page, with email fallback, starter-credit messaging, and credits/referral navigation.
- Added MVP Backend Loop Supabase adapter for Auth signup/login, profile sync, starter credits, generation jobs, Fake Worker completion, Supabase Storage output paths, asset records, gallery reads, history reads, and share links.
- Added Supabase MVP schema and RLS policy file at `src/supabase/mvp-schema.sql`.
- Added starter credits constant and automatic starter credit grant on signup.
- Added Supabase backend loop test covering signup, login, starter credits, generation, fake output storage, gallery, history, and sharing.
- Added GitHub Pages deployment workflow for the `production-mvp` branch using `npm ci`, `npm run build`, and `dist-web` artifact deployment.
- Initialized Git repository and committed the stable MVP baseline.
- Added React, Vite, and a production app shell while preserving the existing MVP product pages.
- Added Supabase environment loading, client creation, connection status checks, and verification script.
- Added `.env.example`, `.env.local.example`, MIT `LICENSE`, and production-safe Git ignore rules.
- Added Supabase configuration tests for environment loading, placeholder detection, and missing-config failure behavior.
- Added premium AI creation platform MVP surface across Home, Explore/Gallery, Generate Studio, Characters, Assets, Dashboard, History, Pricing, Sign in/Account, and Share pages.
- Added expanded product navigation for Explore, Generate, Characters, Assets, Pricing, Dashboard, History, Credits, and Account.
- Added static frontend tests for required pages, required navigation, conversion CTAs, gallery sections, dashboard sections, and premium AI SaaS positioning.
- Added `REVIEW-MVP-PRODUCT-001` MVP Product Review V1 after browser-based product review of the local MVP frontend.
- Added product-value Sprint 3 plan focused on auth UI, connected generation, character management, connected asset library, share page, credits purchase entry, dashboard/history, mobile repair, and product analytics.
- Added MVP Sprint 2 character, asset library, gallery, share, local stub generation, search, filters, and generation history API routes.
- Added reusable asset relationships so generated assets record owner, project, character, generation job, provider, model, credits, estimated cost, resolution, duration, and lifecycle state.
- Added character profile fields for cover asset, tags, memory, and consistency status.
- Added Sprint 2 API test covering create character, generate image, generate video, search assets, share asset, and review generation history.
- Added `ROADMAP-MVP-SPRINTS-001` MVP Sprint Backlog with Sprint 1 through Sprint 4 delivery tasks.
- Added MVP Sprint 1 local HTTP API server for health, signup, login, current user, profile update, credits, local credit purchase, and order listing.
- Added MVP API tests covering auth, profile, credits, local purchase, orders, and protected-route rejection.
- Added `REVIEW-PLATFORM-EVOLUTION-001` Platform Evolution Review V1 to reposition Open Video Studio as an AI Content Operating Platform.
- Added `ROADMAP-PLATFORM-V2-001` Platform Evolution Roadmap V2 with milestones, sprints, and task definitions.
- Added `ADR-007` Platform V2 Ownership Foundation.
- Added local schema and service-layer support for workspaces, workspace members, projects, and role-based project access.
- Added Database Bible documents for `DB-WORKSPACES-001`, `DB-PROJECTS-001`, and `DB-PERMISSIONS-001`.
- Added API Bible documents for `API-WORKSPACE-001` and `API-PROJECT-001`.
- Added Platform Foundation tests covering workspace creation, membership, project creation, read/write role checks, and non-member rejection.
- Added `REVIEW-PROVIDER-PLUGIN-001` Provider Plugin Architecture Review with architecture review, folder refactoring plan, dependency graph, provider/storage/queue/billing interfaces, migration plan, and risk analysis.
- Added proposed `ADR-006` Provider Plugin Architecture as an approval gate before package refactoring.
- Added `ADR-005` AI Engine Foundation for provider-independent AI orchestration without connecting to real models.
- Added unified AI provider interface, provider registry, local stub provider, and not-configured future provider adapters for OpenAI, Gemini, ComfyUI, Fal.ai, Replicate, RunPod, and Local API.
- Added local AI job queue, independent worker, AI cost tracker, and AI storage adapter abstraction.
- Added local schema support for `ai_jobs` and `ai_cost_records`.
- Added AI Bible documents for provider interface, job queue/workers, storage abstraction, and cost tracking.
- Added Database Bible documents for `DB-AI-JOBS-001` and `DB-AI-COST-RECORDS-001`.
- Added AI Engine tests for provider uniformity, queue execution, retry/cancel behavior, storage abstraction, and cost tracking.
- Added `ADR-004` Product Workflow Foundation for the register, purchase credits, generate, store, review, share, and history service-layer workflow.
- Added backend workflow services for billing credit purchases, character management, generation queue/history, and gallery review/sharing.
- Added local schema support for characters, generation jobs, images, videos, orders, and share links.
- Added Database Bible documents for `DB-GENERATION-JOBS-001` and `DB-SHARE-LINKS-001`.
- Added an end-to-end product workflow test covering one user from registration through purchase, generation, storage, review, sharing, and history.
- Added the first MVP frontend reconstruction in `apps/web/` with homepage, gallery, generate entry, and pricing preview static routes.
- Added `ADR-003` to record the MVP frontend reconstruction decision, route mapping, limitations, and future migration path.
- Added automated frontend static tests for route presence, shared assets, and commercial SaaS positioning.
- Added `REVIEW-LEGACY-001` legacy site migration review in `docs/reviews/legacy-site-migration-review.md`, covering reusable legacy ideas, rejected concepts, redesign/rebuild decisions, Product Bible conflicts, and MVP v1 frontend migration plan.
- Added Phase 1 implementation foundation with TypeScript backend core, SQLite local schema, authentication service, user repository, credits ledger, storage service, audit log, and automated tests.
- Added `ADR-002` to document the Phase 1 implementation foundation and its production limitations.
- Added `REVIEW-ARCH-001` architecture review report in `docs/reviews/architecture-review-v1.md`.
- Added the permanent Growth Bible in `docs/0900-growth/` with `GROWTH-BIBLE-001` and strategy documents for SEO, landing pages, blog system, Pinterest, Twitter, Instagram, TikTok, YouTube, Reddit, affiliate, email, referral, analytics, and North Star metrics.
- Added the permanent Backend Architecture Bible in `docs/0400-backend/` with `BE-ARCH-BIBLE-001` and architecture documents for authentication, storage, queue, GPU jobs, image processing, video processing, billing, notification, logging, monitoring, and security.
- Added the permanent Frontend Bible in `docs/0300-frontend/` with `FE-BIBLE-001` and page specifications for homepage, gallery, generate, prompt library, pricing, dashboard, profile, admin, settings, and authentication.
- Added the permanent API Bible in `docs/0600-api/` with `API-BIBLE-001` and API specifications for authentication, image generation, video generation, characters, gallery, credits, payment, subscription, admin, analytics, and webhooks.
- Added the permanent Database Bible in `docs/0500-database/` with `DB-BIBLE-001` and table architecture documents for users, credits, images, videos, characters, prompts, orders, subscriptions, affiliate, analytics, notifications, settings, audit logs, and media assets.
- Added the permanent Design System in `docs/0200-design/` with IDs `DS-001` through `DS-015`.
- Added the permanent Product Bible in `docs/product/` with IDs `PB-001` through `PB-015`.
- Added `CTX-001` project context at `docs/context/PROJECT_CONTEXT.md` as a fast onboarding entry point for AI agents and contributors.
- Created the initial engineering workspace and knowledge base.
- Added governance standards for documents, IDs, task workflow, references, lifecycle, ownership, knowledge management, and architecture decisions.
- Added domain folders for product, design, frontend, backend, AI engine, database, API, SEO, growth, automation, DevOps, analytics, security, and roadmap.
- Added task folders for backlog, todo, doing, and done.
- Added templates for documents, tasks, ADRs, product requirements, API contracts, and database contracts.
- Added Git hygiene files for line endings, ignored local files, and binary handling.
- Added `TASK-DONE-STD-001` to define required completion behavior for every future task.

### Changed

- Updated authentication frontend, API, and sprint documentation after reviewing Hifun-style auth and growth patterns without copying third-party page content.
- Updated local API and workflow tests to account for starter credits on signup.
- Updated backend, database, API, summary, and MVP sprint backlog documentation for the MVP Backend Loop.
- Optimized the live homepage hero for conversion with a shorter headline, clearer subheadline, stronger CTAs, benefit signals, improved generated-output preview, and an expanded creation gallery preview.
- Updated static frontend validation to assert the new homepage conversion copy and CTA direction.
- Fixed Vite asset base path for GitHub Pages subpath deployment so production CSS and JavaScript load under `/open-video-studio/`.
- Updated root README with production stack, local setup, Supabase environment variables, GitHub readiness, and verification commands.
- Updated Frontend, Backend, Authentication, Storage, Database, and Summary documentation for React/Vite and Supabase production-readiness.
- Replaced non-ASCII password placeholder characters in the static sign in page with ASCII-safe text to prevent mojibake in Windows/browser/tooling contexts.
- Rebuilt the MVP visual direction from a plain internal workflow style to a dark, gradient-friendly, gallery-first creator platform style.
- Redesigned Homepage, Gallery, Generate, and Pricing surfaces with visual-first layouts and creator-focused CTAs.
- Updated `ROADMAP-MVP-SPRINTS-001` with completed `MVP-S3-000` Product Surface Direction Correction.
- Updated `ROADMAP-MVP-SPRINTS-001` Sprint 3 from engineering-led provider integration work to browser product activation based on `REVIEW-MVP-PRODUCT-001`.
- Updated `DOC-002` and `ID-REG-001` to register `REVIEW-MVP-PRODUCT-001`.
- Marked MVP Sprint 2 backlog tasks complete after the local stub generation and reusable asset API surface became available.
- Updated API and Database Bible documents affected by Sprint 2 implementation.
- Marked MVP Sprint 1 backlog tasks complete and documented the first usable MVP API surface.
- Updated backend, database, API, context, summary, and ID registry documentation for Platform Architecture V2 Sprint 1.
- Updated AI, backend, API, database, context, summary, and ID registry documentation for the proposed Provider Plugin Architecture.
- Updated AI, API, backend architecture, database, context, summary, and ID registry documentation for the AI Engine foundation.
- Updated API, backend, database, context, summary, and ID registry documentation for the product workflow foundation.
- Updated frontend documentation for `FE-INDEX-001`, `PAGE-HOME-001`, `PAGE-GALLERY-001`, `PAGE-GENERATE-001`, and `PAGE-PRICING-001` to describe the current MVP implementation.
- Updated `CTX-001`, `DOC-002`, and `ID-REG-001` for `ADR-003` and the current MVP frontend surface.
- Updated `DOC-002` and `ID-REG-001` to register the legacy site migration review.
- Fixed a stale example link in `REF-001` so the cross-reference standard points to an existing canonical credits document.
- Updated backend, database, and API documentation to reflect the Phase 1 service-layer implementation and clarify that SQLite/local filesystem are local foundations, not production infrastructure decisions.
- Strengthened production-readiness governance across document standards, task workflow, completion checklist, templates, and core domain indexes.
- Renumbered the database governance folder to `docs/0650-database/` to avoid a top-level numbering conflict with the new API Bible.
- Clarified that `docs/0600-api/` owns permanent API specifications while `docs/0700-api/` remains the API governance and implementation-readiness domain.
- Renumbered the AI Engine folder to `docs/0550-ai-engine/` to avoid a top-level numbering conflict with the new Database Bible.
- Clarified that `docs/0500-database/` owns table architecture while `docs/0650-database/` remains the database governance and implementation-readiness domain.
- Updated the design domain index to distinguish permanent design language from future frontend implementation.
- Clarified that `docs/product/` owns the permanent Product Bible and `docs/0100-product/` owns derived feature-level PRDs.
- Normalized documentation folder names to four-digit prefixes.
- Normalized task status folders to lowercase ordered names.
- Replaced machine-specific links with portable relative Markdown links.

### Validation

- Ran production build and full test suite after social auth entry and OAuth URL support; 24 tests passed.
- Ran TypeScript typecheck, production build, and full test suite after the MVP Backend Loop; 24 tests passed.
- Ran local production build and full test suite after the homepage conversion optimization; 23 tests passed.
- Confirmed local Vite build now emits relative asset URLs and reran the full test suite; 23 tests passed.
- Ran local production build and full test suite before deploying GitHub Pages workflow.
- Ran `npm install` to install React, Vite, Supabase, and React type dependencies.
- Ran `npm run build` after React/Vite/Supabase setup.
- Ran `npm run test` after React/Vite/Supabase setup; 23 tests passed.
- Ran `npm run verify:supabase`; verification correctly reported missing Supabase environment variables instead of pretending to connect.
- Added and ran a static frontend encoding safety test to block non-ASCII/mojibake markers in product surface files.
- Ran the TypeScript build and full Node test suite after the encoding fix; 20 tests passed.
- Ran the TypeScript build and full Node test suite after the product UI direction correction; 19 tests passed.
- Reviewed redesigned pages in the browser at desktop and mobile widths; required pages loaded and no horizontal overflow was detected on checked pages.
- Ran the static MVP frontend locally and reviewed Homepage, Gallery, Generate, and Pricing in desktop and mobile browser contexts.
- Tested key product interactions: Generate mode switch, Add to queue, Gallery search, and Pricing billing toggle.
- Checked documentation links after adding `REVIEW-MVP-PRODUCT-001`.
- Ran the TypeScript build and full Node test suite after completing MVP Sprint 2; 17 tests passed.
- Ran the TypeScript build and full Node test suite after completing MVP Sprint 1.
- Ran the TypeScript build and full Node test suite after completing Platform Architecture V2 Sprint 1.
- Ran the TypeScript build and full Node test suite after documenting the Provider Plugin Architecture plan.
- Ran the TypeScript build and full Node test suite after adding the AI Engine foundation.
- Ran the TypeScript build and full Node test suite after adding the product workflow foundation.
- Ran the TypeScript build and full Node test suite after adding the MVP frontend reconstruction.
- Reviewed the legacy GitHub Pages demo, including its static app shell, bundled frontend script, stylesheet, and favicon asset.
- Checked documentation links after adding `REVIEW-LEGACY-001`.
- Ran TypeScript build and Node test suite for Phase 1 implementation.
- Completed architecture review V1 and recorded score, issues, risks, and debt.
- Checked duplicate IDs.
- Checked unknown dependencies.
- Checked dependency cycles.
- Checked required Markdown sections.
- Checked for stale absolute Windows paths.
- Checked Markdown links for broken references.
- Confirmed current workspace is not yet a Git repository.

## Acceptance Criteria

- Completed tasks can be audited chronologically.
- The changelog references source documents instead of duplicating requirements.
- Future contributors can understand what changed and why.

## Future Plan

- Add release sections after product implementation begins.
- Add task IDs to each changelog entry once task files are created for implementation work.
- Add automated changelog validation.

## AI Context

Every completed task must update this file. Keep entries factual, concise, and linked to source documents.
