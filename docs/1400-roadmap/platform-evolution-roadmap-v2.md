# Platform Evolution Roadmap V2

| Field | Value |
|---|---|
| Unique ID | ROADMAP-PLATFORM-V2-001 |
| Version | 1.1.0 |
| Status | Active |
| Owner | CTO / Product Leadership |
| Dependencies | REVIEW-PLATFORM-EVOLUTION-001, PB-008, PB-010, PB-011 |
| Referenced By | DOC-002, CHANGELOG-001 |
| Cross References | REVIEW-PLATFORM-EVOLUTION-001, ADR-004, ADR-005, REVIEW-PROVIDER-PLUGIN-001 |

## Purpose

Define the roadmap for evolving Open Video Studio into an AI Content Operating Platform.

## Requirements

- Break the platform evolution into milestones, sprints, and tasks.
- Each task must define ID, priority, dependencies, estimated complexity, acceptance criteria, risk, future expansion, and related documents.
- Sequence foundational platform data before publishing, analytics, and automation scale.

## Milestones

### Milestone 1: Platform Ownership Foundation

Goal: every user action can belong to a workspace and project.

Sprints:

- Sprint 1: Workspace, Project, Membership, and Permission foundation.
- Sprint 2: Asset and generation project ownership.
- Sprint 3: Project-scoped gallery and history.

### Milestone 2: Reusable Asset Operating System

Goal: every content output becomes reusable, versioned, searchable asset inventory.

Sprints:

- Sprint 4: Asset versions.
- Sprint 5: Prompt/template/style asset types.
- Sprint 6: Character memory and reference consistency.

### Milestone 3: Workflow Engine

Goal: configurable content lifecycle pipelines.

Sprints:

- Sprint 7: Workflow definition and run model.
- Sprint 8: Workflow step execution and retries.
- Sprint 9: Human approval gates and version history.

### Milestone 4: Publishing And Calendar

Goal: produce, schedule, approve, publish, and retry content across channels.

Sprints:

- Sprint 10: Publishing adapter interface.
- Sprint 11: Content calendar.
- Sprint 12: Publishing queue and approval.

### Milestone 5: Analytics And Optimization

Goal: close the loop from content output to performance and optimization.

Sprints:

- Sprint 13: Analytics ingestion model.
- Sprint 14: Content performance dashboard.
- Sprint 15: Optimization recommendation loop.

### Milestone 6: Administration And Scale

Goal: operate models, providers, workers, feature flags, billing, and enterprise permissions.

Sprints:

- Sprint 16: Model registry and provider config.
- Sprint 17: Feature flags.
- Sprint 18: Admin operations and monitoring.

## Sprint 1 Tasks

### TASK-PLATFORM-001 Workspace Schema

- Priority: P0.
- Dependencies: PB-008, DB-USERS-001.
- Estimated Complexity: Medium.
- Acceptance Criteria: local schema includes workspaces and workspace members; owner membership is auditable.
- Risk: workspace model can overfit single-user MVP.
- Future Expansion: teams, SSO, enterprise org hierarchy.
- Related Documents: REVIEW-PLATFORM-EVOLUTION-001, DB-WORKSPACES-001.

### TASK-PLATFORM-002 Project Schema

- Priority: P0.
- Dependencies: TASK-PLATFORM-001, PB-008.
- Estimated Complexity: Medium.
- Acceptance Criteria: local schema includes projects owned by workspaces and users; projects have lifecycle state.
- Risk: campaign and project concepts may blur.
- Future Expansion: folders, campaigns, project templates.
- Related Documents: DB-PROJECTS-001.

### TASK-PLATFORM-003 Permission Foundation

- Priority: P0.
- Dependencies: TASK-PLATFORM-001, TASK-PLATFORM-002.
- Estimated Complexity: Medium.
- Acceptance Criteria: service layer can verify workspace/project membership and roles.
- Risk: too simple for enterprise; too complex for MVP.
- Future Expansion: role policies, custom roles, resource-level grants.
- Related Documents: DB-PERMISSIONS-001, SEC-INDEX-001.

### TASK-PLATFORM-004 Platform Service

- Priority: P0.
- Dependencies: TASK-PLATFORM-001, TASK-PLATFORM-002, TASK-PLATFORM-003.
- Estimated Complexity: Medium.
- Acceptance Criteria: service can create workspace, add member, create project, list projects, and assert project access.
- Risk: authorization bugs can leak project data later.
- Future Expansion: invitations, teams, project archive, project transfer.
- Related Documents: API-WORKSPACE-001, API-PROJECT-001.

### TASK-PLATFORM-005 Sprint 1 Documentation And Tests

- Priority: P0.
- Dependencies: TASK-PLATFORM-001 through TASK-PLATFORM-004.
- Estimated Complexity: Low.
- Acceptance Criteria: tests pass; docs, changelog, summary, ID registry are updated.
- Risk: docs may drift if future sprints skip completion discipline.
- Future Expansion: automated doc validation.
- Related Documents: TASK-DONE-STD-001, CHANGELOG-001.

## Sprint 2 Tasks

### TASK-PLATFORM-006 Project-Owned Assets

- Priority: P1.
- Dependencies: Sprint 1.
- Estimated Complexity: Medium.
- Acceptance Criteria: new assets may be associated with projects and listed by project.
- Risk: legacy unscoped assets need migration behavior.
- Future Expansion: asset folders and project asset permissions.
- Related Documents: DB-MEDIA-ASSETS-001.

### TASK-PLATFORM-007 Project-Owned Generation

- Priority: P1.
- Dependencies: Sprint 1.
- Estimated Complexity: Medium.
- Acceptance Criteria: generation jobs can belong to projects without breaking unscoped jobs.
- Risk: existing generation workflow tests must remain stable.
- Future Expansion: project budgets and workflow runs.
- Related Documents: DB-GENERATION-JOBS-001, API-GEN-IMAGE-001, API-GEN-VIDEO-001.

## Sprint 3 Tasks

### TASK-PLATFORM-008 Project Gallery

- Priority: P1.
- Dependencies: Sprint 2.
- Estimated Complexity: Medium.
- Acceptance Criteria: gallery can list assets by project.
- Risk: permissions must be applied consistently.
- Future Expansion: public project galleries and collections.
- Related Documents: API-GALLERY-001.

### TASK-PLATFORM-009 Project History

- Priority: P1.
- Dependencies: Sprint 2.
- Estimated Complexity: Medium.
- Acceptance Criteria: generation history can be scoped to a project.
- Risk: mixed personal/project history may confuse users.
- Future Expansion: project activity feeds.
- Related Documents: DB-GENERATION-JOBS-001.

## Imported Content Operating System Guidance

The desktop guidance describing Campaigns, AI Studio, Content Pipeline, Content Queue, platform adaptation, review workflow, and analytics placeholders has been interpreted as a content-lifecycle track, not as permission to reopen enterprise architecture expansion.

### TASK-CONTENT-001 Campaign And Content Lifecycle Foundation

- Priority: P0.
- Dependencies: TASK-PLATFORM-001 through TASK-PLATFORM-004.
- Estimated Complexity: Medium.
- Acceptance Criteria: service layer can create campaigns, create content items, generate mock AI Studio output, move pipeline stages, create platform variants, and schedule queue records.
- Risk: campaign, project, and future workflow concepts can overlap if not kept clearly scoped.
- Future Expansion: campaign dashboards, calendar UI, real publishing adapters, analytics ingestion, and workflow automation.
- Related Documents: REVIEW-PLATFORM-EVOLUTION-001, DB-BIBLE-001, API-BIBLE-001.

Current status: implemented locally through `ContentOperatingService`, local SQLite tables, and automated tests. This is a non-breaking service foundation only; it does not add real social publishing, enterprise teams, approval systems, or real AI provider calls.

## Roadmap Governance

Do not add enterprise modules, real social publishing, analytics ingestion, or automation agents until the MVP product loop remains stable and the owning documents approve those follow-up phases. Local placeholder records may exist when they support testable content lifecycle foundations and do not alter the public product architecture.

## Acceptance Criteria

- Milestones can guide engineering sequencing.
- Sprint 1 can begin without unresolved business decisions.
- Later sprints identify dependencies and risks.

## Future Plan

Expand Sprint 4 and beyond after Sprint 1 through Sprint 3 establish platform ownership and project-scoped content.

## AI Context

This roadmap upgrades the product from generation workflow to content operating system. Start with ownership and project foundations.
