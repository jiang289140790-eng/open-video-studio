-- Phase 8: expiring, revocable consumer share links.
-- Public share resolution is handled by the ai Edge Function so private media
-- remains private and callers never receive Storage write credentials.

alter table public.share_links
  add column if not exists expires_at timestamptz;

create index if not exists share_links_active_expiry_idx
  on public.share_links (token, visibility_status, expires_at)
  where revoked_at is null;

drop policy if exists "share public read" on public.share_links;

drop policy if exists "share owner read" on public.share_links;
create policy "share owner read" on public.share_links
  for select
  using (
    auth.uid() = owner_user_id
    or public.current_profile_role() in ('admin', 'operator')
  );

comment on column public.share_links.expires_at is
  'Optional expiry for explicitly created read-only consumer share links.';
