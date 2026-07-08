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

## Current Scripts

- `npm run verify:supabase`: checks Supabase URL, database reachability, and the configured Storage bucket.
- `npm run verify:production-config`: checks required local and GitHub Pages environment variables for deployment readiness.
- `npm run verify:admin`: checks the Admin Edge Function and admin schema readiness.
- `npm run verify:oauth`: creates non-redirecting Supabase OAuth authorization URLs for Google, X/Twitter, and Discord, and checks Telegram Login Widget public configuration.
- `npm run verify:ai`: checks that the Supabase `ai` Edge Function fails closed for unauthenticated requests, then performs an authenticated smoke test for provider status, Qwen Vision image analysis, DeepSeek prompt enhancement, demo credit purchase, generation job creation, Fake Worker processing, Supabase Storage upload, asset creation, and queued-job cancellation refund. If `SUPABASE_TEST_ACCESS_TOKEN` is absent, the script uses the local service role key to create and clean up a temporary verification user.

## Acceptance Criteria

- Contributors can identify what each script does and when it should be used.
- Operational scripts are linked to DevOps or automation documents.

## Future Plan

- Add documentation lint scripts.
- Add ID registry validation.
- Add task readiness checks.

## AI Context

Do not add scripts as a shortcut around missing process. Create or update the relevant documents first.
Never print Supabase service keys, provider API keys, or OAuth client secrets from verification scripts.
