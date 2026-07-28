# Phase 3B Resource Integration Specification

Status: `READY_FOR_RESOURCES`

## Scope

Phase 3B-Preparation establishes the import, validation, readiness and dry-run contracts for `single-character-reference-remake-v1`. It does not download a model, import a fabricated LoRA, start a GPU worker or submit a provider job.

The existing `GenerationProvider` interface is unchanged. Provider-specific addresses, tokens and ComfyUI details remain outside the frontend, parser, prompt engine and domain model.

## Resource lifecycle

1. Register the real base model and license evidence in `model_registry`.
2. Submit the LoRA manifest and an independent Storage/Worker observation to the LoRA validator.
3. Import the ComfyUI API Workflow JSON together with a node mapping that conforms to `schemas/comfyui-node-mapping.schema.json`.
4. Persist only validated hashes, node mapping and validation status in the Registry.
5. Verify the AutoDL Worker health endpoint and one direct Worker-to-Storage upload.
6. Run the redacted dry run with a real `GenerationPlan`.
7. Set the operational resource and Storage attestations only after steps 1–6 pass.
8. Add the real reference workflow to the allowlist only after the runtime checklist is fully ready.

## Runtime readiness gate

The gate has four layers:

- Configuration rejects an allowlisted reference workflow unless `PHASE3B_RESOURCES_READY=true`.
- The Storage checklist remains `unverified` unless `PHASE3B_STORAGE_UPLOAD_VERIFIED=true`.
- The live checklist reads model, LoRA and Workflow validation evidence from staging Registry and checks Worker health.
- A real reference generation request re-runs the checklist before `engine.create`; missing evidence returns `PHASE3B_RESOURCES_NOT_READY` and no provider is called.

The two attestation variables are deployment controls, not secrets. Their default is `false`, and Render requires an explicit value.

## Administrative API

| Endpoint | Purpose |
| --- | --- |
| `GET /v1/admin/phase3b/resources` | Current six-part resource checklist and allowlist gate |
| `POST /v1/admin/phase3b/validate-lora` | Strict LoRA manifest and observed-file validation |
| `POST /v1/admin/phase3b/validate-workflow` | Workflow JSON and node mapping validation |
| `POST /v1/admin/phase3b/dry-run` | Redacted payload mapping without provider submission |

All endpoints require `admin` or `operator`. The browser receives no provider endpoint, token, signed URL, model file path or raw Worker payload.

## Registry persistence

Migration `20260728122736_phase3b_resource_validation_fields.sql` adds verified file evidence to `lora_registry`, and import status, hashes, mapping and errors to `workflow_registry`. A database check constraint independently prevents a non-mock LoRA from entering `testing` or `production` without complete verified evidence.

Rollback is provided by `supabase/rollback/20260728122736_phase3b_resource_validation_fields.rollback.sql`.

## Current resource state

The real base model, character LoRA, Workflow JSON and node mapping are intentionally `missing`; Worker health is not accepted as ready; Storage upload is `unverified`. Therefore the workflow remains outside the real-provider allowlist.
