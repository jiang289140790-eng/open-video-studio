# Cross-Reference Standard

| Field | Value |
|---|---|
| Unique ID | REF-001 |
| Version | 0.2.0 |
| Status | Active |
| Owner | Engineering Operations |
| Dependencies | DOC-STD-001, ID-REG-001 |
| Referenced By | DOC-STD-001, KNOW-001 |

## Purpose

Define how documents reference each other so the knowledge base remains portable, searchable, and resistant to duplication.

## Requirements

- Reference canonical concepts by permanent ID first, then by relative Markdown link when useful.
- Use relative links, not machine-specific absolute paths.
- Keep `Dependencies` limited to documents that must be understood before applying the current document.
- Keep `Referenced By` focused on known direct references. Do not attempt to list every incidental mention.
- Prefer one owning document for each rule, concept, lifecycle, or contract.
- When moving or renaming a document, update inbound links and the ID registry in the same change.
- When a referenced document is superseded, point readers to the replacement document.

Recommended reference format:

```text
See `DB-CREDITS-001` for credit data ownership.
See [DB-CREDITS-001 Credits](../0500-database/002-credits.md).
```

## Acceptance Criteria

- Documentation can be read correctly outside one developer machine.
- Readers can identify the canonical owner of each rule.
- AI agents can follow dependencies without guessing.

## Future Plan

- Add automated link validation.
- Add stale reference detection.
- Add generated inbound reference reports.

## AI Context

When creating or editing docs, remove duplicated business logic and replace it with an ID-based reference to the owning document.
