#!/usr/bin/env bash
set -euo pipefail

COMFYUI_ROOT="${COMFYUI_ROOT:-/root/ComfyUI}"
WORKFLOW_ROOT="${WORKFLOW_ROOT:-/root/ovs-headless/workflows}"
COMFY_PYTHON="${COMFY_PYTHON:-/root/miniconda3/bin/python}"
GATEWAY_PYTHON="${GATEWAY_PYTHON:-/root/ovs-headless/venv/bin/python}"

export COMFYUI_URL="${COMFYUI_URL:-http://127.0.0.1:8188}"
export WORKFLOW_ROOT

"${COMFY_PYTHON}" "${COMFYUI_ROOT}/main.py" \
  --listen 127.0.0.1 \
  --port 8188 \
  --disable-auto-launch \
  ${COMFYUI_EXTRA_ARGS:-} &
comfy_pid=$!

cleanup() {
  kill "${comfy_pid}" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

"${GATEWAY_PYTHON}" -m uvicorn gateway.main:app \
  --app-dir /root/ovs-headless \
  --host 0.0.0.0 \
  --port "${GATEWAY_PORT:-8080}"
