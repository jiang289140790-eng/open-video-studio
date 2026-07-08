-- Open Video Studio remote MVP schema alignment.
-- Safe to run against the existing Supabase project. It preserves old rows and
-- adds the columns required by the current Auth -> Credits -> Generation -> Asset loop.

create extension if not exists pgcrypto;

do $$
begin
  if to_regclass('public.creations') is not null then
    alter table public.creations drop constraint if exists creations_job_id_fkey;
    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'creations'
        and column_name = 'job_id' and data_type = 'uuid'
    ) then
      alter table public.creations alter column job_id type text using job_id::text;
    end if;
  end if;

  if to_regclass('public.credit_transactions') is not null then
    alter table public.credit_transactions drop constraint if exists credit_transactions_related_job_id_fkey;
    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'credit_transactions'
        and column_name = 'related_job_id' and data_type = 'uuid'
    ) then
      alter table public.credit_transactions alter column related_job_id type text using related_job_id::text;
    end if;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'credit_transactions'
      and column_name = 'id' and data_type = 'uuid'
  ) then
    alter table public.credit_transactions alter column id drop default;
    alter table public.credit_transactions alter column id type text using id::text;
    alter table public.credit_transactions alter column id set default gen_random_uuid()::text;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'generation_jobs'
      and column_name = 'id' and data_type = 'uuid'
  ) then
    alter table public.generation_jobs alter column id drop default;
    alter table public.generation_jobs alter column id type text using id::text;
    alter table public.generation_jobs alter column id set default gen_random_uuid()::text;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'media_assets'
      and column_name = 'id' and data_type = 'uuid'
  ) then
    alter table public.media_assets alter column id drop default;
    alter table public.media_assets alter column id type text using id::text;
    alter table public.media_assets alter column id set default gen_random_uuid()::text;
  end if;
end $$;

alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists account_status text not null default 'active';
alter table public.profiles add column if not exists role text not null default 'user';
alter table public.profiles add column if not exists locale text not null default 'zh-CN';
alter table public.profiles add column if not exists timezone text not null default 'Asia/Shanghai';
alter table public.profiles add column if not exists onboarding_state text not null default 'not_started';
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

alter table public.credit_transactions add column if not exists account_id uuid references auth.users(id) on delete cascade;
alter table public.credit_transactions add column if not exists source_type text not null default 'legacy';
alter table public.credit_transactions add column if not exists source_id text;
alter table public.credit_transactions add column if not exists balance_impact integer;
alter table public.credit_transactions add column if not exists operation_category text not null default 'legacy';
alter table public.credit_transactions add column if not exists status text not null default 'posted';

update public.credit_transactions set account_id = user_id where account_id is null and user_id is not null;
update public.credit_transactions set source_id = related_job_id::text where source_id is null and related_job_id is not null;
update public.credit_transactions set balance_impact = amount where balance_impact is null;

alter table public.credit_transactions alter column balance_impact set not null;

alter table public.generation_jobs add column if not exists media_type text not null default 'image';
alter table public.generation_jobs add column if not exists provider text not null default 'local_api';
alter table public.generation_jobs add column if not exists model text not null default 'local-stub-v0';
alter table public.generation_jobs add column if not exists project_id text;
alter table public.generation_jobs add column if not exists tool_slug text;
alter table public.generation_jobs add column if not exists workflow_id text;
alter table public.generation_jobs add column if not exists workflow_version text;
alter table public.generation_jobs add column if not exists input_params jsonb not null default '{}'::jsonb;
alter table public.generation_jobs add column if not exists output_assets jsonb not null default '[]'::jsonb;
alter table public.generation_jobs add column if not exists resolution text;
alter table public.generation_jobs add column if not exists source_asset_id text;
alter table public.generation_jobs add column if not exists character_id text;
alter table public.generation_jobs add column if not exists result_asset_id text;
alter table public.generation_jobs add column if not exists credit_charged integer;
alter table public.generation_jobs add column if not exists estimated_cost_cents integer not null default 0;
alter table public.generation_jobs add column if not exists estimated_cost integer;
alter table public.generation_jobs add column if not exists latency integer;
alter table public.generation_jobs add column if not exists error_code text;
alter table public.generation_jobs add column if not exists updated_at timestamptz not null default now();

alter table public.generation_jobs alter column duration_seconds drop not null;

update public.generation_jobs
set media_type = case when coalesce(tool_type, '') ilike '%video%' then 'video' else media_type end;
update public.generation_jobs set provider = coalesce(nullif(model_provider, ''), provider);
update public.generation_jobs set model = coalesce(nullif(model_provider, ''), model);
update public.generation_jobs set credit_charged = cost_credits where credit_charged is null;

alter table public.media_assets add column if not exists owner_user_id uuid references auth.users(id) on delete cascade;
alter table public.media_assets add column if not exists project_id text;
alter table public.media_assets add column if not exists character_id text;
alter table public.media_assets add column if not exists generation_job_id text;
alter table public.media_assets add column if not exists asset_type text not null default 'image';
alter table public.media_assets add column if not exists source_type text not null default 'upload';
alter table public.media_assets add column if not exists storage_key text;
alter table public.media_assets add column if not exists preview_storage_key text;
alter table public.media_assets add column if not exists display_name text;
alter table public.media_assets add column if not exists tags_json jsonb not null default '[]'::jsonb;
alter table public.media_assets add column if not exists metadata_json jsonb not null default '{}'::jsonb;
alter table public.media_assets add column if not exists is_favorite boolean not null default false;
alter table public.media_assets add column if not exists processing_status text not null default 'ready';
alter table public.media_assets add column if not exists rights_status text not null default 'unknown';
alter table public.media_assets add column if not exists visibility_status text not null default 'private';
alter table public.media_assets add column if not exists updated_at timestamptz not null default now();
alter table public.media_assets add column if not exists archived_at timestamptz;
alter table public.media_assets add column if not exists deleted_at timestamptz;

update public.media_assets set owner_user_id = user_id where owner_user_id is null and user_id is not null;
update public.media_assets set asset_type = coalesce(nullif(file_type, ''), asset_type) where asset_type is null or asset_type = 'image';
update public.media_assets set storage_key = coalesce(nullif(file_url, ''), storage_key, id) where storage_key is null;
update public.media_assets set display_name = coalesce(display_name, split_part(coalesce(storage_key, file_url, id), '/', greatest(1, array_length(string_to_array(coalesce(storage_key, file_url, id), '/'), 1)))) where display_name is null;
update public.media_assets set visibility_status = case when moderation_status = 'approved' then 'public' else visibility_status end where visibility_status is null or visibility_status = 'private';

alter table public.media_assets alter column user_id drop not null;
alter table public.media_assets alter column file_url drop not null;
alter table public.media_assets alter column file_type drop not null;
alter table public.media_assets alter column consent_confirmed drop not null;
alter table public.media_assets alter column owner_user_id set not null;
alter table public.media_assets alter column storage_key set not null;
alter table public.media_assets alter column display_name set not null;

create table if not exists public.characters (
  id text primary key,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text not null default '',
  character_type text not null default 'persona',
  reference_asset_id text,
  cover_asset_id text,
  tags_json jsonb not null default '[]'::jsonb,
  memory_json jsonb not null default '{}'::jsonb,
  consistency_status text not null default 'draft',
  prompt_seed text not null default '',
  rights_status text not null default 'unknown',
  safety_status text not null default 'pending',
  visibility_status text not null default 'private',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create table if not exists public.orders (
  id text primary key,
  account_id uuid not null references auth.users(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  provider_reference text,
  order_type text not null default 'credit_purchase',
  status text not null default 'pending',
  currency text not null default 'USD',
  amount_cents integer not null default 0,
  credits_granted integer not null default 0,
  credit_transaction_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.share_links (
  id text primary key,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  media_asset_id text not null,
  token text not null unique,
  visibility_status text not null default 'active',
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

create table if not exists public.audit_logs (
  id text primary key,
  actor_type text not null,
  actor_id uuid,
  action text not null,
  target_type text not null,
  target_id text,
  outcome text not null,
  risk_classification text not null default 'low',
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.site_settings (
  setting_key text primary key,
  value_json jsonb not null default '{}'::jsonb,
  status text not null default 'draft',
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.ai_workers (
  worker_id text primary key,
  provider text not null,
  workflow text not null,
  worker_type text not null default 'image',
  status text not null default 'idle',
  queue_count integer not null default 0,
  average_latency integer not null default 0,
  success_rate integer not null default 100,
  cost_per_job integer not null default 0,
  last_heartbeat timestamptz not null default now(),
  recent_failure_reason text not null default '',
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_profiles_email on public.profiles(email);
create index if not exists idx_credit_user_time on public.credit_transactions(user_id, created_at desc);
create index if not exists idx_credit_source on public.credit_transactions(source_type, source_id);
create index if not exists idx_generation_user_time on public.generation_jobs(user_id, created_at desc);
create index if not exists idx_generation_status on public.generation_jobs(status);
create index if not exists idx_generation_tool_workflow on public.generation_jobs(tool_slug, workflow_id, workflow_version);
create index if not exists idx_media_owner_time on public.media_assets(owner_user_id, updated_at desc);
create index if not exists idx_media_generation_job on public.media_assets(generation_job_id);
create index if not exists idx_media_visibility on public.media_assets(visibility_status);
create index if not exists idx_share_token on public.share_links(token);
create index if not exists idx_characters_owner_name on public.characters(owner_user_id, name);
create index if not exists idx_orders_user_time on public.orders(user_id, created_at desc);
create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_audit_actor on public.audit_logs(actor_type, actor_id, created_at desc);
create index if not exists idx_audit_target on public.audit_logs(target_type, target_id);
create index if not exists idx_site_settings_status on public.site_settings(status);

create or replace function public.current_profile_role()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select role from public.profiles where id = auth.uid()
$$;

alter table public.profiles enable row level security;
alter table public.credit_transactions enable row level security;
alter table public.generation_jobs enable row level security;
alter table public.media_assets enable row level security;
alter table public.share_links enable row level security;
alter table public.characters enable row level security;
alter table public.orders enable row level security;
alter table public.audit_logs enable row level security;
alter table public.site_settings enable row level security;
alter table public.ai_workers enable row level security;

drop policy if exists "profiles owner read" on public.profiles;
create policy "profiles owner read" on public.profiles
  for select using (auth.uid() = id or public.current_profile_role() in ('admin', 'operator'));

drop policy if exists "profiles owner update" on public.profiles;
create policy "profiles owner update" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "credits owner read" on public.credit_transactions;
create policy "credits owner read" on public.credit_transactions
  for select using (auth.uid() = user_id or public.current_profile_role() in ('admin', 'operator'));

drop policy if exists "generation owner read" on public.generation_jobs;
create policy "generation owner read" on public.generation_jobs
  for select using (auth.uid() = user_id or public.current_profile_role() in ('admin', 'operator'));

drop policy if exists "generation owner write" on public.generation_jobs;
create policy "generation owner write" on public.generation_jobs
  for insert with check (auth.uid() = user_id);

drop policy if exists "media owner read" on public.media_assets;
create policy "media owner read" on public.media_assets
  for select using (auth.uid() = owner_user_id or public.current_profile_role() in ('admin', 'operator'));

drop policy if exists "media owner write" on public.media_assets;
create policy "media owner write" on public.media_assets
  for insert with check (auth.uid() = owner_user_id);

drop policy if exists "media public read" on public.media_assets;
create policy "media public read" on public.media_assets
  for select using (visibility_status = 'public' and deleted_at is null);

drop policy if exists "share owner read" on public.share_links;
create policy "share owner read" on public.share_links
  for select using (auth.uid() = owner_user_id or public.current_profile_role() in ('admin', 'operator'));

drop policy if exists "share public read" on public.share_links;
create policy "share public read" on public.share_links
  for select using (visibility_status = 'active' and revoked_at is null);

drop policy if exists "characters owner read" on public.characters;
create policy "characters owner read" on public.characters
  for select using (auth.uid() = owner_user_id or public.current_profile_role() in ('admin', 'operator'));

drop policy if exists "characters owner write" on public.characters;
create policy "characters owner write" on public.characters
  for insert with check (auth.uid() = owner_user_id);

drop policy if exists "orders owner read" on public.orders;
create policy "orders owner read" on public.orders
  for select using (auth.uid() = user_id or public.current_profile_role() in ('admin', 'operator'));

drop policy if exists "audit admin read" on public.audit_logs;
create policy "audit admin read" on public.audit_logs
  for select using (public.current_profile_role() = 'admin');

drop policy if exists "site settings public read" on public.site_settings;
create policy "site settings public read" on public.site_settings
  for select using (status = 'published');

drop policy if exists "site settings admin read" on public.site_settings;
create policy "site settings admin read" on public.site_settings
  for select using (public.current_profile_role() in ('admin', 'operator'));

drop policy if exists "ai workers admin read" on public.ai_workers;
create policy "ai workers admin read" on public.ai_workers
  for select using (public.current_profile_role() in ('admin', 'operator'));
