# Dashboard

| Field | Value |
|---|---|
| Unique ID | PAGE-DASHBOARD-001 |
| Version | 1.0.0 |
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

## Future Plan

Add personalized workflow recommendations, team status, review queues, and analytics summaries.

## AI Context

Dashboard is a command center. Keep it useful, dense, and calm rather than decorative.
