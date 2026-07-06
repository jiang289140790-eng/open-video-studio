# Homepage

| Field | Value |
|---|---|
| Unique ID | PAGE-HOME-001 |
| Version | 1.1.0 |
| Status | Active |
| Owner | Frontend Lead / Growth Lead |
| Dependencies | PB-001, PB-002, PB-003, DS-001, DS-003, DS-015 |
| Referenced By | FE-BIBLE-001, DOC-002 |
| Cross References | PB-001, PB-005, PB-006, PB-010, DS-003, SEO-INDEX-001 |

## Purpose

Define the public homepage page specification for Open Video Studio.

## Requirements

- Communicate the product category, value, trust, and primary conversion path.
- Avoid becoming a generic AI landing page.
- Route authenticated users toward their workspace or dashboard.

## Layout

The homepage should use a premium product-led layout with a strong first-viewport signal of Open Video Studio as an AI-native video studio. The page should show the product promise, core workflows, proof, and conversion actions without overwhelming visitors.

## Sections

- Header with brand, product navigation, pricing, sign in, and primary call to action.
- Hero with product category, concise value proposition, and product-relevant visual direction.
- Workflow overview showing idea, generation, editing, review, and export.
- Use cases for creators, marketers, agencies, and teams.
- AI control and brand consistency explanation.
- Trust and security preview.
- Pricing entry point.
- Final conversion section.
- Footer with product, company, legal, and support links.

## Components

- Public header.
- Hero media area.
- Primary and secondary CTA.
- Workflow step group.
- Use case cards.
- Feature summary rows.
- Trust badge group.
- Pricing teaser.
- Footer navigation.

## State Flow

- Anonymous visitor lands on homepage.
- Visitor explores product sections.
- Visitor opens pricing, signup, login, or gallery examples.
- Authenticated visitor is redirected or offered dashboard continuation.
- Failed auth or unavailable session does not block public content.

## Navigation

Primary paths should lead to pricing, authentication, gallery examples, and product education. Authenticated users should have a clear path to dashboard.

## Responsive Rules

Desktop should emphasize product story and visual proof. Tablet should preserve hierarchy with reduced media density. Mobile should prioritize concise value, CTA, use cases, and readable sections without large decorative layouts.

## SEO

Homepage should target the core category and brand. Metadata should describe AI video creation, editing, workflow automation, and team production value. Structured data may be added later through SEO specs.

## Analytics Events

- `homepage_viewed`
- `homepage_cta_clicked`
- `homepage_section_viewed`
- `homepage_pricing_clicked`
- `homepage_login_clicked`
- `homepage_signup_clicked`

## Acceptance Criteria

- Visitors understand what Open Video Studio is within the first viewport.
- The page routes users clearly to signup, pricing, login, or product exploration.
- Design follows `DS-001` through `DS-015`.
- No implementation-specific framework decisions are included.

## Current Implementation

`ADR-003` implements the first MVP homepage at `apps/web/index.html`. The current surface uses commercial SaaS positioning, a generate-first CTA, a product preview, workflow explanation, use cases, trust signals, and a final conversion band.

The implementation intentionally does not preserve legacy demo positioning, viral template sections, hash-only navigation, fake worker controls, direct database writes, or affiliate-first conversion.

## Future Plan

Add dedicated SEO and growth experiments after positioning and pricing are finalized.

## AI Context

Do not design this as a decorative marketing-only page. It must express a serious AI SaaS product and route users into durable product workflows.
