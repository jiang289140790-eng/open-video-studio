# LoRA Import Validation Report

Status: `PASS — validator ready; real LoRA absent`

## Enforced manifest fields

The validator requires:

- file reference, existence observation, SHA-256 and byte size;
- base architecture and at least one compatible model ID;
- at least one trigger word;
- default, minimum and maximum weight with `min <= default <= max`;
- source, license, version and Registry status;
- an independent `storage` or `worker` observation with verification time.

Unknown fields are rejected. Resource references must use `registry://` or `storage://`; local absolute paths are rejected.

For promotion to `testing` or `production`, every compatible model must already be ready and must match the LoRA base architecture. Observed hash and size must exactly match the manifest.

## Fail-closed promotion

The Gateway checks the complete merged Registry record before a LoRA status change. The staging database also enforces `lora_registry_promotion_requires_resources`, so bypassing the Gateway does not permit an incomplete real LoRA to enter `testing` or `production`.

The Phase 3A mock-only Registry fixture has a narrow exemption identified by both mock architecture and mock-only source. It cannot be mistaken for a real LoRA.

## Verification evidence

- Gateway contract tests: required fields, hash mismatch, size mismatch, architecture/model readiness and promotion rejection passed.
- Local PostgreSQL: Phase 3B pgTAP 18/18 passed.
- Local full Registry/RLS set: 115/115 passed.
- Supabase staging: new validation columns are readable through the Data API.
- Supabase staging: an attempted promotion of `phase3-character-lora-v1` without resources returned HTTP 400, and the row remained `draft`.

## Current real resource result

`phase3-character-lora-v1` remains:

- status: `draft`
- validation status: `missing`
- file evidence: absent

No LoRA checksum, size, source or license was invented.
