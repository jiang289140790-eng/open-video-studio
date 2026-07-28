# Real Provider Security Review

Date: 2026-07-28  
Status: **PASS FOR CODE AND DATABASE CONTRACT / REAL RUNTIME BLOCKED**

## Secrets and boundaries

- RunPod secrets exist only as environment variable names in examples and Render configuration.
- Database records contain `RUNPOD_API_KEY` only as a secret reference name.
- No concrete RunPod Endpoint, API key, Worker URL, model path or ComfyUI node ID is exposed to the frontend.
- Public job responses omit provider endpoint/configuration and raw provider errors.
- HMAC verification uses `timingSafeEqual`.
- Logs record request ID, job ID, route, stable error code and duration; they do not log authorization headers, request bodies or provider responses.

## Storage

- The result bucket is private.
- Worker paths must be `generation-results/{user_id}/{job_id}/...`.
- Provider normalization and plan-level validation both verify ownership.
- Render does not proxy image bytes.
- Signed URLs are refreshed server-side for 900 seconds on retrieval.
- Deterministic asset IDs and a unique storage-path index prevent duplicate callback assets.
- No authenticated user has direct update permission on `generation_assets`; service role retains update access.

Supabase documents that private Storage assets should be served through time-limited signed URLs, and that service credentials bypass Storage RLS and must remain server-only: [Storage access control](https://supabase.com/docs/guides/storage/security/access-control), [Serving assets](https://supabase.com/docs/guides/storage/serving/downloads).

## Database and RLS

- Full local replay: 15 migrations passed.
- Phase 2 rollback: passed after removing an invalid direct Storage catalog deletion.
- Reapply after rollback: passed.
- Local RLS/idempotency: 61/61.
- Staging transactional RLS/idempotency: 61/61.
- Workflow and model remain hidden from ordinary users while in `testing`.
- No new public table was created; existing explicit grants remain in force.

## Static checks

- `git diff --check`: pass.
- repository secret-pattern scan: pass.
- frontend provider-endpoint scan: pass.
- JSON/YAML parsing: pass.
- Gateway tests: 42/42.
- Open Video Studio tests: 75/75.
- AI Marketing Studio lint/typecheck/build/migration check: pass.
- Render deployment `474fe15`: live; `/health` and `/ready` pass with real provider disabled.
- Render log redaction scan: 100 recent records, zero matches for JWT, Supabase secret/service-role marker, webhook secret, Render token or Authorization bearer value.
- Supabase local and linked schema lint: pass.
- Supabase staging Security Advisor: **failed on pre-existing, non-Generation tables with RLS disabled**. Examples include `automation_runs`, `automations`, `accounts`, `content_items` and legacy OAuth/job tables. The Phase 2 migration did not create or alter these tables, so they were not changed outside scope.

## Residual risks/blockers

1. A real Worker image has not been reviewed or scanned.
2. Worker logs cannot be checked before deployment.
3. Model license and checksum are unknown.
4. Worker Storage credential scope is not yet configured.
5. The Render API credential was pasted into the conversation and should be rotated.
6. Local Docker image build was blocked by the machine's `docker.1ms.run` DNS mirror; TypeScript production build itself passed.
7. Staging contains pre-existing Security Advisor errors on unrelated exposed tables without RLS. These require a separately scoped ownership and policy review.
