# AutoDL to RunPod Migration Guide

Date: 2026-07-28

AutoDL is a temporary staging adapter. The migration to RunPod must preserve
the existing Gateway input, workflow ID, state machine, database records,
Storage ownership rules, and frontend API.

## Invariants

- Keep `single-person-text-to-image-v1` versioned in the Registry.
- Keep the provider-neutral Worker input/output schemas.
- Keep direct Worker-to-object-storage upload.
- Keep HMAC webhook verification and idempotent event identity.
- Keep stable `GenerationError` mapping.
- Keep private owner/job Storage prefixes.
- Do not expose Provider endpoints, model paths, or workflow JSON to clients.

## Cutover sequence

1. Build a RunPod Serverless Worker that accepts the same JSON contract.
2. Install the same fixed workflow/model dependencies in the Worker image.
3. Verify health, submit, status, cancel, timeout, malformed output, and HMAC
   callbacks against contract tests.
4. Configure RunPod secrets only in Render staging.
5. Keep `REAL_PROVIDER_ALLOWLIST=single-person-text-to-image-v1`.
6. Change the staging workflow Provider binding from AutoDL to RunPod.
7. Run the full online E2E, 10-case benchmark, Storage cleanup, RLS, billing
   idempotency, and log-redaction gates.
8. Disable AutoDL only after RunPod passes every staging gate.

## Rollback

If the RunPod cutover fails:

1. Disable RunPod in Render.
2. Restore the staging Provider binding to AutoDL.
3. Redeploy the last known-good Gateway commit.
4. Confirm `/health`, `/ready`, Provider health, and one real staging job.

No frontend deployment, domain migration, or production database change is
required for either cutover or rollback.

## Acceptance before production consideration

RunPod must pass real cancellation, retry, timeout, duplicate/out-of-order
webhook, empty/malformed output, owner isolation, signed-URL expiry, orphan
cleanup, cost idempotency, and log-redaction tests. AutoDL benchmark results
are staging evidence only and are not a production capacity claim.
