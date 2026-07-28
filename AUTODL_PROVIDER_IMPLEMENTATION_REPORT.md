# AutoDL Provider Implementation Report

Date: 2026-07-28

Branch: `codex/render-staging`

Status: **IMPLEMENTED / STAGING ONLY**

## Result

`AutoDLProvider` implements the existing `GenerationProvider` contract:

- `submit`
- `getStatus`
- `cancel`
- `healthCheck`
- `normalizeResult`
- `verifyWebhook`
- `mapError`

RunPodProvider remains present and disabled. AutoDL is a temporary staging
adapter; no frontend, parser, prompt-engine, router, or domain model contains
an AutoDL endpoint, token, port, ComfyUI node ID, or local file path.

## Enabled workflow

- Gateway workflow: `single-person-text-to-image-v1`
- Provider workflow: `persephone_flux_2_q8_t2i_api_v1`
- Version: `1.0.0`
- Status: `testing`
- Media/mode: image / text-to-image
- Scope: one adult person, photorealistic, no reference image, no LoRA,
  no pose control, no face replacement
- Ratios: `1:1` and `4:5`
- Output count: 1–4
- Worker timeout ceiling: 600 seconds in staging
- Minimum model VRAM declaration: 24 GB

The Registry contains only logical references and metadata. The Worker resolves
the fixed workflow and model artifact; the browser never receives either.

## Runtime verification

- AutoDL contract/unit/integration coverage is part of Gateway 49/49.
- Authenticated Worker health previously returned 200 with ComfyUI and Storage
  connected.
- Direct real generation completed at 1024×1024 in 25,266 ms.
- A second direct real generation completed in 18,852 ms.
- Render online real jobs completed and persisted private Storage assets.
- Invalid JWT, CORS, ownership, cancel, retry, refresh recovery, duplicate
  webhook, and real output normalization were exercised online.

## Safety properties

- Provider errors map to stable `GenerationError` values.
- Raw Worker responses and stacks are not returned to the frontend.
- Render transports JSON only; the Worker uploads image bytes directly.
- Storage paths are constrained to
  `generation-results/{user_id}/{job_id}/...`.
- Completion, asset creation, billing, and webhook events are idempotent.
- A timeout/failure now interrupts and removes the active ComfyUI queue item
  before recording the terminal Worker state.

## Remaining gate

The AutoDL instance is currently shown as **powered off** in its control panel,
so the final negative-path run and 10-case benchmark cannot be completed until
the already-authorized staging instance is started again.
