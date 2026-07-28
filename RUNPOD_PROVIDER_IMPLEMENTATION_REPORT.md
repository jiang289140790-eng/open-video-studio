# RunPod Provider Implementation Report

Date: 2026-07-28  
Branch: `codex/render-staging`  
Status: **IMPLEMENTED / REAL ENDPOINT BLOCKED**

## Scope

Implemented one provider adapter for the testing-only workflow `single-person-text-to-image-v1`. No video, image-to-image, face swap, outfit, dual-person, LoRA, ControlNet or IPAdapter capability was added.

RunPod HTTP and Worker-specific contracts are isolated under `generation-gateway/src/providers/runpod/`. The frontend sends only the generic intent `execution_mode=real_test`.

## Provider contract

| Method | Implementation |
| --- | --- |
| `submit` | Calls the asynchronous `/run` endpoint with a configuration-referenced Worker input, bounded execution policy and signed Worker callback contract. |
| `getStatus` | Polls `/status/{job_id}` and maps `IN_QUEUE`, `IN_PROGRESS`, `RUNNING`, `COMPLETED`, `FAILED`, `CANCELLED` and `TIMED_OUT`. |
| `cancel` | Calls `/cancel/{job_id}`. |
| `normalizeResult` | Rejects inline/base64 payloads, empty outputs, malformed assets, expired URLs and non-owner storage paths. |
| `healthCheck` | Calls `/health` only when the provider is fully enabled and configured; otherwise reports unhealthy without exposing configuration. |
| `verifyWebhook` | Timing-safe HMAC-SHA256 verification. The custom Worker must send `x-webhook-signature`; polling remains available. |
| `mapError` | Maps authentication, rate limit, endpoint, timeout, GPU capacity, workflow/model and malformed-result failures to stable Gateway errors. |

The implementation follows the current RunPod asynchronous endpoint operations documented in [Send requests](https://docs.runpod.io/serverless/endpoints/send-requests), [Operation reference](https://docs.runpod.io/serverless/endpoints/operation-reference) and [Job states](https://docs.runpod.io/serverless/endpoints/job-states).

## Fail-closed controls

- `REAL_PROVIDER_ENABLED=false` by default.
- `REAL_PROVIDER_ALLOWLIST` must explicitly include `single-person-text-to-image-v1`.
- The real workflow manifest contains only `provider_ids=["runpod"]`.
- Mock fallback exists only through the test helper `withMockFallbackForContractTest`.
- Missing configuration produces `PROVIDER_NOT_CONFIGURED` or `REAL_PROVIDER_NOT_ENABLED`.
- Provider raw stacks, response bodies, API keys, endpoint IDs and model paths are not returned by the public API.

## Persistence

- Provider attempt, GPU type, duration, output count, per-output cost and actual cost are persisted.
- Asset IDs are deterministic from job ID and storage path.
- `(job_id, storage_path)` and `(provider, provider_attempt_id)` uniqueness prevents duplicate assets and attempts.
- Billing capture retains its existing idempotency key.
- Private Storage assets receive a fresh 15-minute signed URL on job retrieval/page refresh.

## Verification

- Generation Gateway build/typecheck/tests: **42/42 passed**.
- Local Supabase clean replay: **15/15 migrations passed**.
- Local pgTAP/RLS/idempotency: **61/61 passed**.
- Staging pgTAP/RLS/idempotency transaction: **61/61 passed**.
- MockProvider regression: passed as part of the Gateway suite.

## Blockers

No real RunPod request was sent. The following are absent:

1. `RUNPOD_API_KEY`
2. `RUNPOD_ENDPOINT_ID`
3. deployed ComfyUI Worker implementing the documented input/output and signed callback contract
4. concrete ComfyUI workflow JSON and node IDs
5. exact model manifest, model files, checksums and verified license
6. Worker-side Supabase Storage credentials/configuration

