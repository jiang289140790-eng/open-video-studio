# Character API

| Field | Value |
|---|---|
| ID | API-CHARACTER-001 |
| Unique ID | API-CHARACTER-001 |
| Version | 1.2.0 |
| Status | Active |
| Owner | AI Media Platform Lead / API Platform Lead |
| Dependencies | API-AUTH-001, DB-CHARACTERS-001, DB-IMAGES-001, DB-PROMPTS-001 |
| Referenced By | API-GEN-IMAGE-001, API-GEN-VIDEO-001 |
| Cross References | DB-CHARACTERS-001, SEC-INDEX-001, AI-INDEX-001 |

## Purpose

Define the API surface for creating, retrieving, updating, archiving, and using reusable characters.

## Requirements

- Manage reusable character metadata and references.
- Enforce rights, consent, safety, and visibility constraints.
- Keep character use auditable when used in generation workflows.

## Business Logic

Characters capture reusable visual or persona context for consistent AI media generation. The API manages character metadata, reference assets, prompt associations, rights status, safety state, and visibility.

## Authentication

Requires authenticated user or authorized service account.

## Permissions

Caller must have permission to create or manage characters in the target workspace. Use of likeness, voice, restricted media, or brand characters may require elevated approval.

## Request

Conceptual request inputs may include character name, description, type, reference image IDs, prompt reference, style metadata, visibility, rights attestation, and workspace or project reference.

## Response

Responses may include character ID, status, reference media summary, safety review state, rights state, visibility, timestamps, and usage eligibility.

## Error Codes

- `CHARACTER_NAME_REQUIRED`
- `CHARACTER_REFERENCE_FORBIDDEN`
- `CHARACTER_RIGHTS_REQUIRED`
- `CHARACTER_SAFETY_REVIEW_REQUIRED`
- `CHARACTER_NOT_FOUND`
- `CHARACTER_RATE_LIMITED`

## Rate Limit

Limits apply to creation, update, reference processing, and validation actions. Rights or safety review actions may have stricter throttles.

## Dependencies

Depends on character records, media assets, images, prompts, moderation, rights policy, audit logs, and AI generation workflows.

## Future Expansion

Support character versioning, approvals, voice profiles, consistency scoring, enterprise review workflows, and character libraries.

## Acceptance Criteria

- Characters can be reused safely and consistently across generation workflows.
- Restricted character use is permissioned and auditable.

## Current Implementation

Sprint 2 adds MVP HTTP routes for character creation, listing, retrieval, and update:

- `POST /characters`.
- `GET /characters`.
- `GET /characters/profile?id={characterId}`.
- `PATCH /characters`.

Implemented character fields include name, description, type, reference asset, cover asset, tags, memory, consistency status, prompt seed, rights status, safety status, and visibility status.

No real character generation model, consent workflow, or safety review workflow is implemented yet.

## Future Plan

Define character rights, consent, and review workflows before implementation.

## AI Context

Characters may represent likeness or identity. Always consider consent, rights, safety, and auditability.
