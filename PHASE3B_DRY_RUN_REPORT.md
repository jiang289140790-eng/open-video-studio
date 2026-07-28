# Phase 3B Dry Run Report

Status: `IMPLEMENTATION PASS — real-resource dry run not executed`

## Contract

The dry run accepts a real `GenerationPlan` plus verified base-model, LoRA, Workflow, Worker and Storage evidence. It executes Router output validation and resolves model, LoRA, prompt, seed, dimensions, reference image and output-node replacements.

It never calls `submit`, never starts a GPU job and always returns:

```json
{
  "status": "DRY_RUN_COMPLETE",
  "submitted_to_provider": false
}
```

## Redaction

The returned summary includes Registry IDs, node/input targets, resource hashes, prompt hashes and lengths, opaque user/job/reference identifiers, dimensions and output count.

It excludes:

- full positive or negative prompts;
- signed URLs and reference-image URLs;
- API keys, service credentials and webhook secrets;
- local absolute paths;
- raw Workflow JSON;
- provider endpoint details.

## Tests

A clearly labelled contract-only fixture verified the complete mapping. Assertions confirmed that:

- no provider submission occurred;
- full prompt text was absent;
- signed URL markers were absent;
- Windows and Linux local paths were absent;
- privileged credential markers were absent;
- mismatched workflow, model or LoRA bindings fail closed.

Gateway tests are 72/72.

## Pending real dry run

A real dry run was not executed because no real character LoRA, reference Workflow JSON or node mapping was supplied. Executing it with fabricated resources would violate the phase requirements.
