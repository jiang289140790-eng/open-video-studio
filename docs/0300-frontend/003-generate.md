# Generate

| Field | Value |
|---|---|
| Unique ID | PAGE-GENERATE-001 |
| Version | 1.1.0 |
| Status | Active |
| Owner | Frontend Lead / AI Product Lead |
| Dependencies | PB-009, PB-010, DS-010, API-GEN-IMAGE-001, API-GEN-VIDEO-001, API-CREDITS-001 |
| Referenced By | FE-BIBLE-001, DOC-002 |
| Cross References | API-GEN-IMAGE-001, API-GEN-VIDEO-001, API-CREDITS-001, DB-PROMPTS-001 |

## Purpose

Define the generation page where users create image or video outputs from prompts, references, characters, and settings.

## Requirements

- Make AI generation controllable, inspectable, and reversible.
- Show credit impact before high-cost operations.
- Validate references, permissions, and safety states before submission.

## Layout

The page should center around a prompt and configuration workspace with preview/status output nearby. Settings should be discoverable but not overwhelming. Job state must remain visible after submission.

## Sections

- Generation mode selector.
- Prompt input and prompt helper area.
- Reference asset selector.
- Character selector.
- Generation settings.
- Credit estimate.
- Safety or rights warnings.
- Generate action.
- Job progress and output preview.
- Recent generations.

## Components

- Prompt input.
- Mode segmented control.
- Asset picker.
- Character picker.
- Settings panel.
- Credit estimate badge.
- Generate button.
- Progress state.
- Output card.
- Error recovery panel.

## State Flow

- User selects image or video mode.
- User enters prompt and optional references.
- Page validates required inputs and estimates credits.
- User submits generation.
- Job transitions through queued, running, completed, failed, restricted, or canceled states.
- Completed output is saved to gallery and may be opened or reused.

## Navigation

Users can enter from dashboard, gallery, prompt library, character pages, or homepage. Outputs link to gallery, video detail, editor, or asset detail.

## Responsive Rules

Desktop should show input and output context together. Tablet may stack settings and preview. Mobile should support lightweight generation but may simplify advanced settings.

## SEO

Authenticated generation page is not indexable. Public examples or templates require separate SEO documents.

## Analytics Events

- `generate_page_viewed`
- `generation_mode_selected`
- `generation_prompt_submitted`
- `generation_credit_estimate_viewed`
- `generation_started`
- `generation_completed`
- `generation_failed`

## Acceptance Criteria

- Users understand required inputs, credit cost, and generation status.
- Unsafe, unauthorized, or insufficient-credit states are clear before submission.
- Page does not imply instant success for long-running jobs.

## Current Implementation

`ADR-003` implements the first MVP generate entry at `apps/web/generate.html`. The current surface includes mode selection, prompt input, ratio and duration controls, reference asset input, rights notice, credit estimate, safety state, output preview placeholder, and queue state.

The queue interaction is local-only and does not call AI workers, storage, credits, or database services. Future integration must use `API-GEN-IMAGE-001`, `API-GEN-VIDEO-001`, `API-CREDITS-001`, and backend queue architecture.

## Future Plan

Add batch generation, model selection, templates, regeneration, and workflow automation.

## AI Context

Generation is not magic UI. Make cost, state, provenance, safety, and user control visible.
