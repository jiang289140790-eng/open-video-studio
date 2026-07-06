# Documentation Home

| Field | Value |
|---|---|
| Unique ID | DOC-001 |
| Version | 0.2.0 |
| Status | Active |
| Owner | CTO / Lead Software Architect |
| Dependencies | OVSB-001, DOC-STD-001, ID-REG-001, REF-001, DOC-LIFE-001, OWNERS-001, KNOW-001 |
| Referenced By | OVSB-001, TASK-001 |

## Purpose

This folder is the source of truth for Open Video Studio. It defines what the platform is, how it is designed, how it is built, how it is operated, and how it grows.

## Requirements

- All documents must follow `DOC-STD-001`.
- All permanent concepts must use IDs from `ID-REG-001`.
- All cross-references must follow `REF-001`.
- Document lifecycle must follow `DOC-LIFE-001`.
- Ownership must follow `OWNERS-001`.
- Knowledge organization must follow `KNOW-001`.
- Domain folders own their own canonical decisions.
- Cross-domain documents must reference each other instead of duplicating content.

## Acceptance Criteria

- A contributor can start from this document and find the correct domain.
- A task can trace its requirements back to source documents.
- AI agents can determine what to read before acting.

## Future Plan

- Add domain-specific checklists.
- Add decision records for major architecture choices.
- Add document lifecycle automation.

## AI Context

When uncertain, read `docs/SUMMARY.md` first, then the relevant domain index, then the specific referenced specs.
