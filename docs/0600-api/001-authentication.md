# Authentication API

| Field | Value |
|---|---|
| ID | API-AUTH-001 |
| Unique ID | API-AUTH-001 |
| Version | 1.6.0 |
| Status | Active |
| Owner | API Platform Lead / Security Lead |
| Dependencies | DB-USERS-001, SEC-INDEX-001 |
| Referenced By | API-BIBLE-001, API-ADMIN-001, API-CREDITS-001, API-GEN-IMAGE-001, API-GEN-VIDEO-001 |
| Cross References | DB-USERS-001, SEC-INDEX-001, DB-AUDIT-LOGS-001 |

## Purpose

Define the API surface for user authentication, session state, token handling, identity verification, and future enterprise identity flows.

## Requirements

- Establish trusted actor context for protected APIs.
- Avoid exposing credential secrets through product API responses.
- Audit security-sensitive authentication events.

## Business Logic

Authentication proves identity and establishes the actor context used by all protected APIs. The system must support secure login, logout, session refresh, account state checks, and future SSO without exposing sensitive credential handling in product APIs.

## Authentication

Public authentication actions may accept unauthenticated requests. Protected session actions require a valid session or token. High-risk actions may require recent authentication or additional verification.

## Permissions

Unauthenticated users may request login or signup flows. Authenticated users may inspect their own session. Admin identity operations require elevated permissions and audit logging.

## Request

Conceptual request inputs may include login identifier, verification credential or provider assertion, session token, device context, redirect intent, and optional invitation context.

## Response

Responses may include authentication status, user reference, session metadata, required next step, account status, supported workspace context, and safe client-facing expiration metadata.

## Error Codes

- `AUTH_INVALID_CREDENTIALS`
- `AUTH_SESSION_EXPIRED`
- `AUTH_ACCOUNT_DISABLED`
- `AUTH_VERIFICATION_REQUIRED`
- `AUTH_RATE_LIMITED`
- `AUTH_PROVIDER_UNAVAILABLE`
- `AUTH_PASSWORD_RESET_SENT`
- `AUTH_PASSWORD_RESET_INVALID`

## Rate Limit

Strict limits apply to login, signup, verification, token refresh, and passwordless requests. Limits should consider IP, account identifier, device fingerprint, and abuse signals.

## Dependencies

Depends on `DB-USERS-001`, future identity provider architecture, security policy, audit logging, and session storage.

## Future Expansion

Support SSO, SCIM, MFA, passkeys, enterprise domain verification, service accounts, API keys, and session risk scoring.

## Acceptance Criteria

- Protected APIs can consistently identify the actor.
- Sensitive authentication events can be audited without exposing secrets.

## Current Implementation

MVP Sprint 1 exposes local HTTP routes for signup, login, and current user through `createMvpApiServer`. Authentication uses the existing `AuthService` bearer token session foundation.

MVP Backend Loop adds Supabase Auth integration through `SupabaseMvpBackendLoop.signUp` and `signIn`. Signup syncs a `profiles` row and grants starter credits. Runtime configuration uses environment variables and never hardcodes Supabase credentials.

Social auth support now uses `SupabaseMvpBackendLoop.createOAuthSignInUrl` for Google, X/Twitter, and Discord through Supabase OAuth. Provider secrets and redirect settings must be configured inside Supabase, not committed to the repository.

The static MVP frontend also calls Supabase Auth directly for browser signup, signin, and OAuth redirects through browser-safe Vite variables: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. These public values must point to the same Supabase project used by the backend environment.

Email password recovery uses Supabase Auth from the browser. The sign-in page calls `resetPasswordForEmail` with a same-origin redirect target, and the recovery page calls `updateUser({ password })` after Supabase establishes the recovery session from the email link. No service role key or third-party secret is exposed to the browser.

Telegram login is exposed as a frontend entry through Telegram Login Widget configuration variables: `VITE_TELEGRAM_BOT_USERNAME` and `VITE_TELEGRAM_AUTH_URL`. Telegram identity data must be verified by a trusted backend using Telegram's signed hash before creating or linking a user.

## Future Plan

Create dedicated security and identity architecture before implementation.

## AI Context

Do not design authentication as simple username/password storage. Treat identity as security-critical platform infrastructure.
