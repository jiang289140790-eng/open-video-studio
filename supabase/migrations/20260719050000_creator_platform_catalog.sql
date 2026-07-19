-- AI Creator commercial operations catalog. Additive migration: existing MVP tables remain intact.
create table if not exists public.tools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  category text not null default 'image',
  description text not null default '',
  cover_image text not null default '',
  icon text not null default '',
  credits_cost integer not null default 0 check (credits_cost >= 0),
  free_credits integer not null default 0 check (free_credits >= 0),
  cost_per_run integer not null default 0 check (cost_per_run >= 0),
  daily_limit integer not null default 0 check (daily_limit >= 0),
  membership_required boolean not null default false,
  visibility text not null default 'public' check (visibility in ('public','unlisted','private')),
  route text not null default '',
  workflow_id text,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  featured boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workflows (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  tool_id uuid references public.tools(id) on delete set null,
  provider text not null default 'zealman',
  workflow_id text not null,
  version text not null default 'v1',
  cost numeric(12,4) not null default 0 check (cost >= 0),
  status text not null default 'draft' check (status in ('draft','testing','published','deprecated')),
  input_schema jsonb not null default '{}'::jsonb,
  output_schema jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(provider, workflow_id, version)
);

create table if not exists public.homepage_sections (
  id uuid primary key default gen_random_uuid(),
  section_type text not null check (section_type in ('hero','quick_tools','popular_tools','showcase')),
  title text not null default '',
  subtitle text not null default '',
  image text not null default '',
  link text not null default '',
  sort_order integer not null default 0,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tool_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tool_id uuid not null references public.tools(id) on delete cascade,
  workflow_id uuid references public.workflows(id) on delete set null,
  workflow_key text,
  credits_used integer not null default 0 check (credits_used >= 0),
  free_credits_used integer not null default 0 check (free_credits_used >= 0),
  created_at timestamptz not null default now()
);

-- Keep compatibility with an earlier dashboard schema that may already have
-- created one or more of these tables with a smaller column set.
alter table public.tools add column if not exists workflow_id text;
alter table public.tools add column if not exists free_credits integer default 0;
alter table public.tools add column if not exists cost_per_run integer default 0;
alter table public.tools add column if not exists daily_limit integer default 0;
alter table public.tools add column if not exists membership_required boolean default false;
alter table public.tools add column if not exists visibility text default 'public';
alter table public.tools add column if not exists status text default 'draft';
alter table public.tools add column if not exists featured boolean default false;
alter table public.tools add column if not exists sort_order integer default 0;
alter table public.tools add column if not exists updated_at timestamptz default now();
alter table public.workflows add column if not exists tool_id uuid;
alter table public.workflows add column if not exists provider text default 'zealman';
alter table public.workflows add column if not exists workflow_id text;
alter table public.workflows add column if not exists version text default 'v1';
alter table public.workflows add column if not exists cost numeric(12,4) default 0;
alter table public.workflows add column if not exists status text default 'draft';
alter table public.workflows add column if not exists input_schema jsonb default '{}'::jsonb;
alter table public.workflows add column if not exists output_schema jsonb default '{}'::jsonb;
alter table public.workflows add column if not exists updated_at timestamptz default now();
alter table public.homepage_sections add column if not exists section_type text default 'showcase';
alter table public.homepage_sections add column if not exists sort_order integer default 0;
alter table public.homepage_sections add column if not exists enabled boolean default true;
alter table public.homepage_sections add column if not exists updated_at timestamptz default now();
alter table public.profiles add column if not exists membership_status text not null default 'free';

alter table public.profiles add column if not exists acquisition_source text;
alter table public.profiles add column if not exists last_active_at timestamptz;
alter table public.profiles add column if not exists total_generation_count integer not null default 0;
alter table public.profiles add column if not exists total_spend_cents integer not null default 0;

create index if not exists idx_tools_published_order on public.tools(status, featured desc, sort_order, created_at desc);
create index if not exists idx_workflows_tool_status on public.workflows(tool_id, status);
create index if not exists idx_homepage_sections_enabled_order on public.homepage_sections(enabled, sort_order);
create index if not exists idx_tool_usage_tool_user_created on public.tool_usage(tool_id, user_id, created_at desc);
create index if not exists idx_tool_usage_created on public.tool_usage(created_at desc);

alter table public.tools enable row level security;
alter table public.workflows enable row level security;
alter table public.homepage_sections enable row level security;
alter table public.tool_usage enable row level security;

-- Explicit Data API exposure for the read-only public catalog. RLS below still
-- limits anonymous/authenticated clients to published/enabled rows.
grant select on public.tools, public.workflows, public.homepage_sections to anon, authenticated;
grant select on public.tool_usage to authenticated;

drop policy if exists "own tool usage read" on public.tool_usage;
create policy "own tool usage read" on public.tool_usage
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "published tools public read" on public.tools;
create policy "published tools public read" on public.tools
  for select using (status = 'published');
drop policy if exists "admin tools read" on public.tools;
create policy "admin tools read" on public.tools
  for select using (public.current_profile_role() in ('admin','operator','content_manager','marketing_manager'));

drop policy if exists "published workflows public read" on public.workflows;
create policy "published workflows public read" on public.workflows
  for select using (status = 'published');
drop policy if exists "admin workflows read" on public.workflows;
create policy "admin workflows read" on public.workflows
  for select using (public.current_profile_role() in ('admin','operator','content_manager'));

drop policy if exists "enabled homepage public read" on public.homepage_sections;
create policy "enabled homepage public read" on public.homepage_sections
  for select using (enabled = true);
drop policy if exists "admin homepage read" on public.homepage_sections;
create policy "admin homepage read" on public.homepage_sections
  for select using (public.current_profile_role() in ('admin','operator','content_manager','marketing_manager'));

insert into public.tools (name, slug, category, description, route, workflow_id, status, featured, sort_order)
values
  ('图片编辑器','image-editor','image','图片重绘、局部修复','./zh/app/image-editor/','workflow-hifun-image-editor-v1','published',true,10),
  ('AI 换脸','face-swap','image','授权虚构角色换脸','./zh/app/face-swap/','workflow-hifun-face-swap-v1','published',true,20),
  ('图片转视频','image-to-video','video','将图片生成动态视频','./zh/app/image-to-video/','workflow-hifun-image-to-video-v1','published',true,30)
on conflict (slug) do nothing;

insert into public.workflows (name, tool_id, provider, workflow_id, version, status)
select t.name || ' Workflow', t.id, 'zealman', t.workflow_id, 'v1', 'published'
from public.tools t
where t.workflow_id is not null
on conflict (provider, workflow_id, version) do nothing;
