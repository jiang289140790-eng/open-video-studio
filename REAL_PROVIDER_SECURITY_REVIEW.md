# Real Provider Security Review

Date: 2026-07-28  
Status: **PASS FOR IMPLEMENTED CONTROLS / FINAL RUNTIME GATES BLOCKED**

## Environment separation

- Only Supabase staging project `wyvswkxogkmywduhrhkw` was used.
- No production Supabase project was queried or modified.
- Render service is `generation-gateway-staging`.
- RunPodProvider remains present but disabled.
- Render has no `RUNPOD_*` variables.
- AutoDL is explicitly staging-only and is not described as production.
- No branch was merged into `main`.

## Secret handling

- Render environment contains the required `AUTODL_*` names; values are not
  committed or printed.
- Frontend responses omit Provider endpoint, token, model path, workflow JSON,
  and ComfyUI node IDs.
- Gateway logs do not record authorization headers or request bodies.
- The latest 200 Render log records produced zero matches for JWT/Bearer,
  Supabase secret/service-role markers, Render tokens, AutoDL tokens, webhook
  secrets, or the credentials previously pasted in chat.
- Credentials pasted in chat should still be rotated after acceptance.

## Storage and ownership

- Bucket `generation-results` is private.
- Worker input enforces
  `generation-results/{user_id}/{job_id}`.
- Provider normalization rechecks user, job, prefix, output count, unique
  output index, signed-URL expiry, and absence of local/data/blob URLs.
- Render does not proxy image bytes.
- Refresh recovery signs the bucket-relative object path.
- Deterministic asset IDs and unique constraints prevent duplicate callback
  assets.
- Online user B read of user A job returned 404.
- Online user B saw zero assets from user A's job.
- Five early smoke/E2E orphan objects were removed through the staging Storage
  API; the post-cleanup audit reports zero recent orphan objects.

## JWT, RLS, and roles

- Staging migrations: 16/16 aligned.
- Linked transactional RLS suite: 61/61.
- Coverage includes anon, authenticated users A/B, admin, operator,
  service-role behavior, protected internal fields, management registries,
  webhook idempotency, billing idempotency, and private Storage configuration.
- The transaction rolled back its test data.

## Webhook and errors

- HMAC-SHA256 verification uses timing-safe comparison.
- Replayed online callback returned `duplicate=false` then `duplicate=true`.
- Duplicate callbacks resume nonterminal work but do not duplicate events,
  assets, completion cost, or billing.
- Provider errors are normalized; raw stack traces are not returned.
- Cancel, timeout, and failure interrupt/delete the active ComfyUI prompt.

## Render status

- Latest live deploy: `dep-d9k4m95aeets73a5vm50`
- Commit: `ddbcf4b`
- `/health`: 200 / `ok`
- `/ready`: 200 / `ready`
- Render service is not suspended.

## Residual blockers

1. AutoDL instance is currently powered off.
2. Final deterministic failed/timeout/cancel cleanup run is pending.
3. Ten real benchmark outputs and their subsequent cleanup are pending.
4. A verified GPU hourly price is missing; actual cost remains zero.
5. Final post-benchmark Worker/Render log scan is pending.

Phase 2 security acceptance remains blocked until those runtime gates pass.
