# 0300 Frontend

| Field | Value |
|---|---|
| Unique ID | FE-INDEX-001 |
| Version | 0.7.0 |
| Status | Active |
| Owner | Frontend Lead |
| Dependencies | OVSB-001, DOC-STD-001, UX-INDEX-001, API-INDEX-001, FE-BIBLE-001 |
| Referenced By | DOC-002 |

## Purpose

Own client application architecture, routing, state management, editor surfaces, component contracts, performance budgets, and frontend testing standards.

## Requirements

- Frontend documents must reference product and design source documents.
- Pages must use permanent `PAGE` IDs.
- Shared components and state contracts must be documented before broad reuse.
- Client behavior must not redefine backend, API, or database rules.
- Page implementation must reference the Frontend Bible before code begins.
- Frontend implementation must define accessibility testing, responsive testing, analytics validation, performance budgets, error states, and rollback impact before production launch.

## Frontend Bible

- [FE-BIBLE-001 Frontend Bible](000-frontend-bible.md)
- [PAGE-HOME-001 Homepage](001-homepage.md)
- [PAGE-GALLERY-001 Gallery](002-gallery.md)
- [PAGE-GENERATE-001 Generate](003-generate.md)
- [PAGE-PROMPT-LIBRARY-001 Prompt Library](004-prompt-library.md)
- [PAGE-PRICING-001 Pricing](005-pricing.md)
- [PAGE-DASHBOARD-001 Dashboard](006-dashboard.md)
- [PAGE-PROFILE-001 Profile](007-profile.md)
- [PAGE-ADMIN-001 Admin](008-admin.md)
- [PAGE-SETTINGS-001 Settings](009-settings.md)
- [PAGE-AUTH-001 Authentication](010-authentication.md)

## Current Implementation

The MVP frontend is implemented under `apps/web/`. `ADR-003` records the first reconstruction; `MVP-S3-000` records the product surface direction correction from internal workflow style to premium AI creation platform style.

The repository now includes React, Vite, and a production app shell at `apps/web/app-shell.html`. Existing static MVP pages remain available while the frontend migrates safely into React.

- `apps/web/index.html` implements the current homepage surface for `PAGE-HOME-001`.
- `apps/web/gallery.html` implements the Explore / Gallery surface for `PAGE-GALLERY-001`.
- `apps/web/generate.html` implements Generate Studio for `PAGE-GENERATE-001`.
- `apps/web/pricing.html` implements pricing and credits entry for `PAGE-PRICING-001`.
- `apps/web/dashboard.html` implements the current dashboard surface for `PAGE-DASHBOARD-001`.
- `apps/web/signin.html` implements the current sign in / account entry for `PAGE-AUTH-001`.
- `apps/web/characters.html`, `apps/web/assets.html`, `apps/web/history.html`, and `apps/web/share.html` implement MVP product surfaces derived from existing character, asset, generation history, and share requirements.
- `apps/web/app.html`, `apps/web/image-to-video.html`, `apps/web/referral.html`, and `apps/web/my-creations.html` add target-site-style tool center, video tool, free-credit referral, and creation shelf routes.
- `apps/web/app.js` now provides the local MVP interaction loop for login, credit purchase, character creation, generation, assets, history, and public sharing until the frontend is wired to Supabase APIs.

This is an MVP surface, not the final frontend architecture. Vite production build is available through `npm run build:web`; API integration, analytics instrumentation, and production deployment remain future work.

## Acceptance Criteria

- UI implementation can be planned without guessing application structure.
- Page and component specs identify required APIs, permissions, analytics, and states.
- Frontend readiness can be reviewed for accessibility, performance, analytics, and failure states.

## Future Plan

- Add app shell architecture.
- Add route map.
- Add editor surface architecture.
- Add frontend performance standard.
- Add frontend testing strategy.
- Add route and error boundary standard.

## AI Context

Use this folder after product and design requirements exist. Do not create UI before page or component documentation exists.
