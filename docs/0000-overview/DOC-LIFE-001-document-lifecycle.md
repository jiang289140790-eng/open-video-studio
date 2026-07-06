# Document Lifecycle

| Field | Value |
|---|---|
| Unique ID | DOC-LIFE-001 |
| Version | 0.1.0 |
| Status | Active |
| Owner | Engineering Operations |
| Dependencies | DOC-STD-001, ID-REG-001, REF-001 |
| Referenced By | DOC-STD-001, KNOW-001 |

## Purpose

Define how documents move from idea to authority to retirement.

## Requirements

Lifecycle states:

- Draft: proposed and not yet authoritative.
- Review: ready for domain-owner review.
- Active: authoritative for current work.
- Superseded: replaced by another document and retained for history.
- Deprecated: known to be obsolete and should not guide new work.

Rules:

- Draft documents may guide discussion but not implementation.
- Active documents may block implementation if dependencies are missing.
- Superseded documents must link to the replacement.
- Deprecated documents must explain why they should not be used.
- Documents with production impact need an owner, acceptance criteria, and review history before becoming Active.
- Review cadence should be defined for documents that govern security, billing, AI behavior, data retention, or public APIs.

## Acceptance Criteria

- Contributors can tell whether a document is safe to use.
- Old decisions remain auditable without confusing current work.
- Critical documents have review expectations.

## Future Plan

- Add review-date metadata.
- Add supersession index.
- Add automated stale-document reports.

## AI Context

If a document is Draft, Deprecated, or Superseded, do not treat it as authoritative unless the user explicitly asks for historical context.
