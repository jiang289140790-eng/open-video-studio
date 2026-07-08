-- Open Video Studio MVP Backend Loop schema for Supabase/PostgreSQL.
-- Apply inside the existing Supabase project. Do not commit credentials.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text not null,
  avatar_url text,
  account_status text not null default 'active',
  role text not null default 'user',
  locale text not null default 'en',
  timezone text not null default 'UTC',
  onboarding_state text not null default 'not_started',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.credit_transactions (
  id text primary key,
  account_id uuid not null references auth.users(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  source_type text not null,
  source_id text,
  amount integer not null check (amount > 0),
  balance_impact integer not null,
  operation_category text not null,
  status text not null default 'posted',
  reason text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.generation_jobs (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  media_type text not null check (media_type in ('image', 'video')),
  status text not null default 'queued',
  project_id text,
  prompt text not null,
  provider text not null default 'local_api',
  model text not null default 'local-stub-v0',
  tool_slug text,
  workflow_id text,
  workflow_version text,
  input_params jsonb not null default '{}'::jsonb,
  output_assets jsonb not null default '[]'::jsonb,
  aspect_ratio text not null default '16:9',
  resolution text,
  duration_seconds integer,
  source_asset_id text,
  character_id text,
  result_asset_id text,
  cost_credits integer not null,
  credit_charged integer,
  estimated_cost_cents integer not null default 0,
  estimated_cost integer,
  latency integer,
  progress integer not null default 0,
  safety_status text not null default 'pending_review',
  error_code text,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

alter table public.generation_jobs add column if not exists tool_slug text;
alter table public.generation_jobs add column if not exists workflow_id text;
alter table public.generation_jobs add column if not exists workflow_version text;
alter table public.generation_jobs add column if not exists input_params jsonb not null default '{}'::jsonb;
alter table public.generation_jobs add column if not exists output_assets jsonb not null default '[]'::jsonb;
alter table public.generation_jobs add column if not exists credit_charged integer;
alter table public.generation_jobs add column if not exists estimated_cost integer;
alter table public.generation_jobs add column if not exists latency integer;

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

create table if not exists public.media_assets (
  id text primary key,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  project_id text,
  character_id text,
  generation_job_id text references public.generation_jobs(id) on delete set null,
  asset_type text not null,
  source_type text not null,
  storage_key text not null unique,
  preview_storage_key text,
  display_name text not null,
  tags_json jsonb not null default '[]'::jsonb,
  metadata_json jsonb not null default '{}'::jsonb,
  is_favorite boolean not null default false,
  processing_status text not null default 'ready',
  rights_status text not null default 'unknown',
  moderation_status text not null default 'pending',
  visibility_status text not null default 'private',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  deleted_at timestamptz
);

create table if not exists public.share_links (
  id text primary key,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  media_asset_id text not null references public.media_assets(id) on delete cascade,
  token text not null unique,
  visibility_status text not null default 'active',
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

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

create table if not exists public.images (
  id text primary key,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  project_id text,
  media_asset_id text not null references public.media_assets(id) on delete cascade,
  generation_job_id text references public.generation_jobs(id) on delete set null,
  character_id text,
  prompt text not null default '',
  source_type text not null,
  width integer,
  height integer,
  format text,
  moderation_status text not null default 'pending',
  rights_status text not null default 'unknown',
  visibility_status text not null default 'private',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.videos (
  id text primary key,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  project_id text,
  media_asset_id text not null references public.media_assets(id) on delete cascade,
  generation_job_id text references public.generation_jobs(id) on delete set null,
  character_id text,
  title text not null,
  description text not null default '',
  status text not null default 'draft',
  duration_seconds integer,
  aspect_ratio text not null default '16:9',
  generation_source text not null default 'ai_generation',
  review_status text not null default 'pending',
  export_status text not null default 'not_started',
  visibility_status text not null default 'private',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
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
  credit_transaction_id text references public.credit_transactions(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
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

create index if not exists idx_profiles_email on public.profiles(email);
create index if not exists idx_credit_user_time on public.credit_transactions(user_id, created_at desc);
create index if not exists idx_generation_user_time on public.generation_jobs(user_id, created_at desc);
create index if not exists idx_generation_status on public.generation_jobs(status);
create index if not exists idx_generation_tool_workflow on public.generation_jobs(tool_slug, workflow_id, workflow_version);
create index if not exists idx_ai_workers_provider_status on public.ai_workers(provider, status);
create index if not exists idx_media_owner_time on public.media_assets(owner_user_id, updated_at desc);
create index if not exists idx_media_generation_job on public.media_assets(generation_job_id);
create index if not exists idx_media_visibility on public.media_assets(visibility_status);
create index if not exists idx_share_token on public.share_links(token);
create index if not exists idx_characters_owner_name on public.characters(owner_user_id, name);
create index if not exists idx_images_owner_time on public.images(owner_user_id, created_at desc);
create index if not exists idx_videos_owner_time on public.videos(owner_user_id, updated_at desc);
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
alter table public.ai_workers enable row level security;
alter table public.media_assets enable row level security;
alter table public.share_links enable row level security;
alter table public.characters enable row level security;
alter table public.images enable row level security;
alter table public.videos enable row level security;
alter table public.orders enable row level security;
alter table public.audit_logs enable row level security;
alter table public.site_settings enable row level security;

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

drop policy if exists "ai workers admin read" on public.ai_workers;
create policy "ai workers admin read" on public.ai_workers
  for select using (public.current_profile_role() in ('admin', 'operator'));

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
  for select using (visibility_status = 'active');

drop policy if exists "characters owner read" on public.characters;
create policy "characters owner read" on public.characters
  for select using (auth.uid() = owner_user_id or public.current_profile_role() in ('admin', 'operator'));

drop policy if exists "characters owner write" on public.characters;
create policy "characters owner write" on public.characters
  for insert with check (auth.uid() = owner_user_id);

drop policy if exists "images owner read" on public.images;
create policy "images owner read" on public.images
  for select using (auth.uid() = owner_user_id or public.current_profile_role() in ('admin', 'operator'));

drop policy if exists "videos owner read" on public.videos;
create policy "videos owner read" on public.videos
  for select using (auth.uid() = owner_user_id or public.current_profile_role() in ('admin', 'operator'));

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
