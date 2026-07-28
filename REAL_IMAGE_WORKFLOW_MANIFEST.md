# Real Image Workflow Manifest

Status: **TESTING / INFRASTRUCTURE BLOCKED**

## Identity and capability

| Field | Value |
| --- | --- |
| ID | `single-person-text-to-image-v1` |
| Version | `1.0.0` |
| Status | `testing` |
| Provider | `runpod` |
| Media/task | `image` / `text_to_image` |
| People count | exactly `1` |
| Style | `photorealistic` |
| Reference image | false |
| Character/style LoRA | false / false |
| Pose/ControlNet/IPAdapter | false / false / false |
| Ratios | `1:1`, `4:5` |
| Output count | 1–4 |
| Minimum VRAM metadata | 24 GB, pending real Worker validation |
| Maximum execution time | 600,000 ms |

## Input schema

The Gateway maps the provider-neutral Generation Plan to:

```json
{
  "schema_version": "1.0",
  "workflow": {
    "id": "single-person-text-to-image-v1",
    "version": "1.0.0",
    "comfyui_workflow_ref": "configuration reference",
    "model_manifest_ref": "configuration reference"
  },
  "request": {
    "job_id": "job ID",
    "user_id": "authenticated owner UUID",
    "prompt": "compiled prompt",
    "negative_prompt": "compiled negative prompt",
    "aspect_ratio": "1:1 or 4:5",
    "output_count": "1 to 4",
    "seed": "integer or null"
  },
  "storage": {
    "bucket": "generation-results",
    "path_prefix": "generation-results/{user_id}/{job_id}"
  }
}
```

## Output schema

The Worker must upload image bytes directly to private object storage and return metadata only:

```json
{
  "schema_version": "1.0",
  "job_id": "job ID",
  "user_id": "owner UUID",
  "assets": [{
    "storage_path": "generation-results/{user_id}/{job_id}/output-0.png",
    "signed_url": "temporary HTTPS URL",
    "signed_url_expires_at": "ISO-8601 timestamp",
    "mime_type": "image/png",
    "width": 1024,
    "height": 1024,
    "output_index": 0,
    "checksum_sha256": "optional 64-character digest"
  }],
  "metrics": {
    "gpu_type": "provider GPU name",
    "generation_duration_ms": 0,
    "estimated_cost": 0,
    "actual_cost": 0
  }
}
```

Inline image bytes, `data:` URLs, empty asset arrays, duplicate output indexes, expired URLs and cross-user paths are rejected.

## ComfyUI node mapping

Concrete node IDs are deliberately **not fabricated**. The missing workflow JSON must supply and validate these mappings:

| Semantic input/output | Required concrete mapping |
| --- | --- |
| positive prompt | text encoder positive node/input |
| negative prompt | text encoder negative node/input |
| width/height | latent/image size node inputs for the selected ratio |
| seed | sampler seed input |
| output count | batch size or controlled iteration input |
| model | checkpoint loader selected by model manifest |
| output | save/upload node producing the Storage contract |

The workflow reference comes from `RUNPOD_COMFYUI_WORKFLOW_REF`; the model reference comes from `RUNPOD_MODEL_MANIFEST_REF`. Neither is exposed to the frontend.

## Model dependency manifest

Registered metadata:

- binding: `single-person-photorealistic-model-v1`
- architecture: configuration-defined
- checkpoint files: missing
- checksum: missing
- license verification: required
- automatic download: disabled
- LoRA dependencies: none

The workflow cannot move from `testing` to `production` until the concrete files, checksums, license and node mapping are supplied and benchmarked.

