#!/usr/bin/env bash
set -euo pipefail

ROOT=/root/autodl-generation-worker
COMFY_ROOT=/root/ComfyUI
LOG_ROOT=/root/autodl-tmp/generation-worker-logs
mkdir -p "$LOG_ROOT"
set -a
source "$ROOT/.env"
set +a

LOCK_DIR=/tmp/autodl-generation-worker-start.lock
if ! mkdir "$LOCK_DIR" 2>/dev/null; then
  echo "AutoDL worker startup is already in progress"
  exit 0
fi
trap 'rmdir "$LOCK_DIR" 2>/dev/null || true' EXIT

# AutoDL's image starts ComfyUI on the only publicly proxied application port.
# Move only that known ComfyUI process to the internal port so the authenticated
# Generation Worker can own port 6006. Never terminate an unknown listener.
for legacy_pid in $(lsof -t -iTCP:6006 -sTCP:LISTEN 2>/dev/null || true); do
  legacy_cwd="$(readlink "/proc/$legacy_pid/cwd" 2>/dev/null || true)"
  legacy_cmd="$(tr '\0' ' ' <"/proc/$legacy_pid/cmdline" 2>/dev/null || true)"
  if [[ "$legacy_cwd" == "$COMFY_ROOT" && "$legacy_cmd" == *"main.py"* ]]; then
    kill "$legacy_pid"
    for _ in $(seq 1 30); do
      kill -0 "$legacy_pid" 2>/dev/null || break
      sleep 1
    done
  fi
done

if curl --silent --fail http://127.0.0.1:18188/system_stats >/dev/null; then
  comfy_pid="$(lsof -t -iTCP:18188 -sTCP:LISTEN 2>/dev/null | head -1 || true)"
  [[ -n "$comfy_pid" ]] && echo "$comfy_pid" >"$ROOT/comfyui.pid"
  echo "internal ComfyUI is already running"
elif [[ -f "$ROOT/comfyui.pid" ]] && kill -0 "$(cat "$ROOT/comfyui.pid")" 2>/dev/null; then
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

worker_status="$(curl --silent --output /dev/null --write-out '%{http_code}' \
  --header "Authorization: Bearer $AUTODL_API_TOKEN" \
  http://127.0.0.1:6006/health || true)"
if [[ "$worker_status" == "200" ]]; then
  worker_pid="$(lsof -t -iTCP:6006 -sTCP:LISTEN 2>/dev/null | head -1 || true)"
  [[ -n "$worker_pid" ]] && echo "$worker_pid" >"$ROOT/worker.pid"
  echo "AutoDL worker is already running"
elif [[ -f "$ROOT/worker.pid" ]] && kill -0 "$(cat "$ROOT/worker.pid")" 2>/dev/null; then
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

for _ in $(seq 1 60); do
  status="$(curl --silent --output /dev/null --write-out '%{http_code}' \
    --header "Authorization: Bearer $AUTODL_API_TOKEN" \
    http://127.0.0.1:6006/health || true)"
  [[ "$status" == "200" ]] && exit 0
  sleep 1
done
echo "AutoDL worker failed its authenticated health check" >&2
exit 1
