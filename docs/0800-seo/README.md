# 0800 SEO

| Field | Value |
|---|---|
| Unique ID | SEO-INDEX-001 |
| Version | 0.2.0 |
| Status | Active |
| Owner | SEO Lead |
| Dependencies | OVSB-001, DOC-STD-001, GROWTH-INDEX-001, ANALYTICS-INDEX-001 |
| Referenced By | DOC-002 |

## Purpose

Own organic acquisition strategy, technical SEO, programmatic content systems, metadata, structured data, indexing, and content governance.

## Requirements

- SEO work must reference growth and analytics documents.
- Public pages must define metadata, canonical behavior, indexability, and measurement.
- Programmatic SEO must have quality and duplication controls.
- Technical SEO artifacts must be reproducible from source, not hand-edited in deployed output.
- Authenticated application surfaces must remain `noindex,follow` unless a product/SEO decision explicitly promotes them.

## Current Implementation

- `scripts/apply-seo.mjs` is the canonical generator for public metadata, `robots.txt`, `sitemap.xml`, and localized static alias pages.
- `npm run seo:apply` refreshes the generated SEO surface after public route, title, description, locale, or canonical changes.
- The production domain is `https://luravyn.com`; GitHub Pages remains a deployment fallback at `https://jiang289140790-eng.github.io/open-video-studio`.
- Public indexed locales are `zh-CN`, `en`, `ja`, and `ko`, with localized alias routes under `apps/web/public/{zh,en,ja,ko}/`.
- Public SEO routes include Homepage, Explore/Gallery, Generate, Image to Video, Characters, Pricing, Free Coins, Blog, Terms, Privacy, Cookie, and the noindex Sign In alias.
- Private/product-operation pages including Dashboard, Assets, History, My Creations, Admin, Settings, Queue, Pipeline, Publishing, Automation, and Analytics are marked `noindex,follow`.
- Canonical URLs use clean language-prefixed paths such as `https://luravyn.com/zh/app/generate/`.

## Acceptance Criteria

- Search-facing pages can be reviewed for discoverability and quality.
- SEO initiatives are measurable and connected to growth strategy.
- `apps/web/public/sitemap.xml` includes all indexed locale alternates and `x-default`.
- `apps/web/public/robots.txt` points to the production sitemap and blocks private application routes.
- Core public HTML files include canonical, hreflang, robots, Open Graph, and Twitter metadata.
- Localized alias pages preserve query strings and hashes while forwarding users to the canonical static app pages.

## Future Plan

- Add structured data for organization, software application, pricing, and shareable media pages.
- Add content taxonomy.
- Add programmatic SEO strategy.
- Add launch checklist.

## AI Context

Use this folder for acquisition content, public page visibility, metadata, indexing, and search measurement.
When adding a public page, update `scripts/apply-seo.mjs`, run `npm run seo:apply`, update this document if indexability rules change, and verify sitemap/hreflang output before deployment.
