"""Start the Luravyn gateway when ComfyUI loads this custom node package."""

from __future__ import annotations

import os
import json
import socket
import subprocess
import time
import urllib.request
from pathlib import Path


RUNTIME_ROOT = Path(os.getenv("OVS_HEADLESS_ROOT", "/root/ovs-headless"))
RUNTIME_ENV = RUNTIME_ROOT / "runtime.env"
GATEWAY_LOG = RUNTIME_ROOT / "gateway.log"


def _read_runtime_env() -> dict[str, str]:
    values: dict[str, str] = {}
    if not RUNTIME_ENV.is_file():
        return values
    for line in RUNTIME_ENV.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        values[key.strip()] = value.strip().strip('"').strip("'")
    return values


def _gateway_is_healthy(port: int) -> bool:
    try:
        with urllib.request.urlopen(f"http://127.0.0.1:{port}/api/health", timeout=1) as response:
            payload = json.loads(response.read().decode("utf-8"))
            return response.status == 200 and payload.get("ok") is True
    except (OSError, ValueError):
        return False


def _port_is_open(port: int) -> bool:
    try:
        with socket.create_connection(("127.0.0.1", port), timeout=0.5):
            return True
    except OSError:
        return False


def _start_gateway() -> None:
    runtime = _read_runtime_env()
    port = int(runtime.get("GATEWAY_PORT", "7860"))
    if _gateway_is_healthy(port):
        return

    if _port_is_open(port):
        replace_owner = runtime.get("GATEWAY_REPLACE_PORT_OWNER", "false").lower() in {"1", "true", "yes"}
        if not replace_owner:
            print(f"[ovs-gateway] port {port} is owned by another service")
            return
        subprocess.run(["fuser", "-k", f"{port}/tcp"], check=False, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        for _ in range(20):
            if not _port_is_open(port):
                break
            time.sleep(0.25)
        if _port_is_open(port):
            print(f"[ovs-gateway] port {port} could not be released")
            return

    python = Path(runtime.get("GATEWAY_PYTHON", str(RUNTIME_ROOT / "venv" / "bin" / "python")))
    if not python.is_file() or not (RUNTIME_ROOT / "gateway" / "main.py").is_file():
        print("[ovs-gateway] runtime is incomplete; gateway was not started")
        return

    environment = os.environ.copy()
    environment.update(runtime)
    environment.setdefault("COMFYUI_URL", "http://127.0.0.1:8188")
    environment.setdefault("WORKFLOW_ROOT", str(RUNTIME_ROOT / "workflows"))

    GATEWAY_LOG.parent.mkdir(parents=True, exist_ok=True)
    with GATEWAY_LOG.open("ab", buffering=0) as log:
        subprocess.Popen(
            [
                str(python),
                "-m",
                "uvicorn",
                "gateway.main:app",
                "--app-dir",
                str(RUNTIME_ROOT),
                "--host",
                "0.0.0.0",
                "--port",
                str(port),
            ],
            cwd=RUNTIME_ROOT,
            env=environment,
            stdin=subprocess.DEVNULL,
            stdout=log,
            stderr=subprocess.STDOUT,
            start_new_session=True,
        )
    print(f"[ovs-gateway] started on port {port}")


def _start_tls_proxy() -> None:
    runtime = _read_runtime_env()
    public_host = runtime.get("GATEWAY_PUBLIC_HOST", "").strip()
    if not public_host:
        return
    binary = Path(runtime.get("CADDY_BINARY", str(RUNTIME_ROOT / "bin" / "caddy")))
    config = Path(runtime.get("CADDY_CONFIG", str(RUNTIME_ROOT / "Caddyfile")))
    if not binary.is_file() or not config.is_file():
        print("[ovs-gateway] Caddy runtime is incomplete; HTTPS proxy was not started")
        return
    running = subprocess.run(
        ["pgrep", "-f", f"{binary} run --config {config}"],
        check=False,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    ).returncode == 0
    if running:
        return

    environment = os.environ.copy()
    environment.update(runtime)
    environment.setdefault("CADDY_DATA_DIR", str(RUNTIME_ROOT / "caddy-data"))
    environment.setdefault("CADDY_CONFIG_DIR", str(RUNTIME_ROOT / "caddy-config"))
    caddy_log = RUNTIME_ROOT / "caddy.log"
    with caddy_log.open("ab", buffering=0) as log:
        subprocess.Popen(
            [str(binary), "run", "--config", str(config), "--adapter", "caddyfile"],
            cwd=RUNTIME_ROOT,
            env=environment,
            stdin=subprocess.DEVNULL,
            stdout=log,
            stderr=subprocess.STDOUT,
            start_new_session=True,
        )
    print(f"[ovs-gateway] HTTPS proxy started for {public_host}")


try:
    _start_gateway()
    _start_tls_proxy()
except Exception as error:  # ComfyUI must remain available if the sidecar fails.
    print(f"[ovs-gateway] autostart failed: {error}")


NODE_CLASS_MAPPINGS: dict[str, object] = {}
NODE_DISPLAY_NAME_MAPPINGS: dict[str, str] = {}
