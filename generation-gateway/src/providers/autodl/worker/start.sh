#!/usr/bin/env bash
set -euo pipefail

ROOT=/root/autodl-generation-worker
COMFY_ROOT=/root/ComfyUI
LOG_ROOT=/root/autodl-tmp/generation-worker-logs
mkdir -p "$LOG_ROOT"

if [[ -f "$ROOT/comfyui.pid" ]] && kill -0 "$(cat "$ROOT/comfyui.pid")" 2>/dev/null; then
  echo "internal ComfyUI is already running"
else
  export PATH="/usr/local/bin:/root/miniconda3/bin:$PATH"
  export NO_ALBUMENTATIONS_UPDATE=1
  export NUMBA_THREADING_LAYER=workqueue
  export no_proxy="localhost,127.0.0.1,::1"
  export NO_PROXY="$no_proxy"
  if [[ -f /tmp/.comfyui-ld-cache ]]; then
    export LD_LIBRARY_PATH="$(cat /tmp/.comfyui-ld-cache)"
  fi
  cd "$COMFY_ROOT"
  nohup /root/miniconda3/bin/python main.py \
    --port 18188 \
    --listen 127.0.0.1 \
    --disable-auto-launch \
    >"$LOG_ROOT/comfyui.log" 2>&1 &
  echo "$!" >"$ROOT/comfyui.pid"
fi

for _ in $(seq 1 120); do
  if curl --silent --fail http://127.0.0.1:18188/system_stats >/dev/null; then
    break
  fi
  sleep 1
done
curl --silent --fail http://127.0.0.1:18188/system_stats >/dev/null

if [[ -f "$ROOT/worker.pid" ]] && kill -0 "$(cat "$ROOT/worker.pid")" 2>/dev/null; then
  echo "AutoDL worker is already running"
else
  cd "$ROOT"
  set -a
  source "$ROOT/.env"
  set +a
  nohup "$ROOT/.venv/bin/uvicorn" app:app \
    --host 0.0.0.0 \
    --port 6006 \
    --proxy-headers \
    >"$LOG_ROOT/worker.log" 2>&1 &
  echo "$!" >"$ROOT/worker.pid"
fi

