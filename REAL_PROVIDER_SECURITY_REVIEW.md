# Real Provider Security Review

Date: 2026-07-28

Status: **PASS**

## Environment separation

- Supabase staging project: `wyvswkxogkmywduhrhkw`
- Render service: `generation-gateway-staging`
- AutoDL: temporary staging only
- RunPodProvider: retained and disabled
- Render `RUNPOD_*` variables: none
- Production Supabase access: none
- `main` merge: none

## Secrets and logs

- Secrets remain in Render/Worker environments and are not committed.
- Frontend responses omit Provider endpoint, token, model path, workflow JSON,
  and ComfyUI node IDs.
- Latest 500 Render log records: zero secret-pattern matches.
- AutoDL Worker log scan: zero token/service-role/Bearer matches.
- Render `/health` and `/ready`: pass.
- Credentials previously pasted in chat should still be rotated after this
  acceptance.

## JWT, RLS, and ownership

- Staging migrations: 16/16 aligned.
- Linked transactional RLS suite: 61/61.
- Coverage includes anon, users A/B, admin, operator, service role, protected
  fields, management registries, webhook idempotency, billing idempotency, and
  private Storage.
- User B received 404 for user A's job and saw zero user A assets.
- Storage prefix validation rejected a mismatched owner with 422.

## Webhook, billing, and errors

- HMAC-SHA256 verification uses timing-safe comparison.
- Duplicate callback returned false then true without duplicate assets/events.
- Duplicate submit reused the same Provider job.
- Provider errors map to stable public errors; raw stacks are not returned.
- Billing/cost records include Provider, GPU type, duration, output count,
  cost/output, and Provider-attempt ID.
- Out-of-scope real requests fail closed and never silently use MockProvider.

## Orphan prevention

Real acceptance discovered and fixed two cancellation/upload races. The final
implementation:

- waits for Provider submission before cancellation;
- rejects cancellation of already-terminal Provider work;
- rechecks cancel state after uploads;
- deletes post-cancel uploads;
- retries and validates partial-upload cleanup.

Final audit:

- temporary auth users: 0
- Phase 2 jobs: 0
- recent orphan Storage objects: 0
- benchmark local/remote review files: 0
- benchmark Worker state files: 0

## Scope confirmation

No video, image-to-image, reference image, face swap, outfit change,
ControlNet, IPAdapter, character/style LoRA, real RunPod Endpoint, or production
workflow was enabled.
