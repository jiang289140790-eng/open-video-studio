# Phase 3A Acceptance Report

Date: 2026-07-28

Branch: `codex/render-staging`

Scope status: **ACCEPTED**

## Scope

Phase 3A completes the GPU-independent reference pipeline and registry
management surfaces. It does not enable a real GPU, a real LoRA file, a new
Provider interface, or a production workflow.

The accepted flow is:

`private reference upload -> Mock Analyzer -> user edit/confirmation ->
character selection -> GenerationPlan -> MockProvider job -> refresh recovery`

## Delivered UI

### Character management

- Character selector with owner-scoped records.
- Character detail and lifecycle status.
- Declared adult-age metadata and LoRA binding summary.
- Three mock preview assets per Phase 3A test character.
- Mock character creation is explicit and does not claim a real LoRA file.

### Reference analysis confirmation

- JPG, PNG, and WebP upload to the private `generation-inputs` bucket.
- User-isolated Storage paths under the authenticated user ID.
- Explicit `analyzer_mode: mock`.
- Structured analysis fields for people count, shot, pose, camera, composition,
  body region, scene, lighting, expression, and outfit.
- User editing and explicit confirmation before planning.
- Persisted confirmation ID is required by the Gateway; an unpersisted or
  mismatched confirmation fails closed.

### Workflow and LoRA Registry

- Workflow list, capability tags, lifecycle status, semantic version, and
  immutable version history.
- LoRA metadata, lifecycle status, compatibility bindings, weight ranges, and
  immutable version history.
- Registry management endpoints are restricted to `admin` and `operator`.
- Ordinary users cannot read registry revision history.
- The mock LoRA has no filename, Storage path, or checksum and is labelled
  `mock_only`.

## Mock reference workflow

Workflow ID: `mock-character-reference-remake-v1`

- Provider: `mock` only.
- Media/task: `image` / `image_to_image`.
- Capabilities: reference, character, and pose planning.
- Ratios: `1:1`, `3:4`.
- Outputs: 1 to 4.
- No real model, LoRA, GPU, or Worker dependency.
- The existing real Phase 3 workflow remains AutoDL-only and is not used as a
  fallback.

The browser acceptance run completed:

1. Authenticated reference upload to private Storage.
2. `media_assets` owner row creation.
3. Mock analysis.
4. User edit of the scene field.
5. Explicit analysis confirmation.
6. Mock character selection and plan preview.
7. Two-output MockProvider job.
8. Terminal `completed` state with two result assets.
9. Page reload with job ID, completed state, and both assets restored.
10. Character preview assets and LoRA version history rendered.

During this run, the browser exposed a missing table privilege on
`media_assets`. Migration `20260728085455_phase3a_media_asset_grants.sql`
fixes only the outer table privilege gate. Existing owner RLS policies remain
authoritative and the online isolation test verifies that user A cannot read or
insert an asset for user B.

## Database acceptance

- Local clean replay: **19/19 migrations applied from the first migration**.
- Staging alignment: **19/19 local and linked migration versions match**.
- Staging project: `wyvswkxogkmywduhrhkw` (previously authorized as
  non-production staging).
- Formal local pgTAP: **97/97 passed**.
- Phase 3A pgTAP: **17/17 passed**.
- Online-style RLS script: passed locally and against linked staging.
- Registry revision tables exist with RLS enabled.
- Ordinary users see zero Workflow/LoRA revision rows.
- Authenticated users can insert/read only owner-scoped `media_assets`.
- `service_role` has the minimum `SELECT` privilege needed to validate
  reference ownership.
- Phase 3A registry rollback and re-application passed.
- The follow-up media privilege rollback produced the expected revoked state,
  and re-application restored the expected state.

The linked pgTAP runner cannot execute functions in the staging `extensions`
schema with its login role. This is a Supabase CLI runner-role limitation, not
a test failure. The equivalent no-pgTAP online check executes the actual RLS
roles and assertions in one transaction and passed.

## Automated acceptance

| Gate | Result |
| --- | --- |
| Open Video Studio tests | 75/75 pass |
| Generation Gateway tests | 60/60 pass |
| Generation Gateway typecheck/build | pass |
| Open Video Studio typecheck/build | pass |
| Phase 3A database tests | 17/17 pass |
| Full Generation/Phase 3/Phase 3A RLS suite | 97/97 pass |
| Local full migration replay | 19/19 pass |
| Staging migration alignment | 19/19 pass |
| Linked staging RLS isolation check | pass |
| Browser Mock reference pipeline | pass |
| Refresh recovery | pass |
| Registry admin UI and version history | pass |
| `git diff --check` | pass |
| Changed-file secret scan | pass |
| JSON parse | 13 files pass |
| YAML parse | 2 files pass |

## Deployment observation

Implementation commit `ad5dbd7` was pushed to `codex/render-staging`.
The existing Render staging service continued to pass `/health` and `/ready`
during acceptance. Phase 3A did not define Render deployment as an acceptance
gate; no claim is made here that the online service has already switched to
this commit.

## Safety and non-goals

- No production Supabase project was accessed.
- No change was made to `main`.
- No Provider interface was changed.
- No real GPU, ComfyUI Worker, model, checkpoint, or LoRA file was used.
- No real task silently falls back to MockProvider.
- No secret was added to the repository or returned by an API.

## Decision

All acceptance gates stated for Phase 3A are satisfied. Phase 3A is
**ACCEPTED** for the GPU-independent UI, registry, database, RLS, Gateway, and
Mock reference pipeline scope.
