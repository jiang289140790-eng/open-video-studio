# Admin Console Operations

| Field | Value |
|---|---|
| Unique ID | OPS-ADMIN-001 |
| Version | 1.3.0 |
| Status | Active |
| Owner | CTO / Operations |
| Dependencies | API-ADMIN-001, DB-AUDIT-LOGS-001, BE-ARCH-SECURITY-001 |
| Referenced By | DOC-002, CHANGELOG-001 |

## Purpose

Define how the MVP Admin console is enabled safely for Open Video Studio.

## Requirements

- Never expose `SUPABASE_SERVICE_ROLE_KEY` in the browser.
- Use `profiles.role` to grant `admin` or `operator` access.
- Route sensitive write operations through the Supabase `admin` Edge Function.
- Require a reason for high-risk actions.
- Write audit logs for credit, order, content, and share-link changes.
- Let admins update MVP homepage content without source-code edits.
- Let admins manage MVP page modules and AI tool listings without source-code edits.
- Keep the admin frontend practical for MVP operations without adding enterprise workspace, team, approval, or organization modules.

## Admin Modules

- Overview: command center, admin role state, Supabase status, and KPI cards.
- Users: view real profiles, roles, account state, credit balance, and copy user IDs for support.
- Credits: submit audited manual credit grants or deductions for admins only.
- Orders: inspect credit purchase orders and mark fulfillment state through the admin function.
- Moderation: review generated assets and approve public visibility where allowed.
- Generation Jobs: inspect Fake Worker job status, provider, model, cost, and progress.
- Share Links: inspect public links and revoke unsafe or requested links.
- Page Builder: configure page modules, enabled state, display style, card count, and data source for pages such as Home and Tool Home.
- Tool Catalog: configure AI tools like product listings, including category, status, provider, model, route, featured state, and credit cost.
- Homepage Content: publish public homepage copy, CTA links, trust signals, showcase cards, and gallery preview cards.
- System Configuration: inspect OAuth readiness, Supabase connection, storage bucket, worker mode, and service-key safety posture.
- Audit Logs: review high-risk admin actions; visible only to admins.

## Deployment Steps

1. Apply the migration at `supabase/migrations/202607070001_mvp_admin_console.sql` to the existing Supabase project.
2. Deploy `supabase/functions/admin/index.ts` as the `admin` Edge Function.
3. Set Supabase Function secrets:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Set the first operator manually in Supabase SQL:

```sql
update public.profiles
set role = 'admin'
where email = 'YOUR_ADMIN_EMAIL';
```

5. Open `/admin.html` or `/zh/admin/` and verify the access panel shows the authenticated admin role.

6. Validate the deployed admin console backend:

```bash
npm run verify:admin
```

Expected successful result:

- All admin tables return `ok: true`.
- `edgeFunction.ok` is `true`.
- An unauthenticated function check returns `ADMIN_AUTH_REQUIRED`, proving the function exists and fails closed.

## Acceptance Criteria

- Signed-out users see a blocked admin state.
- Normal users cannot view production admin data.
- Operators can view users, assets, orders, jobs, and perform allowed content review.
- Admins can adjust credits, update orders, revoke shares, and read audit logs.
- Admins can edit and publish homepage hero copy, CTA links, trust signals, showcase cards, and gallery preview cards.
- Admins can publish page module configuration through `page_builder_config`.
- Admins can publish AI tool listing configuration through `tool_catalog_config`.
- Operators can read homepage configuration but cannot publish changes.
- Operators can read page module and tool catalog configuration but cannot publish changes.
- Every high-risk write has an `audit_logs` row.

## Current Deployment Status

As of the first MVP Admin implementation, database tables are reachable from the configured Supabase project when using the local service role environment. The `admin` Edge Function has been deployed and `npm run verify:admin` confirms that the function exists and fails closed with `ADMIN_AUTH_REQUIRED` for unauthenticated requests.

Supabase Auth currently has no users in this project, so the first admin role can only be assigned after the first real account signs up.

The admin console frontend has been upgraded from a lightweight homepage form into a multi-module MVP operations console. It now presents the operating map an internal admin needs: overview, users, credits, orders, moderation, jobs, shares, homepage content, system readiness, and audit logs.

The Admin console now includes MVP Shopify-style configuration surfaces backed by `site_settings.page_builder_config` and `site_settings.tool_catalog_config`. These do not add a new architecture layer; they make existing static pages and AI tool routes operationally configurable for page composition and tool merchandising.

Page Builder and Tool Catalog use visual configuration cards for normal operations, with advanced batch text editing retained for fast import/export style updates.

The public homepage and tool directory surfaces read the published settings when Supabase is configured. Page Builder can affect section visibility, display style, and card count. Tool Catalog can affect tool visibility, display label, route, provider/model metadata, featured state, and visible credit cost labels.

The homepage manager remains backed by `site_settings.homepage_config`. This is the MVP version of a Shopify-style site editor: it supports public homepage content changes while keeping high-risk writes behind admin permission and audit logging.

## AI Context

Admin work is security-sensitive. Do not add browser-side service keys, fake successful writes, or unaudited privileged actions.
