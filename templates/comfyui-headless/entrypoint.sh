#!/usr/bin/env bash
set -euo pipefail

python3 "${COMFYUI_ROOT}/main.py" \
  --listen 127.0.0.1 \
  --port 8188 \
  --disable-auto-launch \
  ${COMFYUI_EXTRA_ARGS:-} &
comfy_pid=$!

cleanup() {
  kill "${comfy_pid}" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

python3 -m uvicorn gateway.main:app \
  --app-dir /opt/ovs \
  --host 0.0.0.0 \
  --port "${GATEWAY_PORT:-8080}"
