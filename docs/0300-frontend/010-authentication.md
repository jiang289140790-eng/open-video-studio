# Authentication

| Field | Value |
|---|---|
| Unique ID | PAGE-AUTH-001 |
| Version | 1.5.0 |
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
- Social provider buttons must remain disabled unless the provider is verified through Supabase/provider dashboards and the matching public readiness flag is enabled.
- Protected product pages must rely on a real Supabase session; frontend navigation alone is not proof of authentication.

## Current Implementation

- Email/password login, signup, signout, session restore, and password reset use Supabase Auth.
- Google, X, Discord, and Telegram buttons are visible for product intent but gated by `VITE_GOOGLE_OAUTH_READY`, `VITE_X_OAUTH_READY`, `VITE_DISCORD_OAUTH_READY`, and `VITE_TELEGRAM_OAUTH_READY`.
- Unverified social providers display `配置中` and do not fall back to Dashboard.
- Unauthenticated product pages show an explicit Demo Mode banner and Demo labels so local placeholder data is not confused with user-owned assets.
- Admin navigation is hidden unless the signed-in profile role is `admin` or `operator`; backend admin functions still enforce the same permission boundary.

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
- MVP account entry offers Google, X, Telegram, Discord, and email options.
- Email users can request a password reset and set a new password from the recovery link.

## Current Implementation

`apps/web/signin.html` presents social authentication options for Google, X, Telegram, and Discord before the email form. Google, X, and Discord call Supabase Auth from the browser when `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are configured. Telegram renders a Telegram Login Widget when `VITE_TELEGRAM_BOT_USERNAME` and `VITE_TELEGRAM_AUTH_URL` are configured. Missing configuration is shown as an explicit page message rather than silently creating a fake local account.

Email authentication now includes a password recovery path. The sign-in page can request a Supabase password reset email, and `apps/web/reset-password.html` lets a user with a valid recovery session update their password before returning to Dashboard. The localized `/zh/reset-password/` alias preserves query strings and hash fragments from Supabase recovery emails.

Product pages now use a target-style app shell with a persistent left tool rail and compact top navigation so authenticated creation flows feel like a mature AI tool product rather than a marketing-only website.

## Future Plan

Complete production redirect configuration in Supabase, enable provider credentials for Google, X/Twitter, and Discord, add a backend Telegram signed-hash callback, then add email verification handling and account settings.

## AI Context

Authentication UI is a security surface. Avoid cleverness; prioritize clarity, privacy, accessibility, and secure state handling.
