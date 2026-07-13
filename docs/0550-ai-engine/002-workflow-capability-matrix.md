# Generation Workflow Capability Matrix

| Field | Value |
|---|---|
| ID | AI-WORKFLOW-002 |
| Version | 1.0.0 |
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
| AI image editing | E01 | Missing | No mask/inpaint workflow found in the AutoDL exports | Select inpaint/edit model, source and mask nodes, automatic mask strategy, run full qualification |
| AI face swap | F01 | Missing | No ReActor, InsightFace, PuLID or InstantID workflow found | Select identity stack, consent/safety checks, restoration stage, run full qualification |
| AI outfit change | O01 | Missing | No garment parsing or virtual try-on workflow found | Select human parsing and garment model, define body/hand preservation, run full qualification |
| AI pose generation | P01 | Missing | D14 is a reference storyboard workflow, not pose control | Add DWPose/OpenPose control and identity conditioning, run full qualification |
| General image generation | A01-compshare | Qualified | Real Qwen Image 2512 credits-to-Storage loop passed | Add optional parameters and production HTTPS before publishing |
| Image composition | M01 | Missing | D14 has one reference latent but does not implement generic one/two-image fusion | Add two reference inputs and explicit influence controls, run full qualification |
| Image-to-video | G01 | Inventory | Wan 2.2 API workflow export exists; G03 and J11 are alternatives | Install exact dependencies and pass video-specific qualification |

## Acceptance Criteria

- The seven requested capabilities appear exactly once in the machine-readable manifest.
- Missing workflows cannot be copied into a deployment bundle or presented as executable.
- Existing A01 qualification evidence remains unchanged.
- G01 remains unavailable until video output and refund behavior are tested.
- Every future status change updates this document, `SUMMARY.md`, `CHANGELOG.md` and the MVP backlog.

## Future Evolution

After E01 and G01 are qualified, implement M01, P01, O01 and F01 in that order. Provider portability remains behind the existing AI provider interface; product pages do not depend on ComfyUI node IDs.

## AI Context

Treat `workflow-manifest.json` as the structured authority. Never infer that D14 covers pose generation or image composition merely because it accepts a reference image. Never mark a workflow complete from a successful ComfyUI preview alone; the SaaS data and billing loop is part of acceptance.
