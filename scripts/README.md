# Scripts

| Field | Value |
|---|---|
| Unique ID | SCRIPT-README-001 |
| Version | 0.1.0 |
| Status | Active |
| Owner | Engineering |
| Dependencies | OVSB-001, DOC-STD-001, DEVOPS-INDEX-001 |
| Referenced By | OVSB-001 |

## Purpose

Store maintenance, validation, generation, and operational scripts used to support the engineering workspace and platform.

## Requirements

- Scripts must be documented before use in production workflows.
- Scripts that affect infrastructure, data, billing, or users require owner approval and runbook references.
- Destructive scripts must include safeguards and clear usage instructions.

## Acceptance Criteria

- Contributors can identify what each script does and when it should be used.
- Operational scripts are linked to DevOps or automation documents.

## Future Plan

- Add documentation lint scripts.
- Add ID registry validation.
- Add task readiness checks.

## AI Context

Do not add scripts as a shortcut around missing process. Create or update the relevant documents first.
