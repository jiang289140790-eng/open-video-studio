# Task Completion Standard

| Field | Value |
|---|---|
| Unique ID | TASK-DONE-STD-001 |
| Version | 0.2.0 |
| Status | Active |
| Owner | CTO / Lead Software Architect |
| Dependencies | DOC-STD-001, TASK-001, REF-001, KNOW-001 |
| Referenced By | OVSB-001, CHANGELOG-001, TASK-001 |

## Purpose

Define the mandatory closeout process for every completed task so the project never drifts into an inconsistent state.

## Requirements

Every time a task is completed:

- Update the related source documentation.
- Update `docs/SUMMARY.md` when documents, domains, canonical specs, or important references are added, renamed, superseded, or removed.
- Update `CHANGELOG.md`.
- Check for broken references.
- Suggest better architecture if the work reveals a structural weakness, scalability risk, duplicated responsibility, or unclear ownership.
- Confirm testing strategy is documented or explicitly not applicable.
- Confirm deployment, rollback, and release impact is documented or explicitly not applicable.
- Confirm observability impact is documented for production-affecting work.
- Confirm security and privacy impact is documented for user, billing, AI, media, admin, or integration work.
- Confirm disaster recovery and data recovery impact is documented for durable data, storage, queues, or critical operations.
- Confirm cost impact is documented for AI, GPU, storage, media processing, analytics, or third-party provider work.
- Do not leave docs, task status, changelog, references, and architecture notes inconsistent with the completed work.

Closeout checklist:

- Related docs updated.
- `docs/SUMMARY.md` updated or explicitly confirmed unchanged.
- `CHANGELOG.md` updated.
- Broken-reference check completed.
- Architecture improvement considered.
- Testing strategy considered.
- Deployment and rollback impact considered.
- Observability impact considered.
- Security and privacy impact considered.
- Disaster recovery impact considered.
- Cost impact considered.
- Task moved to `tasks/40-done` only after acceptance criteria are met.
- Any follow-up work captured in `tasks/10-backlog` or the relevant source document.

## Acceptance Criteria

- A completed task can be audited from changelog to task to source documents.
- Documentation quality is treated as equal to code quality.
- Future agents know exactly what must happen before saying work is done.
- Production-readiness risks cannot be silently skipped.

## Future Plan

- Add a script to validate the completion checklist.
- Add a pull request template when Git hosting is introduced.
- Add release readiness checks that include this standard.

## AI Context

Before giving a final answer for any completed task, verify this checklist. If one item is not applicable, say why in the task notes or final response.
