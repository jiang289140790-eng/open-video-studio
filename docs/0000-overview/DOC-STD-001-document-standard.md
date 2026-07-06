# Document Standard

| Field | Value |
|---|---|
| Unique ID | DOC-STD-001 |
| Version | 0.3.0 |
| Status | Active |
| Owner | CTO / Lead Software Architect |
| Dependencies | OVSB-001, ID-REG-001, REF-001, DOC-LIFE-001, OWNERS-001 |
| Referenced By | OVSB-001, DOC-001, TASK-001, REF-001, DOC-LIFE-001, KNOW-001 |

## Purpose

Define the required structure for every project document so the workspace remains consistent, searchable, and useful for humans and AI agents.

## Requirements

Every document must contain these sections:

- Unique ID
- Version
- Status
- Owner
- Dependencies
- Referenced By
- Purpose
- Requirements
- Acceptance Criteria
- Future Plan
- AI Context

Documents may add specialized metadata when useful. Common optional fields:

- Workflow Status
- Review Cadence
- Last Reviewed
- Supersedes
- Superseded By
- Testing Impact
- Deployment Impact
- Security Impact
- Observability Impact
- Cost Impact
- Disaster Recovery Impact

Statuses are defined by `DOC-LIFE-001`. Current allowed values:

- Draft: being shaped and not yet authoritative.
- Review: ready for domain-owner review.
- Active: authoritative for current work.
- Superseded: replaced by another document and retained for history.
- Deprecated: should not guide new work.

Versioning:

- Use `0.x` for early evolving documents.
- Use `1.0.0` when a document becomes stable enough to govern implementation.
- Increment minor versions for meaningful requirement changes.
- Increment patch versions for clarifications that do not change meaning.

Dependency rules:

- List documents that must be read or honored before this document can be applied.
- Use document IDs, not prose names alone.
- If no dependency exists, write `None`.

Reference rules:

- Follow `REF-001`.
- Use relative Markdown links for files in this repository.
- Use references for canonical concepts.
- Do not copy rules owned by another document.
- If content appears in two places, choose one owner and replace the other copy with a reference.

Architecture readiness rules:

- Any document that can affect production behavior must state testing, deployment, security, observability, cost, and recovery impact directly or through referenced documents.
- Documents that introduce external dependencies must state ownership, failure mode, and fallback or replacement expectations.
- Documents that affect AI generation, billing, user data, permissions, media storage, or public APIs require explicit security and observability references.
- Documents that affect production workloads must identify scalability assumptions or state that scalability is not applicable.

Ownership rules:

- Follow `OWNERS-001`.
- Use role owners when individual owners are not assigned.
- Do not mark a document Active while its owner is `TBD`.

Task document rule:

- `Status` always means document lifecycle.
- `Workflow Status` means task board state and follows `TASK-001`.

File and folder rules:

- Use lowercase filenames.
- Prefix ordered folders with four digits.
- Avoid spaces in filenames and folder names.
- Keep one canonical concept per document when possible.

## Acceptance Criteria

- New documents can be created from `templates/document-template.md`.
- Links are portable across machines and Git hosts.
- Reviewers can quickly verify required fields.
- AI agents can identify source documents and dependencies.
- Production-impacting documents expose testing, deployment, security, observability, cost, and recovery considerations.

## Future Plan

- Add linting or checklist automation for required sections.
- Add document review owners by domain.
- Add automated architecture-readiness validation for production-impacting documents.

## AI Context

When generating project documentation, follow this structure exactly unless a newer document standard supersedes it.
