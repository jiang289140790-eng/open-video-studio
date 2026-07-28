from __future__ import annotations

import hashlib
import json
import os
import time
import uuid
from pathlib import Path
from typing import Any

import httpx


WORKER_URL = os.environ.get(
    "AUTODL_INTERNAL_WORKER_URL", "http://127.0.0.1:6006"
).rstrip("/")
ENV_PATH = Path(
    os.environ.get("AUTODL_WORKER_ENV", "/root/autodl-generation-worker/.env")
)
RESULT_PATH = Path(
    os.environ.get(
        "NEGATIVE_RESULT_PATH",
        "/root/autodl-tmp/generation-worker-logs/negative-paths.json",
    )
)
STATE_DIR = Path(
    os.environ.get(
        "AUTODL_WORKER_STATE_DIR",
        "/root/autodl-tmp/generation-worker-state",
    )
)


def load_env() -> dict[str, str]:
    values: dict[str, str] = {}
    for raw in ENV_PATH.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if line and not line.startswith("#") and "=" in line:
            key, value = line.split("=", 1)
            values[key] = value.strip().strip('"').strip("'")
    return values


def provider_id(job_id: str) -> str:
    return "autodl_" + hashlib.sha256(job_id.encode()).hexdigest()[:32]


def body(
    job_id: str,
    user_id: str,
    *,
    seed: int,
    output_count: int = 1,
    timeout_ms: int = 600_000,
    path_owner: str | None = None,
) -> dict[str, Any]:
    owner = path_owner or user_id
    return {
        "input": {
            "schema_version": "1.0",
            "workflow": {
                "id": "single-person-text-to-image-v1",
                "version": "1.0.0",
                "comfyui_workflow_ref": (
                    "registry://workflows/"
                    "single-person-text-to-image-v1/1.0.0"
                ),
                "model_manifest_ref": (
                    "registry://models/"
                    "single-person-photorealistic-model-v1/1.0.0"
                ),
            },
            "request": {
                "job_id": job_id,
                "user_id": user_id,
                "prompt": (
                    "photorealistic portrait of one adult woman, "
                    "natural light, realistic anatomy"
                ),
                "negative_prompt": "",
                "aspect_ratio": "1:1",
                "output_count": output_count,
                "seed": seed,
            },
            "storage": {
                "bucket": "generation-results",
                "path_prefix": (
                    f"generation-results/{owner}/{job_id}"
                ),
            },
        },
        "policy": {"execution_timeout_ms": timeout_ms},
    }


def wait_terminal(
    client: httpx.Client,
    headers: dict[str, str],
    identifier: str,
    timeout_seconds: int,
) -> tuple[dict[str, Any], list[str]]:
    deadline = time.monotonic() + timeout_seconds
    observed: list[str] = []
    last: dict[str, Any] = {}
    while time.monotonic() < deadline:
        response = client.get(
            f"{WORKER_URL}/v1/jobs/{identifier}", headers=headers
        )
        response.raise_for_status()
        last = response.json()
        if not observed or observed[-1] != last["status"]:
            observed.append(last["status"])
        if last["status"] in {
            "completed",
            "failed",
            "cancelled",
            "timeout",
        }:
            return last, observed
        time.sleep(1)
    raise TimeoutError(
        f"worker job did not terminate; last={last.get('status')}"
    )


def main() -> None:
    env = load_env()
    token = env["AUTODL_API_TOKEN"]
    headers = {
        "authorization": f"Bearer {token}",
        "content-type": "application/json",
    }
    user_id = str(uuid.uuid4())
    state_ids: list[str] = []
    result: dict[str, Any] = {
        "schema_version": "1.0",
        "started_at": time.time(),
        "provider": "autodl",
    }
    with httpx.Client(timeout=30, trust_env=False) as client:
        invalid_auth = client.get(
            f"{WORKER_URL}/health",
            headers={"authorization": "Bearer invalid"},
        )
        result["invalid_auth_http"] = invalid_auth.status_code

        bad_owner_job = f"negative-owner-{uuid.uuid4().hex[:10]}"
        bad_owner = client.post(
            f"{WORKER_URL}/v1/jobs",
            headers=headers,
            json=body(
                bad_owner_job,
                user_id,
                seed=2026072890,
                path_owner=str(uuid.uuid4()),
            ),
        )
        result["storage_owner_mismatch_http"] = bad_owner.status_code

        cancel_job = f"negative-cancel-{uuid.uuid4().hex[:10]}"
        cancel_provider_id = provider_id(cancel_job)
        state_ids.append(cancel_provider_id)
        submitted = client.post(
            f"{WORKER_URL}/v1/jobs",
            headers=headers,
            json=body(
                cancel_job,
                user_id,
                seed=2026072891,
                output_count=4,
            ),
        )
        submitted.raise_for_status()
        cancelled = client.post(
            f"{WORKER_URL}/v1/jobs/{cancel_provider_id}/cancel",
            headers=headers,
        )
        cancelled.raise_for_status()
        cancel_final, cancel_observed = wait_terminal(
            client, headers, cancel_provider_id, 30
        )
        result["cancel"] = {
            "http": cancelled.status_code,
            "status": cancel_final["status"],
            "observed": cancel_observed,
        }

        failed_job = f"negative-failed-{uuid.uuid4().hex[:10]}"
        failed_provider_id = provider_id(failed_job)
        state_ids.append(failed_provider_id)
        failed_submit = client.post(
            f"{WORKER_URL}/v1/jobs",
            headers=headers,
            json=body(failed_job, user_id, seed=-1),
        )
        failed_submit.raise_for_status()
        failed_final, failed_observed = wait_terminal(
            client, headers, failed_provider_id, 90
        )
        result["failed"] = {
            "status": failed_final["status"],
            "code": (failed_final.get("error") or {}).get("code"),
            "observed": failed_observed,
        }

        timeout_job = f"negative-timeout-{uuid.uuid4().hex[:10]}"
        timeout_provider_id = provider_id(timeout_job)
        state_ids.append(timeout_provider_id)
        timeout_submit = client.post(
            f"{WORKER_URL}/v1/jobs",
            headers=headers,
            json=body(
                timeout_job,
                user_id,
                seed=2026072892,
                output_count=4,
                timeout_ms=10_000,
            ),
        )
        timeout_submit.raise_for_status()
        timeout_final, timeout_observed = wait_terminal(
            client, headers, timeout_provider_id, 60
        )
        result["timeout"] = {
            "status": timeout_final["status"],
            "code": (timeout_final.get("error") or {}).get("code"),
            "observed": timeout_observed,
        }

        duplicate_submit = client.post(
            f"{WORKER_URL}/v1/jobs",
            headers=headers,
            json=body(
                timeout_job,
                user_id,
                seed=2026072892,
                output_count=4,
                timeout_ms=10_000,
            ),
        )
        duplicate_submit.raise_for_status()
        result["duplicate_submit"] = {
            "http": duplicate_submit.status_code,
            "same_provider_job_id": (
                duplicate_submit.json()["id"] == timeout_provider_id
            ),
            "status": duplicate_submit.json()["status"],
        }

    result["finished_at"] = time.time()
    result["duration_seconds"] = round(
        result["finished_at"] - result["started_at"], 3
    )
    result["state_files_cleaned"] = 0
    for identifier in state_ids:
        path = STATE_DIR / f"{identifier}.json"
        if path.is_file():
            path.unlink()
            result["state_files_cleaned"] += 1
    RESULT_PATH.parent.mkdir(parents=True, exist_ok=True)
    RESULT_PATH.write_text(
        json.dumps(result, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(json.dumps(result, ensure_ascii=False))


if __name__ == "__main__":
    main()
