# North-Star Metric

| Field | Value |
|---|---|
| Unique ID | PB-013 |
| Version | 1.0.0 |
| Owner | Product Leadership / Analytics Lead |
| Dependencies | PB-002, PB-012 |
| Referenced By | PB-011, PB-012 |

## Purpose

Define the primary product metric that best represents durable customer value.

## Business Value

A north-star metric aligns product, growth, engineering, AI quality, and customer success around the outcome that matters most.

## Problem Statement

Raw generations, uploads, prompts, or exports can be misleading. The product should optimize for completed video production outcomes, not just activity.

## Scope

Proposed north-star metric:

Weekly approved or exported production-ready videos per active workspace.

Rationale:

- Measures completed production value, not only generation attempts.
- Supports both individual and team use.
- Encourages quality, collaboration, editing, and workflow completion.
- Can scale from early users to enterprise teams.
- Connects to retention, monetization, and production efficiency.

Supporting metrics are defined in `PB-012`.

## Acceptance Criteria

- The metric reflects recurring customer value.
- The metric discourages low-quality generation spam.
- Future analytics specs can define exact event logic and edge cases.

## Future Evolution

The exact calculation should be validated after real usage data exists. Enterprise, API, and automation-heavy customers may require segment-specific companion metrics.

## AI Context

Use this metric as a strategic guide, not a final analytics implementation. Exact tracking belongs in analytics specs.
