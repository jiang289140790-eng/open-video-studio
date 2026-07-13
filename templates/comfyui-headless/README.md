# Open Video Studio ComfyUI Headless Runtime

This private deployment template preserves the Zealman API contract already used by the Supabase `ai` Edge Function. The same image can run on Compshare, AutoDL, or another Docker-capable GPU host.

## Runtime contract

- `GET /api/health`
- `GET /api/workflows/download/{filename}`
- `POST /api/workflow/generate`
- `POST /upload/image`
- `GET /history/{prompt_id}`
- `GET /view`

Set both `ZEALMAN_PANEL_BASE_URL` and `ZEALMAN_COMFY_BASE_URL` to this gateway URL. Set `HEADLESS_API_TOKEN` in the container and the same value as `ZEALMAN_API_TOKEN` in Supabase Secrets.

## Private runtime assets

Do not commit workflow exports, licensed models, user inputs, or provider keys. Mount them at runtime:

- `/opt/ovs/workflows`: API-format ComfyUI workflow JSON files.
- `/opt/ComfyUI/models`: model volume or platform model repository.
- `/opt/ComfyUI/custom_nodes`: qualified custom nodes copied from the known-good AutoDL image.
- `/opt/ComfyUI/input` and `/opt/ComfyUI/output`: working volumes.

Run `node scripts/prepare-comfyui-headless.mjs` to copy the six local workflow exports from the ignored `.data` directory into an ignored deployment bundle.

`workflow-manifest.json` also owns the seven user-facing generation capability contracts. A capability with status `missing` is a tracked implementation gap, not an executable workflow, and the bundle script deliberately excludes it. Status may advance only in this order: `missing` -> `inventory` -> `qualified` -> `published`.

## Build and run

```bash
docker build -t luravyn/comfyui-headless:0.1.0 templates/comfyui-headless
docker run --gpus all --rm -p 8080:8080 \
  -e HEADLESS_API_TOKEN=replace-me \
  -v /data/ovs/workflows:/opt/ovs/workflows:ro \
  -v /data/ovs/models:/opt/ComfyUI/models \
  -v /data/ovs/custom_nodes:/opt/ComfyUI/custom_nodes \
  luravyn/comfyui-headless:0.1.0
```

Use a Compshare `Postpay` instance. The Supabase function starts a stopped instance before a job, renews a safety shutdown timer during execution, and shortens the timer after completion. The platform enforces a minimum five-minute scheduled shutdown.

For an existing Compshare application image where nested Docker is unavailable, copy `gateway/`, `requirements.gateway.txt`, `start-native.sh`, and the private `workflows/` directory to `/root/ovs-headless`, create its Python virtual environment, and run `start-native.sh`. Save the qualified instance as a private Compshare image after A01 passes.

Copy `autostart-custom-node/` to `/root/ComfyUI/custom_nodes/ovs_gateway_autostart/` on application images. ComfyUI then restores the protected gateway after a stopped instance starts again. The loader verifies the gateway health endpoint instead of trusting an open port, reads secrets from the root-only `/root/ovs-headless/runtime.env`, and writes runtime output to `/root/ovs-headless/gateway.log`. Set `GATEWAY_REPLACE_PORT_OWNER=true` only when the selected public port is intentionally reassigned from a bundled service such as code-server.

For production access, copy `Caddyfile` to `/root/ovs-headless/Caddyfile`, install a pinned Caddy binary at `/root/ovs-headless/bin/caddy`, and set `GATEWAY_PUBLIC_HOST` to a hostname that resolves to the instance's fixed public IP. The same autostart package restores Caddy and its managed TLS certificate. Supabase must use the HTTPS hostname and must never retain the direct HTTP port as a production secret.

## Qualification order

1. A01 image generation.
2. G01 image-to-video.
3. G03 smooth image-to-video.
4. J11 digital-human/product video.
5. C16 and D14 character/storyboard workflows after their product inputs are mapped.
6. E01 masked image editing.
7. M01 one/two-reference image composition.
8. P01 identity-preserving pose generation.
9. O01 identity-preserving outfit change.
10. F01 consent-gated face swap.

Do not enable a workflow in Workflow Center until its health, output persistence, credit charge, failure refund, and timeout behavior pass.

`workflows/A01-compshare.json` is an original 1024px Qwen Image 2512 baseline for the current Compshare image. It deliberately omits the AutoDL A01 LoRA chain and SeedVR2 upscale stage until those exact dependencies are qualified. Use prompt node `4` and do not describe this baseline as the full AutoDL A01 workflow.
