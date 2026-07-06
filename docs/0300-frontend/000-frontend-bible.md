# Frontend Bible

| Field | Value |
|---|---|
| Unique ID | FE-BIBLE-001 |
| Version | 1.0.0 |
| Status | Active |
| Owner | Frontend Lead |
| Dependencies | PB-008, PB-010, DS-001, DS-010, API-BIBLE-001 |
| Referenced By | DOC-002, FE-INDEX-001 |
| Cross References | PB-008, DS-010, API-BIBLE-001 |

## Purpose

Define the permanent page-level frontend specification source of truth for Open Video Studio.

## Requirements

- Define page behavior before UI implementation.
- Keep page specs implementation-agnostic.
- Reference Product Bible, Design System, API Bible, and Database Bible documents.
- Do not write React, CSS, Tailwind, or implementation code here.

## Pages

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

## Acceptance Criteria

- Every page has a permanent `PAGE-*` ID.
- Page specs define purpose, layout, sections, components, state flow, navigation, responsive rules, SEO, analytics events, acceptance criteria, and AI context.
- Future implementation can proceed without guessing page intent.

## Future Plan

Add route map, app shell spec, editor page specs, project pages, asset detail pages, review pages, and component-specific frontend contracts.

## AI Context

Use this as the page specification index. Do not implement UI from this file alone; create implementation tasks only after page specs, API contracts, and design requirements are approved.
