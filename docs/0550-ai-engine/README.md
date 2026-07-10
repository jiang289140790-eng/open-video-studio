# 0550 AI Engine

| Field | Value |
|---|---|
| Unique ID | AI-INDEX-001 |
| Version | 1.2.0 |
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

The MVP now includes a Supabase `ai` Edge Function for server-only provider orchestration. It reserves `qwen_vision` for Qwen multimodal image analysis, `deepseek_text` for prompt enhancement and Chinese operating copy, `qianwen_generation` for image/video generation, and `liblib_generation` for template-based image generation. Real provider use remains behind backend configuration and environment secrets; `fake_worker` remains the default rollback provider.

`qianwen_generation` now handles both OpenAI-compatible Qianwen bases such as `/compatible-mode/v1` and DashScope native generation endpoints. When a configured endpoint returns `404` or an incompatible `stream=False` response, the server retries same-base Qianwen candidates across native async image generation, native multimodal image generation, native text-to-image generation, native video synthesis, and compatible image/video generation. Native image/video submissions that return a `task_id` are polled server-side until a media URL/base64 result is available, then the output is stored in Supabase Storage. Polling is controlled by `QIANWEN_MAX_POLLS` and `QIANWEN_POLL_INTERVAL_MS` so video workloads can wait longer than image workloads without changing frontend code.

The local AI Asset MCP server under `src/mcp/ai-assets/` supports the model/workflow asset layer around the generation product. It can search Civitai and Hugging Face, inspect/download assets, install files into ComfyUI, record local inventory in SQLite, and call Liblib templates. This does not expose model-provider secrets to the browser and should remain an operator/developer capability, not a public user API.

Credit movement is now tied to auditable job/order records. The `ai` Edge Function inserts generation jobs before credit debit, marks jobs failed if credit debit fails, and only fulfills demo credit orders after the credit ledger grant succeeds.

Current production provider probes classify failures with code, HTTP status, category, and message so admins can distinguish bad credentials from provider outages. DeepSeek prompt enhancement, Fake Worker generation, Storage persistence, credit debit, cancellation refund, admin operations, and demo payment credit grants are verified.

Real external generation is not yet production-ready. The latest production probe shows Qwen Vision timing out, Liblib missing required secrets/template UUID, and Qianwen image generation returning `QIANWEN_GENERATION_FAILED / Not Found` while correctly refunding credits. These are provider configuration blockers, not frontend architecture blockers.

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
