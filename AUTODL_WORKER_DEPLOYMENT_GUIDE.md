# AutoDL Worker Deployment Guide

Date: 2026-07-28

Purpose: temporary Phase 2 staging only

## Components

The instance runs two private processes:

1. ComfyUI on loopback port 18188.
2. The FastAPI Generation Worker on port 6006.

Only the Worker API is exposed to Render. ComfyUI is not a Gateway dependency
and must not be exposed to the frontend.

## Required Worker environment

Store values only in the instance environment file with owner-only
permissions:

```text
AUTODL_API_TOKEN
COMFYUI_BASE_URL
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
AUTODL_GPU_TYPE
AUTODL_GPU_HOURLY_COST
SIGNED_URL_TTL_SECONDS
```

Do not commit values or print the environment file. The Supabase URL must
contain staging project ref `wyvswkxogkmywduhrhkw`.

## Start and recovery

The repository ships:

- `start.sh` — idempotently starts ComfyUI and Worker and waits for health.
- `stop.sh` — stops only the recorded staging processes.
- `autodl-boot.sh` — boot wrapper.
- `autodl-generation-worker.service` and
  `autodl-comfyui-internal.service` — optional systemd units.

This AutoDL image does not enable systemd. An idempotent `/etc/rc.local` hook
invokes `autodl-boot.sh` after instance boot. After every platform restart:

1. Confirm the instance is running.
2. Confirm authenticated Worker `/health` is 200.
3. Confirm `comfyui=connected` and `storage=configured`.
4. Confirm no ComfyUI process listens on public port 6006.
5. Confirm the Worker token matches the Render secret without logging it.

## Worker contract

Endpoints:

- `GET /health`
- `POST /v1/jobs`
- `GET /v1/jobs/{provider_job_id}`
- `POST /v1/jobs/{provider_job_id}/cancel`

Responses contain only normalized state, Storage metadata, signed URLs, and
redacted metrics. They never contain AutoDL absolute paths.

## Fixed workflow binding

- Workflow ID: `persephone_flux_2_q8_t2i_api_v1`
- Loader: `UnetLoaderGGUF`
- Dependencies: `clip_l.safetensors`, `t5xxl_fp16.safetensors`,
  `ae.safetensors`
- Sampler: `dpmpp_2m`
- Scheduler: `beta`
- Steps/CFG: 24 / 1.0

Node mappings live in `registry.json`; do not copy them into Render or the
frontend.

## Storage and cleanup

The Worker uploads directly to the private staging bucket. Every test run must:

- verify owner/job prefix isolation;
- delete its Storage objects;
- delete its temporary auth users, assets, jobs, and Worker state files;
- leave no local ComfyUI output after successful upload;
- interrupt the ComfyUI prompt on cancel, timeout, or failure.

## Render configuration

Render requires the documented `AUTODL_*`, `REAL_PROVIDER_*`, Supabase, CORS,
and Storage secrets. `RUNPOD_*` must remain absent while AutoDL is the selected
staging adapter.
