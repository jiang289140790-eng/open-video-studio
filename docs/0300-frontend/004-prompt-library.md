# Prompt Library

| Field | Value |
|---|---|
| Unique ID | PAGE-PROMPT-LIBRARY-001 |
| Version | 1.0.0 |
| Status | Active |
| Owner | Frontend Lead / AI Product Lead |
| Dependencies | PB-010, DS-010, API-GEN-IMAGE-001, API-GEN-VIDEO-001, DB-PROMPTS-001 |
| Referenced By | FE-BIBLE-001, DOC-002 |
| Cross References | DB-PROMPTS-001, prompts/README.md, AI-INDEX-001 |

## Purpose

Define the prompt library page where users browse, save, edit, organize, and reuse prompts.

## Requirements

- Distinguish user prompts, templates, system-governed prompts, and shared prompts.
- Preserve prompt provenance and intended output type.
- Route prompts into generation workflows.

## Layout

The page should use a library layout with search, filters, prompt list or grid, preview, and edit/detail panel.

## Sections

- Header with create prompt action.
- Search and filters.
- Prompt collection list.
- Prompt preview/detail.
- Prompt metadata.
- Usage history or recent outputs.
- Empty and restricted states.

## Components

- Search input.
- Filter controls.
- Prompt card or row.
- Prompt editor shell.
- Prompt detail inspector.
- Output type badge.
- Share or visibility control.
- Use prompt action.

## State Flow

- Load accessible prompts.
- Search or filter by type, output, owner, or status.
- Select prompt to preview or edit.
- Save changes or archive prompt.
- Send prompt into image or video generation.

## Navigation

Users can navigate to generate, gallery, character, dashboard, and prompt detail routes. Generation routes should preserve selected prompt context.

## Responsive Rules

Desktop supports list plus inspector. Tablet can collapse detail into drawer. Mobile should prioritize search, preview, and use action over advanced editing.

## SEO

Private prompt library is not indexable. Public prompt marketplace or examples require future SEO and rights review.

## Analytics Events

- `prompt_library_viewed`
- `prompt_created`
- `prompt_opened`
- `prompt_saved`
- `prompt_used`
- `prompt_archived`
- `prompt_search_submitted`

## Acceptance Criteria

- Users can find and reuse prompts without confusing prompt type or ownership.
- Prompt usage connects cleanly to generation workflows.
- System or restricted prompts are not exposed improperly.

## Future Plan

Add prompt versioning, evaluations, marketplace, team sharing, and prompt performance analytics.

## AI Context

Prompts are product behavior and data provenance. Do not treat them as disposable text snippets.
