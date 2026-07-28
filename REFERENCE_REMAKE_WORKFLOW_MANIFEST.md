# Reference Remake Workflow Manifest

Workflow ID: `single-character-reference-remake-v1`  
Version: `1.0.0`  
Status: `testing`  
Provider: `autodl` only  
Model: `persephone-flux-2-q8-v1`  
LoRA: `phase3-character-lora-v1` (`draft`, therefore fail-closed)

## Capability

- media type: image
- creation mode: image-to-image
- exactly one person and one reference image
- fixed character LoRA
- pose preservation
- composition reference
- scene replacement
- outfit and expression overrides
- ratios: 1:1 and 3:4
- outputs: 1–4
- timeout: 600,000 ms
- minimum VRAM declaration: 24 GB

## Worker mapping

The provider-neutral mapper emits:

- registry workflow reference
- job/user/reference/character IDs
- prompt package and overrides
- confirmed reference analysis
- fixed LoRA ID/version/weight/trigger words
- transient signed input URL
- owner-isolated output prefix

The real ComfyUI JSON and node IDs for reference load, pose control, composition control, LoRA, prompt, seed, dimensions and output count are still missing. The Render allowlist therefore excludes this workflow.
