# AutoDL Real Image E2E Report

Date: 2026-07-28

Environment: Render staging + Supabase staging + AutoDL temporary GPU

Status: **PASS**

## Final online run

| Check | Result |
| --- | --- |
| Render deploy | `dep-d9k5ah3m8hqs73bmhs50` / `e5e1264` / live |
| `/health` | 200 / `ok` |
| `/ready` | 200 / `ready` |
| invalid JWT | 401 |
| allowed CORS origin | 204 and echoed |
| untrusted CORS origin | not echoed |
| submit | 202 |
| completed states | submitted → running → reviewing → completed |
| page refresh recovery | 200 / completed |
| user B reads user A job | 404 |
| user A assets | 1 |
| user B assets | 0 |
| owner match | true |
| dimensions | 1024×1024 |
| duplicate webhook | first false, replay true |
| cancellation | 202 / cancelled |
| retry | 202 / completed |
| out-of-scope two-person request | failed / `REAL_WORKFLOW_INPUT_UNSUPPORTED` |
| cleanup errors | none |

The cancellation run intentionally encountered a Provider-completion race. The
already-completed candidate correctly returned 409; a new candidate was
actually cancelled and returned 202. The post-run database/Storage audit was
zero users, zero jobs, and zero orphan objects.

## Worker negative paths

| Check | Result |
| --- | --- |
| invalid Worker credential | 401 |
| cross-owner Storage prefix | 422 |
| direct cancel | cancelled |
| invalid ComfyUI seed | failed / `COMFYUI_REQUEST_FAILED` |
| 10-second execution ceiling | timeout / `PROVIDER_TIMEOUT` |
| duplicate submit | same Provider job ID, no duplicate execution |
| Worker state cleanup | 3/3 files removed |

## Storage and cost

The Worker uploaded image bytes directly to private Supabase staging Storage.
Render handled only JSON and metadata. Assets used owner/job-isolated paths and
signed URLs. The Worker recorded GPU type, duration, output count,
Provider-attempt ID, and cost derived from ¥2.78/hour.

## Database

- Project: `wyvswkxogkmywduhrhkw`
- Migration alignment: 16/16
- Linked transactional JWT/RLS/role/idempotency suite: 61/61
- Final test-data audit: 0 users, 0 jobs, 0 orphan objects
- Production projects accessed: none
