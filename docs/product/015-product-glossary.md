# Product Glossary

| Field | Value |
|---|---|
| Unique ID | PB-015 |
| Version | 1.0.0 |
| Owner | Product Operations |
| Dependencies | PB-008, PB-010 |
| Referenced By | PB-003, PB-008, PB-009, PB-010 |

## Purpose

Define product vocabulary for Open Video Studio.

## Business Value

Shared language reduces ambiguity across product, engineering, design, AI, analytics, support, and go-to-market teams.

## Problem Statement

Terms like project, video, asset, generation, export, template, workflow, and automation can mean different things across teams. Ambiguous vocabulary creates mismatched requirements, inconsistent APIs, and confusing UX.

## Scope

Canonical terms:

- Workspace: an organization-level container for members, billing, permissions, brand systems, assets, and projects.
- Project: a container for a video initiative, campaign, or deliverable set.
- Video: an editable media artifact with timeline, versions, outputs, and metadata.
- Timeline: the structured composition state of a video.
- Asset: reusable media or input used in production, including footage, images, audio, scripts, prompts, templates, and references.
- Generation: an AI-created or AI-transformed output.
- Prompt: user or system instruction used to guide AI behavior.
- Template: reusable production structure, style, or workflow pattern.
- Brand Kit: reusable brand rules and assets such as colors, typography, logos, voice, visual style, and compliance constraints.
- Review: feedback and approval workflow attached to a video, version, project, or deliverable.
- Version: a saved state or iteration of a video or asset.
- Export: a deliverable output prepared for download, handoff, upload, or integration.
- Automation: a repeatable workflow that performs production tasks with defined triggers, inputs, outputs, and controls.
- Integration: a connection to an external system.
- Credit: a metered unit or entitlement used for expensive operations, subject to future billing documentation.

## Acceptance Criteria

- Feature documents use these terms consistently.
- API and database naming can reference this glossary.
- New terms are added here before broad use.

## Future Evolution

The glossary should expand as product domains mature. Technical implementation names may differ when necessary, but product-facing meaning should remain aligned here.

## AI Context

Use this document to avoid ambiguous product language. When creating docs, prefer these terms over synonyms.
