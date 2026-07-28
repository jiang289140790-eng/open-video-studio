# Phase 3 Architecture

Status: **IMPLEMENTATION BASELINE READY / REAL GPU ACCEPTANCE BLOCKED**  
Date: 2026-07-28  
Environment boundary: Render staging + Supabase project `wyvswkxogkmywduhrhkw` + AutoDL staging only.

## Data flow

1. The browser uploads one private reference image to the `generation-inputs` bucket under `<user_id>/...`.
2. `POST /v1/reference-analyses` verifies asset ownership and returns a runtime-validated `ReferenceAnalysis`.
3. The user must confirm or correct that analysis before submitting generation.
4. `GET /v1/characters` returns only safe character selection fields.
5. The Gateway validates reference ownership, exactly one person, adult confirmation, the trusted server-side character record, LoRA weight and model compatibility.
6. The persisted `GenerationPlan` contains registry IDs, not AutoDL endpoints or local paths.
7. Immediately before Provider submission, the Gateway creates a 15-minute signed input URL. It is attached only to the transient submission plan and is not persisted.
8. `AutoDLProvider` maps the provider-neutral plan to the unified Worker JSON contract.
9. The Worker must read the signed input, execute the fixed workflow, upload outputs directly to `generation-results/<user_id>/<job_id>/...`, and return normalized JSON.
10. Existing idempotent asset, billing, cancellation, retry and webhook handling remains unchanged.

## Fail-closed controls

- The workflow is `testing` and AutoDL-only.
- `phase3-character-lora-v1` is `draft`; its compatibility binding is also `draft`.
- Render does not allowlist `single-character-reference-remake-v1`.
- Mock is not a fallback for the real workflow.
- RunPod remains unconfigured and disabled.
- The Analyzer does not select a Provider or endpoint.
- Signed URLs, tokens, local paths and workflow JSON are not returned in public job responses.

## Current blocker

The real LoRA manifest and executable reference-remake node mapping do not exist in verified project evidence. AutoDL SSH port `46294` is unreachable and the previously known public Worker URL returns HTTP 404, so Worker deployment and real image validation cannot proceed.
