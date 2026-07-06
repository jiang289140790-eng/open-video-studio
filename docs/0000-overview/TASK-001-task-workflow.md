# Task Workflow

| Field | Value |
|---|---|
| Unique ID | TASK-001 |
| Version | 0.4.0 |
| Status | Active |
| Owner | CTO / Lead Software Architect |
| Dependencies | DOC-STD-001, ID-REG-001, REF-001, OWNERS-001, TASK-DONE-STD-001 |
| Referenced By | OVSB-001, DOC-001, TASK-DONE-STD-001 |

## Purpose

Define how development tasks are created, prioritized, executed, reviewed, and completed.

## Requirements

Task folders:

- `tasks/10-backlog`: ideas and work not yet ready.
- `tasks/20-todo`: approved and ready to start.
- `tasks/30-doing`: actively being worked.
- `tasks/40-done`: completed and accepted.

Every development task must reference:

- Product Spec
- API contract, if applicable
- Database document, if applicable
- Acceptance Criteria
- Owner and impacted domain owners
- Security impact, if applicable
- Analytics impact, if applicable
- Design or frontend document, if applicable
- AI engine document, if applicable
- Testing strategy, if applicable
- Deployment and rollback impact, if applicable
- Observability impact, if applicable
- Disaster recovery impact, if applicable
- Cost impact, if applicable

Task lifecycle:

1. Create in `tasks/10-backlog` from `templates/task-template.md`.
2. Add required source documents.
3. Move to `tasks/20-todo` only when acceptance criteria, owner, dependencies, test impact, deployment impact, security impact, observability impact, and cost or recovery impact are clear or explicitly not applicable.
4. Move to `tasks/30-doing` when implementation starts.
5. Complete the closeout checklist in `TASK-DONE-STD-001`.
6. Move to `tasks/40-done` only after verification, documentation updates, summary updates when needed, changelog updates, and broken-reference checks.

Filename rules:

- Use lowercase kebab-case filenames.
- Prefix task files with their task ID when assigned.
- Keep task status in the folder path, not only inside the document body.

## Acceptance Criteria

- A task cannot be started without references to source documents.
- A reviewer can confirm what requirement each change satisfies.
- Completed tasks preserve implementation evidence and follow-up notes.
- Completed tasks satisfy `TASK-DONE-STD-001`.
- Production-affecting tasks cannot start without a test, deploy, observe, secure, recover, and cost-control posture.

## Future Plan

- Add task review checklist.
- Add task status automation.
- Add links to issue tracker integration if introduced.

## AI Context

If a user asks for implementation and the task lacks documentation, create or request the missing documentation before implementation.
