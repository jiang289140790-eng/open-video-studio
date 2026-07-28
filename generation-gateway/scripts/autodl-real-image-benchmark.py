from __future__ import annotations

import hashlib
import json
import os
import time
import uuid
from pathlib import Path
from typing import Any

import httpx


WORKER_URL = os.environ.get("AUTODL_INTERNAL_WORKER_URL", "http://127.0.0.1:6006").rstrip("/")
ENV_PATH = Path(os.environ.get("AUTODL_WORKER_ENV", "/root/autodl-generation-worker/.env"))
RESULT_PATH = Path(
    os.environ.get(
        "BENCHMARK_RESULT_PATH",
        "/root/autodl-tmp/generation-worker-logs/real-image-benchmark.json",
    )
)

CASES = [
    ("closeup_portrait", "photorealistic close-up editorial portrait of an adult woman, natural skin texture, realistic face, soft window light, white blouse, 50mm lens"),
    ("fullbody_standing", "photorealistic full-body portrait of one adult woman standing in a modern bedroom, tasteful black evening dress and high heels, natural anatomy, realistic hands, editorial lighting"),
    ("hands_and_book", "photorealistic adult woman seated by a window holding an open hardcover book with both hands clearly visible, natural fingers, warm afternoon light, documentary photography"),
    ("outdoor_street", "photorealistic single adult woman walking on a quiet European street, casual jacket and jeans, full body, overcast natural light, realistic candid photography"),
    ("cafe_scene", "photorealistic adult woman seated alone at a cafe table with a ceramic coffee cup, realistic hands, natural expression, shallow depth of field, cinematic interior light"),
    ("studio_fashion", "photorealistic studio fashion portrait of one adult woman in a tasteful red evening gown, three-quarter pose, seamless gray background, softbox lighting, realistic skin"),
    ("low_angle_selfie", "photorealistic low-angle social media selfie composition of one adult woman, casual modern outfit, natural face, realistic perspective, daylight apartment interior"),
    ("seated_living_room", "photorealistic adult woman seated on a modern living room sofa, relaxed pose, both hands visible, neutral knitwear, natural window light, balanced composition"),
    ("night_city", "photorealistic single adult woman on a city sidewalk at night, tasteful coat, neon reflections, cinematic rim light, realistic face, 35mm street photography"),
    ("white_background", "photorealistic commercial portrait of one adult woman against a clean white background, simple professional outfit, waist-up composition, accurate anatomy, catalog lighting"),
]


def load_env() -> dict[str, str]:
    result: dict[str, str] = {}
    for raw in ENV_PATH.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if line and not line.startswith("#") and "=" in line:
            key, value = line.split("=", 1)
            result[key] = value.strip().strip('"').strip("'")
    return result


def main() -> None:
    env = load_env()
    token = env["AUTODL_API_TOKEN"]
    user_id = str(uuid.uuid4())
    headers = {"authorization": f"Bearer {token}", "content-type": "application/json"}
    results: list[dict[str, Any]] = []
    started = time.time()

    with httpx.Client(timeout=60, trust_env=False) as client:
        for index, (case_id, prompt) in enumerate(CASES):
            gateway_job_id = f"benchmark-{case_id}-{uuid.uuid4().hex[:10]}"
            provider_job_id = "autodl_" + hashlib.sha256(
                gateway_job_id.encode()
            ).hexdigest()[:32]
            body = {
                "input": {
                    "schema_version": "1.0",
                    "workflow": {
                        "id": "single-person-text-to-image-v1",
                        "version": "1.0.0",
                        "comfyui_workflow_ref": "registry://workflows/single-person-text-to-image-v1/1.0.0",
                        "model_manifest_ref": "registry://models/single-person-photorealistic-model-v1/1.0.0",
                    },
                    "request": {
                        "job_id": gateway_job_id,
                        "user_id": user_id,
                        "prompt": prompt,
                        "negative_prompt": "",
                        "aspect_ratio": "1:1" if index % 2 == 0 else "4:5",
                        "output_count": 1,
                        "seed": 2026072810 + index,
                    },
                    "storage": {
                        "bucket": "generation-results",
                        "path_prefix": f"generation-results/{user_id}/{gateway_job_id}",
                    },
                },
                "policy": {"execution_timeout_ms": 600000},
            }
            submitted = client.post(f"{WORKER_URL}/v1/jobs", headers=headers, json=body)
            submitted.raise_for_status()
            observed: list[str] = [submitted.json()["status"]]
            deadline = time.monotonic() + 660
            final: dict[str, Any] = {}
            while time.monotonic() < deadline:
                response = client.get(
                    f"{WORKER_URL}/v1/jobs/{provider_job_id}", headers=headers
                )
                response.raise_for_status()
                final = response.json()
                if observed[-1] != final["status"]:
                    observed.append(final["status"])
                if final["status"] in {"completed", "failed", "cancelled", "timeout"}:
                    break
                time.sleep(3)
            output = final.get("output") or {}
            assets = output.get("assets") or []
            results.append(
                {
                    "case_id": case_id,
                    "status": final.get("status", "unknown"),
                    "observed": observed,
                    "metrics": output.get("metrics"),
                    "assets": [
                        {
                            "storage_path": asset.get("storage_path"),
                            "signed_url": asset.get("signed_url"),
                            "width": asset.get("width"),
                            "height": asset.get("height"),
                            "mime_type": asset.get("mime_type"),
                        }
                        for asset in assets
                    ],
                    "error": final.get("error"),
                }
            )

    payload = {
        "schema_version": "1.0",
        "workflow": "single-person-text-to-image-v1",
        "provider_workflow_id": "persephone_flux_2_q8_t2i_api_v1",
        "provider": "autodl",
        "model": "Persephone Flux 2.0 Q8",
        "output_count_per_case": 1,
        "case_count": len(CASES),
        "results": results,
        "duration_seconds": round(time.time() - started, 3),
    }
    RESULT_PATH.parent.mkdir(parents=True, exist_ok=True)
    RESULT_PATH.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(
        json.dumps(
            {
                "case_count": len(results),
                "completed": sum(item["status"] == "completed" for item in results),
                "failed": sum(item["status"] != "completed" for item in results),
                "duration_seconds": payload["duration_seconds"],
            }
        )
    )


if __name__ == "__main__":
    main()
