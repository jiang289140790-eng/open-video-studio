# ComfyUI Workflow Import Specification

Status: `READY_FOR_RESOURCES`

## Import package

An import request contains:

- `workflow_id`, semantic version, model ID and LoRA ID;
- a ComfyUI API-format Workflow object keyed by node ID;
- a node mapping conforming to `schemas/comfyui-node-mapping.schema.json`.

The Workflow must be API format, not the visual editor export format. Every node must contain a non-empty `class_type` and an `inputs` object.

## Required validation

The importer verifies:

1. Workflow and mapping IDs and versions match.
2. All ten required roles are mapped.
3. Every mapped node exists.
4. Every mapped input exists on that node.
5. The declared and actual node classes match exactly.
6. A node class is suitable for its semantic role.
7. No two roles target the same node/input pair.
8. Model, LoRA, reference image, positive prompt, negative prompt, seed, width, height and output roles are present.
9. No Windows, Linux home/system absolute path, localhost endpoint, bearer value, API key marker or webhook secret is embedded.

Validation returns stable issue codes and paths. Invalid packages receive HTTP 422 and are not considered ready.

## Registry evidence

After a successful real import, Registry must record:

- `workflow_import_status=ready`;
- SHA-256 of the Workflow JSON;
- the validated node mapping;
- SHA-256 of the mapping;
- an empty validation-error list;
- validation timestamp.

The full Workflow file remains a controlled resource referenced by Registry; it is not exposed to the browser or embedded in the core domain model.

## Current result

No real reference Workflow JSON or node mapping was supplied in this phase. Staging therefore reports both resources as `missing`; no sample Workflow is persisted as real.
