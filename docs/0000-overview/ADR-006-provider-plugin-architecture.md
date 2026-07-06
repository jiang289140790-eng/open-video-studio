# Provider Plugin Architecture

| Field | Value |
|---|---|
| Unique ID | ADR-006 |
| Version | 1.0.0 |
| Status | Proposed |
| Owner | CTO / Lead Software Architect |
| Dependencies | REVIEW-PROVIDER-PLUGIN-001, ADR-005, AI-PROVIDER-001, AI-JOBS-001, AI-STORAGE-001, AI-COST-001 |
| Referenced By | DOC-002, CHANGELOG-001 |

## Purpose

Propose the permanent Provider Plugin Architecture for Open Video Studio before package refactoring begins.

## Requirements

- Business code calls only provider-neutral AI Engine methods.
- Provider-specific packages stay behind provider manager and provider interface boundaries.
- Storage, queue, and billing are adapter-driven.
- Model registry and feature flags control provider selection and product availability.
- Current fake worker and local stub behavior must continue working.

## Decision

Proposed decision: refactor the existing AI Engine foundation into package boundaries defined by `REVIEW-PROVIDER-PLUGIN-001`, after approval.

Target packages:

- `packages/ai-core/`
- `packages/provider-interface/`
- `packages/provider-manager/`
- `packages/provider-openai/`
- `packages/provider-comfyui/`
- `packages/provider-gemini/`
- `packages/provider-fal/`
- `packages/provider-replicate/`
- `packages/provider-runpod/`
- `packages/worker/`
- `packages/storage/`
- `packages/billing/`
- `packages/queue/`

## Consequences

- AI provider additions become plugin work instead of business-layer rewrites.
- Frontend remains stable across provider changes.
- Provider, queue, storage, billing, and model behavior can be configured independently.
- Migration must be phased to avoid breaking the working foundation.

## Rollback or Migration Plan

Migrate one package boundary at a time. Maintain compatibility re-exports from existing `src/ai/` paths until all tests and imports are migrated. Revert individual package extraction if behavior diverges.

## Security Impact

Provider packages will eventually contain SDKs and credentials. This ADR does not approve adding secrets or live provider calls. Future provider integration requires secret management and security review.

## Observability Impact

Package split should preserve AI job and cost records. Future provider plugins must emit health, latency, failure, retry, and cost telemetry.

## Cost Impact

No immediate cost impact because this ADR is proposed and documentation-only. Future live providers must pass cost review.

## Disaster Recovery Impact

No production infrastructure changes are approved. Queue and storage adapters must define recovery behavior before production use.

## Acceptance Criteria

- Approval is received before refactoring.
- Provider plugin architecture review exists and is linked.
- Existing tests continue passing before and after every migration phase.
- Business-layer imports remain provider-neutral.

## Future Plan

After approval, create implementation tasks for package interface extraction and dependency-boundary tests.

## AI Context

This is a proposed architecture decision, not an implementation instruction. Do not refactor code until explicitly approved.
