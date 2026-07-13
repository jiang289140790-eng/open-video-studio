# Documentation Summary

| Field | Value |
|---|---|
| Unique ID | DOC-002 |
| Version | 1.16.0 |
| Status | Active |
| Owner | CTO / Lead Software Architect |
| Dependencies | OVSB-001, DOC-001, TASK-DONE-STD-001 |
| Referenced By | OVSB-001, DOC-001, TASK-001, TASK-DONE-STD-001 |

## Purpose

Provide the navigation map for the Open Video Studio knowledge base.

## Requirements

- Keep this file updated whenever important documents are added, renamed, or superseded.
- Link to canonical documents only.
- Avoid repeating content from linked documents.

## Current Implementation Notes

- The public tool surface now follows one canonical discovery hierarchy: image tools, AI effect presets, and video workflows use consistent Chinese category names and localized routes. Product, vertical, character, and general image-to-video cards carry distinct presets instead of collapsing into one undifferentiated destination; the permanent routing matrix is maintained in [REVIEW-TARGET-FEATURE-MAP-001](reviews/target-site-feature-map.md).
- The real-generation path now has a portable ComfyUI deployment baseline. Six workflows from the known-good AutoDL Zealman image are inventoried as A01, C16, D14, G01, G03, and J11; raw exports remain ignored, while `templates/comfyui-headless/` contains a token-protected Zealman-compatible gateway, an original Qwen Image 2512 A01 baseline, automatic application-image recovery, and an optional Caddy TLS boundary.
- The seven requested generation capabilities now have a single machine-readable coverage matrix and permanent workflow IDs. A01 general image generation is qualified, G01 image-to-video is inventoried but still gated, and E01 image editing, F01 face swap, O01 outfit change, P01 pose generation, and M01 image composition are explicitly tracked as missing rather than being falsely represented by unrelated reference-image workflows. See [AI-WORKFLOW-002](0550-ai-engine/002-workflow-capability-matrix.md).
- E01 has advanced from missing to inventory. An original API-format Qwen Image Edit workflow now has explicit source-image, mask-image, prompt and masked-composite nodes; the Supabase AI function uploads source and mask separately and rejects incomplete E01 jobs. It remains unpublished until the edit model, automatic masking and the full credits-to-Storage loop pass on a GPU runtime.
- G01 has passed direct AutoDL runtime qualification: an uploaded image completed the Wan2.2 high/low-noise pipeline and produced a 25-frame MP4 before the instance was stopped. M01 now has a D18 multi-reference inventory candidate; the backend accepts at most two source images in fixed nodes and disables four vendor demo inputs. Both remain unpublished pending their complete Supabase qualification gates.
- The Supabase `ai` Edge Function now has verified Compshare on-demand lifecycle control. A stopped instance can start, restore ComfyUI and the gateway, complete A01, debit test credits, persist the output to Supabase Storage and `media_assets`, expose it through history, schedule shutdown, and clean up the verifier account. Production enablement now requires only a stable trusted hostname such as `gpu.luravyn.com`; direct HTTP is not retained in Supabase Secrets.
- Signed-out generation now has a controlled try-before-login path. The unlock modal still makes real saving, downloading, sharing, credit debit, and remote provider generation require a real Supabase session, but it also offers email sign-in/sign-up and one browser-only demo generation that is explicitly marked as non-account data.
- The AI generation layer now includes a server-side Zealman / ComfyUI provider behind the existing Supabase `ai` Edge Function. Browser code still submits only prompt, reference asset, mode, ratio, duration, and provider/workflow intent; server secrets select A01 image generation, G01 image-to-video, G03 smooth video, or J11 digital-human/product-video workflows and persist outputs back into Supabase Storage.
- MVP product surfaces now separate functional previews from real account data. Only a real Supabase-authenticated user is treated as signed in; Assets, History, My Works, Characters, and Dashboard show preview cards while signed out, and generation/share actions require login before creating records or consuming credits.
- Authenticated frontend sync now reads Supabase `profiles`, `characters`, `media_assets`, `generation_jobs`, `credit_transactions`, and `share_links`, so logged-in users can resume from real nickname, credit balance, reusable characters, assets, generation history, and public shares.
- Public model selection no longer exposes Fake Worker. Fake Worker remains an admin/operator internal fallback, while normal users see the production-shaped generation workflow and failed remote jobs fail visibly instead of silently creating local demo output.
- The Image-to-Video page has been repaired to clean UTF-8 Chinese and now includes explicit mobile guardrails for 375px, 390px, 412px, and 768px widths.
- Authentication trust boundaries were hardened. Social login buttons now require both Supabase client configuration and provider-specific readiness flags before they can launch OAuth, unverified providers show `配置中` instead of falling back to Dashboard, unauthenticated product surfaces display Demo Mode labeling, and Admin navigation is hidden unless the current Supabase profile role is `admin` or `operator`.
- OAuth diagnostics now identify the exact provider-facing callback URL. `npm run verify:oauth` reports that Google, X / Twitter OAuth 2.0, and Discord all receive `https://wyvswkxogkmywduhrhkw.supabase.co/auth/v1/callback` as `redirect_uri`; provider consoles must register this exact URL, while Supabase URL Configuration controls the separate in-app return URLs.
- Character Management now supports the MVP character loop from one page: users can create, edit, list, search, filter, preview, copy, and select reusable characters with cover asset, reference asset, tags, memory, favorite state, status, score, and consistency state. `MVP-S3-003` is now completed while the existing API/database contracts remain the source of truth for server wiring.
- Dashboard and Generation History now have a clearer post-login work-resume loop. Dashboard includes next-action recommendations, recent tasks, recent reusable assets, credit ledger, saved characters, share links, and content operations summaries; History remains the detailed task center for search/filter, refresh/cancel, failure reasons, refund state, output links, share, download, and retry.
- Product analytics now has a local, privacy-aware MVP event queue. The frontend records signup/signin, password recovery, pricing CTA, checkout, generation submit/block/fail/complete, and asset-share events to `ovs_product_events_v1` when analytics consent is granted or the site is running locally for QA.
- Email authentication now has a password recovery loop. `signin.html` can request a Supabase reset email, `/zh/reset-password/` preserves the recovery callback, and `reset-password.html` updates the password through the authenticated Supabase recovery session before returning users to Dashboard.
- Reusable media references now use a normalized URL path in the Image-to-Video loop. Reference selection and previews can pull from `sourceImageUrl`, `previewUrl`, `publicUrl`, `downloadUrl`, `outputUrl`, and storage file URL fields, while avoiding JSON metadata downloads as image inputs. This makes existing assets more reliably reusable as generation references.
- Image-to-Video asset selection is now more usable inside the core generation loop. The Asset Library picker can search by asset text, filter favorite/public/recent image assets, show source/status metadata, and recover from empty results with direct upload, demo reference, or full Asset Library actions.
- Generation failures are now recoverable from the product surface. Retry actions preserve a small local recovery context with prompt, workflow type, preset, video ratio, duration, model, reference asset metadata, failure reason, and refund amount; Generate/Image-to-Video restores that context and shows a recovery notice so users can adjust and resubmit without losing the previous setup.
- Credit movement is now visible to users instead of being hidden behind a balance number. The Dashboard injects a credit ledger panel for recent purchases, rewards, generation debits, and refunds; Generation History rows show the credit impact tied to each job. Remote Supabase sessions map `credit_transactions` into the browser state while local MVP actions record matching ledger entries for demo checkout, rewards, and Fake Worker generation.
- Image-to-Video now preserves draft creation context across login. Before opening login, social OAuth, Telegram handoff, unlock modals, or real-generation auth gates, the frontend saves the current preset, prompt, ratio, duration, model, and safe reference metadata; after the user returns, the generator restores those choices and asks for a re-upload only when the previous reference was a local blob/file that should not be persisted.
- Authentication return flow now preserves creation context. When an unauthenticated user opens a locked tool, starts a protected demo generation, or submits a real generation job, the frontend stores a same-origin normalized return target and uses it for social OAuth, Telegram login handoff, and email sign-in/sign-up. Query parameters such as Image-to-Video presets or source assets are preserved, and stale return targets are cleared once the session is restored.
- Image-to-Video preview now reflects the actual output aspect ratio. 16:9 stays cinematic, 9:16 becomes a vertical social-video frame, and 1:1 becomes a square frame; completed output cards preserve ratio/duration metadata from local and remote generation records where available. This improves mobile review and helps users confirm the output is suitable before downloading or sharing.
- Image-to-Video live task cards now bridge the gap between submit and task management. Remote generation exposes the created job ID back to the page, running cards can refresh or cancel the remote job, every card links to Generation Tasks, and completed cards expose Assets, download, share, and regenerate actions. This keeps the P0 loop visible without changing the backend/provider architecture.
- Image-to-Video reference selection now behaves more like a product upload control. Users can pick from gallery, capture from camera on mobile, replace or clear the selected reference, see file size/source metadata, and see whether the reference is local-only, uploading, uploaded to Supabase Storage, or failed remotely while still usable for local fallback generation.
- Completed Image-to-Video generations now render as a reusable result card rather than a thin link list. The output card shows a player-style preview, saved-location copy, title, prompt, specification, provider/model, credits, status, download, share, regenerate, and continue-use actions; image outputs can become the next reference image, while video outputs can restart a similar video flow with the saved prompt.
- Image-to-Video now includes a generation preflight step. Before submitting, users can see the selected reference image, output ratio, duration, provider/model, estimated time, output format, and credit cost; submitting without a reference image is blocked so the primary video flow stays image-to-video instead of becoming an ambiguous empty prompt flow.
- Generation History is now closer to a production task center. It can search prompt/model/provider/title text, filter by running/completed/failed/image/video, refresh all remote tasks, refresh or cancel a single remote task, display progress, surface failure reasons and refund amounts, and link completed outputs to Assets, Share, and downloads.
- Public Share pages now resolve active Supabase `share_links` by token, hydrate the related `media_assets` row, attach Storage signed/public output URLs when available, show unavailable-link fallback copy for revoked/missing assets, and expose model/type/status/download metadata without requiring frontend provider changes.
- Image-to-Video now has a first actionable input-to-output loop. The generator can accept an uploaded reference image, an in-page asset-library selection, or a demo reference image; logged-in Supabase users can upload the reference to Storage, create a reference `media_assets` row, and pass `sourceAssetId` / `sourceImageUrl` to the existing `ai` Edge Function without changing backend architecture.
- The Image-to-Video task area now shows production-shaped generation states for queued, running, retrying, failed, and completed work. Local Fake Worker fallback outputs create asset/history records, update the preview, and expose download/open actions so users can complete a visible generate -> save -> review -> download/share loop during MVP testing.
- Browser configuration now includes `VITE_SUPABASE_STORAGE_BUCKET` as a public bucket-name setting. Third-party secrets remain server-only; the bucket name is only used so the browser can upload user-selected reference images through Supabase Auth and Storage policies.
- The video creation surface has started moving from broad tool discovery toward a real closed-loop workflow. `video-tools.html` now presents task-based video workflows with clear capability, cost, time, and output expectations; `image-to-video.html` supports URL-driven workflow presets for image-to-video, product teaser, and social reel use cases while preserving the existing Supabase/Fake Worker generation path.
- Product vocabulary on the first video workflow pass is now more consistent: user-facing navigation and workflow copy use `免费积分`, `每日奖励`, `生成任务`, `我的作品`, and `资产库` so users can distinguish input assets, running jobs, finished works, and credit actions.
- Mobile video workflow behavior has a first production-oriented baseline. Video filters scroll horizontally, dense generator controls stack cleanly, and the image-to-video studio has a sticky mobile action bar for the primary generation path.
- Social-login redirect handling now uses canonical app return URLs for Supabase `redirectTo` and documents the external OAuth provider callback separately. Google, X / Twitter OAuth 2.0, and Discord now reach their authorization endpoints through Supabase. Telegram uses a separate `telegram-auth` Edge Function because it is not a built-in Supabase Auth provider. External provider consoles must register `https://wyvswkxogkmywduhrhkw.supabase.co/auth/v1/callback`.
- Technical SEO now has a generated, repeatable baseline. `npm run seo:apply` refreshes canonical, hreflang, robots, Open Graph, Twitter metadata, localized `/zh`, `/en`, `/ja`, `/ko` alias pages, `robots.txt`, and `sitemap.xml`; public routes use clean `https://luravyn.com/{locale}/.../` canonicals while private app/admin surfaces remain `noindex,follow`.
- Mobile visual QA now covers Homepage, Gallery, Generate, Image to Video, Characters, Assets, History, Dashboard, Pricing, Free Coins, Sign In, Admin, and Share across 375px, 390px, 412px, and 768px viewport widths. The latest pass found and fixed Studio panel and Dashboard row overflow on narrow screens.
- Regression coverage now includes SEO artifact checks and mobile layout guardrails through `tests/seo-mobile.test.ts`, alongside the existing build and i18n gates.
- MVP payments are now prewired for Stripe and PayPal while preserving the no-charge demo checkout fallback. The browser exposes only public provider config (`VITE_STRIPE_PUBLISHABLE_KEY`, `VITE_PAYPAL_CLIENT_ID`), while the Supabase `ai` Edge Function owns `create-payment-checkout`, `payment-provider-status`, Stripe Checkout Session creation, and PayPal Orders creation. Real fulfillment still requires live provider accounts, Edge Function secrets, webhook verification, PayPal capture, idempotency, refund/reconciliation, and tax/invoice policy.
- The primary pricing page has been restored to clean UTF-8 Chinese and aligned with the Luravyn product surface. It now presents one-time credit packages, Stripe/PayPal payment choices, safe unconfigured-provider copy, and mobile-safe checkout behavior.
- Mobile product surface rules were tightened for navigation wrapping, headline sizing, pricing cards, and scrollable checkout modals. Static regression coverage now guards these rules.
- Payment and language validation are green after the update: `npm run test` passes with 70 tests, `npm run verify:i18n` reports 100% glossary coverage for Chinese/English/Japanese/Korean, and `npm run verify:payments` passes against deployed Supabase `ai` function version 20.
- The public product brand is now moving to Luravyn. The deployed web surface includes Luravyn logo assets, favicon, header/sidebar/admin logo usage, and a GitHub Pages `CNAME` for `luravyn.com`; DNS resolves correctly, while GitHub's Pages API is still waiting for certificate availability before HTTPS enforcement can be toggled for the custom domain.
- MVP readiness now has a consolidated gate. `npm run verify:mvp` orchestrates basic email/password auth, OAuth readiness, demo credit purchase, user generation/assets/history/share, Admin operations, and AI fallback health; `npm run verify:mvp -- --real-ai` adds the cost-bearing real provider probe. Small user testing is gated by email/password auth plus credits, generation/share, and Admin operations. Social OAuth and external real AI providers remain launch blockers until their provider credentials and endpoints are green.
- The real Qianwen image generation loop is now production-verified. `npm run verify:real-ai` creates an authenticated `wan2.6-image` job through the deployed Supabase `ai` Edge Function, waits for the real provider result, saves the generated PNG into Supabase Storage, creates a media asset, records provider/model metadata, and cleans up verification records.
- The real Qianwen video generation loop has production evidence from the earlier successful MP4 probe, and the current failure mode is isolated to Aliyun account/billing status. `npm run verify:real-ai -- --video` still uploads a temporary reference image, creates an authenticated `wan2.7-i2v-2026-04-25` job, records provider failure details, refunds credits, and cleans up verification records when Aliyun returns `overdue-payment`.
- Qianwen real generation support now distinguishes OpenAI-compatible `/compatible-mode/v1` bases from DashScope native `/api/v1/services/aigc/...` endpoints, retries safe same-base endpoint candidates after `404` or incompatible `stream=False` responses, and can poll native async image/video `task_id` responses until a media output is available. The official native async image endpoint now creates real provider task IDs; `QIANWEN_MAX_POLLS` defaults to 36 with 5-second intervals so real image jobs have a production-sized completion window without frontend changes.
- Admin System Configuration now includes a Provider Fix Checklist for real AI rollout. It turns current provider blockers into operator actions for Qianwen image/video endpoints and models, Qwen Vision site API key, Liblib template UUID, and the matching `npm run verify:real-ai` image/video probes.
- Real generation verification now has explicit image and video paths. `npm run verify:real-ai` probes the Qianwen image workflow, while `npm run verify:real-ai -- --video` probes the Qianwen video workflow, job charging, asset persistence, and failure-refund behavior when the external provider fails.
- Generated media storage now preserves real provider outputs. The Supabase `ai` Edge Function stores provider URL/base64 outputs as binary image/video objects in Supabase Storage, while retaining JSON metadata fallback for Fake Worker and metadata-only probe flows.
- Basic Supabase auth has a production verifier. `npm run verify:auth-basic` proves password signin, session restore, signout, and cleanup. Current public signup is hitting Supabase email rate limits, so the verifier falls back to a temporary admin-created test user while preserving the browser-safe email/password sign-in path for small user testing.
- AI asset operations now have a local MCP foundation. The project includes an `ai-assets` MCP server for Civitai and Hugging Face search/detail/download, ComfyUI installation, Liblib template calls, and local SQLite inventory tracking. `npm run verify:ai-assets` validates the tool surface and local asset loop.
- Supabase AI generation now reserves both `qianwen_generation` and `liblib_generation` as real provider candidates while keeping `fake_worker` as rollback. The Admin Workflow Center can expose Liblib image generation as a grey-rollout option, and provider readiness reports whether Liblib secrets plus template UUID are configured.
- Credit and demo-order sequencing has been hardened: generation jobs are recorded before credit debit, credit-debit failure marks the job failed without charging, demo purchases create pending orders before credit grants, and fulfillment is only recorded after the ledger grant succeeds.
- Production verification after deploying `ai` v11 and `admin` v7 proves the current MVP SaaS loop for demo payment credits, admin operations, user generation, Gallery/History readback, public sharing, and failure refunds. Real external provider rollout is still blocked by provider configuration: Qwen Vision currently times out, Liblib lacks required secrets/template UUID, and Qianwen still returns `Not Found` while refunding credits correctly.
- Admin Console source text has been restored to clean UTF-8 Chinese, and static frontend tests now fail on common mojibake markers. The System readiness section also explains that Qianwen needs `npm run verify:real-ai` before rollout and points operators to `QIANWEN_IMAGE_ENDPOINT` when the live provider returns `Not Found`.
- Real Qianwen generation now has a dedicated production probe. `npm run verify:real-ai` forces a `qianwen_generation` image job against the deployed `ai` Edge Function and verifies either Storage-backed asset persistence or failure refund behavior. The provider adapter now supports explicit `QIANWEN_IMAGE_ENDPOINT` / `QIANWEN_VIDEO_ENDPOINT` plus DashScope native Wan endpoints such as `multimodal-generation/generation` and `video-generation/video-synthesis`.
- User product-loop sharing now has a production verifier. The `ai` Edge Function exposes authenticated `create-share-link`, the frontend share action calls it for remote assets, public share pages can hydrate by token from Supabase, and `npm run verify:user-loop` proves credits, generation, Gallery, History, share link, public asset readback, and cleanup.
- Admin Workflow Center routing now has a production verifier. `npm run verify:workflow` publishes a temporary workflow, confirms the `ai` Edge Function creates a generation job using the workflow-selected provider, processes the job into a Storage-backed asset, restores the previous workflow config, and cleans up all temporary data.
- Admin verification now proves real backend operations instead of only checking that the Admin page and tables exist. `npm run verify:admin` creates a temporary admin, reads dashboard/users, adjusts credits, updates an order, reviews an asset, revokes a share link, verifies audit logs, and cleans up all verification records.
- Frontend i18n now has an explicit product glossary quality gate. `I18N_PRODUCT_TERMS` expands the runtime coverage check to 59 MVP product terms across account, generation, credits, admin, workflow, and tool-publishing language. `npm run verify:i18n` validates locale registration, coverage, translated attributes, runtime coverage logic, and mojibake markers.
- The Supabase `ai` Edge Function has been redeployed through `npm run deploy:function -- ai` using the Supabase Management API because the npm Supabase CLI binary is unavailable on the current Windows runtime. The deployment script reads `SUPABASE_ACCESS_TOKEN` locally and only prints non-secret deployment metadata.
- Qwen Vision and DeepSeek server prompts now use valid Chinese text instead of mojibake. Provider health probes now include normalized failure diagnostics with code, status, category, and message; current production verification classifies Qwen Vision as HTTP `401` / `auth`, while DeepSeek, Fake Worker, generation persistence, credit debit, and cancellation refund continue to pass.
- Production payment-loop verification now has a dedicated `npm run verify:payments` script. It proves the MVP demo checkout path fails closed when unauthenticated, then creates an authenticated temporary user, calls the server-side demo credit purchase action, and reads back `orders` plus `credit_transactions` to confirm order fulfillment and credit balance. This is still a no-charge demo checkout until a real payment gateway is configured.
- Frontend i18n now has a registered MVP language layer instead of only ad hoc text replacement. `apps/web/app.js` defines supported locales, core terms, per-locale dictionaries, attribute dictionaries, original text preservation, and runtime core-coverage reporting for Chinese, English, Japanese, and Korean.
- Admin Workflow Center now includes a visual switchboard for per-workflow provider and rollout status changes. Admins can quickly roll workflows between Fake Worker, Qianwen, DeepSeek, and Qwen Vision, or move a workflow between published/testing/draft/deprecated, while all writes still go through the audited `admin` Edge Function.
- Production AI verification now proves database persistence for the MVP backend loop. After demo credit purchase, Fake Worker generation, and cancellation refund, `npm run verify:ai` reads `generation_jobs`, `media_assets`, and `credit_transactions` as the authenticated user to confirm Gallery, History, Credits, and refund state can be sourced from production Supabase tables.
- Admin Console now includes a real Supabase OAuth Provider readiness check through the `admin` Edge Function. It separates visible frontend social-login buttons from actual provider enablement for Google, X / Twitter OAuth 2.0, and Discord.
- Admin Console now reads live AI Provider status from the `ai` Edge Function. System readiness and Workflow Center rows can show provider blockers such as Qwen Vision `Unauthenticated` instead of only showing that a provider name exists in configuration.
- Production AI verification now includes a real Qwen Vision `analyze-image` probe using a small base64 image. Current verification reaches the deployed Supabase `ai` function but Qwen Vision returns `Unauthenticated`, so a valid Qwen Vision site API key is still required before the multimodal analysis provider can be marked production-ready.
- Production AI verification now covers both success and cancellation paths. `npm run verify:ai` proves demo credit purchase, generation job creation, Fake Worker asset creation, and a separate cancellation path where a queued job is cancelled and the consumed 8 credits are refunded.
- Remote Supabase schema is now aligned with the current MVP backend loop through `supabase/migrations/202607080001_remote_mvp_schema_alignment.sql`. Existing rows are preserved while text generation IDs, current media asset fields, credit ledger fields, orders, share links, characters, audit logs, site settings, and worker status support are available in production.
- `npm run verify:ai` now performs a real authenticated smoke test: provider-status, DeepSeek prompt enhancement, demo credit purchase, generation job creation, Fake Worker processing, Storage upload, and asset creation. The latest verification passed against the deployed Supabase `ai` Edge Function.
- OAuth verification is accurate but not yet green: Google, X / Twitter OAuth 2.0, and Discord are reachable from local config; Telegram still needs Bot username, Bot token secret, function deployment, and auth callback configuration.
- Production verification now includes `npm run verify:oauth` for non-redirecting Google, X / Twitter OAuth 2.0, and Discord OAuth URL readiness plus Telegram Login Widget public configuration checks, and `npm run verify:ai` for the Supabase `ai` Edge Function fail-closed gate.
- Social login now uses the Supabase OAuth 2.0 provider id `x` for X, matching the enabled `X / Twitter (OAuth 2.0)` provider.
- Current OAuth verification proves Google, X / Twitter OAuth 2.0, and Discord authorization URLs can be created from local Supabase config; Telegram remains incomplete until Bot username, Bot token secret, deployed `telegram-auth` function, and trusted auth callback URL are configured.
- Language switching now keeps a cached Chinese source text baseline before translating, so switching between English, Japanese, Korean, and Chinese does not compound previous translations.
- Admin Workflow Center previews now explain rollout behavior for `qianwen_generation`, `fake_worker`, `deepseek_text`, and `qwen_vision` providers.
- The Generate page now attempts the authenticated Supabase `ai` Edge Function first, creating and processing generation jobs that save outputs to Supabase Storage and `media_assets`, then syncing Gallery, History, and Credits from real Supabase tables. Local demo generation remains as fallback when auth or Supabase is unavailable.
- The `ai` Edge Function now reads Admin Workflow Center configuration to choose the active generation provider, so admins can switch eligible workflows between `fake_worker` and `qianwen_generation` without changing frontend code.
- Failed or cancelled generation jobs now refund consumed credits through explicit `generation_refund` ledger entries with duplicate-refund protection in both local service tests and the Supabase Edge Function path.
- Prompt enhancement now uses the server-side DeepSeek provider path when available, with local prompt enhancement fallback.
- Demo checkout for logged-in users can create Supabase order and credit ledger records through the server-side `ai` function while real payment gateway integration remains deferred.
- OAuth test coverage now includes Google, X / Twitter OAuth 2.0, Telegram Login Widget entry, and Discord.
- Supabase now includes a server-only `ai` Edge Function for the three-model provider plan: Qwen Vision image analysis, DeepSeek prompt enhancement, Qianwen image/video generation, and Fake Worker fallback. Provider secrets are documented in env templates and must remain in Supabase Secrets.
- Admin Tool Catalog entries now carry an explicit `workflowId` binding in addition to model and version history, so a listed AI tool can be connected to a Workflow Center record before real worker execution is connected.
- Agent Center defaults now cover the six MVP agent roles from the imported backend guidance: Director, Content Analyst, Prompt Engineer, Script Writer, Storyboard, and Publisher.
- Content Intelligence defaults now cover X, TikTok, YouTube, Reddit, Instagram, and Telegram manual-analysis records, preserving the future ingestion shape while keeping MVP data mockable.
- The Admin console now includes P2 operations modules for Content Intelligence, Agent Center, and Cost Analytics. These prepare imported content analysis, agent governance, and provider margin reporting without changing the existing backend or provider architecture.
- The Admin console now includes P1 configuration operations for Workflow Center, Prompt Library, and Tool Version management. These use audited `site_settings` configuration for MVP speed while implementation schemas reserve `workflow_configs`, `prompt_library`, and `tool_versions` for future durable migration.
- The Admin console now includes P0 SaaS operations controls from the latest backend upgrade guidance: daily growth/revenue/generation KPIs, weekly revenue trend, popular/high-failure/credit-consumption tool rankings, Worker Center, and richer generation job detail rows with workflow, cost, latency, input, output, and error context.
- AI Studio mock output now exposes the full content package shape expected by the imported guidance: research, script, prompt, image placeholder, video placeholder, thumbnail, caption, hashtags, translation, CTA, quality check, and platform-specific versions.
- The content operations navigation now covers the remaining MVP guidance surfaces: Publishing, Automation, and Settings. These pages are local-state placeholders for publishing readiness, automation rules, and default content-operation configuration.
- The Dashboard has been upgraded from a personal creation summary into an MVP content-operations command center. It now surfaces active campaigns, content in pipeline, scheduled posts, failed posts, content production volume, social traffic, top performing content, accounts needing attention, and quick routes into the content operating workflow.
- The content operating system UI now includes MVP publishing and feedback-loop pages: Publishing Accounts, Content Calendar, and Analytics. These use local placeholder state for account connections, scheduled content, and performance metrics until real platform publishing and analytics ingestion are approved.
- The content operating system foundation now has visible MVP frontend surfaces: Campaigns, AI Studio, Content Pipeline, and Content Queue. These pages use local state and mock AI output to prove the content lifecycle before real publishing integrations are connected.
- The imported desktop AI Content Operating System guidance has been triaged into an MVP-compatible service foundation: `ContentOperatingService` now supports campaigns, AI Studio mock content packages, content pipeline stages, platform-specific variants, publishing queue records, and analytics placeholders without changing the existing frontend or provider architecture.
- The local development schema now includes `campaigns`, `content_items`, `content_pipeline_events`, `platform_post_variants`, `publishing_queue`, and `content_analytics`, allowing future pages to evolve from one-off generation into reusable content lifecycle workflows.
- The MVP Admin console is now a real Supabase-backed operations surface. Admin/operator access is based on `profiles.role`, sensitive write actions go through the Supabase `admin` Edge Function, and admin credit/order/content/share actions write audit logs.
- The Admin console now supports Shopify-style MVP merchandising controls through `site_settings`: `page_builder_config` controls page modules, display style, card counts, and module data sources; `tool_catalog_config` controls AI tool listing status, category, provider, model, route, featured state, and credit cost.
- The Admin frontend has been upgraded into a multi-module MVP operations console with a left navigation shell, command center, KPI cards, and modules for users, credits, orders, moderation, jobs, shares, homepage content, system readiness, and audit logs.
- The Admin console now includes an MVP homepage manager for Shopify-style public content control: admins can publish hero copy, CTA links, trust signals, showcase cards, and gallery preview cards through `site_settings.homepage_config`.
- The public homepage can read published homepage configuration from Supabase while preserving static fallback content for GitHub Pages and local preview.
- Supabase project configuration and the admin console migration now live under `supabase/`, matching standard Supabase CLI layout for deployment handoff.
- `npm run verify:admin` validates the admin database tables and `admin` Edge Function deployment; current verification confirms both are reachable and the function fails closed for unauthenticated requests.
- `src/supabase/mvp-schema.sql` now includes the admin-required production tables and RLS policies for audit logs, orders, characters, images, videos, and role-aware admin reads.
- Shared top navigation visibility has been restored after the dropdown hidden-state fix; dropdown menus stay hidden until opened without collapsing the visible nav/login bar.
- The MVP now includes an Admin surface at `apps/web/admin.html` with `/zh/admin/` routing for OAuth readiness, content moderation review, order fulfillment status, risk controls, and system health.
- Sign-in now exposes an OAuth readiness checklist for Google, X, Telegram, and Discord so provider configuration gaps are visible before production launch.
- The shared frontend script now includes a lightweight i18n dictionary for core navigation, account, and conversion labels, plus local original preview assets for major creation cards.
- Demo checkout now creates order records that appear in Admin, preserving a visible fulfillment trail until real payment webhooks are connected.
- [OPS-AUTH-001](1500-operations/001-production-auth-config.md) now defines the production Supabase OAuth, Telegram, GitHub Pages Variables/Secrets, redirect URL, and verification checklist.
- Root static product pages now use localized `/zh/.../` and `/zh/app/.../` click routes for primary navigation, keeping the public experience aligned with the target-style Chinese URL structure.
- MVP product pages now use a target-style app shell with a left tool rail and dark creator-tool navigation.
- Account, login, gallery, dashboard, assets, history, and share flows now have localized `/zh/.../` aliases and primary links route through them.
- Primary discovery surfaces now click through target-style localized `/zh/.../` routes instead of exposing `.html` file URLs.
- Primary tools now have `/zh/app/.../` localized URL aliases that forward to the canonical tool pages while preserving query strings and hashes.
- Static `/zh/.../` route aliases now mirror the referenced site's Chinese URL shape and redirect into the canonical Open Video Studio pages while preserving query strings and hashes.
- `apps/web/image-tools.html` and `apps/web/video-tools.html` now provide target-style category landing pages for the top navigation before users enter a specific tool.
- `apps/web/free-coins.html` is now the canonical Free Coins entry, matching the target-style top navigation while `apps/web/referral.html` remains available as a compatibility route.
- `apps/web/app.html` now serves as the primary AI tool homepage with featured tools, quick actions, categorized rows, and footer links modeled after mature tool-directory UX.
- The AI tool homepage now includes target-style category chips, search filtering, active states, section hiding, and empty-state feedback for tool discovery.
- Horizontal tool and content card rows now include target-style injected carousel controls with left/right buttons and smooth scrolling.
- The shared frontend script now injects a global footer navigation block across product pages and the homepage, keeping footer links consistent like a reusable site section.
- Cookie policy behavior now includes a global preference banner, management modal, local preference persistence, and a Cookie page CTA for reopening preferences.
- Pricing, Free Credits, My Creations, and Image to Video pages have been localized and visually aligned with the tool-directory product surface.
- The MVP frontend is now localized to Chinese across the primary product pages, and typography/color styling is tuned toward the referenced black / charcoal / pink AI tool-site direction.
- [REVIEW-TARGET-FEATURE-MAP-001](reviews/target-site-feature-map.md) maps the referenced site into feature modules, page structure, and Open Video Studio implementation parity.
- The account page now supports Google, X, Telegram, and Discord entry points; GitHub and Apple have been removed from the MVP login surface.
- The Daily Check-in navigation action now opens a reusable modal with signed-out login guidance, signed-in credit claiming, and a seven-day reward calendar.
- Daily Check-in now keeps signed-out users in-place and opens the global social-login modal from the reward dialog, matching a target-style conversion loop.
- The Purchase Credits and Free Coins pages now use the target-style credit commerce flow: highlighted credit packs, limited-time 2x credit modal, payment method choices, login-required referral rewards, and copyable referral links.
- The public page map now includes target-style tool routes for AI Effects, Image Editor, Face Swap, Outfit Studio, Pose Generator, Nano Banana, Image Combiner, Blog, Terms, Privacy, and Cookie, with Vite build entries for deployment.
- The shared top navigation now uses target-style Image Tools and Video Tools dropdowns plus a frontend language selector, keeping tool discovery consistent across pages.
- Top navigation dropdowns now support click-to-open and outside-click close behavior with accessible expanded state, making image tools, video tools, language, and account menus usable on touch devices.
- The global language selector now persists the selected locale, updates the document language and active state, and shows clear feedback when a non-Chinese translation is not yet implemented.
- Locked tool cards now use a target-style unlock flow: signed-out users see an in-page login modal with Google, X, Telegram, and Discord options before opening premium tools.
- Signed-in users now see a target-style account navigation state with credit balance, avatar menu, dashboard, creations, history, assets, free coins, purchase credits, and logout actions.
- Dashboard, My Creations, Assets, and History now show a target-style login/register gate to signed-out visitors while preserving local demo content behind the prompt.
- Tool detail pages now include a target-style actionable workbench with upload, prompt, mode selection, templates, demo generation, and local asset/history persistence while real generation APIs remain disconnected.
- Tool detail pages now also inject a target-style discovery layer with popular templates, use-case steps, related tool routing, and login/free-credit conversion actions.
- A target-style floating quick action dock now provides daily check-in, free coins, support/help, assistant avatar, and back-to-top actions across the product surface.
- My Creations now functions as a target-style creation center with work stats, search, filters, reusable asset cards, recent generation history, share links, prompt copy, and retry actions.
- Gallery cards now have working product-loop actions for generate similar, copy prompt, share, favorite, and open character; Asset Library chips now filter visible assets.
- Character Management now behaves as an actionable character center with search, status/favorite filters, selectable profiles, character memory, copy-prompt, and use-character-to-generate handoff.
- Free Coins and Dashboard are now state-driven: check-in progress, referral copy count, claimed rewards, recent generations, saved characters, and share links render from local product state.
- Purchase Credits now uses a target-style checkout modal with order summary, Stripe/PayPal method selection, promo code, login guidance, provider checkout prewire, and demo credit delivery while real fulfillment remains gated by live payment secrets and webhooks.
- Free Coins shows a visible seven-day credit calendar in addition to the daily check-in modal.
- The target-style app side rail now highlights the current page dynamically and separates My Creations from Generation History routes.
- Top navigation and locked tools now use a target-style global social login modal with Google, X, Telegram, and Discord entry points, while the standalone sign-in page remains available.
- The public share page now acts as a conversion surface with generate-similar, copy-prompt, save-to-assets, pricing, tool, and login entry points.
- Browser authentication now calls Supabase Auth when `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are configured; missing configuration is surfaced to the user instead of creating fake accounts.

## Knowledge Base Map

- [0000 Overview](0000-overview/README.md)
- [Product Bible](product/001-product-vision.md)
- [0100 Product](0100-product/README.md)
- [0200 Design](0200-design/README.md)
- [0300 Frontend](0300-frontend/README.md)
- [0400 Backend](0400-backend/README.md)
- [Database Bible](0500-database/README.md)
- [0550 AI Engine](0550-ai-engine/README.md)
- [0600 API Bible](0600-api/README.md)
- [0650 Database Domain](0650-database/README.md)
- [0700 API Domain](0700-api/README.md)
- [0800 SEO](0800-seo/README.md)
- [0900 Growth](0900-growth/README.md)
- [1000 Automation](1000-automation/README.md)
- [1100 DevOps](1100-devops/README.md)
- [1200 Analytics](1200-analytics/README.md)
- [1300 Security](1300-security/README.md)
- [1400 Roadmap](1400-roadmap/README.md)
- [1500 Operations](1500-operations/001-production-auth-config.md)
  - [OPS-ADMIN-001 Admin Console Operations](1500-operations/002-admin-console.md)

## Governance Documents

- [CTX-001 Project Context](context/PROJECT_CONTEXT.md)
- [REVIEW-ARCH-001 Architecture Review V1](reviews/architecture-review-v1.md)
- [REVIEW-LEGACY-001 Legacy Site Migration Review](reviews/legacy-site-migration-review.md)
- [REVIEW-TARGET-FEATURE-MAP-001 Target Site Feature Map](reviews/target-site-feature-map.md)
- [DOC-STD-001 Document Standard](0000-overview/DOC-STD-001-document-standard.md)
- [ID-REG-001 Numbering System](0000-overview/ID-REG-001-numbering-system.md)
- [REF-001 Cross-Reference Standard](0000-overview/REF-001-cross-reference-standard.md)
- [DOC-LIFE-001 Document Lifecycle](0000-overview/DOC-LIFE-001-document-lifecycle.md)
- [OWNERS-001 Ownership Model](0000-overview/OWNERS-001-ownership-model.md)
- [KNOW-001 Knowledge Management](0000-overview/KNOW-001-knowledge-management.md)
- [TASK-001 Task Workflow](0000-overview/TASK-001-task-workflow.md)
- [TASK-DONE-STD-001 Completion Standard](0000-overview/TASK-DONE-STD-001-completion-standard.md)
- [ADR-001 Architecture Decision Records](0000-overview/ADR-001-architecture-decision-records.md)
- [ADR-002 Phase 1 Implementation Foundation](0000-overview/ADR-002-phase-1-implementation-foundation.md)
- [ADR-003 MVP Frontend Reconstruction](0000-overview/ADR-003-mvp-frontend-reconstruction.md)
- [ADR-004 Product Workflow Foundation](0000-overview/ADR-004-product-workflow-foundation.md)
- [ADR-005 AI Engine Foundation](0000-overview/ADR-005-ai-engine-foundation.md)
- [ADR-006 Provider Plugin Architecture](0000-overview/ADR-006-provider-plugin-architecture.md)
- [ADR-007 Platform V2 Ownership Foundation](0000-overview/ADR-007-platform-v2-ownership-foundation.md)

## Product Bible

- [PB-001 Product Vision](product/001-product-vision.md)
- [PB-002 Product Mission](product/002-product-mission.md)
- [PB-003 Target Users](product/003-target-users.md)
- [PB-004 Market Analysis](product/004-market-analysis.md)
- [PB-005 Competitor Analysis](product/005-competitor-analysis.md)
- [PB-006 Business Model](product/006-business-model.md)
- [PB-007 Product Principles](product/007-product-principles.md)
- [PB-008 Information Architecture](product/008-information-architecture.md)
- [PB-009 User Journeys](product/009-user-journeys.md)
- [PB-010 Feature Map](product/010-feature-map.md)
- [PB-011 Product Roadmap](product/011-roadmap.md)
- [PB-012 Success Metrics](product/012-success-metrics.md)
- [PB-013 North-Star Metric](product/013-north-star-metric.md)
- [PB-014 Out Of Scope](product/014-out-of-scope.md)
- [PB-015 Product Glossary](product/015-product-glossary.md)

## Design System

- [DS-001 Design Philosophy](0200-design/001-design-philosophy.md)
- [DS-002 Design Principles](0200-design/002-design-principles.md)
- [DS-003 Brand Guidelines](0200-design/003-brand-guidelines.md)
- [DS-004 Color System](0200-design/004-color-system.md)
- [DS-005 Typography](0200-design/005-typography.md)
- [DS-006 Spacing System](0200-design/006-spacing-system.md)
- [DS-007 Grid System](0200-design/007-grid-system.md)
- [DS-008 Iconography](0200-design/008-iconography.md)
- [DS-009 Animation System](0200-design/009-animation-system.md)
- [DS-010 Component Library](0200-design/010-component-library.md)
- [DS-011 Responsive System](0200-design/011-responsive-system.md)
- [DS-012 Accessibility](0200-design/012-accessibility.md)
- [DS-013 Dark Mode](0200-design/013-dark-mode.md)
- [DS-014 Design Tokens](0200-design/014-design-tokens.md)
- [DS-015 Design Checklist](0200-design/015-design-checklist.md)

## Frontend Bible

- [FE-BIBLE-001 Frontend Bible](0300-frontend/000-frontend-bible.md)
- [PAGE-HOME-001 Homepage](0300-frontend/001-homepage.md)
- [PAGE-GALLERY-001 Gallery](0300-frontend/002-gallery.md)
- [PAGE-GENERATE-001 Generate](0300-frontend/003-generate.md)
- [PAGE-PROMPT-LIBRARY-001 Prompt Library](0300-frontend/004-prompt-library.md)
- [PAGE-PRICING-001 Pricing](0300-frontend/005-pricing.md)
- [PAGE-DASHBOARD-001 Dashboard](0300-frontend/006-dashboard.md)
- [PAGE-PROFILE-001 Profile](0300-frontend/007-profile.md)
- [PAGE-ADMIN-001 Admin](0300-frontend/008-admin.md)
- [PAGE-SETTINGS-001 Settings](0300-frontend/009-settings.md)
- [PAGE-AUTH-001 Authentication](0300-frontend/010-authentication.md)

## Backend Architecture Bible

- [BE-ARCH-BIBLE-001 Backend Architecture Bible](0400-backend/000-backend-architecture-bible.md)
- [BE-ARCH-AUTH-001 Authentication](0400-backend/001-authentication.md)
- [BE-ARCH-STORAGE-001 Storage](0400-backend/002-storage.md)
- [BE-ARCH-QUEUE-001 Queue](0400-backend/003-queue.md)
- [BE-ARCH-GPU-JOBS-001 GPU Jobs](0400-backend/004-gpu-jobs.md)
- [BE-ARCH-IMAGE-PROCESSING-001 Image Processing](0400-backend/005-image-processing.md)
- [BE-ARCH-VIDEO-PROCESSING-001 Video Processing](0400-backend/006-video-processing.md)
- [BE-ARCH-BILLING-001 Billing](0400-backend/007-billing.md)
- [BE-ARCH-NOTIFICATION-001 Notification](0400-backend/008-notification.md)
- [BE-ARCH-LOGGING-001 Logging](0400-backend/009-logging.md)
- [BE-ARCH-MONITORING-001 Monitoring](0400-backend/010-monitoring.md)
- [BE-ARCH-SECURITY-001 Security](0400-backend/011-security.md)

## AI Engine

- [AI-INDEX-001 AI Engine](0550-ai-engine/README.md)
- [AI-PROVIDER-001 Provider Interface](0550-ai-engine/001-provider-interface.md)
- [AI-JOBS-001 Job Queue And Workers](0550-ai-engine/002-job-queue-workers.md)
- [AI-STORAGE-001 Storage Abstraction](0550-ai-engine/003-storage-abstraction.md)
- [AI-COST-001 Cost Tracking](0550-ai-engine/004-cost-tracking.md)

## Database Bible

- [DB-BIBLE-001 Database Bible](0500-database/README.md)
- [DB-USERS-001 Users](0500-database/001-users.md)
- [DB-CREDITS-001 Credits](0500-database/002-credits.md)
- [DB-IMAGES-001 Images](0500-database/003-images.md)
- [DB-VIDEOS-001 Videos](0500-database/004-videos.md)
- [DB-CHARACTERS-001 Characters](0500-database/005-characters.md)
- [DB-PROMPTS-001 Prompts](0500-database/006-prompts.md)
- [DB-ORDERS-001 Orders](0500-database/007-orders.md)
- [DB-SUBSCRIPTIONS-001 Subscriptions](0500-database/008-subscriptions.md)
- [DB-AFFILIATE-001 Affiliate](0500-database/009-affiliate.md)
- [DB-ANALYTICS-001 Analytics](0500-database/010-analytics.md)
- [DB-NOTIFICATIONS-001 Notifications](0500-database/011-notifications.md)
- [DB-SETTINGS-001 Settings](0500-database/012-settings.md)
- [DB-AUDIT-LOGS-001 Audit Logs](0500-database/013-audit-logs.md)
- [DB-MEDIA-ASSETS-001 Media Assets](0500-database/014-media-assets.md)
- [DB-GENERATION-JOBS-001 Generation Jobs](0500-database/015-generation-jobs.md)
- [DB-SHARE-LINKS-001 Share Links](0500-database/016-share-links.md)
- [DB-AI-JOBS-001 AI Jobs](0500-database/017-ai-jobs.md)
- [DB-AI-COST-RECORDS-001 AI Cost Records](0500-database/018-ai-cost-records.md)
- [DB-WORKSPACES-001 Workspaces](0500-database/019-workspaces.md)
- [DB-PROJECTS-001 Projects](0500-database/020-projects.md)
- [DB-PERMISSIONS-001 Permissions](0500-database/021-permissions.md)
- [DB-AI-WORKERS-001 AI Workers](0500-database/022-ai-workers.md)
- [DB-WORKFLOW-CONFIGS-001 Workflow Configs](0500-database/023-workflow-configs.md)
- [DB-TOOL-VERSIONS-001 Tool Versions](0500-database/024-tool-versions.md)
- [DB-CONTENT-INTELLIGENCE-001 Content Intelligence](0500-database/025-content-intelligence.md)
- [DB-AGENT-CONFIGS-001 Agent Configs](0500-database/026-agent-configs.md)
- [DB-COST-ANALYTICS-001 Cost Analytics](0500-database/027-cost-analytics.md)

## API Bible

- [API-BIBLE-001 API Bible](0600-api/README.md)
- [API-AUTH-001 Authentication](0600-api/001-authentication.md)
- [API-GEN-IMAGE-001 Generate Image](0600-api/002-generate-image.md)
- [API-GEN-VIDEO-001 Generate Video](0600-api/003-generate-video.md)
- [API-CHARACTER-001 Character](0600-api/004-character.md)
- [API-GALLERY-001 Gallery](0600-api/005-gallery.md)
- [API-CREDITS-001 Credits](0600-api/006-credits.md)
- [API-PAYMENT-001 Payment](0600-api/007-payment.md)
- [API-SUBSCRIPTION-001 Subscription](0600-api/008-subscription.md)
- [API-ADMIN-001 Admin](0600-api/009-admin.md)
- [API-ANALYTICS-001 Analytics](0600-api/010-analytics.md)
- [API-WEBHOOK-001 Webhook](0600-api/011-webhook.md)
- [API-WORKSPACE-001 Workspace](0600-api/012-workspace.md)
- [API-PROJECT-001 Project](0600-api/013-project.md)

## Growth Bible

- [GROWTH-BIBLE-001 Growth Bible](0900-growth/000-growth-bible.md)
- [GROWTH-SEO-001 SEO](0900-growth/001-seo.md)
- [GROWTH-LANDING-001 Landing Pages](0900-growth/002-landing-pages.md)
- [GROWTH-BLOG-001 Blog System](0900-growth/003-blog-system.md)
- [GROWTH-PINTEREST-001 Pinterest](0900-growth/004-pinterest.md)
- [GROWTH-TWITTER-001 Twitter](0900-growth/005-twitter.md)
- [GROWTH-INSTAGRAM-001 Instagram](0900-growth/006-instagram.md)
- [GROWTH-TIKTOK-001 TikTok](0900-growth/007-tiktok.md)
- [GROWTH-YOUTUBE-001 YouTube](0900-growth/008-youtube.md)
- [GROWTH-REDDIT-001 Reddit](0900-growth/009-reddit.md)
- [GROWTH-AFFILIATE-001 Affiliate](0900-growth/010-affiliate.md)
- [GROWTH-EMAIL-001 Email](0900-growth/011-email.md)
- [GROWTH-REFERRAL-001 Referral](0900-growth/012-referral.md)
- [GROWTH-ANALYTICS-001 Analytics](0900-growth/013-analytics.md)
- [GROWTH-NORTH-STAR-001 North Star Metrics](0900-growth/014-north-star-metrics.md)

## Project History

- [CHANGELOG-001 Changelog](../CHANGELOG.md)

## Production Setup

- Root [README](../README.md) documents GitHub-ready setup, React/Vite build scripts, Supabase environment variables, and verification commands.
- [Frontend Domain](0300-frontend/README.md) documents the current React/Vite app shell and static MVP surface.
- The current MVP surface includes target-site-style routes for Tools, Image to Video, Free Credits / Referral, and My Creations, with local browser-state interaction for signup, credits, characters, generation, assets, history, and sharing.
- [Backend Architecture Bible](0400-backend/000-backend-architecture-bible.md) documents the Supabase connection foundation.
- [Database Bible](0500-database/README.md) documents Supabase PostgreSQL as the production target.
- [Supabase MVP Schema](../src/supabase/mvp-schema.sql) defines the MVP Backend Loop tables, indexes, and RLS policies for the existing Supabase project.

## Reviews

- [REVIEW-ARCH-001 Architecture Review V1](reviews/architecture-review-v1.md)
- [REVIEW-LEGACY-001 Legacy Site Migration Review](reviews/legacy-site-migration-review.md)
- [REVIEW-PROVIDER-PLUGIN-001 Provider Plugin Architecture Review](reviews/provider-plugin-architecture-review.md)
- [REVIEW-PLATFORM-EVOLUTION-001 Platform Evolution Review V1](reviews/platform-evolution-review-v1.md)
- [REVIEW-MVP-PRODUCT-001 MVP Product Review V1](reviews/mvp-product-review-v1.md)

## Roadmap

- [ROADMAP-PLATFORM-V2-001 Platform Evolution Roadmap V2](1400-roadmap/platform-evolution-roadmap-v2.md)
- [ROADMAP-MVP-SPRINTS-001 MVP Sprint Backlog](1400-roadmap/mvp-sprint-backlog.md) - MVP Backend Loop completed.

## Acceptance Criteria

- The summary lists every top-level documentation domain.
- Links resolve to domain index files.
- Contributors know where to begin.

## Future Plan

- Add links to approved product specs, API contracts, schema docs, and decision records.

## AI Context

Use this file as the first navigation step after reading the root README.
