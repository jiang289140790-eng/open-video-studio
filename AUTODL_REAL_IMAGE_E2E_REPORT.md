# AutoDL Real Image E2E Report

Date: 2026-07-28

Environment: Render staging + Supabase staging + AutoDL temporary GPU

Status: **PARTIAL PASS / FINAL RUN BLOCKED BY POWERED-OFF INSTANCE**

## Passed online

| Check | Result |
| --- | --- |
| Render deploy | live, commit `8f83b0a` |
| `/health` | 200 / `ok` |
| `/ready` | 200 / `ready` |
| invalid JWT | 401 |
| allowed CORS origin | 204 and echoed |
| untrusted CORS origin | not echoed |
| real submit | 202 |
| real completion | passed |
| observed real states | submitted → running → reviewing → completed |
| page refresh recovery | 200 / completed |
| user B reads user A job | 404 |
| user A asset count | 1 |
| user B asset count | 0 |
| asset owner | matched user A |
| output dimensions | 1024×1024 |
| duplicate webhook | first `duplicate=false`, replay `duplicate=true` |
| retry | 202 → completed |
| cleanup in completed run | no cleanup errors |

An earlier complete online run also returned `cancelled` for the Gateway cancel
path. A later repeat encountered a legitimate completion/cancel race and
returned 409 after the GPU finished before cancellation reached the Worker.
The final deterministic cancellation retry script is ready but has not run
because the instance powered off.

## Real output/storage path

The Worker uploaded image bytes directly to the private Supabase staging
bucket. Render stored only normalized JSON and asset metadata. Refresh signing
was corrected to remove the bucket prefix before creating a new signed URL;
the post-fix online job reached `completed` and recovered after refresh.

## Database acceptance

- Staging project: `wyvswkxogkmywduhrhkw`
- Migration alignment: 16/16
- Linked transactional JWT/RLS/role/idempotency suite: 61/61
- Test transaction rolled back.
- Five orphan objects from early smoke/E2E attempts were deleted through the
  Storage API; the final audit is zero temporary users, zero Phase 2 jobs, and
  zero recent orphan objects.
- No production project was queried or modified.

## Pending online checks

- deterministic Worker `failed` path;
- deterministic Worker `timeout` path;
- final cancellation rerun after timeout cleanup change;
- final orphan-output verification;
- 10-case real benchmark and image review;
- cost calculation after a non-zero GPU hourly price is configured.

## Current blocker

The AutoDL control panel reports instance `pro-7841f4d2206a` as **已关机**.
SSH port 46294 rejects connections and the former public Worker mapping returns
404. The instance must be started before the pending tests can run.
