# Production Auth Configuration

| Field | Value |
|---|---|
| Unique ID | OPS-AUTH-001 |
| Version | 1.1.0 |
| Status | Active |
| Owner | CTO / Operations |
| Dependencies | FE-AUTH-010, API-AUTH-001, BACKEND-AUTH-001 |
| Referenced By | DOC-002, CHANGELOG-001 |

## Purpose

Define the production configuration required to make Open Video Studio social login work on GitHub Pages with the existing Supabase project.

## Requirements

- Never commit real API keys or Supabase service role keys.
- Browser login may use only browser-safe values: Supabase URL and anon key.
- Provider secrets must stay inside Supabase or the provider dashboard.
- Telegram login must be verified by a trusted backend before account creation or linking.

## Required Local Environment

Create `.env.local` from `.env.local.example` and fill:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_STORAGE_BUCKET`
- `VITE_TELEGRAM_BOT_USERNAME`
- `VITE_TELEGRAM_AUTH_URL`

Validate local Supabase connectivity:

```bash
npm run verify:supabase
```

Validate local and GitHub production configuration presence:

```bash
npm run verify:production-config
```

Validate OAuth launch readiness without redirecting the browser:

```bash
npm run verify:oauth
```

Validate the password auth loop used for small user testing:

```bash
npm run verify:auth-basic
```

Validate the whole MVP launch gate:

```bash
npm run verify:mvp
```

`verify:mvp` treats email/password auth, credits, generation/sharing, and Admin operations as required for small user testing. Social OAuth remains a formal launch-readiness blocker, but it does not block the first controlled test cohort while the email/password path is available. The report also surfaces AI fallback health and optional real external AI provider readiness.

The OAuth verifier creates Supabase authorization URLs for Google, X/Twitter, and Discord, then probes the Supabase authorization endpoint without following the browser redirect. It also checks whether the Telegram Login Widget public values are present. It does not print provider secrets.

The Admin Console now performs the same Google, X/Twitter, and Discord provider enablement check through the `admin` Edge Function, so operators can see the difference between "button exists" and "Supabase provider is actually enabled" without using the command line.

## Required GitHub Pages Configuration

Set these GitHub repository Variables:

- `VITE_SUPABASE_URL`
- `VITE_TELEGRAM_BOT_USERNAME`
- `VITE_TELEGRAM_AUTH_URL`

Set this GitHub repository Secret:

- `VITE_SUPABASE_ANON_KEY`

Recommended CLI commands after values are known:

```bash
gh variable set VITE_SUPABASE_URL --repo jiang289140790-eng/open-video-studio --body "https://PROJECT_REF.supabase.co"
gh secret set VITE_SUPABASE_ANON_KEY --repo jiang289140790-eng/open-video-studio
gh variable set VITE_TELEGRAM_BOT_USERNAME --repo jiang289140790-eng/open-video-studio --body "YOUR_BOT_USERNAME"
gh variable set VITE_TELEGRAM_AUTH_URL --repo jiang289140790-eng/open-video-studio --body "https://YOUR_BACKEND_DOMAIN/auth/telegram/callback"
```

## Supabase Auth Redirect URLs

Add these URLs in Supabase Authentication URL configuration:

- `https://jiang289140790-eng.github.io/open-video-studio/`
- `https://jiang289140790-eng.github.io/open-video-studio/signin.html`
- `https://jiang289140790-eng.github.io/open-video-studio/dashboard.html`
- `https://jiang289140790-eng.github.io/open-video-studio/zh/login/`
- `https://jiang289140790-eng.github.io/open-video-studio/zh/dashboard/`
- `https://luravyn.com/`
- `https://luravyn.com/signin.html`
- `https://luravyn.com/dashboard.html`
- `http://127.0.0.1:4173`
- `http://127.0.0.1:4173/signin.html`
- `http://127.0.0.1:4173/dashboard.html`
- `http://127.0.0.1:4174`

Set the production Site URL:

- `https://jiang289140790-eng.github.io/open-video-studio/`

## External OAuth Provider Callback URL

In Google, X/Twitter, and Discord developer consoles, do not use the Luravyn page URL as the OAuth callback. Use the Supabase Auth provider callback URL:

- `https://wyvswkxogkmywduhrhkw.supabase.co/auth/v1/callback`

This is different from the in-app `redirectTo` URL. The third-party provider redirects back to Supabase first, then Supabase redirects the user back to `signin.html` or `dashboard.html`.

## Provider Setup

### Google

- Create OAuth credentials in Google Cloud.
- Add `https://wyvswkxogkmywduhrhkw.supabase.co/auth/v1/callback` to the Google OAuth authorized redirect URIs.
- Paste Client ID and Client Secret into Supabase Authentication Provider settings.
- Enable the Google provider in Supabase.

### X / Twitter

- Create an X developer app with OAuth enabled.
- Add `https://wyvswkxogkmywduhrhkw.supabase.co/auth/v1/callback` to the X OAuth callback / redirect URI settings.
- Paste API Key and API Secret into Supabase.
- Enable the Twitter provider in Supabase.

### Discord

- Create a Discord application.
- Add `https://wyvswkxogkmywduhrhkw.supabase.co/auth/v1/callback` to Discord Developer Portal > OAuth2 > Redirects.
- Paste Client ID and Client Secret into Supabase.
- Enable the Discord provider in Supabase.

### Telegram

- Create a Telegram bot with BotFather.
- Set `VITE_TELEGRAM_BOT_USERNAME`.
- Provide a trusted backend endpoint for `VITE_TELEGRAM_AUTH_URL`.
- The backend must verify Telegram signed hash before creating or linking a user.

## Acceptance Criteria

- `npm run verify:supabase` returns `ok: true`.
- `npm run verify:production-config` returns `ok: true`.
- `npm run verify:auth-basic` returns `ok: true`.
- `npm run verify:oauth` returns reachable authorization redirects for Google, X/Twitter, and Discord.
- GitHub Pages build has `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- Sign-in page OAuth readiness shows Google, X, and Discord as ready.
- Telegram shows ready only after Bot username and backend auth URL are configured.

## Current Verification Status

As of 2026-07-10:

- `npm run verify:mvp` confirms the credits loop, user generation/assets/history/share loop, and Admin operations loop are working in production.
- `npm run verify:auth-basic` confirms password signin, session restore, signout, and cleanup. Public signup is currently hitting Supabase email rate limits, so the verifier uses a temporary admin-created test user fallback to prove the login/session loop.
- Google, X/Twitter, and Discord can create Supabase OAuth authorization URLs from local configuration, but Supabase currently returns `Unsupported provider: provider is not enabled` when the verifier probes the provider authorization endpoints.
- Telegram is not complete until `VITE_TELEGRAM_BOT_USERNAME` and `VITE_TELEGRAM_AUTH_URL` are configured with a trusted backend hash-verification endpoint.
- The frontend social-login buttons are present; remaining OAuth work is Supabase Auth Provider enablement and provider-dashboard credentials.
- Admin Console system readiness shows the same provider-disabled state for Google, X/Twitter, and Discord.

## Future Plan

- Replace the static Telegram callback placeholder with a deployed backend auth endpoint.
- Add OAuth callback smoke tests after provider credentials are configured.
- Add production monitoring for failed OAuth redirects.

## AI Context

Future AI agents must not invent or commit OAuth secrets. If credentials are missing, stop at the exact missing value and ask the user to provide it or configure it in the provider dashboard.
