# 0700 API Domain

| Field | Value |
|---|---|
| Unique ID | API-INDEX-001 |
| Version | 0.3.0 |
| Status | Active |
| Owner | API Platform Lead |
| Dependencies | OVSB-001, DOC-STD-001, PRD-INDEX-001, BE-INDEX-001, DB-INDEX-001, SEC-INDEX-001, API-BIBLE-001 |
| Referenced By | DOC-002 |

## Purpose

Own API governance, implementation-readiness, versioning policy, compatibility rules, and future concrete contracts. The permanent API specification source of truth lives in `docs/0600-api/`.

## Requirements

- API contracts must reference product requirements and database documents.
- API contracts must reference `API-BIBLE-001` and the relevant API Bible documents in `docs/0600-api/`.
- Breaking changes require an ADR.
- Errors, permissions, rate limits, and idempotency must be specified.
- Public APIs must include compatibility and deprecation rules.
- API work must define contract tests, authorization tests, rate-limit behavior, idempotency, observability, and rollback or deprecation plan.

## Acceptance Criteria

- Frontend and backend teams can implement against stable contracts.
- API behavior is testable before implementation begins.
- Future endpoint implementation references API Bible specifications before code.
- API changes can be validated through documented contract and compatibility expectations.

## Future Plan

- Add API style guide.
- Add auth and error standard.
- Add webhook standard.
- Add OpenAPI generation policy.
- Add API contract testing standard.
- Add API versioning and deprecation policy.

## AI Context

Use `docs/0600-api/` for permanent API specifications. Use this folder for concrete contracts, versioning, OpenAPI generation, implementation readiness, and compatibility policy.
