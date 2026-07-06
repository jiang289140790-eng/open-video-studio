# 0100 Product

| Field | Value |
|---|---|
| Unique ID | PRD-INDEX-001 |
| Version | 0.2.0 |
| Status | Active |
| Owner | Product Lead |
| Dependencies | OVSB-001, DOC-STD-001, ID-REG-001, PB-001, PB-010 |
| Referenced By | DOC-002 |

## Purpose

Own implementation-ready product requirement documents derived from the permanent Product Bible in `docs/product/`.

## Requirements

- Every feature must have a Product Requirement Document before implementation.
- Every Product Requirement Document must reference the relevant Product Bible documents.
- Product documents define user value, scope, non-goals, acceptance criteria, and dependencies.
- Shared product rules must be canonical in one document and referenced elsewhere.
- `docs/product/` owns permanent product strategy, while `docs/0100-product/` owns feature-level PRDs and product specs.

## Acceptance Criteria

- Engineers can trace implementation work to a product requirement and then to the Product Bible.
- Product behavior is described before API, database, AI, or UI work begins.

## Future Plan

- Add feature-level PRDs derived from the Product Bible.
- Add credits and billing requirements.
- Add workspace, project, and asset lifecycle requirements.

## AI Context

Start here when a request needs a feature-level PRD. For permanent product strategy, read `docs/product/` first.
