# Admin Console Operations

| Field | Value |
|---|---|
| Unique ID | OPS-ADMIN-001 |
| Version | 1.0.0 |
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

## Acceptance Criteria

- Signed-out users see a blocked admin state.
- Normal users cannot view production admin data.
- Operators can view users, assets, orders, jobs, and perform allowed content review.
- Admins can adjust credits, update orders, revoke shares, and read audit logs.
- Every high-risk write has an `audit_logs` row.

## AI Context

Admin work is security-sensitive. Do not add browser-side service keys, fake successful writes, or unaudited privileged actions.
