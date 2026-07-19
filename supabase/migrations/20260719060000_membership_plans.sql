-- Membership catalog and subscription state. Payment providers are intentionally
-- not connected in this phase; subscriptions can be created by trusted admin
-- operations or a future payment webhook.
create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  price numeric(12,2) not null default 0 check (price >= 0),
  currency text not null default 'USD',
  stripe_price_id text,
  credits integer not null default 0 check (credits >= 0),
  features jsonb not null default '[]'::jsonb,
  tool_access jsonb not null default '[]'::jsonb,
  daily_limit integer not null default 0 check (daily_limit >= 0),
  status text not null default 'draft' check (status in ('draft','published','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid not null references public.plans(id) on delete restrict,
  status text not null default 'pending' check (status in ('pending','trialing','active','paused','cancelled','expired')),
  started_at timestamptz,
  ended_at timestamptz,
  provider text not null default 'manual',
  external_id text,
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_price_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.plans add column if not exists stripe_price_id text;
alter table public.plans add column if not exists price numeric(12,2) not null default 0;
alter table public.plans add column if not exists currency text not null default 'USD';
alter table public.plans add column if not exists credits integer not null default 0;
alter table public.plans add column if not exists features jsonb not null default '[]'::jsonb;
alter table public.plans add column if not exists tool_access jsonb not null default '[]'::jsonb;
alter table public.plans add column if not exists daily_limit integer not null default 0;
alter table public.plans add column if not exists status text not null default 'draft';
alter table public.plans add column if not exists created_at timestamptz not null default now();
alter table public.plans add column if not exists updated_at timestamptz not null default now();
alter table public.subscriptions add column if not exists status text not null default 'pending';
alter table public.subscriptions add column if not exists user_id uuid;
alter table public.subscriptions add column if not exists plan_id uuid;
alter table public.subscriptions add column if not exists started_at timestamptz;
alter table public.subscriptions add column if not exists ended_at timestamptz;
alter table public.subscriptions add column if not exists provider text not null default 'manual';
alter table public.subscriptions add column if not exists external_id text;
alter table public.subscriptions add column if not exists created_at timestamptz not null default now();
alter table public.subscriptions add column if not exists updated_at timestamptz not null default now();
alter table public.subscriptions add column if not exists stripe_customer_id text;
alter table public.subscriptions add column if not exists stripe_subscription_id text;
alter table public.subscriptions add column if not exists stripe_price_id text;

create index if not exists idx_plans_status on public.plans(status);
create index if not exists idx_subscriptions_user_status on public.subscriptions(user_id, status, ended_at);
create index if not exists idx_subscriptions_plan on public.subscriptions(plan_id);
create unique index if not exists idx_subscriptions_stripe_subscription_id on public.subscriptions(stripe_subscription_id) where stripe_subscription_id is not null;
create index if not exists idx_subscriptions_stripe_customer_id on public.subscriptions(stripe_customer_id) where stripe_customer_id is not null;

alter table public.plans enable row level security;
alter table public.subscriptions enable row level security;

grant select on public.plans to anon, authenticated;
grant select on public.subscriptions to authenticated;

drop policy if exists "published plans public read" on public.plans;
create policy "published plans public read" on public.plans
  for select to anon, authenticated using (status = 'published');
drop policy if exists "admin plans read" on public.plans;
create policy "admin plans read" on public.plans
  for select to authenticated using (public.current_profile_role() in ('admin','operator','content_manager','marketing_manager'));

drop policy if exists "own subscriptions read" on public.subscriptions;
create policy "own subscriptions read" on public.subscriptions
  for select to authenticated using (user_id = auth.uid());
drop policy if exists "admin subscriptions read" on public.subscriptions;
create policy "admin subscriptions read" on public.subscriptions
  for select to authenticated using (public.current_profile_role() in ('admin','operator','content_manager','marketing_manager'));

insert into public.plans (id, slug, name, price, currency, credits, monthly_credits_limit, features, tool_access, daily_limit, status)
select gen_random_uuid(), lower(seed.name), seed.name, seed.price, seed.currency, seed.credits, seed.credits, seed.features, seed.tool_access, seed.daily_limit, seed.status
from (values
  ('Free', 0::numeric, 'USD', 40, '["基础工具"]'::jsonb, '["image-editor"]'::jsonb, 5, 'published'),
  ('Pro', 19.99::numeric, 'USD', 1000, '["高级工具", "更多积分", "更高每日限额"]'::jsonb, '["image-editor", "face-swap", "image-to-video"]'::jsonb, 50, 'published'),
  ('Enterprise', 99.99::numeric, 'USD', 10000, '["全部工具", "企业额度"]'::jsonb, '["*"]'::jsonb, 0, 'published')
) as seed(name, price, currency, credits, features, tool_access, daily_limit, status)
where not exists (select 1 from public.plans existing where existing.name = seed.name);
