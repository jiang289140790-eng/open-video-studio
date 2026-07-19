create table if not exists public.agent_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  agent_id text not null,
  task_type text not null check (task_type in ('content', 'prompt', 'workflow', 'automation', 'analysis', 'publishing', 'other')),
  title text not null,
  description text not null default '',
  status text not null default 'pending' check (status in ('pending', 'running', 'completed', 'failed')),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  payload jsonb not null default '{}'::jsonb,
  result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists agent_tasks_user_created_idx on public.agent_tasks(user_id, created_at desc);
create index if not exists agent_tasks_user_status_idx on public.agent_tasks(user_id, status);
create index if not exists agent_tasks_agent_idx on public.agent_tasks(agent_id);

alter table public.agent_tasks enable row level security;

drop policy if exists "agent_tasks_select_own" on public.agent_tasks;
create policy "agent_tasks_select_own" on public.agent_tasks for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "agent_tasks_insert_own" on public.agent_tasks;
create policy "agent_tasks_insert_own" on public.agent_tasks for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "agent_tasks_update_own" on public.agent_tasks;
create policy "agent_tasks_update_own" on public.agent_tasks for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

grant select, insert, update on public.agent_tasks to authenticated;
