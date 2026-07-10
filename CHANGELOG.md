# Changelog

| Field | Value |
|---|---|
| Unique ID | CHANGELOG-001 |
| Version | 0.87.0 |
| Status | Active |
| Owner | Engineering Operations |
| Dependencies | DOC-STD-001, TASK-DONE-STD-001 |
| Referenced By | OVSB-001, TASK-DONE-STD-001, REVIEW-ARCH-001 |

## Purpose

Record meaningful changes to the Open Video Studio workspace, documentation, architecture, and future product implementation.

## Requirements

- Update this file every time a task is completed.
- Use reverse chronological order.
- Include documentation changes, architecture changes, validation performed, and known follow-ups.
- Reference relevant document IDs, task IDs, and decision records.
- Do not use the changelog as the source of truth for requirements; link to the owning document instead.

## 2026-07-10

### Improved

- Added the Luravyn production brand package to the web app deployment surface. The site now ships the Luravyn wordmark, icon, favicon, brand preview assets, shared header/sidebar/admin logo usage, and a GitHub Pages `CNAME` for `luravyn.com`.
- Added `npm run verify:auth-basic`, a real Supabase email/password auth verifier for signup, signin, session restore, signout, and cleanup. When public signup is rate-limited, it uses a service-role test-user fallback so the login/session loop can still be verified without exposing secrets to the frontend.
- Added email/password fallback controls to the sign-in page so small user testing is not blocked while Google, X/Twitter, Telegram, and Discord provider setup is still pending.
- Updated `npm run verify:mvp`, the consolidated production readiness gate for the four MVP loops. It now treats email/password auth, credit purchase/ledger, user generation-to-share, and Admin operations as the small-user-test gate, while social OAuth and external real AI providers remain reported launch blockers.
- Added a direct "生成视频" action on the Generate page that switches to video mode and runs the same authenticated AI job pipeline.
- Extended `npm run verify:real-ai` with `-- --video` / `OVS_VERIFY_REAL_AI_MODE=video` so operators can explicitly probe the Qianwen video workflow, asset persistence, and failure-refund behavior.
- Updated the Supabase `ai` Edge Function so real provider `outputUrl` and base64 results are stored as binary image/video objects in Supabase Storage. JSON object storage remains as fallback for Fake Worker and metadata-only outputs.
- Restored the Qwen Vision and DeepSeek default Chinese prompts to valid UTF-8 text inside the AI Edge Function.
- Added an Admin System Provider Fix Checklist that maps real AI rollout blockers to concrete operator actions: Qianwen image/video endpoint and model fixes, Qwen Vision site API key replacement, Liblib template setup, and the matching image/video verification commands.
- Improved the Qianwen generation adapter for the real generation loop. It now treats `/compatible-mode/v1` as an OpenAI-compatible base instead of misrouting it to native DashScope paths, retries safe same-base Qianwen endpoint candidates after `404` or incompatible `stream=False` responses, supports server-side polling for native async `task_id` responses, and documents `QIANWEN_MAX_POLLS` / `QIANWEN_POLL_INTERVAL_MS` for long-running video jobs.
- Updated the real video verification path to generate and upload a temporary 256x256 Supabase Storage reference image, pass its signed URL into `sourceImageUrl`, and clean it up after the probe so image-to-video models that require `input.media` can be tested against production.
- Added the official DashScope native async image generation candidate `/services/aigc/image-generation/generation` and sends `X-DashScope-Async: enable` for native image/video task creation, matching the Wan2.6 image generation API contract.
- Increased the default Qianwen polling window to 36 polls at 5 seconds so real image tasks that return `task_id` have enough time to finish before the platform marks the job failed and refunds credits.

### Validation

- Configured DNS-ready GitHub Pages custom-domain support through the deployed `CNAME` artifact for `luravyn.com`. Direct GitHub Pages API binding is currently waiting on GitHub certificate availability even though public DNS now resolves the apex A records and `www` CNAME.
- Ran `npm run test`; production build passed and 66 tests passed after the Luravyn brand integration.
- Ran `npm run verify:auth-basic`; Supabase password signin, session restore, signout, and cleanup passed. Public signup currently returned `email rate limit exceeded`, so the verifier used its admin-created temporary user fallback.
- Ran `npm run verify:mvp`; `readyForSmallUserTesting` returned `true`. Required loops passed: email/password login, credits/order ledger, user generation to Gallery/History/Share, and Admin operations. Optional launch blockers remain: Google/X/Discord providers are not enabled in Supabase, Telegram config is missing, and Qwen Vision times out.
- Ran `npm run verify:real-ai -- --video`; the deployed `ai` function created a Qianwen video job, charged 24 credits, received `QIANWEN_GENERATION_FAILED / Not Found` from the external provider, refunded the 24 credits, and cleaned up the temporary records. This confirms the video failure-refund path while proving the live video endpoint/model still needs correction before real video output can be marked ready.
- Deployed Supabase `ai` Edge Function version `12` with real provider media storage support.
- Ran `npm run verify:ai` after deploy; unauthenticated gate, DeepSeek prompt enhancement, Fake Worker generation persistence, cancellation refund, and database readback passed. Qwen Vision still returns `Unauthenticated`, and Liblib remains unconfigured.
- Ran `npm run verify:user-loop` after deploy; authenticated demo credits, generation, asset readback, history, share link, public asset readback, and cleanup passed.
- Ran `npm run verify:real-ai -- --video` after deploy; Qianwen video still returns `QIANWEN_GENERATION_FAILED / Not Found`, and the 24-credit refund path remains verified.
- Ran `npm run test`; production build passed and 66 tests passed.
- Ran `npm run verify:admin`; live admin dashboard/user reads, credit adjustment, order update, asset review, share revocation, audit logging, and cleanup passed after adding the Provider Fix Checklist.
- Deployed Supabase `ai` Edge Function version `17` with Qianwen endpoint fallback, async task polling, and source image support.
- Ran `npm run verify:real-ai -- --video`; the production Qianwen image-to-video path completed successfully, created a `wan2.7-i2v-2026-04-25` video job, saved the returned MP4 into Supabase Storage, created a media asset, and cleaned up the temporary user/reference image records.
- Ran `npm run verify:real-ai`; Qianwen image generation still fails with Aliyun `url error`, and the 8-credit refund path remains verified. This narrows the remaining image blocker to provider/model/payload compatibility rather than the video pipeline or storage path.
- Ran `npm run verify:real-ai` after adding the official async image endpoint; Qianwen image generation now creates a real provider task ID but timed out before completion under the old polling window, and the 8-credit refund path remained verified.
- Deployed Supabase `ai` Edge Function version `19` with the longer Qianwen polling window.
- Ran `npm run verify:real-ai`; the production Qianwen image workflow completed successfully with `wan2.6-image`, saved the generated PNG into Supabase Storage, created a media asset, recorded provider/model metadata, and cleaned up verification records.
- Ran `npm run verify:real-ai -- --video`; the production video workflow currently returns a Qianwen account-standing error (`overdue-payment`) from Aliyun. The platform marked the job failed, refunded 24 credits, and cleaned up verification records, so the remaining video blocker is provider account/billing status rather than the Open Video Studio job, storage, or refund path.

## 2026-07-09

### Improved

- Added the local AI Asset MCP foundation for Civitai, Hugging Face, GitHub-reserved workflow discovery, Liblib template calls, local asset downloads, ComfyUI installation, and SQLite inventory tracking.
- Added `liblib_generation` as a server-side image-generation provider candidate in the Supabase `ai` Edge Function, Admin Tool Catalog defaults, Workflow Center defaults, provider readiness UI, environment templates, and provider configuration tests.
- Hardened the backend credit/order sequence: generation jobs are inserted before credit debit, failed credit debit marks the job failed with `credit_charged = 0`, and demo credit purchases create a pending order before granting credits and only mark the order fulfilled after the ledger grant succeeds.

### Validation

- Ran `npm run verify:ai-assets`; 6 MCP asset-management tests passed, covering tool registration, Civitai normalization, local download/install/remove loop, ComfyUI directory mapping, Liblib HMAC signing, and secret-free defaults.
- Ran `npm run test`; production build passed and 66 tests passed, including the new credit/order sequencing guard.
- Deployed Supabase `ai` Edge Function version `11` and `admin` Edge Function version `7`.
- Ran `npm run verify:payments`; authenticated demo checkout created a fulfilled order and posted 123 credits, while unauthenticated access failed closed.
- Ran `npm run verify:admin`; dashboard/user reads, credit adjustment, order update, asset review, share revocation, audit logging, and cleanup passed.
- Ran `npm run verify:user-loop`; temporary user signup/signin, credit debit, Fake Worker generation, Storage metadata, Gallery/History readback, share link creation, public share readback, and cleanup passed.
- Ran `npm run verify:ai`; DeepSeek, Fake Worker generation, database persistence, and cancellation refund passed. Qwen Vision currently times out, and Liblib is not configured.
- Ran `npm run verify:real-ai`; Qianwen still returns `QIANWEN_GENERATION_FAILED / Not Found`, and the 8-credit refund path passed.

### Fixed

- Rebuilt `apps/web/admin.html` as clean UTF-8 Chinese after detecting a page-level encoding regression in the Admin Console source.
- Strengthened the Admin System readiness copy for AI Providers. Qianwen now explicitly tells operators to use `npm run verify:real-ai` for live generation verification and to inspect `QIANWEN_IMAGE_ENDPOINT` when real generation returns `Not Found`.
- Updated static frontend tests so mojibake markers fail the build instead of being treated as expected Admin text.

### Validation

- Ran `npm run test`; build passed and 59 tests passed, including Admin UTF-8 mojibake regression coverage.
- Ran `npm run verify:admin`; Admin Edge Function, role-gated operation probe, credit adjustment, order update, asset review, share revocation, audit logging, and cleanup all passed.
- Ran `npm run verify:user-loop`; demo credits, Fake Worker generation, Gallery/History readback, share link creation, public share readback, and cleanup all passed.
- Ran `npm run verify:i18n`; Chinese, English, Japanese, and Korean product-term coverage remained 100% with no mojibake markers.
- Ran `npm run verify:real-ai`; Qianwen live generation still returns `QIANWEN_GENERATION_FAILED / Not Found`, and the 8-credit refund path remains verified.

### Improved

- Added `npm run verify:real-ai` as a live Qianwen generation probe. It creates a temporary authenticated user, grants demo credits, forces a `qianwen_generation` image job, processes the deployed `ai` Edge Function path, verifies generated asset persistence on success, verifies refund ledger behavior on provider failure, and cleans up all temporary data.
- Added `QIANWEN_IMAGE_ENDPOINT` and `QIANWEN_VIDEO_ENDPOINT` to environment templates and the environment loader so Qianwen image/video endpoints can be corrected without frontend changes.
- Updated the Qianwen provider adapter to support Alibaba Model Studio / DashScope native Wan endpoints. For `wan2.6-image`, the adapter can use the official `multimodal-generation/generation` style payload; for video it can use the native `video-generation/video-synthesis` style payload.

### Validation

- Deployed the updated Supabase `ai` Edge Function through the Management API; production function version is `10`.
- Ran `npm run verify:real-ai`; the deployed function created a real `qianwen_generation` job with model `wan2.6-image`, the provider still returned `QIANWEN_GENERATION_FAILED / Not Found`, and the 8-credit failure refund was verified. This proves the live provider endpoint configured in Supabase is not production-ready yet but the failure path does not keep user credits.
- Referenced Alibaba Cloud Model Studio documentation for Wan2.6 image generation and Wan image-to-video endpoint families while updating endpoint handling.

### Improved

- Added authenticated `create-share-link` support to the Supabase `ai` Edge Function so asset owners can publish generated assets through server-side ownership checks.
- Updated the frontend share flow to call the real share API for remote assets and to hydrate public share pages from Supabase token lookup instead of relying only on local demo state.
- Added `npm run verify:user-loop` to prove demo credits, generation job creation, Fake Worker processing, owner Gallery readback, owner History readback, public share-link lookup, public asset lookup, and cleanup.
- Repaired remaining mojibake in Qwen Vision and DeepSeek default prompt text inside the AI Edge Function source.

### Validation

- Deployed the updated Supabase `ai` Edge Function through the Management API; production function version is `8`.
- Ran `npm run verify:user-loop`; temporary user auth, demo credit grant, credit debit, Fake Worker generation, Storage-backed asset creation, owner Gallery readback, owner History readback, server-created share link, anonymous public share-link readback, anonymous public asset readback, and cleanup all passed.
- Ran `npm run verify:workflow`; Admin Workflow routing, provider selection, asset persistence, config restore, and cleanup all passed.
- Ran `npm run verify:payments`; demo checkout order, credit ledger, balance readback, and unauthenticated fail-closed gate all passed.
- Ran `npm run verify:admin`; admin reads, credit adjustment, order update, asset review, share revocation, audit log, and cleanup all passed.
- Ran `npm run test`; 59 tests passed.
- Ran `npm run verify:oauth`; Supabase local config is present, but Google, X/Twitter, and Discord still return `Unsupported provider: provider is not enabled`, and Telegram still lacks public bot/auth URL configuration.

### Improved

- Added `npm run verify:workflow` as a production smoke test for Admin Workflow Center routing.
- The verifier creates a temporary admin, reads the current Workflow Center config, publishes a temporary testing workflow, creates an AI generation job without passing a direct provider override, confirms the AI Edge Function selects the provider from the Workflow config, processes the job, reads back the generated asset, restores the previous Workflow config, and cleans up all temporary data.
- This proves the backend AI Workflow switch affects real generation routing without changing frontend code.

### Validation

- Ran `npm run verify:workflow`; Admin Workflow config read/update/restore, AI job creation, provider selection, Fake Worker processing, Storage asset creation, asset readback, and cleanup all passed.

### Improved

- Upgraded `npm run verify:admin` from schema and unauthenticated-gate checks into an authenticated production admin operation smoke test.
- The verifier now creates a temporary admin user, validates dashboard and user reads, adjusts credits, updates an order, reviews an asset, revokes a share link, verifies audit log creation, and cleans up all temporary records.
- Added stale verification cleanup so failed admin probes do not leave temporary orders, assets, share links, credit rows, profiles, users, or verification audit logs in production data.

### Validation

- Ran `npm run verify:admin`; database tables, Admin Edge Function fail-closed gate, authenticated admin reads, credit adjustment, order fulfillment, asset moderation, share revocation, audit logging, and cleanup all passed.

### Improved

- Expanded the frontend i18n quality scope from 24 core navigation/admin terms to a 59-term product glossary covering account, generation, credits, admin operations, workflow rollout, and tool publishing language.
- Added Japanese and Korean translations for the expanded MVP product glossary, keeping English, Japanese, and Korean product-term coverage at 100%.
- Added `npm run verify:i18n` to independently validate registered locales, product-term coverage, translated placeholders/attributes, runtime coverage logic, and mojibake markers.

### Validation

- Ran `npm run verify:i18n`; Chinese, English, Japanese, and Korean locale registration passed, product-term coverage was 100% for all target locales, and no mojibake markers were detected.

### Improved

- Fixed corrupted Chinese prompt text inside the deployed Supabase `ai` Edge Function for Qwen Vision image analysis and DeepSeek prompt enhancement.
- Added normalized provider-health failure diagnostics so admin and verification probes classify provider failures by code, HTTP status, and category such as `auth`, `timeout`, `provider`, or `request`.
- Added `npm run deploy:function -- <slug>` as a Supabase Management API deployment path for Edge Functions, avoiding the unavailable Windows Supabase CLI binary package while keeping `SUPABASE_ACCESS_TOKEN` out of logs.
- Expanded `npm run verify:ai` to request live provider probes. Current production evidence shows Qwen Vision failing with `QWEN_VISION_FAILED`, HTTP `401`, category `auth`; DeepSeek verifies successfully; Qianwen is configured with live generation probe skipped; Fake Worker remains healthy.

### Validation

- Deployed the `ai` Edge Function to Supabase through the Management API; production function version is `7`.
- Ran `npm run verify:ai`; generation, Storage asset persistence, credit debit, cancellation refund, and database readback passed, while Qwen Vision remains blocked by external API authentication.
- Ran `npm run verify:payments`; demo checkout, order readback, credit ledger readback, and balance verification passed.
- Ran `npm run test`; 59 tests passed.

### Improved

- Added `npm run verify:payments` as a dedicated production payment-loop verifier for the MVP demo checkout path.
- The verifier proves unauthenticated credit purchase requests fail closed, then creates a temporary authenticated user, calls the server-side `demo-credit-purchase` action, reads the resulting `orders` row, reads the `credit_transactions` ledger grant, verifies the credit balance, and cleans up the temporary records.
- Added static test coverage so the payment verifier must keep checking `orders`, `credit_transactions`, and balance correctness.

### Validation

- Ran `npm run verify:payments`; production Supabase demo checkout, order readback, credit ledger readback, and balance verification passed.
- Ran `npm run test`; 59 tests passed.

## 2026-07-08

### Improved

- Upgraded frontend language switching from a small ad hoc dictionary into a registered MVP i18n layer with `I18N_LOCALES`, `I18N_CORE_TERMS`, text dictionaries, attribute dictionaries, original text/attribute preservation, and runtime coverage reporting.
- Expanded English, Japanese, and Korean coverage for core navigation, admin, workflow, credits, generation, and operations labels.
- Language switching now reports core UI coverage instead of saying non-Chinese translations are only placeholders.

### Validation

- Ran `npm run test`; 59 tests passed.

### Improved

- Added an Admin Workflow Center switchboard so admins can roll individual workflows between Fake Worker, Qianwen, DeepSeek, and Qwen Vision providers, or change workflow status between published, testing, draft, and deprecated without editing raw rows.
- The switchboard still saves through the existing `admin` Edge Function and therefore preserves admin-only permission checks, required reason text, and audit logging.
- Added frontend coverage to keep the Workflow switchboard, quick switch handler, and workflow config mutation helper present.

### Validation

- Ran `npm run test`; 59 tests passed.
- Ran `npm run verify:ai`; Fake Worker generation, Storage/asset persistence, credit debit, cancellation refund, and database readback passed. Qwen Vision still fails with external provider `Unauthenticated`.

### Improved

- Expanded `npm run verify:ai` to read production Supabase tables after generation and refund probes, proving that `generation_jobs`, `media_assets`, and `credit_transactions` are usable by Gallery, History, and Credits instead of only trusting Edge Function responses.
- Updated the AI verification coverage test so future changes must preserve the database persistence readback probe.

### Validation

- Ran `npm run verify:ai`; production generation, asset persistence, credit debit, and cancellation refund readback all passed, while Qwen Vision still fails with external provider `Unauthenticated`.
- Ran `npm run test`; 59 tests passed.

### Improved

- Added an admin-only `oauth-provider-status` action to the Supabase `admin` Edge Function, probing Google, X/Twitter, and Discord authorization endpoints without exposing OAuth secrets.
- Updated the Admin Console system readiness panel to show both frontend social-login entry readiness and real Supabase OAuth Provider enablement status.

### Validation

- Deployed the updated `admin` Edge Function.
- Ran `npm run verify:oauth`; Google, X/Twitter, and Discord still report Supabase `Unsupported provider: provider is not enabled`, matching the new Admin readiness behavior.
- Ran `npm run test`; 59 tests passed.

### Improved

- Added optional live provider probes to the Supabase `ai` Edge Function `provider-status` action for admin/operator users.
- Updated the Admin Console system readiness and Workflow Center previews to show AI Provider runtime state, including Qwen Vision / DeepSeek probe results and provider-specific blocker messages.

### Validation

- Deployed the updated `ai` Edge Function.
- Ran `npm run verify:ai`; Qwen Vision still fails with provider `Unauthenticated`, while DeepSeek, generation asset creation, and cancellation refund still pass.
- Ran `npm run test`; 59 tests passed.

### Improved

- Added a real Qwen Vision smoke-test path to `npm run verify:ai` so production validation now attempts the authenticated `analyze-image` action with a small base64 verification image.
- Updated the AI verification coverage test so the production verifier must retain Qwen Vision, DeepSeek prompt enhancement, successful generation, and cancellation refund probes.

### Validation

- Ran `npm run verify:ai`; DeepSeek prompt enhancement, successful generation asset creation, and cancellation refund still passed, while Qwen Vision returned `Unauthenticated`, proving the remaining issue is the external Qwen Vision site API key/authorization rather than the Supabase AI function route.
- Ran `npm run test`; 59 tests passed.

### Improved

- Extended the Supabase `ai` Edge Function cancellation response to return explicit refund metadata for non-completed generation jobs.
- Expanded `npm run verify:ai` to prove the production credit refund loop by creating a generation job, cancelling it, and verifying the cancellation refund amount.

### Validation

- Ran `npm run verify:ai`; the deployed `ai` function now passes provider status, DeepSeek prompt enhancement, successful generation asset creation, and cancellation refund verification.
- Ran `npm run test`; 59 tests passed.

### Improved

- Applied the remote Supabase MVP schema alignment migration so production tables now match the current Auth -> Credits -> Generation Job -> Storage -> Asset -> Gallery/History loop while preserving existing rows.
- Updated the Supabase `ai` Edge Function asset write path to populate both legacy media columns and the current `media_assets` fields, keeping old MVP records compatible with the current backend loop.
- Expanded `npm run verify:ai` from a fail-closed endpoint check into an authenticated production smoke test covering provider status, DeepSeek prompt enhancement, demo credit purchase, generation job creation, Fake Worker processing, Supabase Storage upload, and asset creation.
- Registered the applied Supabase migrations in remote migration history to avoid future duplicate migration attempts.

### Validation

- Ran `npm run verify:ai`; the deployed `ai` function passed unauthenticated auth-gate verification, authenticated provider-status verification, DeepSeek prompt enhancement, and the demo credit -> job -> asset generation loop.
- Ran `npm run verify:oauth`; Google, X/Twitter, and Discord still fail with Supabase `Unsupported provider: provider is not enabled`, and Telegram remains unconfigured until Bot username/auth URL are provided.
- Ran `npm run build`; production build completed successfully.
- Ran `npm run test`; 59 tests passed.

### Improved

- Added `npm run verify:oauth` to create non-redirecting Supabase OAuth authorization URLs for Google, X/Twitter, and Discord, while checking Telegram Login Widget public configuration.
- Added `npm run verify:ai` to verify the Supabase `ai` Edge Function endpoint and its unauthenticated fail-closed behavior.
- Added Admin Workflow Center rollout hints so operators can see whether a workflow will route to Qianwen generation, Fake Worker fallback, DeepSeek prompt enhancement, Qwen Vision analysis, or a reserved provider path.
- Expanded the frontend i18n dictionary and changed language switching to preserve original source text before applying English, Japanese, Korean, or Chinese translations.

### Validation

- Ran `npm run build`; production build completed successfully.
- Ran `npm run test`; 59 tests passed.
- Ran `npm run verify:ai`; the deployed `ai` function returned the expected unauthenticated 401 gate.
- Ran `npm run verify:oauth`; Google, X/Twitter, and Discord authorization URLs were created successfully, while Telegram correctly reported missing Bot username/auth URL configuration.

### Improved

- Connected the Generate page to the authenticated Supabase `ai` Edge Function before falling back to local demo generation, so real jobs can flow through Prompt -> AI provider -> Supabase Storage -> Asset -> Gallery/History.
- Added remote product-state sync for Supabase `media_assets`, `generation_jobs`, and `credit_transactions` after login and generation completion.
- Added DeepSeek-backed prompt enhancement through the `ai` Edge Function with local fallback when the provider or auth is unavailable.
- Added generation failure and cancellation credit refunds in the local service layer and Supabase `ai` Edge Function, with duplicate-refund protection.
- Updated the `ai` Edge Function to read Admin Workflow Center configuration when choosing generation providers, enabling backend `fake_worker` / `qianwen_generation` rollout switches without frontend changes.
- Added a logged-in demo credit purchase action through the `ai` Edge Function so non-real-payment checkout can still create Supabase orders and credit ledger entries visible in Admin.
- Expanded OAuth test coverage to include the Telegram Login Widget entry alongside Google, X/Twitter, and Discord.
- Added Qwen Vision, DeepSeek Text, and Qianwen Generation as selectable Admin Tool Catalog providers.

### Validation

- Ran `npm run build`; production build completed successfully.
- Ran `npm run test`; 58 tests passed.

### Added

- Added Supabase `ai` Edge Function with authenticated actions for Qwen Vision image analysis, DeepSeek prompt enhancement, Qianwen/Fake Worker generation jobs, job status, cancellation, and provider status.
- Added server-only AI provider environment placeholders for Qwen Vision, DeepSeek, Qianwen, rollout mode, and timeout configuration.
- Added Admin Tool Catalog and Workflow Center defaults for Qwen Vision, DeepSeek prompt enhancement, Qianwen image generation, and Qianwen video generation.

### Validation

- Added AI provider configuration tests for env placeholders, Edge Function actions, secret isolation, and Admin default workflow readiness.

### Improved

- Added local homepage visual assets from the approved素材目录 to the hero showcase and creation preview cards.
- Updated homepage rendering so Supabase/local homepage configuration preserves card image paths instead of falling back to CSS-only placeholders.
- Added image-card styling with dark overlays for readable premium visual cards.

### Validation

- Added static frontend coverage to ensure homepage visual assets exist and are referenced by the homepage surface.

### Fixed

- Fixed Admin console select dropdowns flashing closed by isolating admin form controls from global document click handlers.
- Renamed Admin Tool Catalog visual cards away from the public `tool-card` class so backend form controls no longer inherit frontend card interaction assumptions.

### Validation

- Ran `npm run test`; production build completed and 53 tests passed.
- Verified the Admin Tool Catalog category select can change from `image` to `video` in the browser.

### Improved

- Reduced Admin console visual density issues by tightening sidebar typography, top heading size, KPI numbers, panel headings, list rows, form controls, textareas, and admin-only media/tool preview cards.
- Added stronger Admin CSS overrides so backend configuration cards no longer inherit oversized public tool-card image/layout dimensions.

### Validation

- Ran `npm run test`; production build completed and 53 tests passed.
- Verified the Admin console at 1366x768 with no horizontal overflow; H1 is approximately 27px, panel headings approximately 15px, and tool configuration cards approximately 209px high.

### Improved

- Added explicit `workflowId` binding to Admin Tool Catalog configuration, visual editing, batch editing, previews, backend normalization, and Supabase Edge Function normalization.
- Expanded default Agent Center configuration to cover Director, Content Analyst, Prompt Engineer, Script Writer, Storyboard, and Publisher Agent roles.
- Expanded default Content Intelligence records to cover X, TikTok, YouTube, Reddit, Instagram, and Telegram manual-analysis inputs with preserved AI analysis JSON shape.
- Updated Admin API, Database Bible, Summary documentation, and tests for the completed backend operations guidance alignment.

### Validation

- Ran `npm run test`; production build completed and 53 tests passed.

### Added

- Added P2 Admin operations modules for Content Intelligence, Agent Center, and Cost Analytics.
- Extended the admin backend and Supabase `admin` Edge Function with audited actions for `content_intelligence_config` and `agent_center_config`, plus generation-job-derived cost analytics.
- Added schema readiness for `content_intelligence`, `agent_configs`, and `cost_analytics` in local SQLite and Supabase MVP schemas.
- Added database documentation for Content Intelligence, Agent Configs, and Cost Analytics, and updated Admin API, Database Bible, and Summary documentation.
- Added admin backend and static frontend test coverage for P2 admin surfaces.

### Validation

- Ran `npm run build`; production build completed successfully.
- Ran `npm run test`; production build completed and 53 tests passed.

### Added

- Added P1 Admin operations modules for Workflow Center, Prompt Library, and Tool Version management.
- Extended `tool_catalog_config` with tool version history for version, changelog, model version, workflow version, prompt version, and status.
- Added Admin API actions and audited publish paths for `workflow_center_config` and `prompt_library_config`.
- Added schema readiness for `workflow_configs`, `prompt_library`, and `tool_versions` in local SQLite and Supabase MVP schemas.
- Added database documentation for Workflow Configs and Tool Versions, and updated Prompt, Admin API, Database Bible, and Summary documentation.

### Validation

- Ran `npm run test`; production build completed and 53 tests passed.

### Added

- Added P0 Admin operations console upgrades: daily growth/revenue/generation KPIs, weekly revenue trend, popular tools, high-failure tools, credit consumption ranking, Worker Center, and richer generation job detail rows.
- Extended `SupabaseAdminBackend` and the Supabase `admin` Edge Function with enhanced `dashboard-summary`, `list-workers`, and normalized generation job outputs for workflow, cost, latency, input, output, and error inspection.
- Added schema readiness for `ai_workers` and generation job workflow/cost/detail fields in local SQLite and Supabase MVP schemas.
- Added admin backend and static frontend test coverage for KPI fields, worker status derivation, and new admin UI hooks.

### Validation

- Ran `npm run test`; production build completed and 53 tests passed.

### Improved

- Expanded AI Studio output to match the imported content lifecycle guidance more closely. Mock content packages now surface image placeholder, video placeholder, thumbnail placeholder, CTA, translation, quality check, and platform-specific versions.
- Platform version cards now show platform, caption, media format, review status, account, hashtags, and CTA so users can see how one content item adapts across channels.
- Added static frontend coverage for AI Studio asset placeholders and platform-version output.

### Validation

- Ran `npm run test`; production build completed and 53 tests passed.

### Added

- Added the remaining MVP content-operations navigation surfaces required by the imported guidance: `publishing.html`, `automation.html`, and `settings.html`, with localized `/zh/.../` aliases and Vite build entries.
- Added local Publishing Center rendering over content queue records, including platform account readiness and status filters.
- Added local Automation rules with trigger/action/status/last-run placeholders, plus form-based rule creation.
- Added local content operations Settings for default platforms, publishing frequency, default CTA, content style, and review-required behavior.
- Extended the shared side rail, account menu, footer navigation, and static tests to include Publishing, Automation, and Settings.

### Validation

- Ran `npm run test`; production build completed and 53 tests passed.

### Improved

- Upgraded `dashboard.html` into a content-operations command center aligned with the imported guidance. It now shows active campaigns, content in pipeline, scheduled posts, failed posts, content production volume, social traffic, top performing content, accounts needing attention, and direct links to Campaigns, AI Studio, Pipeline, Calendar, Accounts, and Analytics.
- Extended dashboard local-state rendering so the new command-center cards are computed from campaigns, content items, queue records, social accounts, and analytics placeholders.
- Added static test coverage for the new dashboard content operations metrics and panels.

### Validation

- Ran `npm run test`; production build completed and 53 tests passed.

### Added

- Added MVP publishing and feedback-loop surfaces from the imported content operating guidance: `accounts.html`, `calendar.html`, and `analytics.html`, with localized `/zh/.../` aliases and Vite build entries.
- Added local social account connection placeholders for X, TikTok, YouTube Shorts, Instagram, Pinterest, Reddit, Telegram, and Facebook without connecting real platform APIs.
- Added a Content Calendar view that renders queue items by Today, Tomorrow, This Week, Scheduled, Failed, and Published states.
- Added Content Analytics summary and performance snapshot cards using local placeholder metrics for views, likes, shares, clicks, signups, and conversion rate.
- Extended static frontend tests to cover publishing account, calendar, and analytics page hooks.

### Validation

- Ran `npm run test`; production build completed and 53 tests passed.

### Added

- Added MVP Content Operating System frontend surfaces: `campaigns.html`, `ai-studio.html`, `pipeline.html`, and `queue.html`, with localized `/zh/.../` aliases and Vite build entries.
- Connected the new pages to the shared dark creator app shell, side rail, account menu, global footer, and local product state.
- Added local interactions for campaign creation, AI Studio mock content package generation, pipeline stage movement, queue filtering, and scheduled queue insertion.
- Extended static frontend tests so the Campaigns, AI Studio, Content Pipeline, and Content Queue surfaces and hooks remain covered.

### Validation

- Ran `npm run test`; production build completed and 53 tests passed.

### Added

- Added the first AI Content Operating System service foundation from the imported desktop guidance: campaigns, content items, AI Studio mock draft generation, content pipeline events, platform-specific post variants, publishing queue records, and analytics placeholder records.
- Added `ContentOperatingService` so a user can create a campaign, create a content idea, generate research/script/prompt/caption/hashtags/translations with mock AI output, move the item through pipeline stages, create platform variants, and schedule a queue item without changing the existing generation, asset, admin, or Supabase architecture.
- Extended the local SQLite schema with `campaigns`, `content_items`, `content_pipeline_events`, `platform_post_variants`, `publishing_queue`, and `content_analytics` as a non-breaking foundation for future content lifecycle workflows.
- Added automated coverage for the Campaign → AI Studio → Pipeline → Platform Variants → Publishing Queue loop.

### Validation

- Ran `npm run test`; production build completed and 53 tests passed.

### Improved

- Expanded the MVP Admin console toward a Shopify-style operations model with Page Builder and Tool Catalog sections. Admins can now configure page modules, display styles, card counts, module data sources, tool listing status, category, provider, model, route, featured state, and credit cost through `site_settings`.
- Upgraded Page Builder and Tool Catalog from batch text-only configuration into visual admin cards with editable page/module/tool fields while keeping advanced batch editing available.
- Connected the public homepage and tool directory surfaces to published `page_builder_config` and `tool_catalog_config`, so admin settings can affect section visibility, card counts, display style, tool labels, provider metadata, route, featured state, and credit labels.
- Added Supabase Admin Edge Function actions and backend methods for `get-page-builder-config`, `update-page-builder-config`, `get-tool-catalog-config`, and `update-tool-catalog-config`, with admin-only writes and audit logs.
- Added tests for page module merchandising, tool listing sanitization, admin/operator permissions, and static admin UI coverage.
- Upgraded `apps/web/admin.html` from a simple homepage form into a richer Chinese MVP operations console with left navigation, command center, KPI cards, and dedicated modules for users, credits, orders, moderation, generation jobs, share links, homepage content, system readiness, and audit logs.
- Restored the Admin page source to clean UTF-8 Chinese text and added static regression coverage for the expanded admin module map.
- Added final Admin console styling overrides for the black / charcoal / pink product direction, including responsive navigation and denser operations layouts.

### Validation

- Ran `npm run build`; production build completed successfully.
- Ran `npm run test`; 52 tests passed.

### Added

- Added the MVP Admin homepage manager so admins can edit and publish homepage hero copy, CTA links, trust signals, showcase cards, and gallery preview cards without changing source files.
- Added `site_settings` to the Supabase MVP schema, migration, and verification script for public published settings such as `homepage_config`.
- Added admin backend and Supabase Edge Function actions for `get-homepage-config` and `update-homepage-config`; operators can read config, while only admins can publish and create audit logs.
- Updated the public homepage to read published homepage configuration from Supabase with static fallback content and local preview support.
- Restored `apps/web/admin.html` and `apps/web/index.html` to clean UTF-8 Chinese content while preserving the current dark AI SaaS visual direction.
- Added automated coverage for admin homepage publishing permissions, unsafe CTA URL sanitization, and audit logging.

### Validation

- Ran `npm run build`; production build completed successfully.
- Ran `npm run test`; 52 tests passed.
- Ran `npm run verify:admin`; Supabase database tables including `site_settings` and the existing `admin` function are reachable.

## 2026-07-07

### Added

- Built the MVP Admin backend foundation with `SupabaseAdminBackend`, role-gated admin/operator access, dashboard summaries, user balance views, credit adjustments, order updates, asset review, share revocation, and audit log reads.
- Added the Supabase `admin` Edge Function entry for production-safe admin actions without exposing the service role key in the browser.
- Added Supabase CLI-standard project configuration and admin console migration files under `supabase/`.
- Added `npm run verify:admin` to validate admin database tables and the Supabase `admin` Edge Function deployment status without printing secrets.
- Extended the Supabase MVP schema with admin-required `audit_logs`, `orders`, `characters`, `images`, and `videos` tables plus role-aware RLS read policies.
- Rebuilt `apps/web/admin.html` as a real Chinese admin console for users, credits, orders, content moderation, generation jobs, share links, system configuration, and audit logs.
- Connected the admin console frontend to Supabase Functions and added clear blocked states for unauthenticated users, unauthorized roles, missing Supabase config, or undeployed admin functions.
- Added automated coverage for admin role enforcement, operator/admin permission boundaries, credit adjustment, asset review, order fulfillment, share revocation, and audit logging.

### Validation

- Ran TypeScript type checking after the admin backend implementation.
- Ran `npm run verify:admin`; admin database tables were reachable, while the Supabase `admin` Edge Function still returned `404` until deployed.
- Deployed the Supabase `admin` Edge Function from the dashboard and reran `npm run verify:admin`; verification now passes with the expected unauthenticated `ADMIN_AUTH_REQUIRED` response.
- Checked Supabase Auth user inventory; no users exist yet, so the first `profiles.role = 'admin'` assignment must wait until a real account signs up.

### Fixed

- Restored the shared top navigation bar after the dropdown hidden-state styling accidentally hid `.topbar` on deployed pages.
- Kept image tools, video tools, language, and account dropdowns hidden by default while preserving the visible top navigation and login actions.

### Validation

- Ran the full test suite after the top navigation visibility fix; 51 tests passed.
- Ran the production build after the top navigation visibility fix.

### Added

- Added `npm run verify:production-config` to check local Supabase environment values and required GitHub Pages Variables/Secrets for production OAuth readiness.
- Added `OPS-AUTH-001` production auth configuration documentation covering Supabase OAuth, Telegram login, redirect URLs, GitHub Variables/Secrets, and validation steps.
- Updated README with the production auth configuration verification command and required GitHub Pages environment names.
- Added the MVP Admin surface with localized `/zh/admin/` routing, OAuth readiness, moderation queue, order fulfillment, risk controls, and system health status.
- Added OAuth readiness checks to the sign-in page so Google, X, Telegram, and Discord login setup gaps are visible before production launch.
- Added a shared i18n message dictionary and static text translation pass for core navigation, account, and conversion labels.
- Added local original preview assets for major creation cards so product surfaces are no longer limited to pure CSS placeholder visuals.
- Added demo order records to the checkout flow so credit fulfillment is visible in Admin instead of only changing the local balance.
- Added static coverage for admin, OAuth readiness, i18n, moderation, orders, and local preview assets.
- Normalized root static product-page links so user-facing navigation now routes through the existing localized `/zh/.../` and `/zh/app/.../` public paths instead of exposing canonical `.html` file URLs.
- Added static coverage to prevent primary root product pages from regressing back to old `.html` click routes.
- Added localized account, login, gallery, dashboard, assets, history, and share route aliases, then routed primary account and creation-flow links through those `/zh/.../` paths.
- Updated primary tool discovery, category, navigation, footer, modal, and conversion links to use target-style `/zh/.../` and `/zh/app/.../` click routes instead of exposing `.html` file URLs.
- Added `/zh/app/.../` tool route aliases for the primary image, character, effect, and video tool pages to better match target-style localized tool URLs.
- Added static `/zh/.../` route aliases for target-style Chinese URL patterns, including app, image tools, video tools, pricing, free coins, my creations, blog, terms, privacy, and cookie.
- Added a shared `public/zh/redirect.js` helper that preserves query strings and hashes when forwarding localized route aliases to canonical static pages.
- Added canonical `image-tools.html` and `video-tools.html` category pages so the top navigation now opens target-style tool category surfaces before users choose a specific tool.
- Updated top navigation dropdowns, left rail, footer links, Vite build inputs, and static tests to include the image/video category route layer.
- Added `free-coins.html` as the canonical target-style Free Coins page while preserving `referral.html` as a compatibility route.
- Updated global navigation, account navigation, side rail, footer links, floating quick actions, Vite build inputs, and static tests to include the Free Coins route.
- Made the public share page actionable with generate-similar, copy-prompt, save-to-assets, and conversion links back to tools, pricing, and login.
- Reused the shared social-login modal from the public share page so signed-out users stay in the same conversion flow.
- Added static coverage for public share conversion actions.
- Aligned the Purchase Credits and Free Coins surfaces more closely with the referenced commerce flow: PayPal, Cash App, Apple Pay, Venmo choices; Chinese 2x bonus messaging; and a visible seven-day free-credit calendar.
- Added static coverage for the free-credit calendar and checkout payment options.
- Added a shared target-style discovery layer to every tool detail page: popular templates, use-case steps, related tool routing, and login/free-credit conversion actions.
- Added static coverage for the tool template gallery, related tool routes, and conversion strip.
- Aligned the daily check-in flow with the target-style modal behavior: signed-out users now stay on the current page and open the social login modal from the check-in dialog.
- Added stronger free-credit CTA copy and gift-labeled daily check-in navigation.
- Upgraded the global language selector with persisted locale state, active menu state, document language updates, and a site toast that clarifies untranslated languages remain in Chinese for now.
- Added target-style tool directory filtering on the AI tools homepage with category chips, search, active states, section hiding, and empty-state feedback.
- Added target-style protected account page gates for Dashboard, My Creations, Assets, and History so signed-out visitors see a login/register prompt before managing demo account data.
- Added click-to-open top navigation menus for image tools, video tools, language, and account navigation with `aria-expanded`, open-state styling, and outside-click closing for touch-friendly target-style navigation.
- Added target-style Cookie preference controls with a global banner, manage preferences modal, local persistence, accept-essential and accept-all actions, and a Cookie page management CTA.
- Added target-style carousel controls to horizontal tool/content rows with injected left/right buttons and smooth scrolling.

### Validation

- Ran production configuration verification; it correctly reports missing `.env.local` and missing GitHub Variables/Secrets until real Supabase and provider values are supplied.
- Ran the full test suite after the production-readiness surface update; 51 tests passed.
- Ran the full test suite after the static route normalization update; 49 tests passed.
- Checked local HTML links and documentation summary links after the route normalization update.
- Ran the full test suite after the Free Coins route, public share, purchase credits, free coins, tool discovery, daily check-in flow, language selector, tool directory, protected account page, navigation menu, Cookie preference, and carousel control update; 44 tests passed.
- Checked local HTML links and documentation summary links after the update.

### Added

- Added a global target-site-style login modal for top navigation sign-in, using Google, X, Telegram, and Discord entry points.
- Routed locked tool login choices through the same dynamic social-login flow instead of sending users to a separate page first.
- Added static coverage for the global auth modal and social login hooks.

### Validation

- Ran production build and full test suite after the global auth modal update; 38 tests passed.
- Checked local HTML links after the update.

### Added

- Made the app side rail page-aware so the current tool/page is highlighted instead of always marking Home active.
- Corrected the side rail My Creations and Generation History routes and improved mobile rail group headings.
- Added static coverage for page-aware side rail navigation.

### Validation

- Ran production build and full test suite after the side rail navigation update; 37 tests passed.
- Checked local HTML links after the update.

### Added

- Added a target-site-style checkout modal for credit purchases with order summary, payment-method selection, promo code field, login prompt, and demo credit delivery without connecting a real payment API.
- Routed the limited-time 2x credit offer through the same checkout flow so every purchase entry point behaves consistently.
- Added static coverage for the checkout flow and no-real-payment messaging.

### Validation

- Ran production build and full test suite after the checkout flow update; 36 tests passed.
- Checked local HTML links after the update.

### Added

- Upgraded Free Coins into a dynamic reward center with signed-in state, check-in progress, referral-copy tracking, claimed task state, and task reward claiming without connecting payment or real referral APIs.
- Upgraded Dashboard panels to render recent generations, saved characters, and share links from the local product state.
- Added static coverage for reward center and dashboard state hooks.

### Validation

- Ran production build and full test suite after the rewards and dashboard update; 35 tests passed.
- Checked local HTML links after the update.

### Added

- Upgraded Character Management into an actionable character center with search, filters, selectable character cards, dynamic profile preview, character memory, related assets, copy-character-prompt, and use-character-to-generate flow.
- Added local character state defaults for status, favorite, and memory so existing demo characters remain compatible.
- Added static coverage for the character management center and character-to-generate handoff.

### Validation

- Ran production build and full test suite after the character center update; 34 tests passed.
- Checked local HTML links after the update.

### Added

- Wired the visual gallery cards into the product loop: Generate Similar now sends prompts to Generate, Copy Prompt writes the prompt, Share creates a shareable local asset, Favorite marks cards as saved, and Open Character routes to Characters.
- Added working Asset Library filter chips for images, videos, prompts, references, and favorites.
- Added static coverage for the gallery action hooks and asset filter hooks.

### Validation

- Ran production build and full test suite after the gallery and asset filter update; 33 tests passed.
- Checked local HTML links after the update.

### Added

- Rebuilt My Creations into a target-site-style creation center with a hero summary, work stats, filters, search, reusable work cards, recent generation history, and next-step creation actions.
- Added creation-center interactions for share links, copy prompt, retry from asset, and retry from generation history using stable delegated handlers.
- Added static coverage for the My Creations center and its required hooks.

### Validation

- Ran production build and full test suite after the My Creations center update; 33 tests passed.
- Checked local HTML links and `docs/SUMMARY.md` links after the update.

### Added

- Added a target-site-style floating quick action dock with daily check-in, free coins, support/help, assistant avatar, and back-to-top actions.
- Added a frontend-only support widget with links to image tools, video tools, credit plans, free coins, and support email.
- Added responsive floating dock behavior for mobile screens.

### Validation

- Ran production build and full test suite after the floating quick action update; 32 tests passed.

### Added

- Added a shared actionable workbench to tool detail pages with reference upload, mode tabs, prompt input, style/ratio selectors, demo generation, templates, and output status.
- Added frontend-only demo generation for tool pages that saves local demo results to Assets and Generation History without connecting a real generation API.
- Added static coverage for the injected tool workbench and demo generation hooks.

### Validation

- Ran production build and full test suite after the tool workbench update; 31 tests passed.

### Added

- Added a signed-in top navigation state with credit balance, account avatar/menu, dashboard, creations, history, assets, free coins, purchase credits, and logout actions.
- Converted Daily Check-in, language selection, and logout actions to delegated handlers so the account navigation remains interactive after state changes.
- Added static coverage for signed-in account navigation state and logout hooks.

### Validation

- Ran production build and full test suite after the account navigation update; 30 tests passed.

### Added

- Added target-site-style locked tool gates: locked tool cards now open a login modal for signed-out visitors instead of navigating directly.
- Added four-provider unlock login choices for Google, X, Telegram, and Discord, plus a credits package CTA inside the unlock modal.
- Added static coverage for locked tool login gates and unlock modal hooks.

### Validation

- Ran production build and full test suite after the locked tool gate update; 29 tests passed.

### Added

- Added target-site-style top navigation dropdowns for Image Tools and Video Tools across the product surface.
- Added a language selector menu with Chinese, English, Japanese, and Korean choices as a frontend-only interaction.
- Added static coverage for dropdown navigation, language hooks, and the expanded tool route map.

### Validation

- Ran production build and full test suite after the navigation interaction update; 28 tests passed.

### Added

- Added target-site-style route coverage for AI Effects, Image Editor, Face Swap, Outfit Studio, Pose Generator, Nano Banana, Image Combiner, Blog, Terms, Privacy, and Cookie pages.
- Expanded the app shell side rail and global footer to link to the new tool and footer pages.
- Added Vite build entries so the new static pages are included in GitHub Pages deployment output.

### Validation

- Ran production build, full test suite, and local HTML link target check after expanding the page map; 27 tests passed.

### Changed

- Rebuilt the Purchase Credits page into a conversion-focused credit shop with highlighted credit packs, one-time payment messaging, payment method choices, creator trust cards, and a limited-time 2x credit offer modal.
- Rebuilt the Free Coins page around login-required rewards, daily check-in, referral link copy, creator tasks, and free-credit use cases.
- Added frontend interactions for payment method selection, referral link copying, and the credit offer promo-code claim path.

### Validation

- Ran production build and full test suite after the credit shop and free coins update; 26 tests passed.

### Added

- Added a target-style Daily Check-in modal opened from the top navigation check-in action.
- Added signed-out and signed-in check-in states, a seven-day reward calendar, current credit display, red notification dot, and a login-to-claim CTA.

### Validation

- Ran production build and full test suite after the Daily Check-in modal update; 26 tests passed.

### Changed

- Rebuilt `signin.html` from a two-column email form into a target-style centered login modal with only Google, X, Telegram, and Discord entry points.
- Removed visible email/password form fields from the MVP login surface while keeping provider hooks and configuration messaging.
- Added modal login styling with dimmed tool-card backdrop, white provider buttons, close action, and terms/privacy text.

### Validation

- Ran production build and full test suite after the login modal rebuild; 26 tests passed.

### Changed

- Replaced the account page social options with the requested four-provider set: Google, X, Telegram, and Discord.
- Removed GitHub and Apple login options from the frontend and Supabase OAuth provider type.
- Updated Supabase OAuth support to use Google, X/Twitter, and Discord; Telegram is wired through Telegram Login Widget configuration and requires a backend signed-hash callback.
- Added Telegram public configuration variables to environment templates and the GitHub Pages deployment workflow.
- Rebuilt the frontend static test file as clean UTF-8 and added coverage for the four required social login options.

### Validation

- Ran production build and full test suite after the social login provider update; 26 tests passed.

### Added

- Added `REVIEW-TARGET-FEATURE-MAP-001` to document the referenced tool site's page map, feature checklist, and Open Video Studio implementation mapping.
- Added pricing trust metrics, creator quotes, and example creation cards to strengthen the credit purchase flow.
- Added referral task cards, a My Creations empty-state creation prompt, and an Image to Video workflow explainer.

### Changed

- Expanded page modules to better match mature AI tool-site information architecture while keeping original Open Video Studio copy and safe AI creation categories.

### Validation

- Ran production build, full test suite, and Markdown link check after the module expansion; 26 tests passed.

### Changed

- Localized the primary MVP product surface to Chinese across Home, Generate, Gallery, Characters, Assets, Dashboard, History, Sign in, Share, Image to Video, Pricing, Referral, and My Creations pages.
- Tuned global typography, title scale, panel colors, controls, and tool-page styling toward the referenced black / charcoal / pink visual direction.
- Localized visible dynamic interaction messages for auth configuration, credit purchase, generation results, asset lists, history rows, and share prompts.
- Updated frontend static tests to enforce the Chinese product surface and localized CTA/navigation expectations.

### Validation

- Ran production build and full test suite after localization and typography changes; 26 tests passed.

### Added

- Added a global site footer module through `apps/web/app.js` so pages share the same footer navigation, tool links, contact details, and copyright block.
- Added the global footer to the homepage by loading the shared product script from `apps/web/index.html`.

### Changed

- Rebuilt Pricing, Free Credits / Referral, My Creations, and Image to Video pages toward the target tool-site structure with Chinese navigation, compact black / pink styling, action-focused cards, and reusable page sections.
- Updated frontend static tests to accept localized conversion CTAs while preserving route, auth, gallery, dashboard, and encoding checks.

### Validation

- Ran production build and full test suite after multi-page layout alignment; 26 tests passed.

### Changed

- Rebuilt `apps/web/app.html` into a target-style AI tool homepage with a fixed left navigation rail, compact top navigation, two large featured tool banners, quick tool cards, categorized horizontal tool rows, and footer link groups.
- Updated the product shell color direction toward the referenced black / charcoal / pink tool-site style while keeping Open Video Studio-safe AI creation categories.
- Updated frontend static encoding coverage to allow intentional UTF-8 Chinese interface text while still blocking mojibake markers.

### Validation

- Ran production build and full test suite after the tool homepage rebuild; 26 tests passed.

### Added

- Added target-style product application shell with a left tool rail, compact dark top navigation, referral and upgrade actions, and tool-first navigation across MVP product pages.
- Added real Supabase browser Auth integration for email signup, email signin, and OAuth redirects for Google, GitHub, Discord, and Apple using `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- Added frontend environment examples for browser-safe Supabase public configuration.
- Added GitHub Pages build environment wiring for browser Supabase Auth variables without committing credentials.

### Changed

- Replaced fake email/social auth redirects on `signin.html` with Supabase Auth calls and visible configuration/error states.
- Updated static frontend tests to prevent regression to local-only fake registration and to verify the target-style product shell hooks.

### Validation

- Ran production build and full test suite after auth/layout changes; 26 tests passed.

### Added

- Added target-site-style routes for Tools, Image to Video, Free Credits / Referral, and My Creations.
- Added local MVP browser-state interactions for social/email login, credit purchase, character creation, generation, asset listing, history listing, and public share pages.
- Added Vite build entries and frontend static coverage for the expanded product route set and core interaction hooks.

### Changed

- Updated homepage navigation toward mature AI SaaS acquisition paths: Tools, Buy Credits, Free Credits, My Creations, and Login.
- Updated Frontend Summary documentation to reflect the expanded route surface and local MVP interaction loop.

### Validation

- Ran production build and full test suite after route/function expansion; 26 tests passed.
- Browser-tested the local MVP flow: Google login, credit purchase, character creation, generation, assets, history, my creations, and share page.
- Checked Markdown links after documentation updates.

## 2026-07-06

### Added

- Added Supabase OAuth URL support for Google, GitHub, Discord, and Apple sign-in.
- Added social authentication options to the account page, with email fallback, starter-credit messaging, and credits/referral navigation.
- Added MVP Backend Loop Supabase adapter for Auth signup/login, profile sync, starter credits, generation jobs, Fake Worker completion, Supabase Storage output paths, asset records, gallery reads, history reads, and share links.
- Added Supabase MVP schema and RLS policy file at `src/supabase/mvp-schema.sql`.
- Added starter credits constant and automatic starter credit grant on signup.
- Added Supabase backend loop test covering signup, login, starter credits, generation, fake output storage, gallery, history, and sharing.
- Added GitHub Pages deployment workflow for the `production-mvp` branch using `npm ci`, `npm run build`, and `dist-web` artifact deployment.
- Initialized Git repository and committed the stable MVP baseline.
- Added React, Vite, and a production app shell while preserving the existing MVP product pages.
- Added Supabase environment loading, client creation, connection status checks, and verification script.
- Added `.env.example`, `.env.local.example`, MIT `LICENSE`, and production-safe Git ignore rules.
- Added Supabase configuration tests for environment loading, placeholder detection, and missing-config failure behavior.
- Added premium AI creation platform MVP surface across Home, Explore/Gallery, Generate Studio, Characters, Assets, Dashboard, History, Pricing, Sign in/Account, and Share pages.
- Added expanded product navigation for Explore, Generate, Characters, Assets, Pricing, Dashboard, History, Credits, and Account.
- Added static frontend tests for required pages, required navigation, conversion CTAs, gallery sections, dashboard sections, and premium AI SaaS positioning.
- Added `REVIEW-MVP-PRODUCT-001` MVP Product Review V1 after browser-based product review of the local MVP frontend.
- Added product-value Sprint 3 plan focused on auth UI, connected generation, character management, connected asset library, share page, credits purchase entry, dashboard/history, mobile repair, and product analytics.
- Added MVP Sprint 2 character, asset library, gallery, share, local stub generation, search, filters, and generation history API routes.
- Added reusable asset relationships so generated assets record owner, project, character, generation job, provider, model, credits, estimated cost, resolution, duration, and lifecycle state.
- Added character profile fields for cover asset, tags, memory, and consistency status.
- Added Sprint 2 API test covering create character, generate image, generate video, search assets, share asset, and review generation history.
- Added `ROADMAP-MVP-SPRINTS-001` MVP Sprint Backlog with Sprint 1 through Sprint 4 delivery tasks.
- Added MVP Sprint 1 local HTTP API server for health, signup, login, current user, profile update, credits, local credit purchase, and order listing.
- Added MVP API tests covering auth, profile, credits, local purchase, orders, and protected-route rejection.
- Added `REVIEW-PLATFORM-EVOLUTION-001` Platform Evolution Review V1 to reposition Open Video Studio as an AI Content Operating Platform.
- Added `ROADMAP-PLATFORM-V2-001` Platform Evolution Roadmap V2 with milestones, sprints, and task definitions.
- Added `ADR-007` Platform V2 Ownership Foundation.
- Added local schema and service-layer support for workspaces, workspace members, projects, and role-based project access.
- Added Database Bible documents for `DB-WORKSPACES-001`, `DB-PROJECTS-001`, and `DB-PERMISSIONS-001`.
- Added API Bible documents for `API-WORKSPACE-001` and `API-PROJECT-001`.
- Added Platform Foundation tests covering workspace creation, membership, project creation, read/write role checks, and non-member rejection.
- Added `REVIEW-PROVIDER-PLUGIN-001` Provider Plugin Architecture Review with architecture review, folder refactoring plan, dependency graph, provider/storage/queue/billing interfaces, migration plan, and risk analysis.
- Added proposed `ADR-006` Provider Plugin Architecture as an approval gate before package refactoring.
- Added `ADR-005` AI Engine Foundation for provider-independent AI orchestration without connecting to real models.
- Added unified AI provider interface, provider registry, local stub provider, and not-configured future provider adapters for OpenAI, Gemini, ComfyUI, Fal.ai, Replicate, RunPod, and Local API.
- Added local AI job queue, independent worker, AI cost tracker, and AI storage adapter abstraction.
- Added local schema support for `ai_jobs` and `ai_cost_records`.
- Added AI Bible documents for provider interface, job queue/workers, storage abstraction, and cost tracking.
- Added Database Bible documents for `DB-AI-JOBS-001` and `DB-AI-COST-RECORDS-001`.
- Added AI Engine tests for provider uniformity, queue execution, retry/cancel behavior, storage abstraction, and cost tracking.
- Added `ADR-004` Product Workflow Foundation for the register, purchase credits, generate, store, review, share, and history service-layer workflow.
- Added backend workflow services for billing credit purchases, character management, generation queue/history, and gallery review/sharing.
- Added local schema support for characters, generation jobs, images, videos, orders, and share links.
- Added Database Bible documents for `DB-GENERATION-JOBS-001` and `DB-SHARE-LINKS-001`.
- Added an end-to-end product workflow test covering one user from registration through purchase, generation, storage, review, sharing, and history.
- Added the first MVP frontend reconstruction in `apps/web/` with homepage, gallery, generate entry, and pricing preview static routes.
- Added `ADR-003` to record the MVP frontend reconstruction decision, route mapping, limitations, and future migration path.
- Added automated frontend static tests for route presence, shared assets, and commercial SaaS positioning.
- Added `REVIEW-LEGACY-001` legacy site migration review in `docs/reviews/legacy-site-migration-review.md`, covering reusable legacy ideas, rejected concepts, redesign/rebuild decisions, Product Bible conflicts, and MVP v1 frontend migration plan.
- Added Phase 1 implementation foundation with TypeScript backend core, SQLite local schema, authentication service, user repository, credits ledger, storage service, audit log, and automated tests.
- Added `ADR-002` to document the Phase 1 implementation foundation and its production limitations.
- Added `REVIEW-ARCH-001` architecture review report in `docs/reviews/architecture-review-v1.md`.
- Added the permanent Growth Bible in `docs/0900-growth/` with `GROWTH-BIBLE-001` and strategy documents for SEO, landing pages, blog system, Pinterest, Twitter, Instagram, TikTok, YouTube, Reddit, affiliate, email, referral, analytics, and North Star metrics.
- Added the permanent Backend Architecture Bible in `docs/0400-backend/` with `BE-ARCH-BIBLE-001` and architecture documents for authentication, storage, queue, GPU jobs, image processing, video processing, billing, notification, logging, monitoring, and security.
- Added the permanent Frontend Bible in `docs/0300-frontend/` with `FE-BIBLE-001` and page specifications for homepage, gallery, generate, prompt library, pricing, dashboard, profile, admin, settings, and authentication.
- Added the permanent API Bible in `docs/0600-api/` with `API-BIBLE-001` and API specifications for authentication, image generation, video generation, characters, gallery, credits, payment, subscription, admin, analytics, and webhooks.
- Added the permanent Database Bible in `docs/0500-database/` with `DB-BIBLE-001` and table architecture documents for users, credits, images, videos, characters, prompts, orders, subscriptions, affiliate, analytics, notifications, settings, audit logs, and media assets.
- Added the permanent Design System in `docs/0200-design/` with IDs `DS-001` through `DS-015`.
- Added the permanent Product Bible in `docs/product/` with IDs `PB-001` through `PB-015`.
- Added `CTX-001` project context at `docs/context/PROJECT_CONTEXT.md` as a fast onboarding entry point for AI agents and contributors.
- Created the initial engineering workspace and knowledge base.
- Added governance standards for documents, IDs, task workflow, references, lifecycle, ownership, knowledge management, and architecture decisions.
- Added domain folders for product, design, frontend, backend, AI engine, database, API, SEO, growth, automation, DevOps, analytics, security, and roadmap.
- Added task folders for backlog, todo, doing, and done.
- Added templates for documents, tasks, ADRs, product requirements, API contracts, and database contracts.
- Added Git hygiene files for line endings, ignored local files, and binary handling.
- Added `TASK-DONE-STD-001` to define required completion behavior for every future task.

### Changed

- Updated authentication frontend, API, and sprint documentation after reviewing Hifun-style auth and growth patterns without copying third-party page content.
- Updated local API and workflow tests to account for starter credits on signup.
- Updated backend, database, API, summary, and MVP sprint backlog documentation for the MVP Backend Loop.
- Optimized the live homepage hero for conversion with a shorter headline, clearer subheadline, stronger CTAs, benefit signals, improved generated-output preview, and an expanded creation gallery preview.
- Updated static frontend validation to assert the new homepage conversion copy and CTA direction.
- Fixed Vite asset base path for GitHub Pages subpath deployment so production CSS and JavaScript load under `/open-video-studio/`.
- Updated root README with production stack, local setup, Supabase environment variables, GitHub readiness, and verification commands.
- Updated Frontend, Backend, Authentication, Storage, Database, and Summary documentation for React/Vite and Supabase production-readiness.
- Replaced non-ASCII password placeholder characters in the static sign in page with ASCII-safe text to prevent mojibake in Windows/browser/tooling contexts.
- Rebuilt the MVP visual direction from a plain internal workflow style to a dark, gradient-friendly, gallery-first creator platform style.
- Redesigned Homepage, Gallery, Generate, and Pricing surfaces with visual-first layouts and creator-focused CTAs.
- Updated `ROADMAP-MVP-SPRINTS-001` with completed `MVP-S3-000` Product Surface Direction Correction.
- Updated `ROADMAP-MVP-SPRINTS-001` Sprint 3 from engineering-led provider integration work to browser product activation based on `REVIEW-MVP-PRODUCT-001`.
- Updated `DOC-002` and `ID-REG-001` to register `REVIEW-MVP-PRODUCT-001`.
- Marked MVP Sprint 2 backlog tasks complete after the local stub generation and reusable asset API surface became available.
- Updated API and Database Bible documents affected by Sprint 2 implementation.
- Marked MVP Sprint 1 backlog tasks complete and documented the first usable MVP API surface.
- Updated backend, database, API, context, summary, and ID registry documentation for Platform Architecture V2 Sprint 1.
- Updated AI, backend, API, database, context, summary, and ID registry documentation for the proposed Provider Plugin Architecture.
- Updated AI, API, backend architecture, database, context, summary, and ID registry documentation for the AI Engine foundation.
- Updated API, backend, database, context, summary, and ID registry documentation for the product workflow foundation.
- Updated frontend documentation for `FE-INDEX-001`, `PAGE-HOME-001`, `PAGE-GALLERY-001`, `PAGE-GENERATE-001`, and `PAGE-PRICING-001` to describe the current MVP implementation.
- Updated `CTX-001`, `DOC-002`, and `ID-REG-001` for `ADR-003` and the current MVP frontend surface.
- Updated `DOC-002` and `ID-REG-001` to register the legacy site migration review.
- Fixed a stale example link in `REF-001` so the cross-reference standard points to an existing canonical credits document.
- Updated backend, database, and API documentation to reflect the Phase 1 service-layer implementation and clarify that SQLite/local filesystem are local foundations, not production infrastructure decisions.
- Strengthened production-readiness governance across document standards, task workflow, completion checklist, templates, and core domain indexes.
- Renumbered the database governance folder to `docs/0650-database/` to avoid a top-level numbering conflict with the new API Bible.
- Clarified that `docs/0600-api/` owns permanent API specifications while `docs/0700-api/` remains the API governance and implementation-readiness domain.
- Renumbered the AI Engine folder to `docs/0550-ai-engine/` to avoid a top-level numbering conflict with the new Database Bible.
- Clarified that `docs/0500-database/` owns table architecture while `docs/0650-database/` remains the database governance and implementation-readiness domain.
- Updated the design domain index to distinguish permanent design language from future frontend implementation.
- Clarified that `docs/product/` owns the permanent Product Bible and `docs/0100-product/` owns derived feature-level PRDs.
- Normalized documentation folder names to four-digit prefixes.
- Normalized task status folders to lowercase ordered names.
- Replaced machine-specific links with portable relative Markdown links.

### Validation

- Ran production build and full test suite after social auth entry and OAuth URL support; 24 tests passed.
- Ran TypeScript typecheck, production build, and full test suite after the MVP Backend Loop; 24 tests passed.
- Ran local production build and full test suite after the homepage conversion optimization; 23 tests passed.
- Confirmed local Vite build now emits relative asset URLs and reran the full test suite; 23 tests passed.
- Ran local production build and full test suite before deploying GitHub Pages workflow.
- Ran `npm install` to install React, Vite, Supabase, and React type dependencies.
- Ran `npm run build` after React/Vite/Supabase setup.
- Ran `npm run test` after React/Vite/Supabase setup; 23 tests passed.
- Ran `npm run verify:supabase`; verification correctly reported missing Supabase environment variables instead of pretending to connect.
- Added and ran a static frontend encoding safety test to block non-ASCII/mojibake markers in product surface files.
- Ran the TypeScript build and full Node test suite after the encoding fix; 20 tests passed.
- Ran the TypeScript build and full Node test suite after the product UI direction correction; 19 tests passed.
- Reviewed redesigned pages in the browser at desktop and mobile widths; required pages loaded and no horizontal overflow was detected on checked pages.
- Ran the static MVP frontend locally and reviewed Homepage, Gallery, Generate, and Pricing in desktop and mobile browser contexts.
- Tested key product interactions: Generate mode switch, Add to queue, Gallery search, and Pricing billing toggle.
- Checked documentation links after adding `REVIEW-MVP-PRODUCT-001`.
- Ran the TypeScript build and full Node test suite after completing MVP Sprint 2; 17 tests passed.
- Ran the TypeScript build and full Node test suite after completing MVP Sprint 1.
- Ran the TypeScript build and full Node test suite after completing Platform Architecture V2 Sprint 1.
- Ran the TypeScript build and full Node test suite after documenting the Provider Plugin Architecture plan.
- Ran the TypeScript build and full Node test suite after adding the AI Engine foundation.
- Ran the TypeScript build and full Node test suite after adding the product workflow foundation.
- Ran the TypeScript build and full Node test suite after adding the MVP frontend reconstruction.
- Reviewed the legacy GitHub Pages demo, including its static app shell, bundled frontend script, stylesheet, and favicon asset.
- Checked documentation links after adding `REVIEW-LEGACY-001`.
- Ran TypeScript build and Node test suite for Phase 1 implementation.
- Completed architecture review V1 and recorded score, issues, risks, and debt.
- Checked duplicate IDs.
- Checked unknown dependencies.
- Checked dependency cycles.
- Checked required Markdown sections.
- Checked for stale absolute Windows paths.
- Checked Markdown links for broken references.
- Confirmed current workspace is not yet a Git repository.

## Acceptance Criteria

- Completed tasks can be audited chronologically.
- The changelog references source documents instead of duplicating requirements.
- Future contributors can understand what changed and why.

## Future Plan

- Add release sections after product implementation begins.
- Add task IDs to each changelog entry once task files are created for implementation work.
- Add automated changelog validation.

## AI Context

Every completed task must update this file. Keep entries factual, concise, and linked to source documents.
