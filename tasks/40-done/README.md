# Done

| Field | Value |
|---|---|
| Unique ID | TASK-DONE-001 |
| Version | 0.2.0 |
| Status | Active |
| Owner | Product / Engineering |
| Dependencies | TASK-001 |
| Referenced By | TASK-README-001 |

## Purpose

Archive completed tasks with verification evidence and follow-up notes.

## Requirements

- Move a task here only after acceptance criteria are met.
- Include verification notes and any documents updated.

## Acceptance Criteria

- Completed work remains auditable.

## Completed Tasks

- 2026-07-11: OAuth redirect hardening. Replaced relative social-login return URLs with canonical app return URLs, updated the OAuth verification report to show the exact external provider callback URL, and clarified Supabase versus Discord/X/Google redirect configuration. Verification: `npm run verify:oauth` confirms Discord reaches the provider while Google/X remain disabled and Telegram remains unconfigured.
- 2026-07-11: Social OAuth provider activation fix. Switched X login to Supabase OAuth 2.0 provider id `x`, deployed the Admin readiness probe update, added and deployed the `telegram-auth` Edge Function for Telegram Login Widget callbacks, and stored the public Telegram auth URL in GitHub variables. Verification: `npm run verify:oauth` confirms Google, X, and Discord reach provider authorization hosts; `npm run test` passes; Telegram function probe fails closed until Bot token secret is configured.
- 2026-07-11: Technical SEO and mobile visual QA baseline. Added `npm run seo:apply`, generated sitemap/robots/hreflang/localized SEO aliases, repaired mobile Studio/Dashboard overflow, and added SEO/mobile regression tests. Verification: `npm run seo:apply`, browser mobile QA across 13 pages and 4 viewport widths, `npm run build`, `npm run test`, and `npm run verify:i18n`.
- 2026-07-11: MVP payment provider prewire. Added Stripe and PayPal checkout entry points, server-side Supabase Edge Function checkout creation, environment placeholders, pricing page localization, mobile checkout/nav repairs, and payment/provider regression tests. Verification: `npm run build`, `npm run test`, `npm run verify:i18n`, `npm run verify:payments`, and deployed Supabase `ai` function version 20.

## Future Plan

- Add release note generation from completed tasks.

## AI Context

Do not mark a task done unless verification has been performed or explicitly documented as not performed.
