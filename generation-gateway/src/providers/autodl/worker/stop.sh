#!/usr/bin/env bash
set -euo pipefail

ROOT=/root/autodl-generation-worker

for name in worker comfyui; do
  pid_file="$ROOT/$name.pid"
  if [[ -f "$pid_file" ]]; then
    pid="$(cat "$pid_file")"
    if [[ "$pid" =~ ^[0-9]+$ ]] && kill -0 "$pid" 2>/dev/null; then
      kill "$pid"
      for _ in $(seq 1 20); do
        kill -0 "$pid" 2>/dev/null || break
        sleep 1
      done
    fi
  fi
done

