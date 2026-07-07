# Authentication

| Field | Value |
|---|---|
| Unique ID | PAGE-AUTH-001 |
| Version | 1.1.0 |
| Status | Active |
| Owner | Frontend Lead / Security Lead |
| Dependencies | API-AUTH-001, DB-USERS-001, SEC-INDEX-001, DS-012 |
| Referenced By | FE-BIBLE-001, DOC-002 |
| Cross References | API-AUTH-001, DB-USERS-001, SEC-INDEX-001 |

## Purpose

Define the authentication page set for login, signup, session recovery, verification, and future identity provider flows.

## Requirements

- Establish user identity securely and clearly.
- Avoid leaking account existence or sensitive auth state.
- Support onboarding and invitation context.

## Layout

Authentication should use a focused, low-distraction layout with brand context, clear form state, helpful recovery paths, and security-aware messaging.

## Sections

- Brand and product identity.
- Login or signup form.
- Provider options.
- Verification step.
- Recovery link.
- Invitation or workspace context.
- Legal and privacy links.
- Error and rate-limit states.

## Components

- Auth shell.
- Form field.
- Provider button.
- Verification input.
- Submit button.
- Error message.
- Recovery link.
- Redirect notice.

## State Flow

- User enters auth route.
- Page detects existing valid session if present.
- User submits login, signup, or provider action.
- System handles verification, error, rate limit, or success.
- Successful auth routes to onboarding, dashboard, or intended destination.

## Navigation

Routes to homepage, dashboard, pricing, profile, and onboarding depending on user state. Auth pages should preserve return destination when safe.

## Responsive Rules

All auth flows must work well on mobile. Forms should remain readable, accessible, and low-friction without decorative distractions.

## SEO

Authentication pages may be crawlable only if useful for brand navigation, but should not target search acquisition. Sensitive auth states must not be indexed.

## Analytics Events

- `auth_page_viewed`
- `auth_method_selected`
- `auth_submit_clicked`
- `auth_success`
- `auth_failed`
- `auth_verification_required`
- `auth_recovery_clicked`

## Acceptance Criteria

- Users can authenticate or recover gracefully.
- Error states are secure and helpful.
- Session success routes users to the correct destination.
- MVP account entry offers Google, GitHub, Discord, Apple, and email options.

## Current Implementation

`apps/web/signin.html` now presents social authentication options for Google, GitHub, Discord, and Apple before the email fallback. The page also communicates starter credits and routes users toward credits/referral growth paths without copying third-party page content.

## Future Plan

Add SSO, passkeys, MFA, enterprise domain discovery, and account recovery policies.

## AI Context

Authentication UI is a security surface. Avoid cleverness; prioritize clarity, privacy, accessibility, and secure state handling.
