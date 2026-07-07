# Documentation Summary

| Field | Value |
|---|---|
| Unique ID | DOC-002 |
| Version | 0.27.0 |
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

- MVP product pages now use a target-style app shell with a left tool rail and dark creator-tool navigation.
- `apps/web/app.html` now serves as the primary AI tool homepage with featured tools, quick actions, categorized rows, and footer links modeled after mature tool-directory UX.
- The shared frontend script now injects a global footer navigation block across product pages and the homepage, keeping footer links consistent like a reusable site section.
- Pricing, Free Credits, My Creations, and Image to Video pages have been localized and visually aligned with the tool-directory product surface.
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

## Governance Documents

- [CTX-001 Project Context](context/PROJECT_CONTEXT.md)
- [REVIEW-ARCH-001 Architecture Review V1](reviews/architecture-review-v1.md)
- [REVIEW-LEGACY-001 Legacy Site Migration Review](reviews/legacy-site-migration-review.md)
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
