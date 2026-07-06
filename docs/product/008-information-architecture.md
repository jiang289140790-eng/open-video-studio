# Information Architecture

| Field | Value |
|---|---|
| Unique ID | PB-008 |
| Version | 1.0.0 |
| Owner | Product Lead / Design Lead |
| Dependencies | PB-003, PB-007 |
| Referenced By | PB-009, PB-010 |

## Purpose

Define the durable product information architecture for Open Video Studio.

## Business Value

Strong information architecture allows the product to scale from simple creation to team operations without constant navigation rewrites.

## Problem Statement

AI video workflows involve many objects: workspaces, projects, videos, timelines, clips, prompts, scripts, assets, brand kits, templates, automations, renders, approvals, exports, and analytics. Without stable structure, users and engineers lose track of ownership and workflow state.

## Scope

Core product objects:

- Workspace: top-level organization for members, billing, permissions, brand systems, assets, and projects.
- Project: container for a video initiative or campaign deliverable set.
- Video: editable media artifact with timeline, versions, outputs, and metadata.
- Asset: reusable media, brand, script, prompt, audio, template, or reference input.
- Timeline: structured edit state for video composition.
- Generation: AI-created or AI-transformed media output.
- Automation: repeatable workflow that performs production tasks.
- Review: feedback, approval, and decision state.
- Export: generated deliverable for downstream use.
- Integration: external connection to storage, publishing, analytics, or workflow systems.

Primary navigation zones:

- Home or command center.
- Projects.
- Studio/editor.
- Assets.
- Templates and brand.
- Automations.
- Review and approvals.
- Analytics.
- Workspace administration.

## Acceptance Criteria

- Page and route specs can map to stable product objects.
- Database and API docs can reference product object definitions.
- User journeys in `PB-009` can move through this architecture without inventing new concepts.

## Future Evolution

As enterprise and automation features mature, the architecture may add governance, audit, marketplace, and developer surfaces. New top-level concepts should be added only when they cannot be modeled through existing objects.

## AI Context

Use this document for product object vocabulary. Do not define conflicting object meanings in feature docs.
