# Prompts

| Field | Value |
|---|---|
| Unique ID | DB-PROMPTS-001 |
| Version | 1.1.0 |
| Status | Active |
| Owner | AI Platform Data Owner |
| Dependencies | DB-USERS-001, PB-010, AI-INDEX-001 |
| Referenced By | DB-IMAGES-001, DB-VIDEOS-001, DB-CHARACTERS-001, DB-CREDITS-001 |
| Cross References | AI-INDEX-001, prompts/README.md, DB-AUDIT-LOGS-001 |

## Purpose

Represent reusable, submitted, generated, or system-derived prompts used in AI workflows.

## Requirements

- Track prompt ownership, source, version, intended use, inputs, outputs, and safety context.
- Support user prompts, system prompts, templates, and workflow prompts.
- Preserve provenance for generated media and AI decisions.

## Relationships

- Created by users, systems, or automations.
- Used by images, videos, characters, media assets, analytics events, credits, and audit logs.
- May belong to future prompt library, template, workflow, or experiment tables.

## Fields

- Prompt ID.
- Owner user or workspace reference.
- Prompt type.
- Prompt content reference or stored content.
- Version.
- Input variables.
- Intended output type.
- Model or provider metadata.
- Safety classification.
- Visibility status.
- Usage count.
- Created timestamp.
- Updated timestamp.
- Archived timestamp.

## Indexes

- Owner reference plus updated timestamp.
- Prompt type.
- Version.
- Safety classification.
- Visibility status.

## Lifecycle

Prompts may be drafted, executed, saved, versioned, shared, archived, or restricted. Production prompts require stronger governance than ad hoc user prompts.

## Permissions

Users can access prompts they own or that are shared within their workspace. System prompts require internal-only permissions. Sensitive prompts may require restricted access.

## Retention

Retain prompts needed for reproducibility, audit, evaluation, or generated media provenance. User-deleted prompts may require anonymized retention if linked to outputs.

## Future Expansion

Support prompt versions, evaluations, A/B tests, prompt libraries, variable schemas, safety reviews, and model migration records.

## Acceptance Criteria

- Generated outputs can reference the prompt context that produced them.
- Production prompt governance remains separate from casual user input.

## Future Plan

Create AI prompt registry and evaluation documents before production AI workflows launch.

## Current Implementation

MVP P1 adds Admin Prompt Library configuration through `site_settings.prompt_library_config` and defines `prompt_library` in local and Supabase schemas. Prompt records include prompt ID, title, category, use case, prompt text, negative prompt, variables, model, version, tags, status, and timestamps.

## AI Context

Prompts are product behavior and data provenance. Do not bury prompt meaning inside code without registry documentation.
