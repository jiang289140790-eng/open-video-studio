-- Production user authentication support for the existing Supabase project.
-- Browser clients may use only the publishable/anon key. Service-role credentials
-- are never exposed to GitHub Pages.

create extension if not exists pgcrypto with schema extensions;

alter table public.profiles add column if not exists username text;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists credits integer not null default 100;
alter table public.profiles add column if not exists credit_balance integer not null default 100;
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

update public.profiles
set username = coalesce(nullif(username, ''), nullif(display_name, ''), split_part(email, '@', 1), 'creator'),
    credit_balance = coalesce(credits, credit_balance, 100),
    updated_at = coalesce(updated_at, now());

create table if not exists public.credits (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  credits integer not null default 100 check (credits >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_creations (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tool_id text not null,
  result_url text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_user_creations_user_created
  on public.user_creations(user_id, created_at desc);

insert into public.credits (user_id, credits)
select p.id, greatest(coalesce(p.credits, p.credit_balance, 100), 0)
from public.profiles p
on conflict (user_id) do nothing;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create or replace function private.sync_auth_user_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  resolved_username text;
  resolved_display_name text;
  resolved_avatar_url text;
begin
  resolved_username := coalesce(
    nullif(new.raw_user_meta_data ->> 'user_name', ''),
    nullif(new.raw_user_meta_data ->> 'preferred_username', ''),
    nullif(new.raw_user_meta_data ->> 'name', ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'creator'
  );
  resolved_display_name := coalesce(
    nullif(new.raw_user_meta_data ->> 'display_name', ''),
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'name', ''),
    resolved_username
  );
  resolved_avatar_url := coalesce(
    nullif(new.raw_user_meta_data ->> 'avatar_url', ''),
    nullif(new.raw_user_meta_data ->> 'picture', '')
  );

  insert into public.profiles (
    id, email, display_name, username, avatar_url, credits, credit_balance, created_at, updated_at
  ) values (
    new.id, coalesce(new.email, ''), resolved_display_name, resolved_username,
    resolved_avatar_url, 100, 100, coalesce(new.created_at, now()), now()
  )
  on conflict (id) do update set
    email = excluded.email,
    display_name = excluded.display_name,
    username = excluded.username,
    avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
    updated_at = now();

  insert into public.credits (user_id, credits)
  values (new.id, 100)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

revoke all on function private.sync_auth_user_profile() from public, anon, authenticated;

drop trigger if exists on_auth_user_profile_sync on auth.users;
create trigger on_auth_user_profile_sync
  after insert or update of email, raw_user_meta_data on auth.users
  for each row execute function private.sync_auth_user_profile();

insert into public.profiles (id, email, display_name, username, avatar_url, credits, credit_balance, created_at, updated_at)
select
  u.id,
  coalesce(u.email, ''),
  coalesce(
    nullif(u.raw_user_meta_data ->> 'display_name', ''),
    nullif(u.raw_user_meta_data ->> 'full_name', ''),
    nullif(u.raw_user_meta_data ->> 'name', ''),
    nullif(split_part(coalesce(u.email, ''), '@', 1), ''),
    'creator'
  ),
  coalesce(
    nullif(u.raw_user_meta_data ->> 'user_name', ''),
    nullif(u.raw_user_meta_data ->> 'preferred_username', ''),
    nullif(u.raw_user_meta_data ->> 'name', ''),
    nullif(split_part(coalesce(u.email, ''), '@', 1), ''),
    'creator'
  ),
  coalesce(nullif(u.raw_user_meta_data ->> 'avatar_url', ''), nullif(u.raw_user_meta_data ->> 'picture', '')),
  100,
  100,
  coalesce(u.created_at, now()),
  now()
from auth.users u
on conflict (id) do nothing;

insert into public.credits (user_id, credits)
select p.id, greatest(coalesce(p.credits, p.credit_balance, 100), 0)
from public.profiles p
on conflict (user_id) do nothing;

alter table public.profiles enable row level security;
alter table public.credits enable row level security;
alter table public.user_creations enable row level security;

drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists "Users can read own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "profiles owner read" on public.profiles;
drop policy if exists "profiles owner update" on public.profiles;
drop policy if exists "profiles authenticated owner select" on public.profiles;
create policy "profiles authenticated owner select" on public.profiles
  for select to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "profiles authenticated owner update" on public.profiles;
create policy "profiles authenticated owner update" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

drop policy if exists "credits authenticated owner select" on public.credits;
create policy "credits authenticated owner select" on public.credits
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "user creations authenticated owner select" on public.user_creations;
create policy "user creations authenticated owner select" on public.user_creations
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "user creations authenticated owner insert" on public.user_creations;
create policy "user creations authenticated owner insert" on public.user_creations
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "user creations authenticated owner delete" on public.user_creations;
create policy "user creations authenticated owner delete" on public.user_creations
  for delete to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.profiles, public.credits, public.user_creations from anon;
revoke update on public.profiles from public, authenticated;
grant select on public.profiles to authenticated;
grant update (display_name, username, avatar_url, locale, timezone, onboarding_state, updated_at)
  on public.profiles to authenticated;
grant select on public.credits to authenticated;
grant select, insert, delete on public.user_creations to authenticated;

create or replace function public.debit_credits(p_amount integer)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  remaining integer;
begin
  if caller_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;
  if p_amount is null or p_amount <= 0 then
    raise exception 'INVALID_CREDIT_AMOUNT';
  end if;

  update public.credits
  set credits = credits - p_amount,
      updated_at = now()
  where user_id = caller_id
    and credits >= p_amount
  returning credits into remaining;

  if remaining is null then
    raise exception 'INSUFFICIENT_CREDITS';
  end if;

  update public.profiles
  set credit_balance = remaining,
      credits = remaining,
      updated_at = now()
  where id = caller_id;

  return remaining;
end;
$$;

revoke all on function public.debit_credits(integer) from public, anon;
grant execute on function public.debit_credits(integer) to authenticated;
