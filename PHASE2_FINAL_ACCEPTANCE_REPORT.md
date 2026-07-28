# Phase 2 Final Acceptance Report

Date: 2026-07-28

Branch: `codex/render-staging`

Final status: **ACCEPTED**

## Accepted scope

Phase 2 delivered one temporary real-GPU staging chain:

- image
- text-to-image
- one adult person
- photorealistic
- no reference image
- no LoRA or control model
- fixed versioned workflow
- 1–4 outputs
- `1:1` and `4:5`

AutoDL is accepted only as the temporary Phase 2 staging Provider. It is not a
final production-platform decision.

## Acceptance matrix

| Gate | Result |
| --- | --- |
| Generation Gateway | 50/50 pass |
| Open Video Studio | 75/75 pass |
| AI Marketing Studio lint/typecheck/build/migrations | pass |
| Supabase staging migrations | 16/16 aligned |
| Supabase linked RLS/idempotency | 61/61 pass |
| Render deployment | `dep-d9k5ah3m8hqs73bmhs50` live |
| Render health/readiness | pass |
| AutoDL Worker health | pass |
| invalid JWT / CORS | pass |
| real completed image | pass |
| full real state chain | pass |
| page refresh recovery | pass |
| user/job/asset isolation | pass |
| failed / timeout | pass |
| cancelled / retry | pass |
| duplicate submit/webhook | pass |
| no matching real workflow | fail-closed pass |
| cancellation race handling | pass |
| orphan cleanup | pass, final count 0 |
| 10-class benchmark | 10/10 completed |
| benchmark failure rate | 0% |
| cost recording | pass at ¥2.78/hour |
| Render/Worker log redaction | 0 matches |
| MockProvider regression | pass |
| secret scan / JSON-YAML / diff check | pass |

## Real benchmark

- overall manual score: 4.53/5
- mean generation time: 15.233 seconds
- proportional attributed cost: ¥0.11763259 for 10 outputs
- known limitations: low-angle composition and strict white-background
  commercial framing

These limitations are recorded but do not block the narrow Phase 2 transport,
state, security, storage, and rollback objective.

## Safety and scope

- No production Supabase project was accessed.
- No production deployment or `main` merge occurred.
- RunPodProvider remains disabled.
- No real video Provider, LoRA, checkpoint expansion, reference-image flow, or
  additional workflow type was added.
- Test users, jobs, assets, Storage objects, review copies, and Worker states
  were cleaned.

## Decision

All Phase 2 gates for the authorized temporary AutoDL staging chain are
satisfied. Phase 2 is **ACCEPTED**.

Before any production use, rotate credentials that appeared in chat and run a
separate production-readiness review for the final GPU platform.
