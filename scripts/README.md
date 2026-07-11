# Scripts

| Field | Value |
|---|---|
| Unique ID | SCRIPT-README-001 |
| Version | 0.8.0 |
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

- `npm run seo:apply`: regenerates public HTML metadata, localized `/zh`, `/en`, `/ja`, `/ko` alias pages, `robots.txt`, and `sitemap.xml` from `scripts/apply-seo.mjs`. Run it after public route, canonical, title, description, locale, or indexability changes.
- `npm run verify:supabase`: checks Supabase URL, database reachability, and the configured Storage bucket.
- `npm run verify:production-config`: checks required local and GitHub Pages environment variables for deployment readiness.
- `npm run verify:admin`: checks the Admin Edge Function, admin schema readiness, and authenticated admin operation loop. When `SUPABASE_SERVICE_ROLE_KEY` is available, it creates a temporary admin user, verifies dashboard/user reads, credit adjustment, order status update, asset review, share revocation, audit logging, and cleanup.
- `npm run verify:oauth`: creates non-redirecting Supabase OAuth authorization URLs for Google, X/Twitter, and Discord, and checks Telegram Login Widget public configuration.
- `npm run verify:i18n`: checks registered locales, MVP product-term translation coverage, translated attributes, runtime coverage logic, and mojibake markers for the static product surface.
- `npm run verify:ai`: checks that the Supabase `ai` Edge Function fails closed for unauthenticated requests, then performs an authenticated smoke test for provider status with live provider probes, Qwen Vision image analysis, DeepSeek prompt enhancement, demo credit purchase, generation job creation, Fake Worker processing, Supabase Storage upload, asset creation, queued-job cancellation refund, and production table readback from `generation_jobs`, `media_assets`, and `credit_transactions`. If `SUPABASE_TEST_ACCESS_TOKEN` is absent, the script uses the local service role key to create and clean up a temporary verification user.
- `npm run verify:workflow`: checks that Admin Workflow Center configuration controls AI generation routing. It creates a temporary admin, publishes a temporary workflow, creates a generation job without a direct provider override, confirms the job provider comes from the workflow config, processes the job into an asset, restores the previous workflow config, and cleans up temporary data.
- `npm run verify:user-loop`: checks the authenticated user product loop from demo credit grant to Fake Worker generation, owner Gallery asset readback, owner History job readback, server-created share link, anonymous public share-link readback, anonymous public asset readback, and cleanup.
- `npm run verify:real-ai`: checks the live Qianwen generation path by creating a temporary authenticated user, granting demo credits, forcing a `qianwen_generation` image job, processing it through the deployed AI Edge Function, verifying generated asset persistence when successful, verifying refund ledger behavior when the provider fails, and cleaning up temporary data.
- `npm run verify:payments`: checks that unauthenticated demo credit purchases fail closed, then performs an authenticated production smoke test for demo checkout, order creation, order readback, credit ledger grant, and credit balance readback. This verifies the MVP no-charge payment loop while real payment gateway integration remains deferred.
- `npm run deploy:function -- <slug>`: deploys a Supabase Edge Function through the Supabase Management API using `SUPABASE_ACCESS_TOKEN`. Use this when the local Supabase CLI binary is unavailable. The script does not print access tokens or function secrets.

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
