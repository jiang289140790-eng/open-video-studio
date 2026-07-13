# Generation Workflow Capability Matrix

| Field | Value |
|---|---|
| ID | AI-WORKFLOW-002 |
| Version | 1.6.0 |
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
| AI image editing | E01 | Runtime qualified | Repository-owned Qwen Image Edit 2509 graph ran on AutoDL and produced a 1,015,671-byte masked PNG; expanded Gaussian mask blending removed the hard rectangular seam seen in the first run | Add automatic-mask generation and run authenticated debit/refund/Storage/history qualification |
| AI face swap | F01 | Runtime qualified, identity gated | The fixed D18 target/identity preset produced a valid 7,256,708-byte PNG with one subject and preserved red dress, pose, chair and outdoor scene; explicit identity consent is enforced server-side | Measure identity similarity with controlled fixtures, prefer an InsightFace/PuLID/InstantID stack for production fidelity, add face-safety checks and run the full SaaS qualification |
| AI outfit change | O01 | Runtime qualified | The fixed D18 person/garment preset produced a valid 7,139,337-byte PNG with one subject, preserved seated pose/chair/outdoor background and replaced the red dress with the black-and-white reference garment | Run controlled identity similarity fixtures and the complete credits/refund/Storage/history/shutdown qualification |
| AI pose generation | P01 | Runtime executable, identity gated | Dedicated P01 now uses OpenPose preprocessing plus Qwen ControlNet Union. Runtime proved pose control without visible skeleton artifacts, but Qwen copied the pose-reference character instead of preserving the identity source | Add FaceID/IP-Adapter/InstantID identity locking, then repeat controlled identity/pose fixtures and the full SaaS qualification |
| General image generation | A01-compshare | Qualified | Real Qwen Image 2512 credits-to-Storage loop passed | Add optional parameters and production HTTPS before publishing |
| Image composition | M01 | Runtime qualified | D18 accepted an uploaded reference through fixed node 1103, disabled unused demo inputs and produced a valid 6,146,977-byte PNG | Verify the two-image semantic quality, simplify its local LLM dependency where possible, then run credits/refund/Storage/history/shutdown qualification |
| Image-to-video | G01 | Runtime qualified | Wan 2.2 dual-stage workflow produced a 25-frame MP4 from an uploaded image on AutoDL; prompt node 119 and image node 145 are now fixed server contracts | Run the authenticated credits, refund, Storage, history and on-demand shutdown qualification through Supabase |

## Acceptance Criteria

- The seven requested capabilities appear exactly once in the machine-readable manifest.
- Missing workflows cannot be copied into a deployment bundle or presented as executable.
- Existing A01 qualification evidence remains unchanged.
- G01 remains unpublished until its successful direct GPU result is repeated through the complete Supabase billing and asset loop.
- E01 remains unpublished until automatic masking and the authenticated billing/Storage/history loop pass; manual-mask runtime is qualified.
- M01 remains unpublished until two-image behavior and the complete SaaS data/billing loop pass.
- P01 remains unpublished: OpenPose execution is proven, but identity preservation must pass before release.
- O01 remains unpublished until controlled identity preservation and the complete SaaS data/billing loop pass.
- F01 remains unpublished until identity similarity, consent/audit behavior, misuse safeguards and the complete SaaS data/billing loop pass.
- Every future status change updates this document, `SUMMARY.md`, `CHANGELOG.md` and the MVP backlog.

## Future Evolution

Finish the authenticated SaaS qualification for E01, G01, M01, O01 and F01. Strengthen P01 with a dedicated identity adapter while retaining OpenPose as the pose-control signal. P07/P17 are video action-transfer workflows and do not satisfy P01's required still-image output. Provider portability remains behind the existing AI provider interface; product pages do not depend on ComfyUI node IDs.

## AI Context

Treat `workflow-manifest.json` as the structured authority. P01 has real OpenPose/ControlNet control, but it is still identity-gated. Never mark a workflow complete from a successful ComfyUI preview alone; visual semantics and the SaaS data/billing loop are part of acceptance.

## Cross References

- [ComfyUI Qwen Image Edit native workflow](https://docs.comfy.org/tutorials/image/qwen/qwen-image-edit)
- [ComfyUI TextEncodeQwenImageEdit node](https://docs.comfy.org/built-in-nodes/TextEncodeQwenImageEdit)
- [AI-PROVIDER-001](001-provider-interface.md)
