from __future__ import annotations

import asyncio
import copy
import hashlib
import hmac
import io
import json
import os
import secrets
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Literal
from urllib.parse import quote

import httpx
from fastapi import Depends, FastAPI, Header, HTTPException, Response
from PIL import Image
from pydantic import BaseModel, Field, HttpUrl, field_validator


ROOT = Path(__file__).resolve().parent
STATE_DIR = Path(os.environ.get("AUTODL_WORKER_STATE_DIR", "/root/autodl-tmp/generation-worker-state"))
COMFYUI_OUTPUT_DIR = Path(os.environ.get("COMFYUI_OUTPUT_DIR", "/root/ComfyUI/output")).resolve()
REGISTRY = json.loads((ROOT / "registry.json").read_text(encoding="utf-8"))
API_TOKEN = os.environ.get("AUTODL_API_TOKEN", "")
COMFYUI_BASE_URL = os.environ.get("COMFYUI_BASE_URL", "http://127.0.0.1:18188").rstrip("/")
SUPABASE_URL = os.environ.get("SUPABASE_URL", "").rstrip("/")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
GPU_TYPE = os.environ.get("AUTODL_GPU_TYPE", "NVIDIA GeForce RTX 5090")
GPU_HOURLY_COST = float(os.environ.get("AUTODL_GPU_HOURLY_COST", "0"))
SIGNED_URL_TTL_SECONDS = int(os.environ.get("SIGNED_URL_TTL_SECONDS", "900"))
MAX_TIMEOUT_MS = 3_600_000

STATE_DIR.mkdir(parents=True, exist_ok=True)
app = FastAPI(title="Generation Engine AutoDL Worker", version="1.0.0")
tasks: dict[str, asyncio.Task[None]] = {}
queue_lock = asyncio.Lock()


class CallbackConfig(BaseModel):
    url: HttpUrl
    signature_algorithm: Literal["hmac-sha256"]
    signature_header: Literal["x-webhook-signature"]


class Policy(BaseModel):
    execution_timeout_ms: int = Field(ge=10_000, le=MAX_TIMEOUT_MS)


class WorkflowInput(BaseModel):
    id: Literal["single-person-text-to-image-v1"]
    version: Literal["1.0.0"]
    comfyui_workflow_ref: str
    model_manifest_ref: str


class RequestInput(BaseModel):
    job_id: str = Field(min_length=1, max_length=160)
    user_id: str = Field(pattern=r"^[0-9a-fA-F-]{36}$")
    prompt: str = Field(min_length=1, max_length=12_000)
    negative_prompt: str = Field(max_length=12_000)
    aspect_ratio: Literal["1:1", "4:5"]
    output_count: int = Field(ge=1, le=4)
    seed: int | None = None


class StorageInput(BaseModel):
    bucket: Literal["generation-results"]
    path_prefix: str = Field(min_length=1, max_length=500)


class WorkerInput(BaseModel):
    schema_version: Literal["1.0"]
    workflow: WorkflowInput
    request: RequestInput
    storage: StorageInput

    @field_validator("storage")
    @classmethod
    def validate_storage_owner(cls, storage: StorageInput, info: Any) -> StorageInput:
        request = info.data.get("request")
        if request:
            expected = f"{storage.bucket}/{request.user_id}/{request.job_id}"
            if storage.path_prefix != expected:
                raise ValueError("storage path does not match the request owner")
        return storage


class SubmitBody(BaseModel):
    input: WorkerInput
    callback: CallbackConfig | None = None
    policy: Policy


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def state_path(job_id: str) -> Path:
    return STATE_DIR / f"{job_id}.json"


def save_state(state: dict[str, Any]) -> None:
    temporary = state_path(state["id"]).with_suffix(".tmp")
    temporary.write_text(json.dumps(state, ensure_ascii=False), encoding="utf-8")
    temporary.replace(state_path(state["id"]))


def load_state(job_id: str) -> dict[str, Any] | None:
    path = state_path(job_id)
    if not path.exists():
        return None
    return json.loads(path.read_text(encoding="utf-8"))


def public_state(state: dict[str, Any]) -> dict[str, Any]:
    return {
        key: value
        for key, value in state.items()
        if key in {"id", "status", "output", "error", "created_at", "updated_at"}
    }


def require_auth(authorization: str | None = Header(default=None)) -> None:
    if not API_TOKEN:
        raise HTTPException(status_code=503, detail="worker authentication is not configured")
    supplied = authorization.removeprefix("Bearer ").strip() if authorization else ""
    if not supplied or not secrets.compare_digest(supplied, API_TOKEN):
        raise HTTPException(status_code=401, detail="invalid worker credential")


@app.get("/health")
async def health(response: Response, _: None = Depends(require_auth)) -> dict[str, Any]:
    comfy = False
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            response = await client.get(f"{COMFYUI_BASE_URL}/system_stats")
            comfy = response.is_success
    except httpx.HTTPError:
        comfy = False
    configured = bool(API_TOKEN and SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY)
    if not comfy or not configured:
        response.status_code = 503
    return {
        "status": "ok" if comfy and configured else "not_ready",
        "worker": "autodl",
        "schema_version": "1.0",
        "comfyui": "connected" if comfy else "unavailable",
        "storage": "configured" if configured else "unconfigured",
        "staging_only": True,
    }


@app.post("/v1/jobs", status_code=202)
async def submit(body: SubmitBody, _: None = Depends(require_auth)) -> dict[str, Any]:
    request = body.input.request
    provider_job_id = f"autodl_{hashlib.sha256(request.job_id.encode()).hexdigest()[:32]}"
    existing = load_state(provider_job_id)
    if existing:
        return public_state(existing)
    validate_registry(body.input)
    state = {
        "id": provider_job_id,
        "status": "queued",
        "created_at": utc_now(),
        "updated_at": utc_now(),
        "input": body.input.model_dump(mode="json"),
        "callback": body.callback.model_dump(mode="json") if body.callback else None,
        "execution_timeout_ms": body.policy.execution_timeout_ms,
        "cancel_requested": False,
        "comfy_prompt_id": None,
    }
    save_state(state)
    tasks[provider_job_id] = asyncio.create_task(run_job(provider_job_id))
    return public_state(state)


@app.get("/v1/jobs/{provider_job_id}")
async def get_job(provider_job_id: str, _: None = Depends(require_auth)) -> dict[str, Any]:
    state = load_state(provider_job_id)
    if not state:
        raise HTTPException(status_code=404, detail="job not found")
    return public_state(state)


@app.post("/v1/jobs/{provider_job_id}/cancel", status_code=202)
async def cancel_job(provider_job_id: str, _: None = Depends(require_auth)) -> dict[str, Any]:
    state = load_state(provider_job_id)
    if not state:
        raise HTTPException(status_code=404, detail="job not found")
    if state["status"] in {"completed", "failed", "cancelled", "timeout"}:
        return public_state(state)
    state["cancel_requested"] = True
    state["updated_at"] = utc_now()
    save_state(state)
    async with httpx.AsyncClient(timeout=5) as client:
        prompt_id = state.get("comfy_prompt_id")
        if prompt_id:
            await client.post(f"{COMFYUI_BASE_URL}/queue", json={"delete": [prompt_id]})
        await client.post(f"{COMFYUI_BASE_URL}/interrupt")
    state = load_state(provider_job_id) or state
    state["status"] = "cancelled"
    state["updated_at"] = utc_now()
    save_state(state)
    await send_callback(state)
    return public_state(state)


async def run_job(provider_job_id: str) -> None:
    async with queue_lock:
        state = load_state(provider_job_id)
        if not state or state.get("cancel_requested"):
            return
        started = time.monotonic()
        deadline = started + state["execution_timeout_ms"] / 1000
        try:
            state["status"] = "running"
            state["updated_at"] = utc_now()
            save_state(state)
            await send_callback(state)
            workflow = build_workflow(state["input"])
            async with httpx.AsyncClient(timeout=30) as client:
                response = await client.post(
                    f"{COMFYUI_BASE_URL}/prompt",
                    json={"prompt": workflow, "client_id": provider_job_id},
                )
                response.raise_for_status()
                prompt_id = response.json()["prompt_id"]
            state = load_state(provider_job_id) or state
            state["comfy_prompt_id"] = prompt_id
            save_state(state)
            images = await wait_for_images(provider_job_id, prompt_id, deadline)
            state = load_state(provider_job_id) or state
            if state.get("cancel_requested") or state["status"] == "cancelled":
                return
            assets = await upload_assets(state["input"], images)
            state = load_state(provider_job_id) or state
            if state.get("cancel_requested") or state["status"] == "cancelled":
                await delete_uploaded_assets(state["input"], assets)
                return
            duration_ms = int((time.monotonic() - started) * 1000)
            actual_cost = round((duration_ms / 3_600_000) * GPU_HOURLY_COST, 8)
            request = state["input"]["request"]
            state["output"] = {
                "schema_version": "1.0",
                "job_id": request["job_id"],
                "user_id": request["user_id"],
                "assets": assets,
                "metrics": {
                    "gpu_type": GPU_TYPE,
                    "generation_duration_ms": duration_ms,
                    "estimated_cost": actual_cost,
                    "actual_cost": actual_cost,
                },
            }
            state["status"] = "completed"
            state["updated_at"] = utc_now()
            save_state(state)
            await send_callback(state)
        except asyncio.TimeoutError:
            await fail_job(provider_job_id, "timeout", "PROVIDER_TIMEOUT")
        except asyncio.CancelledError:
            await fail_job(provider_job_id, "cancelled", "PROVIDER_CANCELLED")
        except httpx.HTTPStatusError as exc:
            code = "COMFYUI_REQUEST_FAILED" if exc.response.status_code < 500 else "COMFYUI_UNAVAILABLE"
            await fail_job(provider_job_id, "failed", code)
        except Exception as exc:
            text = str(exc).lower()
            if "cuda" in text or "out of memory" in text:
                code = "CUDA_OUT_OF_MEMORY"
            elif "model" in text or "workflow" in text or "node" in text:
                code = "WORKFLOW_INVALID"
            elif "output" in text or "image" in text:
                code = "OUTPUT_INVALID"
            else:
                code = "WORKER_FAILED"
            await fail_job(provider_job_id, "failed", code)
        finally:
            tasks.pop(provider_job_id, None)


def validate_registry(worker_input: WorkerInput) -> None:
    workflow = REGISTRY["workflows"].get(worker_input.workflow.comfyui_workflow_ref)
    model = REGISTRY["models"].get(worker_input.workflow.model_manifest_ref)
    if not workflow or not model:
        raise HTTPException(status_code=422, detail="workflow or model registry reference is unknown")
    if workflow["id"] != worker_input.workflow.id or workflow["version"] != worker_input.workflow.version:
        raise HTTPException(status_code=422, detail="workflow version does not match registry")
    if workflow["model_manifest_ref"] != worker_input.workflow.model_manifest_ref:
        raise HTTPException(status_code=422, detail="model binding does not match workflow")


def build_workflow(raw_input: dict[str, Any]) -> dict[str, Any]:
    workflow_input = raw_input["workflow"]
    request = raw_input["request"]
    config = REGISTRY["workflows"][workflow_input["comfyui_workflow_ref"]]
    model = REGISTRY["models"][workflow_input["model_manifest_ref"]]
    workflow = json.loads((ROOT / config["workflow_file"]).read_text(encoding="utf-8"))
    mapping = config["node_mapping"]
    width, height = config["limits"]["aspect_ratios"][request["aspect_ratio"]]
    workflow[mapping["model_loader"]]["inputs"][model["loader_input"]] = model["artifact"]
    workflow[mapping["latent_image"]]["inputs"].update({
        "width": width,
        "height": height,
        "batch_size": request["output_count"],
    })
    workflow[mapping["positive_prompt"]]["inputs"]["text"] = request["prompt"]
    workflow[mapping["negative_prompt"]]["inputs"]["text"] = (
        request["negative_prompt"] or config["defaults"]["negative_prompt"]
    )
    workflow[mapping["sampler"]]["inputs"].update({
        "seed": request["seed"] if request["seed"] is not None else secrets.randbelow(2**63 - 1),
        "steps": config["defaults"]["steps"],
        "cfg": config["defaults"]["cfg"],
        "sampler_name": config["defaults"]["sampler_name"],
        "scheduler": config["defaults"]["scheduler"],
    })
    workflow[mapping["save_image"]]["inputs"]["filename_prefix"] = (
        f"generation-engine/{request['user_id']}/{request['job_id']}"
    )
    return copy.deepcopy(workflow)


async def wait_for_images(provider_job_id: str, prompt_id: str, deadline: float) -> list[dict[str, Any]]:
    while time.monotonic() < deadline:
        state = load_state(provider_job_id)
        if not state or state.get("cancel_requested") or state["status"] == "cancelled":
            raise asyncio.CancelledError
        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.get(f"{COMFYUI_BASE_URL}/history/{quote(prompt_id, safe='')}")
            response.raise_for_status()
            history = response.json().get(prompt_id)
        if history:
            status = history.get("status", {})
            if status.get("status_str") == "error":
                messages = status.get("messages", [])
                raise RuntimeError(f"workflow execution failed: {type(messages).__name__}")
            outputs = history.get("outputs", {})
            images: list[dict[str, Any]] = []
            for output in outputs.values():
                images.extend(output.get("images", []))
            if images:
                return images
        await asyncio.sleep(1)
    raise asyncio.TimeoutError


async def upload_assets(raw_input: dict[str, Any], images: list[dict[str, Any]]) -> list[dict[str, Any]]:
    request = raw_input["request"]
    storage = raw_input["storage"]
    if len(images) != request["output_count"]:
        raise RuntimeError("output count mismatch")
    assets = []
    uploaded_paths: list[str] = []
    async with httpx.AsyncClient(timeout=90) as client:
        try:
            for index, image in enumerate(images):
                params = {
                    "filename": image["filename"],
                    "subfolder": image.get("subfolder", ""),
                    "type": image.get("type", "output"),
                }
                response = await client.get(f"{COMFYUI_BASE_URL}/view", params=params)
                response.raise_for_status()
                content = response.content
                with Image.open(io.BytesIO(content)) as decoded:
                    width, height = decoded.size
                    image_format = decoded.format or "PNG"
                mime_type = {
                    "PNG": "image/png",
                    "JPEG": "image/jpeg",
                    "WEBP": "image/webp",
                }.get(image_format.upper(), "image/png")
                extension = {"image/png": "png", "image/jpeg": "jpg", "image/webp": "webp"}[mime_type]
                full_path = f"{storage['path_prefix']}/output-{index}.{extension}"
                object_path = full_path.removeprefix(f"{storage['bucket']}/")
                encoded_path = quote(object_path, safe="/")
                headers = {
                    "apikey": SUPABASE_SERVICE_ROLE_KEY,
                    "authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
                    "content-type": mime_type,
                    "x-upsert": "false",
                }
                upload = await client.post(
                    f"{SUPABASE_URL}/storage/v1/object/{storage['bucket']}/{encoded_path}",
                    content=content,
                    headers=headers,
                )
                upload.raise_for_status()
                uploaded_paths.append(object_path)
                signed = await client.post(
                    f"{SUPABASE_URL}/storage/v1/object/sign/{storage['bucket']}/{encoded_path}",
                    json={"expiresIn": SIGNED_URL_TTL_SECONDS},
                    headers={
                        "apikey": SUPABASE_SERVICE_ROLE_KEY,
                        "authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
                        "content-type": "application/json",
                    },
                )
                signed.raise_for_status()
                signed_path = signed.json().get("signedURL") or signed.json().get("signedUrl")
                if not signed_path:
                    raise RuntimeError("signed output URL missing")
                signed_url = signed_path if signed_path.startswith("http") else f"{SUPABASE_URL}/storage/v1{signed_path}"
                assets.append({
                    "storage_path": full_path,
                    "signed_url": signed_url,
                    "signed_url_expires_at": (
                        datetime.now(timezone.utc) + timedelta(seconds=SIGNED_URL_TTL_SECONDS)
                    ).isoformat().replace("+00:00", "Z"),
                    "mime_type": mime_type,
                    "width": width,
                    "height": height,
                    "output_index": index,
                    "checksum_sha256": hashlib.sha256(content).hexdigest(),
                })
                delete_local_output(image)
        except Exception:
            if uploaded_paths:
                await client.request(
                    "DELETE",
                    f"{SUPABASE_URL}/storage/v1/object/{storage['bucket']}",
                    json={"prefixes": uploaded_paths},
                    headers={
                        "apikey": SUPABASE_SERVICE_ROLE_KEY,
                        "authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
                        "content-type": "application/json",
                    },
                )
            raise
    return assets


async def delete_uploaded_assets(
    raw_input: dict[str, Any],
    assets: list[dict[str, Any]],
) -> None:
    storage = raw_input["storage"]
    prefixes = [
        asset["storage_path"].removeprefix(f"{storage['bucket']}/")
        for asset in assets
    ]
    if not prefixes:
        return
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.request(
            "DELETE",
            f"{SUPABASE_URL}/storage/v1/object/{storage['bucket']}",
            json={"prefixes": prefixes},
            headers={
                "apikey": SUPABASE_SERVICE_ROLE_KEY,
                "authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
                "content-type": "application/json",
            },
        )
        response.raise_for_status()


def delete_local_output(image: dict[str, Any]) -> None:
    candidate = (COMFYUI_OUTPUT_DIR / image.get("subfolder", "") / image["filename"]).resolve()
    if candidate.is_relative_to(COMFYUI_OUTPUT_DIR) and candidate.is_file():
        candidate.unlink()


async def fail_job(provider_job_id: str, status: str, code: str) -> None:
    state = load_state(provider_job_id)
    if not state:
        return
    prompt_id = state.get("comfy_prompt_id")
    if prompt_id:
        try:
            async with httpx.AsyncClient(timeout=5) as client:
                await client.post(
                    f"{COMFYUI_BASE_URL}/queue",
                    json={"delete": [prompt_id]},
                )
                await client.post(f"{COMFYUI_BASE_URL}/interrupt")
        except httpx.HTTPError:
            pass
    state["status"] = status
    state["error"] = {"code": code}
    state["updated_at"] = utc_now()
    save_state(state)
    await send_callback(state)


async def send_callback(state: dict[str, Any]) -> None:
    callback = state.get("callback")
    if not callback:
        return
    body = json.dumps(public_state(state), separators=(",", ":"), ensure_ascii=False)
    signature = hmac.new(API_TOKEN.encode(), body.encode(), hashlib.sha256).hexdigest()
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            await client.post(
                callback["url"],
                content=body.encode(),
                headers={
                    callback["signature_header"]: f"sha256={signature}",
                    "content-type": "application/json",
                },
            )
    except httpx.HTTPError:
        return
