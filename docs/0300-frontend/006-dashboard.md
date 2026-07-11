# Dashboard

| Field | Value |
|---|---|
| Unique ID | PAGE-DASHBOARD-001 |
| Version | 1.2.0 |
| Status | Active |
| Owner | Frontend Lead / Product Lead |
| Dependencies | PB-008, PB-009, DS-007, DS-010, API-GALLERY-001, API-CREDITS-001 |
| Referenced By | FE-BIBLE-001, DOC-002 |
| Cross References | PB-008, PB-009, API-GALLERY-001, API-CREDITS-001 |

## Purpose

Define the authenticated dashboard as the user's command center for projects, recent work, generation entry points, usage, and workflow status.

## Requirements

- Help users resume work quickly.
- Surface important system, credit, review, generation, and subscription states.
- Provide clear paths to generate, gallery, prompt library, pricing, and settings.

## Layout

The dashboard should use a dense but calm SaaS command center layout. It should prioritize recent work, primary actions, and operational status without becoming a marketing page.

## Sections

- Welcome or workspace header.
- Primary action shortcuts.
- Recent projects or media.
- Generation or render status.
- Credit and subscription summary.
- Review or notification summary.
- Suggested next actions.
- Active campaigns.
- Content in pipeline.
- Scheduled and failed posts.
- Top performing content.
- Accounts needing attention.
- Content production volume.
- Website or social traffic from publishing channels.

## Components

- App shell.
- Workspace switcher.
- Quick action group.
- Recent item list.
- Status cards.
- Credit summary.
- Notification preview.
- Empty state.

## State Flow

- Load user and workspace context.
- Load recent assets, videos, and workflow status.
- Display credit or subscription warnings if relevant.
- Route user to next action or recover from empty state.

## Navigation

Dashboard links to generate, gallery, prompt library, pricing, profile, admin, settings, and authentication/session management.

## Responsive Rules

Desktop can show multiple dashboard panels. Tablet should stack status and recent work. Mobile should prioritize quick actions, recent work, and urgent state.

## SEO

Authenticated dashboard is not indexable.

## Analytics Events

- `dashboard_viewed`
- `dashboard_quick_action_clicked`
- `dashboard_recent_item_opened`
- `dashboard_credit_summary_clicked`
- `dashboard_empty_state_action_clicked`

## Acceptance Criteria

- Users can resume or start core workflows quickly.
- Important account, credit, generation, or review states are visible.
- Dashboard does not duplicate detailed gallery, pricing, or admin behavior.
- Dashboard summarizes content operations without replacing dedicated Campaigns, AI Studio, Pipeline, Queue, Accounts, Calendar, or Analytics pages.

## Current Implementation

`apps/web/dashboard.html` is the authenticated command center. It shows credit balance, generation task count, asset count, share count, content operations metrics, credit ledger, next-action recommendations, recent generation tasks, recent reusable assets, saved characters, public share links, top content, account attention, and quick links back to Generate, Image-to-Video, Assets, History, Pricing, Campaigns, AI Studio, Pipeline, and Calendar.

`apps/web/history.html` owns the detailed generation task view. It supports search, status/type filters, all-job refresh, single-job refresh, cancellation for running remote jobs, failed-task reason/refund display, recovery hints, progress bars, output links, share actions, and downloads for completed assets.

## Future Plan

Add personalized workflow recommendations, team status, review queues, real analytics summaries, and production publishing status after real platform integrations are approved.

## AI Context

Dashboard is a command center. Keep it useful, dense, and calm rather than decorative.
