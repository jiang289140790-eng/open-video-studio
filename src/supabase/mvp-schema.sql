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
  aspect_ratio text not null default '16:9',
  resolution text,
  duration_seconds integer,
  source_asset_id text,
  character_id text,
  result_asset_id text,
  cost_credits integer not null,
  estimated_cost_cents integer not null default 0,
  progress integer not null default 0,
  safety_status text not null default 'pending_review',
  error_code text,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
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

create index if not exists idx_profiles_email on public.profiles(email);
create index if not exists idx_credit_user_time on public.credit_transactions(user_id, created_at desc);
create index if not exists idx_generation_user_time on public.generation_jobs(user_id, created_at desc);
create index if not exists idx_generation_status on public.generation_jobs(status);
create index if not exists idx_media_owner_time on public.media_assets(owner_user_id, updated_at desc);
create index if not exists idx_media_generation_job on public.media_assets(generation_job_id);
create index if not exists idx_media_visibility on public.media_assets(visibility_status);
create index if not exists idx_share_token on public.share_links(token);

alter table public.profiles enable row level security;
alter table public.credit_transactions enable row level security;
alter table public.generation_jobs enable row level security;
alter table public.media_assets enable row level security;
alter table public.share_links enable row level security;

drop policy if exists "profiles owner read" on public.profiles;
create policy "profiles owner read" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles owner update" on public.profiles;
create policy "profiles owner update" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "credits owner read" on public.credit_transactions;
create policy "credits owner read" on public.credit_transactions
  for select using (auth.uid() = user_id);

drop policy if exists "generation owner read" on public.generation_jobs;
create policy "generation owner read" on public.generation_jobs
  for select using (auth.uid() = user_id);

drop policy if exists "generation owner write" on public.generation_jobs;
create policy "generation owner write" on public.generation_jobs
  for insert with check (auth.uid() = user_id);

drop policy if exists "media owner read" on public.media_assets;
create policy "media owner read" on public.media_assets
  for select using (auth.uid() = owner_user_id);

drop policy if exists "media owner write" on public.media_assets;
create policy "media owner write" on public.media_assets
  for insert with check (auth.uid() = owner_user_id);

drop policy if exists "media public read" on public.media_assets;
create policy "media public read" on public.media_assets
  for select using (visibility_status = 'public' and deleted_at is null);

drop policy if exists "share owner read" on public.share_links;
create policy "share owner read" on public.share_links
  for select using (auth.uid() = owner_user_id);

drop policy if exists "share public read" on public.share_links;
create policy "share public read" on public.share_links
  for select using (visibility_status = 'active');

