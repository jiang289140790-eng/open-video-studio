import json
import os
from pathlib import Path
from typing import Any

import httpx
from fastapi import Depends, FastAPI, File, Form, Header, HTTPException, Query, UploadFile
from fastapi.responses import JSONResponse, Response
from pydantic import BaseModel


COMFYUI_URL = os.getenv("COMFYUI_URL", "http://127.0.0.1:8188").rstrip("/")
WORKFLOW_ROOT = Path(os.getenv("WORKFLOW_ROOT", "/opt/ovs/workflows")).resolve()
API_TOKEN = os.getenv("HEADLESS_API_TOKEN", "").strip()
REQUEST_TIMEOUT = float(os.getenv("GATEWAY_REQUEST_TIMEOUT_SECONDS", "120"))

app = FastAPI(title="Luravyn ComfyUI Headless Gateway", version="0.1.0")


class WorkflowRequest(BaseModel):
    workflow_template: dict[str, Any]
    client_id: str | None = None


def authorize(authorization: str | None = Header(default=None)) -> None:
    if not API_TOKEN:
        raise HTTPException(status_code=503, detail="HEADLESS_API_TOKEN is not configured")
    accepted = {API_TOKEN, f"Bearer {API_TOKEN}"}
    if authorization not in accepted:
        raise HTTPException(status_code=401, detail="Invalid authorization token")


@app.get("/api/health")
async def health() -> JSONResponse:
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            response = await client.get(f"{COMFYUI_URL}/system_stats")
        status = 200 if response.is_success else 503
        return JSONResponse({"ok": response.is_success, "comfyui_status": response.status_code}, status_code=status)
    except httpx.HTTPError:
        return JSONResponse({"ok": False, "comfyui_status": 0}, status_code=503)


@app.get("/api/workflows/download/{filename}", dependencies=[Depends(authorize)])
async def download_workflow(filename: str) -> dict[str, Any]:
    target = (WORKFLOW_ROOT / filename).resolve()
    if target.parent != WORKFLOW_ROOT or target.suffix.lower() != ".json":
        raise HTTPException(status_code=400, detail="Invalid workflow filename")
    if not target.is_file():
        raise HTTPException(status_code=404, detail="Workflow not found")
    try:
        value = json.loads(target.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        raise HTTPException(status_code=500, detail=f"Workflow cannot be read: {error}") from error
    if not isinstance(value, dict):
        raise HTTPException(status_code=422, detail="Workflow must use ComfyUI API object format")
    return value


@app.post("/api/workflow/generate", dependencies=[Depends(authorize)])
async def generate(request: WorkflowRequest) -> dict[str, Any]:
    payload = {"prompt": request.workflow_template}
    if request.client_id:
        payload["client_id"] = request.client_id
    return await proxy_json("POST", "/prompt", json=payload)


@app.post("/upload/image", dependencies=[Depends(authorize)])
async def upload_image(image: UploadFile = File(...), overwrite: str = Form(default="true")) -> dict[str, Any]:
    content = await image.read()
    files = {"image": (image.filename or "input.png", content, image.content_type or "application/octet-stream")}
    return await proxy_json("POST", "/upload/image", files=files, data={"overwrite": overwrite})


@app.get("/history/{prompt_id}", dependencies=[Depends(authorize)])
async def history(prompt_id: str) -> dict[str, Any]:
    return await proxy_json("GET", f"/history/{prompt_id}")


@app.get("/system_stats", dependencies=[Depends(authorize)])
async def system_stats() -> dict[str, Any]:
    return await proxy_json("GET", "/system_stats")


@app.get("/view", dependencies=[Depends(authorize)])
async def view(
    filename: str = Query(...),
    subfolder: str = Query(default=""),
    type: str = Query(default="output"),
) -> Response:
    async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
        response = await client.get(
            f"{COMFYUI_URL}/view",
            params={"filename": filename, "subfolder": subfolder, "type": type},
        )
    if not response.is_success:
        raise HTTPException(status_code=response.status_code, detail=response.text[:500])
    headers = {}
    if response.headers.get("content-disposition"):
        headers["Content-Disposition"] = response.headers["content-disposition"]
    return Response(
        content=response.content,
        media_type=response.headers.get("content-type", "application/octet-stream"),
        headers=headers,
    )


async def proxy_json(method: str, path: str, **kwargs: Any) -> dict[str, Any]:
    try:
        async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
            response = await client.request(method, f"{COMFYUI_URL}{path}", **kwargs)
    except httpx.HTTPError as error:
        raise HTTPException(status_code=502, detail=f"ComfyUI is unavailable: {error}") from error
    if not response.is_success:
        raise HTTPException(status_code=response.status_code, detail=response.text[:1000])
    try:
        value = response.json()
    except ValueError as error:
        raise HTTPException(status_code=502, detail="ComfyUI returned non-JSON data") from error
    return value
