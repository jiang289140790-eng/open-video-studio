# AI Provider Interface

| Field | Value |
|---|---|
| Unique ID | AI-PROVIDER-001 |
| Version | 1.0.0 |
| Status | Active |
| Owner | AI Engineering Lead |
| Dependencies | AI-INDEX-001, ADR-005 |
| Referenced By | AI-INDEX-001, ADR-005 |

## Purpose

Define the provider-independent AI contract used by all future model providers.

## Requirements

- Every provider must implement the same operations.
- Provider-specific SDKs, credentials, and payloads must stay behind adapters.
- Product and frontend code must not depend on provider-specific behavior.

## Interface

Required operations:

- Generate Image.
- Generate Video.
- Generate Character.
- Upscale.
- Edit Image.
- Check Job Status.
- Cancel Job.

Supported future providers:

- OpenAI.
- Gemini.
- ComfyUI.
- Fal.ai.
- Replicate.
- RunPod.
- Local API.

## Acceptance Criteria

- Provider adapters can be registered and selected by provider ID.
- Unsupported providers fail as not configured instead of silently falling through.
- Tests verify all provider adapters expose the same interface.

## Future Plan

Add provider-specific capability matrices, safety constraints, model catalogs, latency budgets, and cost policies.

## AI Context

Keep provider differences behind adapters. Never let frontend or product workflow code depend directly on one AI vendor.
