# Real Image E2E Acceptance Report

Date: 2026-07-28  
Environment: Render staging + Supabase staging only  
Status: **BLOCKED**

## Environment verification

- Supabase project ref: `wyvswkxogkmywduhrhkw` (user-authorized non-production staging).
- Phase 2 migration `20260728022333_real_image_runpod_foundation.sql`: applied.
- Workflow: present, `testing`, provider array contains only `runpod`.
- Storage bucket: `generation-results`, private.
- Render service: `generation-gateway-staging`.
- Current Render deployment: live Phase 1 commit `5f5738f`.
- Current `/health`: `ok`.
- Current `/ready`: `ready`.
- Render Phase 2 environment variables: all absent.

No production Supabase project was accessed.

## Acceptance matrix

| Test | Result | Evidence |
| --- | --- | --- |
| Provider submit/status/cancel/health | PASS (contract) | Gateway test suite |
| queued/submitted/running/completed mapping | PASS (contract) | RunPod response fixtures |
| post_processing/reviewing | PASS (engine regression) | Generation Engine tests |
| Provider failed/timeout/endpoint unavailable | PASS (contract) | Stable error mapping tests |
| Cancel/retry | PASS (engine/contract) | Gateway tests |
| No matching workflow | PASS | Engine regression |
| Duplicate webhook | PASS (contract + DB) | deterministic event ID and unique idempotency key |
| Duplicate billing/attempt/asset | PASS (DB) | pgTAP uniqueness tests |
| User A/User B isolation | PASS (staging DB) | transactional RLS suite |
| Refresh recovery | PASS (code/contract) | Storage path is re-signed for 900 seconds on retrieval |
| MockProvider regression | PASS | Gateway suite |
| Real endpoint health | BLOCKED | endpoint ID/key absent |
| Real image bytes uploaded | BLOCKED | Worker/workflow/model absent |
| Real signed URL download | BLOCKED | no real object |
| Real cancellation/retry/timeout | BLOCKED | no real provider job |
| Real logs and cost measurement | BLOCKED | no real provider job |
| Test asset cleanup | NOT REQUIRED | zero real assets created |

## Required human inputs

1. Create/deploy one RunPod Serverless ComfyUI Worker.
2. Configure the Worker with the fixed workflow JSON, model manifest and Storage access.
3. Provide `RUNPOD_ENDPOINT_ID` and `RUNPOD_API_KEY` as Render secrets.
4. Configure the same webhook signing secret in Worker and Render.
5. Set the remaining Phase 2 variables and enable the allowlist.

Until these inputs exist, a real success would be fabricated; therefore no real request was attempted and this report remains blocked.

`TIMED_OUT` is represented by the existing terminal `failed` state plus stable error code `PROVIDER_TIMEOUT`. A new core-domain `timeout` enum value was not introduced because this phase explicitly prohibits changing the existing core domain model.
