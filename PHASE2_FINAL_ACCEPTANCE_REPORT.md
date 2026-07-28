# Phase 2 Final Acceptance Report

Date: 2026-07-28  
Branch: `codex/render-staging`  
Final status: **BLOCKED — NOT ACCEPTED**

## Completed

- AutoDLProvider implements the unified Provider interface.
- RunPodProvider is retained and disabled.
- Fixed testing workflow `single-person-text-to-image-v1` is bound to
  `persephone_flux_2_q8_t2i_api_v1` in staging.
- ComfyUI + FastAPI Worker deployed on AutoDL RTX 5090.
- Worker uploads directly to private Supabase staging Storage.
- Real direct and Render-mediated images completed.
- Online JWT, CORS, cross-user job/asset isolation, refresh recovery, retry,
  and duplicate webhook passed.
- Gateway page-refresh asset signing and resumable idempotent completion were
  corrected and deployed.
- Staging migrations are aligned 16/16.
- Linked staging RLS/role/idempotency suite passed 61/61.
- Render is live and ready; latest 200 logs contain no detected secrets.
- No production Supabase access, no real RunPod, no video, no LoRA,
  no reference-image workflow, and no merge to `main`.

## Current verification matrix

| Gate | Result |
| --- | --- |
| Generation Gateway | 49/49 pass |
| Open Video Studio | 75/75 pass |
| AI Marketing Studio lint | pass |
| AI Marketing Studio typecheck | pass |
| AI Marketing Studio build | pass |
| AI Marketing Studio migration check | pass |
| Supabase staging migrations | 16/16 aligned |
| Supabase linked RLS/idempotency | 61/61 pass |
| Render deploy | live |
| Render health/readiness | pass |
| invalid JWT / CORS | pass |
| real image completed | pass |
| page refresh recovery | pass |
| user A/B isolation | pass |
| duplicate webhook | pass |
| retry | pass |
| cancel | passed in an earlier online run; deterministic rerun pending |
| failed / timeout cleanup | script prepared; runtime pending |
| 10-case benchmark | blocked |
| valid actual cost | blocked by missing hourly price |
| current test-data cleanup | pass: 0 users, 0 jobs, 0 recent orphan objects |

## Blocking condition

AutoDL control panel reports the authorized staging instance
`pro-7841f4d2206a` as **已关机**. SSH port 46294 consistently refuses
connections and the public Worker mapping is unavailable. Starting it incurs
pay-as-you-go GPU usage, so it was not restarted from the browser without a
fresh action-time confirmation.

## Required human action

1. Start the existing AutoDL staging instance and keep it running for
   approximately 5–10 minutes, or explicitly authorize Codex to click
   **开机** in the AutoDL control panel.
2. Provide the RTX 5090 hourly price or set `AUTODL_GPU_HOURLY_COST` to the
   verified value.

After that, run the prepared negative-path suite and 10-case benchmark, inspect
all outputs, remove test assets/users/jobs/state, rescan logs, run final static
checks, commit/push the reports, and only then change status to **ACCEPTED**.
