# Phase 3B Preparation Status

Overall status: `READY_FOR_RESOURCES`

This phase is not marked `ACCEPTED`, because the required real resources and real-resource dry run do not yet exist.

## Completed

- Render staging first deployed `87f375e` for the Phase 3A regression, then deployed Phase 3B preparation commit `c87dfe5`; health, readiness, online Mock Reference regression and the online resource gate passed.
- Strict LoRA manifest/observation validator implemented.
- Gateway and database LoRA promotion gates implemented.
- ComfyUI Workflow JSON and node-mapping validator implemented.
- JSON Schema for the ten required ComfyUI mapping roles added.
- Admin/operator resource checklist page implemented.
- Registry-backed resource readiness and Worker/Storage states implemented.
- Runtime re-check prevents a real reference job from reaching `engine.create` while resources are incomplete.
- Redacted provider-free dry run implemented.
- Mock Reference Pipeline regression preserved.
- Supabase migration 20/20 applied to the authorized staging project.
- Local migration replay, rollback and re-apply passed.

## Verification baseline

| Check | Result |
| --- | --- |
| Open Video Studio | 75/75 |
| Generation Gateway | 72/72 |
| Local Registry/RLS pgTAP | 115/115 |
| Phase 3B local pgTAP | 18/18 |
| Root typecheck/build | pass |
| Gateway lint/typecheck/build | pass |
| Web production build | pass |
| `git diff --check` | pass |

The linked pgTAP command could not use the staging `extensions` schema because Supabase's migration login role lacks that permission. This is not recorded as a pgTAP pass. Instead, the staging Data API verified every new column and confirmed that incomplete real-LoRA promotion is rejected with HTTP 400 while the record remains `draft`.

## Current checklist

| Resource | State |
| --- | --- |
| Base model | `missing` |
| Character LoRA | `missing` |
| Workflow JSON | `missing` |
| Node mapping | `missing` |
| AutoDL Worker | not accepted as ready |
| Storage upload | `unverified` |
| Real-resource Dry Run | not run |
| Real reference provider allowlist | locked |

## Required next inputs

1. Real base-model Registry record with file reference, SHA-256, size and license evidence.
2. Real character LoRA manifest and independent Storage/Worker observation.
3. ComfyUI API Workflow JSON.
4. Node mapping conforming to the committed schema.
5. Online Worker health verification without submitting a generation.
6. One verified direct Worker-to-staging-Storage upload.
7. A successful redacted dry run using the real resources.

Only after all seven inputs pass may the readiness attestations be enabled and the real reference workflow be added to the staging allowlist.

No production Supabase project was accessed, `main` was not modified, and no real GPU result was generated or claimed.
