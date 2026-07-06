# Templates

| Field | Value |
|---|---|
| Unique ID | TEMPLATE-README-001 |
| Version | 0.2.0 |
| Status | Active |
| Owner | Engineering Operations |
| Dependencies | OVSB-001, DOC-STD-001, TASK-001, REF-001, DOC-LIFE-001 |
| Referenced By | DOC-STD-001, TASK-001 |

## Purpose

Store reusable document and task templates that keep the knowledge base consistent.

## Requirements

- Templates must follow the current document standard.
- Template changes that alter required fields must update `DOC-STD-001`.
- Task template changes must update `TASK-001` when workflow expectations change.
- Specialized templates must preserve required metadata while adding domain-specific sections.

## Available Templates

- [document-template.md](document-template.md)
- [task-template.md](task-template.md)
- [adr-template.md](adr-template.md)
- [product-requirement-template.md](product-requirement-template.md)
- [api-contract-template.md](api-contract-template.md)
- [database-contract-template.md](database-contract-template.md)

## Acceptance Criteria

- Contributors can create compliant documents and tasks quickly.
- Templates match the active governance documents.

## Future Plan

- Add design specification template.
- Add frontend page specification template.
- Add AI engine specification template.
- Add analytics event specification template.
- Add security review template.

## AI Context

Use templates when creating new project documents. Keep generated documents concise and reference-based.
