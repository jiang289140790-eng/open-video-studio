# Generation Workflow Capability Matrix

| Field | Value |
|---|---|
| ID | AI-WORKFLOW-002 |
| Version | 1.3.0 |
| Status | Active |
| Owner | AI Platform |
| Dependencies | AI-PROVIDER-001, BACKEND-GPU-004, API-IMAGE-002, API-VIDEO-003 |
| Referenced By | SUMMARY-001, ROADMAP-MVP-001 |

## Purpose

Define the permanent mapping between user-facing generation capabilities and executable ComfyUI workflows. The machine-readable source is `templates/comfyui-headless/workflow-manifest.json`; this document explains the product and qualification meaning without duplicating node graphs.

## Requirements

- A tool may be shown as operational only when its workflow status is `qualified` or `published`.
- Workflow IDs are permanent: E01 image editing, F01 face swap, O01 outfit change, P01 pose generation, A01 image generation, M01 image composition and G01 image-to-video.
- Raw ComfyUI exports, model weights, API tokens and user media remain outside Git.
- Each workflow must expose explicit input node mappings. Different product tools must not silently resolve to the same generic workflow unless the preset differences are encoded and tested.
- Qualification includes authentication, credit debit, failure refund, timeout, output validation, Supabase Storage persistence, asset/history visibility and GPU shutdown.

## Coverage

| Product capability | Workflow | Current status | Current evidence | Missing before release |
|---|---:|---|---|---|
| AI image editing | E01 | Inventory | Original API-format Qwen Image Edit workflow now maps prompt node 76, source node 78, mask node 79 and masked composite output 96 | Install `qwen_image_edit_fp8_e4m3fn.safetensors`, verify native nodes, add automatic-mask stage, run full qualification |
| AI face swap | F01 | Missing | No ReActor, InsightFace, PuLID or InstantID workflow found | Select identity stack, consent/safety checks, restoration stage, run full qualification |
| AI outfit change | O01 | Missing | No garment parsing or virtual try-on workflow found | Select human parsing and garment model, define body/hand preservation, run full qualification |
| AI pose generation | P01 | Runtime executable, quality gated | The P01 preset submitted two fixed D18 references and produced a valid 6,320,961-byte PNG; visual review showed a two-character composition rather than proven identity-preserving pose transfer | Add DWPose/OpenPose control or stronger pose conditioning, test with controlled identity/pose fixtures, then run full SaaS qualification |
| General image generation | A01-compshare | Qualified | Real Qwen Image 2512 credits-to-Storage loop passed | Add optional parameters and production HTTPS before publishing |
| Image composition | M01 | Runtime qualified | D18 accepted an uploaded reference through fixed node 1103, disabled unused demo inputs and produced a valid 6,146,977-byte PNG | Verify the two-image semantic quality, simplify its local LLM dependency where possible, then run credits/refund/Storage/history/shutdown qualification |
| Image-to-video | G01 | Runtime qualified | Wan 2.2 dual-stage workflow produced a 25-frame MP4 from an uploaded image on AutoDL; prompt node 119 and image node 145 are now fixed server contracts | Run the authenticated credits, refund, Storage, history and on-demand shutdown qualification through Supabase |

## Acceptance Criteria

- The seven requested capabilities appear exactly once in the machine-readable manifest.
- Missing workflows cannot be copied into a deployment bundle or presented as executable.
- Existing A01 qualification evidence remains unchanged.
- G01 remains unpublished until its successful direct GPU result is repeated through the complete Supabase billing and asset loop.
- E01 remains unavailable until the Qwen edit model, manual-mask behavior and automatic-mask behavior pass runtime qualification.
- M01 remains unpublished until two-image behavior and the complete SaaS data/billing loop pass.
- P01 remains unpublished: successful execution is not sufficient because the first visual result did not meet the identity-preserving pose acceptance gate.
- Every future status change updates this document, `SUMMARY.md`, `CHANGELOG.md` and the MVP backlog.

## Future Evolution

After E01 and G01 are qualified, finish M01, then replace or strengthen the P01 pose stage before implementing O01 and F01. P07/P17 are video action-transfer workflows and do not satisfy P01's required still-image output. Provider portability remains behind the existing AI provider interface; product pages do not depend on ComfyUI node IDs. E01 follows the native Qwen Image Edit loading and conditioning pattern documented by ComfyUI; the repository owns its API graph and explicit masked composite stage.

## AI Context

Treat `workflow-manifest.json` as the structured authority. Never infer that a reference-image workflow provides pose control merely because it executes. P01's D18 preset is an integration scaffold, not a qualified pose workflow. Never mark a workflow complete from a successful ComfyUI preview alone; visual semantics and the SaaS data/billing loop are part of acceptance.

## Cross References

- [ComfyUI Qwen Image Edit native workflow](https://docs.comfy.org/tutorials/image/qwen/qwen-image-edit)
- [ComfyUI TextEncodeQwenImageEdit node](https://docs.comfy.org/built-in-nodes/TextEncodeQwenImageEdit)
- [AI-PROVIDER-001](001-provider-interface.md)
