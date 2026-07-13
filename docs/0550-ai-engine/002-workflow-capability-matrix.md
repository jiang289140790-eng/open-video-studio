# Generation Workflow Capability Matrix

| Field | Value |
|---|---|
| ID | AI-WORKFLOW-002 |
| Version | 1.2.0 |
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
| AI pose generation | P01 | Missing | D14 is a reference storyboard workflow, not pose control | Add DWPose/OpenPose control and identity conditioning, run full qualification |
| General image generation | A01-compshare | Qualified | Real Qwen Image 2512 credits-to-Storage loop passed | Add optional parameters and production HTTPS before publishing |
| Image composition | M01 | Inventory | D18 provides six switched reference inputs and Flux/Klein reference latents; the SaaS contract exposes only nodes 1103/1104 and disables four bundled demo inputs | Verify one-image and two-image behavior, simplify its local LLM dependency where possible, run full qualification |
| Image-to-video | G01 | Runtime qualified | Wan 2.2 dual-stage workflow produced a 25-frame MP4 from an uploaded image on AutoDL; prompt node 119 and image node 145 are now fixed server contracts | Run the authenticated credits, refund, Storage, history and on-demand shutdown qualification through Supabase |

## Acceptance Criteria

- The seven requested capabilities appear exactly once in the machine-readable manifest.
- Missing workflows cannot be copied into a deployment bundle or presented as executable.
- Existing A01 qualification evidence remains unchanged.
- G01 remains unpublished until its successful direct GPU result is repeated through the complete Supabase billing and asset loop.
- E01 remains unavailable until the Qwen edit model, manual-mask behavior and automatic-mask behavior pass runtime qualification.
- Every future status change updates this document, `SUMMARY.md`, `CHANGELOG.md` and the MVP backlog.

## Future Evolution

After E01 and G01 are qualified, finish M01, then implement P01, O01 and F01 in that order. P07/P17 are video action-transfer workflows and do not satisfy P01's required still-image output. Provider portability remains behind the existing AI provider interface; product pages do not depend on ComfyUI node IDs. E01 follows the native Qwen Image Edit loading and conditioning pattern documented by ComfyUI; the repository owns its API graph and explicit masked composite stage.

## AI Context

Treat `workflow-manifest.json` as the structured authority. Never infer that D14 covers pose generation or image composition merely because it accepts a reference image. Never mark a workflow complete from a successful ComfyUI preview alone; the SaaS data and billing loop is part of acceptance.

## Cross References

- [ComfyUI Qwen Image Edit native workflow](https://docs.comfy.org/tutorials/image/qwen/qwen-image-edit)
- [ComfyUI TextEncodeQwenImageEdit node](https://docs.comfy.org/built-in-nodes/TextEncodeQwenImageEdit)
- [AI-PROVIDER-001](001-provider-interface.md)
