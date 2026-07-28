-- Production performance telemetry tables.
-- These tables are user-owned and intentionally keep provider payloads in JSONB
-- so ingestion can evolve without changing the core metric columns.

create table if not exists public.content_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content_ref text not null,
  tool_id uuid references public.tools(id) on delete set null,
  workflow_id uuid references public.workflows(id) on delete set null,
  metric_date date not null default current_date,
  impressions bigint not null default 0 check (impressions >= 0),
  views bigint not null default 0 check (views >= 0),
  likes bigint not null default 0 check (likes >= 0),
  comments bigint not null default 0 check (comments >= 0),
  shares bigint not null default 0 check (shares >= 0),
  clicks bigint not null default 0 check (clicks >= 0),
  signups bigint not null default 0 check (signups >= 0),
  conversions bigint not null default 0 check (conversions >= 0),
  spend_cents bigint not null default 0 check (spend_cents >= 0),
  revenue_cents bigint not null default 0 check (revenue_cents >= 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, content_ref, metric_date)
);
create table if not exists public.publish_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content_metric_id uuid references public.content_metrics(id) on delete set null,
  platform text not null,
  external_post_id text,
  published_at timestamptz,
  impressions bigint not null default 0 check (impressions >= 0),
  views bigint not null default 0 check (views >= 0),
  likes bigint not null default 0 check (likes >= 0),
  comments bigint not null default 0 check (comments >= 0),
  shares bigint not null default 0 check (shares >= 0),
  clicks bigint not null default 0 check (clicks >= 0),
  conversions bigint not null default 0 check (conversions >= 0),
  spend_cents bigint not null default 0 check (spend_cents >= 0),
  revenue_cents bigint not null default 0 check (revenue_cents >= 0),
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, platform, external_post_id)
);
create table if not exists public.content_strategies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text not null default '',
  strategy_type text not null default 'content_optimization',
  status text not null default 'draft' check (status in ('draft', 'active', 'paused', 'archived')),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  config jsonb not null default '{}'::jsonb,
  target_metrics jsonb not null default '{}'::jsonb,
  last_run_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists content_metrics_user_date_idx
  on public.content_metrics (user_id, metric_date desc);
create index if not exists content_metrics_tool_idx
  on public.content_metrics (user_id, tool_id, metric_date desc);
create index if not exists publish_metrics_user_platform_idx
  on public.publish_metrics (user_id, platform, published_at desc);
create index if not exists publish_metrics_content_idx
  on public.publish_metrics (content_metric_id);
create index if not exists content_strategies_user_status_idx
  on public.content_strategies (user_id, status, updated_at desc);
alter table public.content_metrics enable row level security;
alter table public.publish_metrics enable row level security;
alter table public.content_strategies enable row level security;
grant select, insert, update, delete on public.content_metrics to authenticated;
grant select, insert, update, delete on public.publish_metrics to authenticated;
grant select, insert, update, delete on public.content_strategies to authenticated;
create policy "content_metrics_select_own"
  on public.content_metrics for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "content_metrics_insert_own"
  on public.content_metrics for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "content_metrics_update_own"
  on public.content_metrics for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "content_metrics_delete_own"
  on public.content_metrics for delete to authenticated
  using ((select auth.uid()) = user_id);
create policy "publish_metrics_select_own"
  on public.publish_metrics for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "publish_metrics_insert_own"
  on public.publish_metrics for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "publish_metrics_update_own"
  on public.publish_metrics for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "publish_metrics_delete_own"
  on public.publish_metrics for delete to authenticated
  using ((select auth.uid()) = user_id);
create policy "content_strategies_select_own"
  on public.content_strategies for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "content_strategies_insert_own"
  on public.content_strategies for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "content_strategies_update_own"
  on public.content_strategies for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "content_strategies_delete_own"
  on public.content_strategies for delete to authenticated
  using ((select auth.uid()) = user_id);
