# ComfyUI Node Mapping Schema

Canonical schema: `generation-gateway/schemas/comfyui-node-mapping.schema.json`

Status: `PASS`

The schema uses JSON Schema Draft 2020-12, rejects additional properties and requires workflow identity plus all role mappings.

| Role | Required target |
| --- | --- |
| `model` | base model or UNet loader input |
| `lora_model` | LoRA filename/reference input |
| `lora_strength` | LoRA weight input |
| `reference_image` | image loader input |
| `positive_prompt` | positive text encoder input |
| `negative_prompt` | negative text encoder input |
| `seed` | sampler/seed input |
| `width` | latent/size width input |
| `height` | latent/size height input |
| `output` | image output/save input |

Each target requires `node_id`, `input_name` and `expected_class_type`. Runtime validation additionally checks uniqueness, node existence, input existence, exact class agreement and semantic class suitability.

The schema contains no model choice, local file path, provider URL or credential.
