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

The OAuth verifier creates Supabase authorization URLs for Google, X/Twitter, and Discord, then probes the Supabase authorization endpoint without following the browser redirect. It also checks whether the Telegram Login Widget public values are present. It does not print provider secrets.

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
- `https://jiang289140790-eng.github.io/open-video-studio/zh/login/`
- `https://jiang289140790-eng.github.io/open-video-studio/zh/dashboard/`
- `http://127.0.0.1:4173`
- `http://127.0.0.1:4174`

Set the production Site URL:

- `https://jiang289140790-eng.github.io/open-video-studio/`

## Provider Setup

### Google

- Create OAuth credentials in Google Cloud.
- Add the Supabase callback URL shown in Supabase Google provider settings.
- Paste Client ID and Client Secret into Supabase Authentication Provider settings.
- Enable the Google provider in Supabase.

### X / Twitter

- Create an X developer app with OAuth enabled.
- Add the Supabase callback URL shown in Supabase Twitter provider settings.
- Paste API Key and API Secret into Supabase.
- Enable the Twitter provider in Supabase.

### Discord

- Create a Discord application.
- Add the Supabase callback URL shown in Supabase Discord provider settings.
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
- `npm run verify:oauth` returns reachable authorization redirects for Google, X/Twitter, and Discord.
- GitHub Pages build has `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- Sign-in page OAuth readiness shows Google, X, and Discord as ready.
- Telegram shows ready only after Bot username and backend auth URL are configured.

## Current Verification Status

As of 2026-07-08:

- Google, X/Twitter, and Discord can create Supabase OAuth authorization URLs from local configuration, but Supabase currently returns `Unsupported provider: provider is not enabled` when the verifier probes the provider authorization endpoints.
- Telegram is not complete until `VITE_TELEGRAM_BOT_USERNAME` and `VITE_TELEGRAM_AUTH_URL` are configured with a trusted backend hash-verification endpoint.
- The frontend social-login buttons are present; remaining OAuth work is Supabase Auth Provider enablement and provider-dashboard credentials.

## Future Plan

- Replace the static Telegram callback placeholder with a deployed backend auth endpoint.
- Add OAuth callback smoke tests after provider credentials are configured.
- Add production monitoring for failed OAuth redirects.

## AI Context

Future AI agents must not invent or commit OAuth secrets. If credentials are missing, stop at the exact missing value and ask the user to provide it or configure it in the provider dashboard.
