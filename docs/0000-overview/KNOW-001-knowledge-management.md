# Knowledge Management

| Field | Value |
|---|---|
| Unique ID | KNOW-001 |
| Version | 0.1.0 |
| Status | Active |
| Owner | CTO / Lead Software Architect |
| Dependencies | DOC-STD-001, ID-REG-001, REF-001, DOC-LIFE-001, OWNERS-001 |
| Referenced By | OVSB-001, DOC-001 |

## Purpose

Define how Open Video Studio keeps documentation useful after the project grows large.

## Requirements

- Domain folders must stay shallow at the top level and add subfolders only for repeated document types.
- Index files must summarize what exists and link to canonical documents.
- Long documents should be split when they contain multiple owners, lifecycles, or implementation surfaces.
- Duplicated content must be replaced by references.
- Decisions belong in ADRs, not buried in implementation tasks.
- Tasks must capture execution evidence, but source-of-truth requirements belong in docs.
- AI-readable context should explain how to use a document, not restate the whole document.
- Paths must be lowercase where possible and ordered with numeric prefixes when order matters.

Recommended domain subfolders:

- `prd/` for product requirement documents.
- `pages/` for page and route specs.
- `components/` for reusable UI specs.
- `contracts/` for API, data, or integration contracts.
- `decisions/` for domain-specific decision records.
- `runbooks/` for operational procedures.
- `checklists/` for launch and review gates.

## Acceptance Criteria

- New contributors can find current truth without reading every file.
- AI agents can retrieve the right files with low ambiguity.
- The repo remains navigable after hundreds of documents.

## Future Plan

- Add generated document indexes by ID.
- Add ownership dashboards.
- Add stale document and missing reference checks.

## AI Context

Prefer small, linked, canonical documents. If adding content would make a document own multiple unrelated concepts, create a new document and reference it.
