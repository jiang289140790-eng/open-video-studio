# Target Site Feature Map

| Field | Value |
|---|---|
| Unique ID | REVIEW-TARGET-FEATURE-MAP-001 |
| Version | 2.0.0 |
| Status | Active |
| Owner | Product / Frontend |
| Dependencies | FE-BIBLE-001, REVIEW-LEGACY-001 |
| Referenced By | DOC-002, CHANGELOG-001 |

## Purpose

Map the referenced AI tool site into product capabilities, page structure, and user flows that Open Video Studio can implement with original UI, original copy, and safe product categories.

## Requirements

- Match product capability, information architecture, and user journey shape.
- Do not copy proprietary source code, images, or exact protected creative expression.
- Keep Open Video Studio content focused on reusable AI images, video, characters, assets, credits, and sharing.

## Page Map

| Target Pattern | Open Video Studio Page | Implemented Capability |
|---|---|---|
| Tool directory home | `apps/web/app.html` | Left rail, top nav, featured tools, quick cards, categorized tool rows |
| Chinese localized route shape | `apps/web/public/zh/*/index.html` | `/zh/.../` URL aliases that preserve query strings and hashes before routing to canonical pages |
| Localized app tool route shape | `apps/web/public/zh/app/*/index.html` | `/zh/app/.../` aliases for primary image, character, effect, and video tool pages |
| Localized click routing | `apps/web/app.html`, `apps/web/image-tools.html`, `apps/web/video-tools.html`, `apps/web/app.js` | Primary discovery surfaces route through `/zh/.../` and `/zh/app/.../` aliases instead of exposing static `.html` URLs |
| Root static page routing | `apps/web/*.html` | User-facing links across root product pages now route through localized public aliases while canonical files remain build targets |
| Localized account and creation routes | `apps/web/public/zh/{login,account,dashboard,gallery,assets,history,share}/index.html` | Account, gallery, asset, history, and share flows have target-style Chinese route aliases |
| Image tools category | `apps/web/image-tools.html` | Searchable category page for image generation, editing, face swap, styling, pose, and image combination routes |
| Video tools category | `apps/web/video-tools.html` | Task-based workflow market for image-to-video, product teaser, social reel, asset selection, generation tasks, and finished works |
| Pricing / credits | `apps/web/pricing.html` | One-time credit packs, discount messaging, trust metrics, examples |
| Free coins / referral | `apps/web/free-coins.html` plus compatibility route `apps/web/referral.html` | Daily check-in, referral reward, task-based credit earning |
| My creations | `apps/web/my-creations.html` | Assets, history, share links, search/filter, signed-in creation shelf |
| Image to video tool | `apps/web/image-to-video.html` | Preset-aware upload, in-page asset picker, prompt, aspect ratio, duration, provider preference, source asset/source image payload, task progress, preview, credit estimate, mobile generate action, output download, and examples |
| Image generation tool | `apps/web/generate.html` | Mode cards, character selector, prompt enhancer, preview, recent results |
| Gallery / explore | `apps/web/gallery.html` | Masonry feed, filters, generate similar, copy prompt, share, save |
| Authentication | `apps/web/signin.html` | Email auth, social auth options, real Supabase integration hooks |
| OAuth readiness | `apps/web/signin.html`, `apps/web/admin.html` | Google, X, Telegram, and Discord setup visibility before production launch |
| Admin operations | `apps/web/admin.html` | Moderation queue, order fulfillment status, risk rules, and system health |
| Local visual assets | `apps/web/public/assets/previews/*` | Original deployable preview imagery for character, video, fashion, and portrait cards |
| Shared footer | `apps/web/app.js` | Site-wide footer links, tool links, contact, copyright |

## Feature Checklist

- Global top navigation: image tools, video tools, credits, free credits, my creations, login.
- Left tool rail: home, tool categories, my creations, referral, upgrade.
- Tool directory: large feature banners, quick action cards, categorized horizontal rows.
- Credit commerce: credit packs, visible price, discounts, trust section, examples.
- Growth loop: check-in, referral link, reward steps, task rewards.
- Video creation loop: choose workflow preset, upload or choose reference image, select ratio/duration/provider, review credit estimate, generate, watch task progress, save output to assets and generation tasks, then download/share/reuse.
- Asset loop: saved outputs, generation tasks, search, filters, share, retry.
- Public loop: share page, generate similar action.
- Trust / conversion: metrics, user-style quotes, visual examples, upgrade CTA.

## Acceptance Criteria

- Every primary page uses Chinese product copy.
- Pages share a consistent black / charcoal / pink tool-site visual system.
- Footer appears as a reusable site section, not a one-off page block.
- Users can navigate from tool discovery to generation, credits, creation history, and sharing.

## AI Context

Future AI agents should use this document as the comparison checklist when aligning pages to mature AI tool-site behavior. Preserve functional parity and user-flow parity while keeping copy, media, and brand expression original to Open Video Studio.
