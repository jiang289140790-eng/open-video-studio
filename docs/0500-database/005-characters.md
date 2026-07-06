# Characters

| Field | Value |
|---|---|
| Unique ID | DB-CHARACTERS-001 |
| Version | 1.2.0 |
| Status | Active |
| Owner | AI Media Data Owner |
| Dependencies | DB-USERS-001, DB-IMAGES-001, DB-PROMPTS-001, SEC-INDEX-001 |
| Referenced By | DB-VIDEOS-001, DB-MEDIA-ASSETS-001 |
| Cross References | PB-010, AI-INDEX-001, SEC-INDEX-001 |

## Purpose

Represent reusable AI or production characters, avatars, presenters, personas, or visual identity entities.

## Requirements

- Track character ownership, visual references, prompt references, consent or rights status, and usage constraints.
- Support consistency across generated images, videos, scripts, and templates.
- Preserve governance for likeness, rights, and safety.

## Relationships

- Owned by user or workspace.
- May reference images, prompts, media assets, videos, and audit logs.
- May be linked to brand kits, templates, or future model fine-tuning records.

## Fields

- Character ID.
- Owner user or workspace reference.
- Name.
- Description.
- Character type.
- Reference image IDs.
- Cover asset reference.
- Tags.
- Memory metadata.
- Consistency status.
- Prompt reference.
- Voice or audio reference.
- Style metadata.
- Consent or rights status.
- Safety review status.
- Visibility status.
- Created timestamp.
- Updated timestamp.
- Archived timestamp.

## Indexes

- Owner reference plus name.
- Character type.
- Rights status.
- Safety review status.
- Updated timestamp.

## Lifecycle

Characters are created from user definition, reference media, brand assets, or generation workflows. They may be edited, approved, reused, archived, or restricted.

## Permissions

Only permitted workspace members may create or modify characters. Use of restricted likeness, voice, or brand characters requires rights-aware permission checks.

## Retention

Retain while used by active projects, videos, or templates. Restricted or disputed characters may require preservation of provenance and audit records.

## Future Expansion

Support character versioning, voice profiles, consistency embeddings, consent records, enterprise approval, and model-specific adaptation metadata.

## Acceptance Criteria

- Character identity and rights context are clear before AI generation uses it.
- Reusable characters can be governed separately from one-off images.

## Current Implementation

`ADR-004` adds local character records and `CharacterService`. Sprint 2 extends characters with optional reference asset, cover asset, tags, memory metadata, consistency status, prompt seed, rights status, safety status, visibility, and timestamps.

## Future Plan

Define character rights and safety policy before implementation.

## AI Context

Characters are high-risk AI entities when they involve likeness or voice. Always consider consent, rights, safety, and auditability.
