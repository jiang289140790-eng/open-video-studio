# Done

| Field | Value |
|---|---|
| Unique ID | TASK-DONE-001 |
| Version | 1.5.0 |
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

- 2026-07-11: Image-to-Video asset picker usability. Added search, favorite/public/recent filters, asset metadata, empty-result recovery actions, upload/demo-reference shortcuts, and a repaired modal footer link for the reference-image chooser. Verification: `npm run test` passed with 74 tests.
- 2026-07-11: Generation failure recovery guidance. Added reusable recovery context for retrying failed/cancelled jobs and regenerated assets, including prompt, preset, video settings, model, reference metadata, failure reason, and refund amount; History and live task cards now explain recovery and route users back to the right generator. Verification: `npm run test` passed with 74 tests.
- 2026-07-11: Credit ledger visibility. Added Dashboard credit ledger rows, History job-level credit-flow notes, remote `credit_transactions` mapping, and local ledger recording for demo checkout, daily rewards, free-credit tasks, tool demos, and Fake Worker generation. Verification: `npm run test` passed with 74 tests.
- 2026-07-11: Image-to-Video login draft restore. Saved the current preset, prompt, ratio, duration, model, and safe reference metadata before login/social OAuth/unlock/real-generation auth gates; restored the draft after authentication; avoided persisting local blob/file contents by requiring re-upload for local-only references. Verification: `npm run test` passed with 74 tests.
- 2026-07-11: Auth return continuity. Added normalized same-origin return target persistence for social login, email login, unlock modals, protected tool gates, Telegram login handoff, and real generation auth prompts so users can return to the exact tool route/preset after signing in. Verification: `npm run test` passed with 74 tests.
- 2026-07-11: Aspect-ratio-aware video preview. Added 16:9, 9:16, and 1:1 preview framing, mobile-safe vertical preview sizing, generated-output ratio preservation, and remote/local ratio-duration metadata mapping for Image-to-Video outputs. Verification: `npm run test` passed with 74 tests.
- 2026-07-11: Live generation task card actions. Added job-created callbacks, remote job ID handoff, in-card refresh, cancel, Generation Tasks link, open Assets, download, share, and regenerate actions for Image-to-Video results across Supabase and Fake Worker fallback paths. Verification: `npm run test` passed with 74 tests.
- 2026-07-11: Image-to-Video reference upload controls. Added gallery selection, mobile camera capture, replace, delete, file metadata, local/uploading/ready/error upload state display, and remote-upload-failed/local-fallback behavior for reference images. Verification: `npm run test` passed with 74 tests.
- 2026-07-11: Generated result output card. Replaced the thin generated-preview link list with a player-style output card showing saved destination, title, prompt, specification, provider/model, credits, status, download, share, regenerate, and continue-use actions. Image outputs can become the next reference image; video outputs restart a similar video flow with the saved prompt. Verification: `npm run test` passed with 74 tests.
- 2026-07-11: Image-to-Video preflight and reference guard. Added submit-time confirmation for reference image, output ratio, duration, provider/model, estimated time, output format, credit cost, and save destination; blocked image-to-video submission until upload, asset selection, URL source, or demo reference provides a reference image. Verification: `npm run test` passed with 74 tests.
- 2026-07-11: Generation task and share download loop. Added History search/filter controls, remote all-job and single-job refresh, cancellable remote jobs, visible failure/refund/progress states, remote Storage signed/public download URL attachment, and public Share page type/model/status/download metadata with unavailable-link fallback. Verification: `npm run test` passed with 74 tests.
- 2026-07-11: Image-to-Video input and progress loop. Added reference image upload, in-page asset picker, demo reference selection, Supabase Storage reference upload wiring, source asset/source image generation payloads, visible generation progress states, Fake Worker output download metadata, generated preview actions, and Asset Library / Generation Task output actions. Verification: `npm run test` passed with 74 tests.
- 2026-07-11: Video workflow surface consolidation. Rebuilt Video Tools as a task-based workflow market, added distinct image-to-video/product-teaser/social-reel preset routing, updated the Image to Video Studio with preset-aware ratio, duration, model, cost, preview, mobile CTA, and generation payload handling, and standardized core vocabulary around assets, generation tasks, works, rewards, and credits. Verification: `npm run test` passed with 74 tests.
- 2026-07-11: OAuth redirect hardening. Replaced relative social-login return URLs with canonical app return URLs, updated the OAuth verification report to show the exact external provider callback URL, and clarified Supabase versus Discord/X/Google redirect configuration. Verification: `npm run verify:oauth` confirms Discord reaches the provider while Google/X remain disabled and Telegram remains unconfigured.
- 2026-07-11: Social OAuth provider activation fix. Switched X login to Supabase OAuth 2.0 provider id `x`, deployed the Admin readiness probe update, added and deployed the `telegram-auth` Edge Function for Telegram Login Widget callbacks, and stored the public Telegram auth URL in GitHub variables. Verification: `npm run verify:oauth` confirms Google, X, and Discord reach provider authorization hosts; `npm run test` passes; Telegram function probe fails closed until Bot token secret is configured.
- 2026-07-11: Technical SEO and mobile visual QA baseline. Added `npm run seo:apply`, generated sitemap/robots/hreflang/localized SEO aliases, repaired mobile Studio/Dashboard overflow, and added SEO/mobile regression tests. Verification: `npm run seo:apply`, browser mobile QA across 13 pages and 4 viewport widths, `npm run build`, `npm run test`, and `npm run verify:i18n`.
- 2026-07-11: MVP payment provider prewire. Added Stripe and PayPal checkout entry points, server-side Supabase Edge Function checkout creation, environment placeholders, pricing page localization, mobile checkout/nav repairs, and payment/provider regression tests. Verification: `npm run build`, `npm run test`, `npm run verify:i18n`, `npm run verify:payments`, and deployed Supabase `ai` function version 20.

## Future Plan

- Add release note generation from completed tasks.

## AI Context

Do not mark a task done unless verification has been performed or explicitly documented as not performed.
