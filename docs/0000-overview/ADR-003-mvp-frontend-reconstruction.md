# MVP Frontend Reconstruction

| Field | Value |
|---|---|
| Unique ID | ADR-003 |
| Version | 1.0.0 |
| Status | Active |
| Owner | CTO / Lead Software Architect |
| Dependencies | PAGE-HOME-001, PAGE-GALLERY-001, PAGE-GENERATE-001, PAGE-PRICING-001, DS-001, DS-015, REVIEW-LEGACY-001, ADR-002 |
| Referenced By | DOC-002, CHANGELOG-001, FE-INDEX-001 |

## Purpose

Record the first MVP frontend reconstruction decision for the commercial SaaS homepage, gallery, generate entry, and pricing preview.

## Requirements

- Build the commercial SaaS version rather than preserving weak demo-style sections.
- Use Legacy Demo v0 only where it matches the Engineering Bible.
- Keep frontend implementation separate from backend service logic.
- Avoid direct database, storage, or AI provider calls from the static MVP frontend.
- Preserve future migration options for a full application framework.

## Context

Phase 1 created a backend foundation for authentication, users, credits, storage, and audit logging. The next user request asked to proceed with MVP frontend reconstruction for homepage, gallery, generate entry, and pricing preview.

`REVIEW-LEGACY-001` found that the legacy site had reusable workflow ideas but also rejected its weak positioning, hash-only navigation, fake worker controls, direct Supabase browser writes, and demo-style viral template catalog.

## Options Considered

- Copy the legacy React/Supabase app: rejected because it conflicts with product positioning, architecture boundaries, SEO needs, and frontend migration goals.
- Introduce a full frontend framework immediately: deferred because routing, app shell, component contracts, and production deployment standards are not yet finalized.
- Build a framework-free static MVP surface: selected because it validates commercial product structure, page hierarchy, responsive behavior, and conversion flow without locking the long-term frontend stack.

## Decision

Create a framework-free MVP web surface in `apps/web/` with:

- `index.html` for homepage.
- `gallery.html` for gallery.
- `generate.html` for generate entry.
- `pricing.html` for pricing preview.
- `styles.css` for shared design language.
- `app.js` for small local interactions such as generation mode switching, gallery filtering, queue placeholder insertion, and pricing interval preview.

The requested `PAGE-001` through `PAGE-004` implementation labels map to the canonical Frontend Bible documents:

- `PAGE-001 Homepage` maps to `PAGE-HOME-001`.
- `PAGE-002 Gallery` maps to `PAGE-GALLERY-001`.
- `PAGE-003 Generate Entry` maps to `PAGE-GENERATE-001`.
- `PAGE-004 Pricing Preview` maps to `PAGE-PRICING-001`.

## Consequences

- The MVP frontend can be opened directly from static files.
- No frontend build tool, framework, router, or package dependency is introduced yet.
- SEO-friendly file routes replace the legacy hash-only route pattern.
- Static interactions are placeholders and must be replaced by API-backed behavior in future implementation phases.
- Long-term frontend framework selection remains open.

## Rollback or Migration Plan

The `apps/web/` static surface can be replaced by a framework implementation later. Future work should preserve the page intent, copy hierarchy, and source-document mappings while moving state, routing, data loading, and component composition into the selected frontend architecture.

## Security Impact

No authentication, payment, storage upload, or AI generation API calls are wired in this pass. File inputs and queue interactions are local placeholders. Future integration must use API and backend contracts rather than browser-side database writes.

## Observability Impact

No analytics pipeline is implemented yet. Page specs define target analytics events. Future work should add analytics instrumentation before experimentation or public traffic.

## Cost Impact

The static MVP frontend has negligible local cost. Future AI generation, media storage, bandwidth, payment, and analytics costs remain governed by backend, database, billing, and growth documents.

## Disaster Recovery Impact

No production infrastructure is introduced. Static files can be versioned with the repository. Production deployment, rollback, CDN, backup, and incident response remain future DevOps work.

## Acceptance Criteria

- Homepage, gallery, generate entry, and pricing preview exist under `apps/web/`.
- The implementation avoids legacy demo positioning and fake worker language.
- The pages reference commercial SaaS positioning, credit visibility, rights awareness, and gallery operations.
- Automated tests verify the presence of core frontend routes and shared frontend assets.

## Future Plan

- Select the long-term frontend framework and routing architecture.
- Add application shell, authentication integration, dashboard, profile, settings, and prompt library.
- Wire generate, gallery, credits, and pricing behavior through API contracts.
- Add accessibility, visual regression, analytics, performance, and browser compatibility testing.

## AI Context

Treat `apps/web/` as an MVP product surface, not the final frontend architecture. Do not copy legacy demo concepts unless they are explicitly allowed by `REVIEW-LEGACY-001` and mapped to canonical bible documents.
