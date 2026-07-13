# 1100 DevOps

| Field | Value |
|---|---|
| Unique ID | DEVOPS-INDEX-001 |
| Version | 0.4.0 |
| Status | Active |
| Owner | Infrastructure Lead |
| Dependencies | OVSB-001, DOC-STD-001, SEC-INDEX-001, ANALYTICS-INDEX-001 |
| Referenced By | DOC-002 |

## Purpose

Own environments, deployment, observability, reliability, incident response, backups, cost management, and operational readiness.

## Requirements

- Infrastructure choices that affect long-term architecture require an ADR.
- Production services must define monitoring, alerts, logs, and rollback.
- Environment variables and secrets must reference security standards.
- Deployment strategy must define environments, promotion flow, rollback, release gates, and ownership.
- Disaster recovery strategy must define backups, restore testing, RTO, RPO, incident ownership, and data-loss procedures.
- Cost control must define budget ownership, provider spend monitoring, GPU cost controls, storage lifecycle, and alert thresholds.
- Operational readiness must include testing, observability, on-call, runbooks, and incident response before production launch.

## Acceptance Criteria

- The platform can be deployed, monitored, recovered, and scaled intentionally.
- Operational ownership is clear.
- Release, rollback, disaster recovery, and cost-control expectations are documented before production implementation.

## Current GPU Deployment Baseline

- AutoDL is used to inspect and qualify existing ComfyUI workflows; it is not a production dependency of the browser.
- `templates/comfyui-headless/` is the portable Docker deployment baseline for Compshare or another Docker-capable GPU host.
- The gateway exposes only the existing Zealman-compatible server contract and requires `HEADLESS_API_TOKEN` for workflow, upload, history, output, and system endpoints. Health exposes no secret data.
- Model weights, custom nodes, workflow JSON, and generated media are private mounted volumes. Raw third-party workflow exports remain under ignored `.data` paths.
- The Supabase `ai` Edge Function can call the official Compshare OpenAPI using server-only public/private keys. It starts `Stopped` instances, waits for `Running` plus gateway health, and schedules shutdown after generation.
- The default post-job shutdown delay is 600 seconds. Compshare requires at least 300 seconds. A two-hour safety window protects an active long video job before the post-job timer is shortened.
- A selected 4090 application instance now contains the qualified Qwen A01 baseline, persistent gateway runtime, automatic restart integration, and a pinned Caddy 2.11.4 binary. Whole-instance recovery and a cost-bearing Supabase-to-Storage A01 run passed.
- Permanent production Secrets remain intentionally unset until `gpu.luravyn.com` or another owned hostname resolves to the fixed instance IP and completes trusted TLS issuance. Direct HTTP was limited to a one-time rotated verification token and is not an accepted production endpoint.
- AutoDL and both Compshare instances must be stopped after qualification sessions. At the end of the current validation all three GPU environments were confirmed stopped.
- Supabase function deployment uses the installed official CLI with server-side bundling so shared function modules are included.

## Future Plan

- Add environment strategy.
- Add deployment pipeline standard.
- Add observability baseline.
- Add incident response process.
- Add disaster recovery plan.
- Add cost management policy.
- Add production readiness checklist.

## AI Context

Use this folder for deployment, environments, reliability, monitoring, and operational processes.
