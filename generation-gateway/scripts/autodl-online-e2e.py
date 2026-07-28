from __future__ import annotations

import json
import os
import time
import uuid
from pathlib import Path
from typing import Any

import httpx


GATEWAY = os.environ.get(
    "GENERATION_GATEWAY_URL",
    "https://generation-gateway-staging.onrender.com",
).rstrip("/")
RESULT_PATH = Path(
    os.environ.get(
        "E2E_RESULT_PATH",
        "/root/autodl-tmp/generation-worker-logs/online-e2e-result.json",
    )
)
WORKER_ENV_PATH = Path(
    os.environ.get("AUTODL_WORKER_ENV", "/root/autodl-generation-worker/.env")
)
TERMINAL = {"completed", "failed", "cancelled"}


def load_env_file(path: Path) -> dict[str, str]:
    result: dict[str, str] = {}
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        result[key] = value.strip().strip('"').strip("'")
    return result


def wait_for_job(
    client: httpx.Client,
    token: str,
    job_id: str,
    *,
    timeout_seconds: int = 240,
    diagnostics: dict[str, Any] | None = None,
) -> tuple[dict[str, Any], list[str]]:
    headers = {"authorization": f"Bearer {token}"}
    observed: list[str] = []
    deadline = time.monotonic() + timeout_seconds
    last: dict[str, Any] = {}
    while time.monotonic() < deadline:
        response = client.get(f"{GATEWAY}/v1/generations/{job_id}", headers=headers)
        if response.status_code in {502, 503, 504}:
            if diagnostics is not None:
                diagnostics["transient_gateway_errors"] = (
                    diagnostics.get("transient_gateway_errors", 0) + 1
                )
            time.sleep(3)
            continue
        response.raise_for_status()
        last = response.json()["job"]
        status = last["status"]
        if not observed or observed[-1] != status:
            observed.append(status)
        if status in TERMINAL:
            return last, observed
        time.sleep(3)
    raise TimeoutError(f"gateway job did not finish; last status={last.get('status')}")


def generation_body(*, seed: int, idempotency_key: str, people_count: int = 1) -> dict[str, Any]:
    return {
        "media_type": "image",
        "creation_mode": "text_to_image",
        "prompt": (
            "photorealistic editorial portrait of an adult woman, natural skin texture, "
            "realistic face and hands, soft window light, tasteful modern clothing, "
            "neutral studio background, professional 50mm photography"
        ),
        "structured_options": {
            "execution_mode": "real_test",
            "people_count": people_count,
            "visual_style": "photorealistic",
            "seed": seed,
        },
        "reference_assets": [],
        "aspect_ratio": "1:1",
        "output_count": 1,
        "subject_age_confirmed_adult": True,
        "idempotency_key": idempotency_key,
        "client_context": {
            "app": "open-video-studio",
            "platform": "autodl-online-e2e",
        },
    }


def main() -> None:
    env = load_env_file(WORKER_ENV_PATH)
    supabase_url = env["SUPABASE_URL"].rstrip("/")
    service_key = env["SUPABASE_SERVICE_ROLE_KEY"]
    admin_headers = {
        "apikey": service_key,
        "authorization": f"Bearer {service_key}",
        "content-type": "application/json",
    }
    result: dict[str, Any] = {
        "schema_version": "1.0",
        "started_at": time.time(),
        "gateway": GATEWAY,
        "temporary_users": 0,
        "cleanup_errors": [],
    }
    users: list[dict[str, str]] = []
    job_ids: list[str] = []
    storage_paths: list[str] = []

    with httpx.Client(timeout=60, follow_redirects=True, trust_env=False) as client:
        try:
            for label in ("a", "b"):
                email = f"phase2-{label}-{uuid.uuid4().hex[:12]}@example.invalid"
                password = f"T9!{uuid.uuid4().hex}aA"
                created = client.post(
                    f"{supabase_url}/auth/v1/admin/users",
                    headers=admin_headers,
                    json={"email": email, "password": password, "email_confirm": True},
                )
                created.raise_for_status()
                user_id = created.json()["id"]
                session = client.post(
                    f"{supabase_url}/auth/v1/token?grant_type=password",
                    headers={"apikey": service_key, "content-type": "application/json"},
                    json={"email": email, "password": password},
                )
                session.raise_for_status()
                users.append({"id": user_id, "token": session.json()["access_token"]})
            result["temporary_users"] = len(users)
            user_a, user_b = users
            headers_a = {
                "authorization": f"Bearer {user_a['token']}",
                "content-type": "application/json",
                "origin": "https://jiang289140790-eng.github.io",
            }
            headers_b = {
                "authorization": f"Bearer {user_b['token']}",
                "content-type": "application/json",
                "origin": "https://jiang289140790-eng.github.io",
            }

            invalid = client.get(
                f"{GATEWAY}/v1/generations",
                headers={"authorization": "Bearer invalid-phase2-token"},
            )
            result["invalid_jwt_http"] = invalid.status_code

            allowed_preflight = client.options(
                f"{GATEWAY}/v1/generations",
                headers={
                    "origin": "https://jiang289140790-eng.github.io",
                    "access-control-request-method": "POST",
                },
            )
            denied_preflight = client.options(
                f"{GATEWAY}/v1/generations",
                headers={
                    "origin": "https://untrusted.example.invalid",
                    "access-control-request-method": "POST",
                },
            )
            result["cors"] = {
                "allowed_http": allowed_preflight.status_code,
                "allowed_origin_echoed": (
                    allowed_preflight.headers.get("access-control-allow-origin")
                    == "https://jiang289140790-eng.github.io"
                ),
                "denied_origin_echoed": bool(
                    denied_preflight.headers.get("access-control-allow-origin")
                ),
            }

            key = f"phase2-online-{uuid.uuid4().hex}"
            submit = client.post(
                f"{GATEWAY}/v1/generations",
                headers=headers_a,
                json=generation_body(seed=2026072804, idempotency_key=key),
            )
            submit.raise_for_status()
            first_job = submit.json()["job_id"]
            job_ids.append(first_job)
            result["submit_http"] = submit.status_code
            result["cross_user_job_http"] = client.get(
                f"{GATEWAY}/v1/generations/{first_job}", headers=headers_b
            ).status_code
            terminal, observed = wait_for_job(
                client, user_a["token"], first_job, diagnostics=result
            )
            result["completed_job"] = {
                "job_id": first_job,
                "status": terminal["status"],
                "provider": terminal.get("provider"),
                "observed": observed,
            }

            refreshed = httpx.get(
                f"{GATEWAY}/v1/generations/{first_job}",
                headers={"authorization": f"Bearer {user_a['token']}"},
                timeout=60,
                trust_env=False,
            )
            result["refresh_recovery"] = {
                "http": refreshed.status_code,
                "status": refreshed.json().get("job", {}).get("status"),
            }

            assets_a = client.get(
                f"{supabase_url}/rest/v1/generation_assets",
                headers={
                    "apikey": service_key,
                    "authorization": f"Bearer {user_a['token']}",
                },
                params={
                    "select": "id,user_id,storage_path,width,height",
                    "job_id": f"eq.{first_job}",
                },
            )
            assets_b = client.get(
                f"{supabase_url}/rest/v1/generation_assets",
                headers={
                    "apikey": service_key,
                    "authorization": f"Bearer {user_b['token']}",
                },
                params={
                    "select": "id,user_id,storage_path,width,height",
                    "job_id": f"eq.{first_job}",
                },
            )
            assets_a.raise_for_status()
            assets_b.raise_for_status()
            owned_assets = assets_a.json()
            result["asset_isolation"] = {
                "user_a_count": len(owned_assets),
                "user_b_count": len(assets_b.json()),
                "dimensions": [
                    [asset.get("width"), asset.get("height")] for asset in owned_assets
                ],
                "owner_matches": all(
                    asset.get("user_id") == user_a["id"] for asset in owned_assets
                ),
            }
            storage_paths.extend(
                asset["storage_path"].removeprefix("generation-results/")
                for asset in owned_assets
            )

            cancel_submit = client.post(
                f"{GATEWAY}/v1/generations",
                headers=headers_a,
                json=generation_body(
                    seed=2026072805,
                    idempotency_key=f"phase2-cancel-{uuid.uuid4().hex}",
                ),
            )
            cancel_submit.raise_for_status()
            cancel_job = cancel_submit.json()["job_id"]
            job_ids.append(cancel_job)
            cancelled = client.post(
                f"{GATEWAY}/v1/generations/{cancel_job}/cancel", headers=headers_a
            )
            cancelled.raise_for_status()
            result["cancel"] = {
                "http": cancelled.status_code,
                "status": cancelled.json()["job"]["status"],
            }

            retried = client.post(
                f"{GATEWAY}/v1/generations/{cancel_job}/retry", headers=headers_a
            )
            retried.raise_for_status()
            retry_job = retried.json()["job_id"]
            job_ids.append(retry_job)
            retry_terminal, retry_observed = wait_for_job(
                client, user_a["token"], retry_job, diagnostics=result
            )
            result["retry"] = {
                "http": retried.status_code,
                "job_id": retry_job,
                "status": retry_terminal["status"],
                "observed": retry_observed,
            }

            retry_assets = client.get(
                f"{supabase_url}/rest/v1/generation_assets",
                headers=admin_headers,
                params={
                    "select": "storage_path",
                    "job_id": f"eq.{retry_job}",
                },
            )
            retry_assets.raise_for_status()
            storage_paths.extend(
                asset["storage_path"].removeprefix("generation-results/")
                for asset in retry_assets.json()
            )

            no_match = client.post(
                f"{GATEWAY}/v1/generations",
                headers=headers_a,
                json=generation_body(
                    seed=2026072806,
                    idempotency_key=f"phase2-no-match-{uuid.uuid4().hex}",
                    people_count=2,
                ),
            )
            result["no_matching_workflow"] = {
                "http": no_match.status_code,
                "code": no_match.json().get("error", {}).get("code"),
            }
        except Exception as exc:
            result["exception"] = type(exc).__name__
            result["exception_message"] = str(exc)[:300]
        finally:
            try:
                if storage_paths:
                    response = client.request(
                        "DELETE",
                        f"{supabase_url}/storage/v1/object/generation-results",
                        headers=admin_headers,
                        json={"prefixes": sorted(set(storage_paths))},
                    )
                    response.raise_for_status()
            except Exception as exc:
                result["cleanup_errors"].append(f"storage:{type(exc).__name__}")

            for job_id in job_ids:
                for table in ("generation_assets", "generation_jobs"):
                    try:
                        key = "job_id" if table == "generation_assets" else "id"
                        response = client.delete(
                            f"{supabase_url}/rest/v1/{table}",
                            headers={**admin_headers, "prefer": "return=minimal"},
                            params={key: f"eq.{job_id}"},
                        )
                        if response.is_error:
                            result["cleanup_errors"].append(
                                f"{table}:http_{response.status_code}:"
                                f"{response.text[:120]}"
                            )
                    except Exception as exc:
                        result["cleanup_errors"].append(
                            f"{table}:{type(exc).__name__}"
                        )
            for user in users:
                try:
                    response = client.delete(
                        f"{supabase_url}/auth/v1/admin/users/{user['id']}",
                        headers=admin_headers,
                    )
                    response.raise_for_status()
                except Exception as exc:
                    result["cleanup_errors"].append(f"auth:{type(exc).__name__}")

    result["finished_at"] = time.time()
    result["duration_seconds"] = round(
        result["finished_at"] - result["started_at"], 3
    )
    RESULT_PATH.parent.mkdir(parents=True, exist_ok=True)
    RESULT_PATH.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(result, ensure_ascii=False))


if __name__ == "__main__":
    main()
