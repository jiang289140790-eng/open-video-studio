# AutoDL Provider Implementation Report

Date: 2026-07-28

Branch: `codex/render-staging`

Status: **PASS**

## Implementation

`AutoDLProvider` implements the existing `GenerationProvider` contract:

- `submit`
- `getStatus`
- `cancel`
- `healthCheck`
- `normalizeResult`
- `verifyWebhook`
- `mapError`

RunPodProvider remains present and disabled. AutoDL is a temporary staging
adapter; no frontend, parser, prompt engine, router, or domain model contains
an AutoDL endpoint, token, port, ComfyUI node ID, or local file path.

## Enabled workflow

- Gateway workflow: `single-person-text-to-image-v1`
- Provider workflow: `persephone_flux_2_q8_t2i_api_v1`
- Version/status: `1.0.0` / `testing`
- Media/mode: image / text-to-image
- Scope: one adult person, photorealistic, no reference image, no LoRA,
  no pose control, no face replacement
- Ratios: `1:1` and `4:5`
- Output count: 1–4
- Worker timeout ceiling: 600 seconds
- Minimum declared VRAM: 24 GB

## Runtime

- GPU: NVIDIA GeForce RTX 5090
- Price configured: ¥2.78/hour
- Worker health: 200, ComfyUI connected, Storage configured
- Direct real generation: completed
- Render-mediated real generation and retry: completed
- Provider negative paths: invalid auth 401, owner-path mismatch 422,
  failed, timeout, cancelled, and duplicate submit all passed
- Gateway/Provider tests: 50/50

## Race-condition fixes

Two real acceptance findings were fixed:

1. AutoDL cancel now rejects an already-terminal Provider job with stable
   `PROVIDER_JOB_TERMINAL` instead of falsely marking the Gateway job cancelled.
2. Gateway cancellation waits for an in-flight Provider submission to settle,
   then cancels the concrete Provider job.
3. Worker cancellation rechecks state after upload and deletes any newly
   uploaded objects.
4. Partial upload cleanup validates Storage deletion responses and retries
   transient failures.

The final real rerun produced zero temporary users, zero Phase 2 jobs, and zero
recent orphan Storage objects.

## Platform decoupling

The shared real-workflow boundary now reports
`REAL_WORKFLOW_INPUT_UNSUPPORTED`; it no longer exposes a RunPod-specific error
code when AutoDL rejects an out-of-scope request.
