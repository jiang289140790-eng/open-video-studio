# Legacy Site Migration Review

| Field | Value |
|---|---|
| Unique ID | REVIEW-LEGACY-001 |
| Version | 1.0.0 |
| Status | Active |
| Owner | CTO / Lead Software Architect |
| Dependencies | PB-001, PB-007, PB-010, PAGE-HOME-001, PAGE-GENERATE-001, PAGE-GALLERY-001, PAGE-DASHBOARD-001, API-BIBLE-001, DB-BIBLE-001, GROWTH-BIBLE-001, ADR-002 |
| Referenced By | DOC-002, ID-REG-001 |
| Cross References | PB-001, PB-006, PB-010, PB-014, DS-001, DS-015, FE-BIBLE-001, API-AUTH-001, API-GEN-IMAGE-001, API-GEN-VIDEO-001, API-CREDITS-001, API-GALLERY-001, DB-USERS-001, DB-CREDITS-001, DB-MEDIA-ASSETS-001, GROWTH-SEO-001, GROWTH-AFFILIATE-001 |

## Purpose

Review the Legacy Demo v0 at `https://jiang289140790-eng.github.io/open-video-studio/?v=f03f7d8#free` and define what may inform MVP v1 frontend migration without allowing the demo to become the product source of truth.

## Requirements

- Treat the legacy site as reference material only.
- Preserve the Engineering Bible, Product Bible, Design Bible, Frontend Bible, API Bible, Database Bible, and Growth Bible as authoritative.
- Identify reusable ideas, rejected ideas, redesign targets, rebuild targets, Product Bible conflicts, and MVP v1 candidates.
- Do not implement UI or production code as part of this review.

## Evidence Reviewed

- Static app shell with title `开放视频工作室`.
- Bundled React/Supabase client app with hash-based navigation.
- Observed surface areas: sidebar navigation, top navigation, image tools, video tools, create task composer, upload flow, prompt input, duration and ratio settings, consent checkbox, task queue, fake worker action, creation status cards, credit pricing cards, affiliate/referral area, account center, mobile bottom navigation, and favicon asset.
- Observed legacy implementation dependencies: direct Supabase browser client, client-visible table names, direct storage upload, direct database inserts, local placeholder generation states, and fake worker simulation.

## What To Keep

- The idea of a generation-first workspace with prompt, source asset, settings, credit cost, and queue visibility. This aligns with `PAGE-GENERATE-001`.
- Visible credit impact near generation and template actions. This aligns with `API-CREDITS-001` and `DB-CREDITS-001`.
- Source asset upload with explicit authorization and adult/person rights confirmation. This should be rebuilt through `BE-ARCH-STORAGE-001`, `DB-MEDIA-ASSETS-001`, and security review.
- Job queue visibility with status, progress, cost, prompt summary, and output state. This aligns with `API-GEN-IMAGE-001`, `API-GEN-VIDEO-001`, and future queue architecture.
- Pricing card structure as a simple comparison pattern, not the exact plans or copy. Pricing must follow `PB-006` and `PAGE-PRICING-001`.
- Referral and affiliate dashboard concepts as future growth surfaces. These must follow `GROWTH-AFFILIATE-001`, `GROWTH-REFERRAL-001`, and `DB-AFFILIATE-001`.
- Mobile bottom navigation as a pattern candidate for core authenticated workflows.
- The favicon can inspire a future brand asset review, but it should not be treated as final brand identity without `DS-003` approval.

## What To Remove

- Legacy brand positioning such as `open.fun`, because it does not match the durable Open Video Studio brand or `PB-001`.
- Viral adult-template positioning and explicit template taxonomy, because it narrows the product, weakens trust, and conflicts with the professional AI SaaS positioning in `PB-001` and `DS-001`.
- Fake worker controls and demo-only status simulation, because production state must come from backend job orchestration.
- Client-side direct database and storage mutations as an application architecture pattern, because API and backend ownership belong to `API-BIBLE-001` and `BE-ARCH-BIBLE-001`.
- Hash-only navigation as the product routing model, because it blocks SEO, analytics clarity, and durable page ownership.
- Placeholder generated artwork made from CSS gradients as product proof. MVP should use real sample outputs or clearly labeled examples.
- Visible internal system map inside account UI. Operational readiness belongs in docs and admin surfaces, not public user workflows.
- Daily check-in rewards until growth governance defines abuse prevention, cost controls, and retention value.

## What To Redesign

- Homepage: redesign around product category, value proposition, proof, trust, pricing, and signup paths from `PAGE-HOME-001`, not a tool shelf.
- Primary CTA: replace scattered `Open`, `Upgrade`, `Free Credits`, and affiliate CTAs with a clear hierarchy: start generating, view gallery/examples, pricing, sign in.
- Generate page: preserve the create-task idea but redesign around mode selection, prompt quality, references, characters, credit estimate, safety state, queue, and output preview per `PAGE-GENERATE-001`.
- Gallery: create a first-class gallery and recent outputs surface instead of status placeholders. Reference `PAGE-GALLERY-001` and `API-GALLERY-001`.
- Dashboard: rebuild as workspace overview, recent generations, credit balance, usage, projects, and next actions per `PAGE-DASHBOARD-001`.
- Pricing: redesign plans, credit bundles, subscription framing, trust copy, refund/payment expectations, and conversion flow under `PB-006`.
- Account center: redesign around profile, authentication state, settings, credits, billing, and security rather than a demo login panel.
- Navigation: separate public marketing navigation from authenticated workspace navigation.
- Mobile experience: keep bottom navigation as a candidate but redesign IA around generate, gallery, dashboard, and account.
- Visual language: move away from loud dark/pink viral styling toward the calm, premium, operational language defined in `DS-001` through `DS-015`.

## What To Rebuild

- Authentication using the Phase 1 auth foundation and future `API-AUTH-001` contracts.
- User system using `DB-USERS-001` and documented ownership.
- Credits ledger using backend-controlled transactions from `DB-CREDITS-001` and `API-CREDITS-001`.
- Storage uploads using backend-mediated storage policies from `BE-ARCH-STORAGE-001`.
- Generation submission through API contracts instead of browser-side table inserts.
- Job queue and worker states through `BE-ARCH-QUEUE-001`, `BE-ARCH-GPU-JOBS-001`, `BE-ARCH-IMAGE-PROCESSING-001`, and `BE-ARCH-VIDEO-PROCESSING-001`.
- Gallery and media asset persistence through `DB-IMAGES-001`, `DB-VIDEOS-001`, `DB-MEDIA-ASSETS-001`, and `API-GALLERY-001`.
- Prompt library as a structured product surface, not hard-coded template arrays.
- Analytics events from the Frontend Bible and Growth Bible instead of implicit navigation clicks.
- SEO-friendly public routes for homepage, gallery examples, pricing, and content pages.
- Admin and content operations workflows for template publishing, moderation, featured examples, and quality review.

## Product Bible Conflicts

- The legacy site presents a narrow high-click tool catalog rather than an AI-native video operating system. This conflicts with `PB-001` and `PB-010`.
- The strongest visible conversion path is affiliate/free-credit oriented, while the Product Bible requires durable activation, retained creation, and professional production outcomes.
- The demo foregrounds locked templates before trust, control, quality, or workflow clarity. This conflicts with `PB-007` and `DS-001`.
- The demo lacks a first-class gallery, dashboard, prompt library, account model, and content operations layer, all of which are part of the long-term feature map in `PB-010`.
- The demo uses implementation shortcuts that bypass API, backend, security, and observability boundaries.
- The demo has weak SEO structure because hash routes and app-shell rendering do not establish durable public pages.

## MVP V1 Inclusion

MVP v1 should include these legacy-inspired ideas after redesign and rebuild:

- Public homepage with clear product positioning and generate-first CTA.
- Authentication entry and account state.
- Generate page with upload, prompt, settings, credit estimate, consent/safety confirmation, and job queue.
- Gallery page for completed outputs and reusable assets.
- Dashboard summary with recent creations, credits, and next action.
- Credits balance and starter pricing entry.
- Prompt/template library as curated, safe, product-aligned starter workflows.
- Basic referral/affiliate placeholder only if governance, abuse prevention, and analytics are defined.
- Mobile authenticated navigation pattern after IA validation.

## MVP Frontend Migration Plan

1. Establish routing and page shells from `FE-BIBLE-001`: homepage, authentication, dashboard, generate, gallery, prompt library, pricing, profile/settings.
2. Build the public conversion path from `PAGE-HOME-001`, `PAGE-PRICING-001`, `GROWTH-SEO-001`, and `GROWTH-LANDING-001`: homepage to signup, gallery/examples, pricing, and generate.
3. Build authenticated entry from `PAGE-AUTH-001`, `API-AUTH-001`, and `DB-USERS-001`: sign up, sign in, session state, user profile, and safe redirects.
4. Build generate-first workflow from `PAGE-GENERATE-001`: mode selector, prompt input, reference upload, settings, credit estimate, rights confirmation, submit, queue state, and output preview.
5. Build gallery and dashboard surfaces from `PAGE-GALLERY-001` and `PAGE-DASHBOARD-001`: recent outputs, saved assets, job history, credit balance, and reuse actions.
6. Add credits and pricing integration from `API-CREDITS-001`, `DB-CREDITS-001`, `PAGE-PRICING-001`, and `PB-006`.
7. Add prompt library MVP from `PAGE-PROMPT-LIBRARY-001` and `DB-PROMPTS-001`, using curated professional workflows instead of legacy viral template taxonomy.
8. Add analytics events from frontend and growth docs before experimentation: page views, CTA clicks, signup, generation started, generation completed, credit estimate viewed, pricing clicked, and gallery reuse.
9. Defer affiliate/referral UI until abuse prevention, settlement logic, and growth measurement are implementation-ready.

## Acceptance Criteria

- Future frontend migration can cite this report before using any legacy idea.
- No legacy section is accepted without mapping to a Product Bible, Frontend Bible, API Bible, Database Bible, Design Bible, or Growth Bible reference.
- Conflicting legacy positioning is explicitly rejected.
- MVP v1 scope is clearer after the review.
- No production code or UI implementation is introduced by this document.

## Future Plan

- Create implementation tasks for the MVP frontend migration after frontend architecture is approved.
- Add screenshots or visual annotations if a browser-rendered review artifact is needed.
- Revisit rejected legacy concepts only through new product specs and safety review.

## AI Context

When implementing frontend work, use this document to mine the legacy demo for ideas, not requirements. The legacy demo is evidence of previous exploration. The Engineering Bible is the authority.
