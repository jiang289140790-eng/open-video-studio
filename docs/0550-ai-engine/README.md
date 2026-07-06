# 0550 AI Engine

| Field | Value |
|---|---|
| Unique ID | AI-INDEX-001 |
| Version | 1.1.0 |
| Status | Active |
| Owner | AI Engineering Lead |
| Dependencies | OVSB-001, DOC-STD-001, PRD-INDEX-001, SEC-INDEX-001, ANALYTICS-INDEX-001 |
| Referenced By | DOC-002 |

## Purpose

Own AI model orchestration, prompt systems, generation pipelines, evaluation, safety, quality controls, cost controls, and human override workflows.

## Requirements

- AI behavior must reference product requirements.
- Prompts must live in `prompts/` or be referenced from AI engine documents.
- Evaluations and safety constraints must be defined before production use.
- Model selection, fallback, and cost rules must be documented.
- AI features must define evaluation datasets, quality metrics, safety checks, latency targets, fallback behavior, provider failure handling, and cost guardrails.
- Prompt and model changes that affect user-visible output require versioning, evaluation evidence, and rollback plan.

## AI Engine Foundation

- [AI-PROVIDER-001 Provider Interface](001-provider-interface.md)
- [AI-JOBS-001 Job Queue And Workers](002-job-queue-workers.md)
- [AI-STORAGE-001 Storage Abstraction](003-storage-abstraction.md)
- [AI-COST-001 Cost Tracking](004-cost-tracking.md)

## Current Implementation

`ADR-005` implements a provider-independent TypeScript AI Engine foundation under `src/ai/`. It includes a unified provider interface, provider registry, local deterministic stub provider, not-configured future provider adapters, local AI job queue, independent worker, cost tracker, and storage adapter abstraction.

No real AI model, provider SDK, provider credential, or live network call is connected yet.

## Proposed Provider Plugin Architecture

`REVIEW-PROVIDER-PLUGIN-001` and proposed `ADR-006` define the package-level Provider Plugin Architecture for future refactoring. No package refactor is approved until `ADR-006` is accepted.

## Acceptance Criteria

- AI-powered features have clear prompts, inputs, outputs, evaluation criteria, and failure modes.
- Safety and privacy considerations are documented before launch.
- AI workloads can be observed, cost-controlled, and safely rolled back.

## Future Plan

- Add real provider adapters after model, prompt, safety, evaluation, and cost policies exist.
- Add prompt registry.
- Add video generation pipeline architecture.
- Add AI evaluation standard.
- Add model/provider routing policy.
- Add AI cost-control and quality regression policy.

## AI Context

Use this folder for all AI behavior. Do not hide model prompts or evaluation criteria inside implementation only.
