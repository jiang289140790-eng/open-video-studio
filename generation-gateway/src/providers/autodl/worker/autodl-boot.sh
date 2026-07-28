#!/usr/bin/env bash
set -euo pipefail

# The base AutoDL image launches its own ComfyUI process during container boot.
# Wait for that process to settle, then hand the public port to the staging worker.
sleep "${AUTODL_BOOT_DELAY_SECONDS:-25}"
exec /root/autodl-generation-worker/start.sh
