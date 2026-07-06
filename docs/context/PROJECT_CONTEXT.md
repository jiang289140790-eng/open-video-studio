# Project Context

| Field | Value |
|---|---|
| Unique ID | CTX-001 |
| Version | 1.4.0 |
| Status | Active |
| Owner | CTO / Lead Software Architect |
| Dependencies | OVSB-001, DOC-002, DOC-STD-001, ID-REG-001, TASK-001, TASK-DONE-STD-001, KNOW-001, PB-001, DS-001, FE-BIBLE-001, BE-ARCH-BIBLE-001, DB-BIBLE-001, API-BIBLE-001, GROWTH-BIBLE-001 |
| Referenced By | DOC-002 |

## Purpose

Provide a compact operating context for Open Video Studio so AI agents, contributors, and future maintainers can quickly understand the project before doing work.

This document is an entry point, not the full source of truth. When a rule or requirement is owned elsewhere, this document references the owning document instead of duplicating it.

## Requirements

- Treat Open Video Studio as a long-term AI SaaS platform, not a simple website.
- Read the root `README.md` before starting meaningful work.
- Read `docs/SUMMARY.md` to find the relevant domain documents.
- Follow `DOC-STD-001` for documentation structure.
- Follow `ID-REG-001` for permanent IDs.
- Follow `REF-001` for cross-references.
- Follow `TASK-001` for task workflow.
- Follow `TASK-DONE-STD-001` before saying a task is complete.
- Do not implement business features before the relevant documentation exists.
- Do not duplicate canonical product, API, database, AI, security, or architecture rules.
- Do not start production-impacting work until testing, deployment, rollback, observability, security, disaster recovery, and cost impact are documented or explicitly not applicable.

## Current Workspace Shape

Primary entry points:

- Root project vision and rules: `OVSB-001`
- Documentation navigation: `DOC-002`
- Document standard: `DOC-STD-001`
- Numbering system: `ID-REG-001`
- Knowledge management: `KNOW-001`
- Task workflow: `TASK-001`
- Completion standard: `TASK-DONE-STD-001`
- Project history: `CHANGELOG-001`
- Permanent product source of truth: `PB-001` through `PB-015`
- Permanent design system source of truth: `DS-001` through `DS-015`
- Permanent frontend page source of truth: `FE-BIBLE-001` and `PAGE-*` documents in `docs/0300-frontend/`
- Permanent backend architecture source of truth: `BE-ARCH-BIBLE-001` and `BE-ARCH-*` documents in `docs/0400-backend/`
- Permanent database architecture source of truth: `DB-BIBLE-001` and table documents in `docs/0500-database/`
- Permanent API specification source of truth: `API-BIBLE-001` and API documents in `docs/0600-api/`
- Permanent growth source of truth: `GROWTH-BIBLE-001` and growth channel documents in `docs/0900-growth/`
- Current MVP frontend surface: `apps/web/`, governed by `ADR-003` and `PAGE-HOME-001`, `PAGE-GALLERY-001`, `PAGE-GENERATE-001`, and `PAGE-PRICING-001`
- Current product workflow foundation: service-layer register, purchase credits, generate, store, review, share, and history behavior governed by `ADR-004`
- Current AI Engine foundation: provider-independent AI interfaces, local queue, worker, storage abstraction, and cost tracking governed by `ADR-005`
- Proposed provider plugin architecture: package refactoring plan governed by `REVIEW-PROVIDER-PLUGIN-001` and proposed `ADR-006`; do not refactor packages until approved
- Current Platform V2 foundation: workspace, membership, project, and permission service-layer behavior governed by `ADR-007`

Core domains:

- Product Bible: `docs/product/`
- Product: `docs/0100-product/`
- Design: `docs/0200-design/`
- Frontend: `docs/0300-frontend/`
- Backend: `docs/0400-backend/`
- Database Bible: `docs/0500-database/`
- AI Engine: `docs/0550-ai-engine/`
- API Bible: `docs/0600-api/`
- Database governance: `docs/0650-database/`
- API: `docs/0700-api/`
- SEO: `docs/0800-seo/`
- Growth: `docs/0900-growth/`
- Automation: `docs/1000-automation/`
- DevOps: `docs/1100-devops/`
- Analytics: `docs/1200-analytics/`
- Security: `docs/1300-security/`
- Roadmap: `docs/1400-roadmap/`

## How To Work In This Project

Before implementation:

1. Identify the domain affected by the request.
2. Read the relevant domain index and referenced source documents.
3. Create or update missing documentation first.
4. Create or update a task with source-document references.
5. Confirm testing, deployment, rollback, observability, security, recovery, and cost impact.
6. Implement only after acceptance criteria are clear.

Before completion:

1. Update related documentation.
2. Update `docs/SUMMARY.md` if navigation or canonical references changed.
3. Update `CHANGELOG.md`.
4. Check for broken references.
5. Suggest better architecture if the work reveals a structural issue.
6. Leave the workspace internally consistent.

## Acceptance Criteria

- A future AI agent can read this file and know where to look next.
- This file references source documents instead of becoming a duplicate rulebook.
- The project context remains aligned with `README.md`, `docs/SUMMARY.md`, and `CHANGELOG.md`.

## Future Plan

- Add links to MVP product context after product discovery documents exist.
- Add architecture context once major ADRs are created.
- Add current milestone context once roadmap planning begins.

## AI Context

Start here when entering the project cold. Use this file to orient yourself, then follow the referenced source documents before editing docs, creating tasks, writing code, or declaring work complete.
