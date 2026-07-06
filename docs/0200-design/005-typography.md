# Typography

| Field | Value |
|---|---|
| ID | DS-005 |
| Unique ID | DS-005 |
| Version | 1.0.0 |
| Status | Active |
| Owner | Design Systems Lead |
| Dependencies | DS-001, DS-003, DS-012 |
| Referenced By | DS-010, DS-014, DS-015 |
| Cross References | DS-003, DS-012, DS-014 |

## Purpose

Define the typographic language for Open Video Studio.

## Requirements

- Support readable dense workflows and focused creative work.
- Define roles before implementation values.
- Preserve accessibility and avoid viewport-scaled typography.

## Scope

Typography should make the product feel precise, calm, and professional. It must support long sessions, dense operational interfaces, creative review, and AI-assisted workflows.

Typographic roles:

- Display: rare, high-level product or workspace moments.
- Page Title: primary screen identity.
- Section Title: major grouping inside a page.
- Panel Title: compact headings inside tools, sidebars, and inspectors.
- Body: normal reading and form content.
- Body Compact: dense operational content.
- Label: controls, form labels, metadata labels.
- Caption: timestamps, helper text, audit detail.
- Code or Monospace: IDs, filenames, technical values, automation parameters.

Usage rules:

- Use hierarchy through size, weight, spacing, and placement.
- Avoid oversized typography inside dense product surfaces.
- Avoid negative letter spacing.
- Do not scale typography directly with viewport width.
- Text must fit inside controls and panels across supported viewports.
- AI-generated text should be readable, scannable, and clearly separated from user-authored content when needed.

## Acceptance Criteria

- Future text styles map to defined typographic roles.
- Dense interfaces remain readable without feeling cramped.
- Creative work areas do not lose priority to decorative typography.
- Accessibility requirements in `DS-012` are preserved.

## Future Evolution

Future design token work should define type scale, font families, weights, line heights, and platform fallback behavior.

## Future Plan

Define exact type tokens and examples for editor, dashboard, review, onboarding, and admin surfaces.

## AI Context

Use typographic roles instead of raw font sizes. For product UI, favor clear hierarchy and compact professionalism over hero-scale typography.
