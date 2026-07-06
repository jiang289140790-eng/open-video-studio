# 0650 Database Domain

| Field | Value |
|---|---|
| Unique ID | DB-INDEX-001 |
| Version | 0.4.0 |
| Status | Active |
| Owner | Data Architecture Lead |
| Dependencies | OVSB-001, DOC-STD-001, PRD-INDEX-001, SEC-INDEX-001, DB-BIBLE-001 |
| Referenced By | DOC-002 |

## Purpose

Own database governance, migration policy, retention standards, data contracts, and implementation readiness. The permanent table architecture source of truth lives in `docs/0500-database/`.

## Requirements

- Tables, collections, events, and durable entities must use `DB` IDs.
- Table architecture must reference `DB-BIBLE-001` and the relevant table documents in `docs/0500-database/`.
- Product documents define business meaning; database documents define persistence contracts.
- Sensitive data must reference security and privacy requirements.
- Schema changes must be documented before implementation.
- Database work must define migration strategy, rollback limits, backup and restore behavior, data quality checks, privacy classification, and storage growth expectations.

## Acceptance Criteria

- Backend and analytics work can reference stable data contracts.
- Data ownership, retention, and migration expectations are explicit.
- Future SQL or migration work references the Database Bible before implementation.
- Durable data changes include recovery, quality, and growth considerations.

## Future Plan

- Extend the Database Bible as new canonical entities are approved.
- Add migration policy.
- Add audit log model.
- Add retention policy.
- Add backup and restore policy.
- Add migration rollback standard.
- Add data quality and storage cost policy.

## AI Context

Use `docs/0500-database/` for table architecture. Use this folder for database governance, migration strategy, retention policy, and implementation-readiness documents.
