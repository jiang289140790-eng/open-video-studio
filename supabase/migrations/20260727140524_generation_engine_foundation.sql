-- Additive Generation Engine foundation.
-- This migration intentionally preserves all existing generation_jobs columns and rows.

alter table public.generation_jobs
  add column if not exists creation_mode text,
  add column if not exists original_prompt text,
  add column if not exists parsed_brief jsonb,
  add column if not exists generation_plan jsonb,
  add column if not exists selected_workflow_id text,
  add column if not exists selected_model_id text,
  add column if not exists selected_lora_ids jsonb not null default '[]'::jsonb,
  add column if not exists provider_job_id text,
  add column if not exists output_count integer not null default 1,
  add column if not exists estimated_cost numeric(14, 4) not null default 0,
  add column if not exists final_cost numeric(14, 4),
  add column if not exists idempotency_key text,
  add column if not exists retry_of_job_id text references public.generation_jobs(id) on delete set null,
  add column if not exists attempt_count integer not null default 0,
  add column if not exists started_at timestamptz,
  add column if not exists cancelled_at timestamptz;
create unique index if not exists generation_jobs_user_idempotency_idx
  on public.generation_jobs(user_id, idempotency_key)
  where idempotency_key is not null;
create unique index if not exists generation_jobs_provider_job_idx
  on public.generation_jobs(provider, provider_job_id)
  where provider_job_id is not null;
create index if not exists generation_jobs_workflow_idx
  on public.generation_jobs(selected_workflow_id, created_at desc);
create table if not exists public.workflow_registry (
  id text primary key,
  version text not null,
  status text not null check (status in ('draft', 'testing', 'production', 'deprecated', 'disabled')),
  manifest jsonb not null,
  capability jsonb not null,
  provider_ids text[] not null default '{}',
  model_binding_ids text[] not null default '{}',
  lora_binding_ids text[] not null default '{}',
  priority integer not null default 100,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, version)
);
create table if not exists public.model_registry (
  id text primary key,
  name text not null,
  model_type text not null,
  base_architecture text not null,
  version text not null,
  provider text not null,
  storage_path text,
  status text not null check (status in ('draft', 'testing', 'production', 'deprecated', 'disabled')),
  minimum_vram_gb numeric(6, 2),
  recommended_resolution text,
  checksum text,
  license_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.lora_registry (
  id text primary key,
  name text not null,
  category text not null,
  base_architecture text not null,
  version text not null,
  trigger_words text[] not null default '{}',
  default_weight numeric(5, 3) not null default 1,
  min_weight numeric(5, 3) not null default 0,
  max_weight numeric(5, 3) not null default 2,
  compatible_model_ids text[] not null default '{}',
  status text not null check (status in ('draft', 'testing', 'production', 'deprecated', 'disabled')),
  preview_asset_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (min_weight <= default_weight and default_weight <= max_weight)
);
create table if not exists public.workflow_model_compatibility (
  workflow_id text not null references public.workflow_registry(id) on delete cascade,
  model_id text not null references public.model_registry(id) on delete cascade,
  status text not null default 'testing' check (status in ('draft', 'testing', 'production', 'deprecated', 'disabled')),
  constraints_json jsonb not null default '{}'::jsonb,
  primary key (workflow_id, model_id)
);
create table if not exists public.workflow_lora_compatibility (
  workflow_id text not null references public.workflow_registry(id) on delete cascade,
  lora_id text not null references public.lora_registry(id) on delete cascade,
  status text not null default 'testing' check (status in ('draft', 'testing', 'production', 'deprecated', 'disabled')),
  constraints_json jsonb not null default '{}'::jsonb,
  primary key (workflow_id, lora_id)
);
create table if not exists public.provider_configs (
  id text primary key,
  provider_type text not null,
  display_name text not null,
  status text not null check (status in ('draft', 'testing', 'production', 'deprecated', 'disabled')),
  capabilities jsonb not null default '{}'::jsonb,
  public_config jsonb not null default '{}'::jsonb,
  secret_reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.prompt_templates (
  id text primary key,
  template_type text not null,
  name text not null,
  status text not null check (status in ('draft', 'testing', 'production', 'deprecated', 'disabled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.prompt_versions (
  id text primary key,
  template_id text not null references public.prompt_templates(id) on delete cascade,
  version text not null,
  content text not null,
  variables jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  unique (template_id, version)
);
create table if not exists public.generation_presets (
  id text primary key,
  name text not null,
  media_type text not null check (media_type in ('image', 'video')),
  creation_mode text not null check (creation_mode in ('text_to_image', 'image_to_image', 'text_to_video', 'image_to_video', 'image_edit', 'effect_preset')),
  public_options jsonb not null default '{}'::jsonb,
  status text not null check (status in ('draft', 'testing', 'production', 'deprecated', 'disabled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.generation_attempts (
  id text primary key,
  job_id text not null references public.generation_jobs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  attempt_number integer not null check (attempt_number > 0),
  provider text not null,
  provider_job_id text,
  status text not null,
  estimated_cost numeric(14, 4) not null default 0,
  final_cost numeric(14, 4),
  error_code text,
  error_message text,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (job_id, attempt_number),
  unique (provider, provider_job_id)
);
create table if not exists public.generation_assets (
  id text primary key,
  job_id text not null references public.generation_jobs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  media_type text not null check (media_type in ('image', 'video')),
  storage_bucket text,
  storage_path text,
  public_url text,
  preview_url text,
  mime_type text not null,
  width integer,
  height integer,
  duration_seconds numeric(8, 3),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (job_id, id)
);
create table if not exists public.generation_events (
  id text primary key,
  job_id text not null references public.generation_jobs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  from_status text,
  to_status text,
  payload jsonb not null default '{}'::jsonb,
  idempotency_key text,
  created_at timestamptz not null default now()
);
create unique index if not exists generation_events_idempotency_idx
  on public.generation_events(idempotency_key)
  where idempotency_key is not null;
create index if not exists generation_events_job_time_idx
  on public.generation_events(job_id, created_at);
create table if not exists public.generation_reviews (
  id text primary key,
  job_id text not null references public.generation_jobs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null check (status in ('approved', 'rejected', 'needs_review')),
  score numeric(5, 4) not null check (score between 0 and 1),
  checks jsonb not null default '{}'::jsonb,
  notes jsonb not null default '[]'::jsonb,
  reviewer_type text not null default 'mock',
  created_at timestamptz not null default now()
);
create table if not exists public.generation_billing_events (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  job_id text not null references public.generation_jobs(id) on delete cascade,
  operation text not null check (operation in ('estimate', 'reserve', 'capture', 'release', 'refund')),
  amount numeric(14, 4) not null check (amount >= 0),
  provider text not null default 'mock',
  idempotency_key text not null unique,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.workflow_registry enable row level security;
alter table public.model_registry enable row level security;
alter table public.lora_registry enable row level security;
alter table public.workflow_model_compatibility enable row level security;
alter table public.workflow_lora_compatibility enable row level security;
alter table public.provider_configs enable row level security;
alter table public.prompt_templates enable row level security;
alter table public.prompt_versions enable row level security;
alter table public.generation_presets enable row level security;
alter table public.generation_attempts enable row level security;
alter table public.generation_assets enable row level security;
alter table public.generation_events enable row level security;
alter table public.generation_reviews enable row level security;
alter table public.generation_billing_events enable row level security;
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'generation_attempts', 'generation_assets', 'generation_events',
    'generation_reviews', 'generation_billing_events'
  ] loop
    execute format('drop policy if exists %I on public.%I', table_name || '_owner_read', table_name);
    execute format(
      'create policy %I on public.%I for select to authenticated using ((select auth.uid()) = user_id or coalesce((select auth.jwt() -> ''app_metadata'' ->> ''role''), '''') in (''admin'', ''operator''))',
      table_name || '_owner_read',
      table_name
    );
  end loop;
end $$;
drop policy if exists "workflow_registry_read" on public.workflow_registry;
create policy "workflow_registry_read" on public.workflow_registry for select to authenticated
  using (status = 'production' or coalesce((select auth.jwt() -> 'app_metadata' ->> 'role'), '') in ('admin', 'operator'));
drop policy if exists "model_registry_read" on public.model_registry;
create policy "model_registry_read" on public.model_registry for select to authenticated
  using (status = 'production' or coalesce((select auth.jwt() -> 'app_metadata' ->> 'role'), '') in ('admin', 'operator'));
drop policy if exists "lora_registry_read" on public.lora_registry;
create policy "lora_registry_read" on public.lora_registry for select to authenticated
  using (status = 'production' or coalesce((select auth.jwt() -> 'app_metadata' ->> 'role'), '') in ('admin', 'operator'));
drop policy if exists "generation_presets_read" on public.generation_presets;
create policy "generation_presets_read" on public.generation_presets for select to authenticated
  using (status = 'production' or coalesce((select auth.jwt() -> 'app_metadata' ->> 'role'), '') in ('admin', 'operator'));
drop policy if exists "workflow_model_compatibility_read" on public.workflow_model_compatibility;
create policy "workflow_model_compatibility_read" on public.workflow_model_compatibility for select to authenticated using (true);
drop policy if exists "workflow_lora_compatibility_read" on public.workflow_lora_compatibility;
create policy "workflow_lora_compatibility_read" on public.workflow_lora_compatibility for select to authenticated using (true);
drop policy if exists "prompt_templates_read" on public.prompt_templates;
create policy "prompt_templates_read" on public.prompt_templates for select to authenticated
  using (status = 'production' or coalesce((select auth.jwt() -> 'app_metadata' ->> 'role'), '') in ('admin', 'operator'));
drop policy if exists "prompt_versions_read" on public.prompt_versions;
create policy "prompt_versions_read" on public.prompt_versions for select to authenticated
  using (exists (select 1 from public.prompt_templates t where t.id = template_id and t.status = 'production'));
drop policy if exists "provider_configs_admin_read" on public.provider_configs;
create policy "provider_configs_admin_read" on public.provider_configs for select to authenticated
  using (coalesce((select auth.jwt() -> 'app_metadata' ->> 'role'), '') in ('admin', 'operator'));
grant select on public.workflow_registry, public.model_registry, public.lora_registry,
  public.workflow_model_compatibility, public.workflow_lora_compatibility,
  public.prompt_templates, public.prompt_versions, public.generation_presets,
  public.provider_configs
  to authenticated;
grant select on public.generation_attempts, public.generation_assets, public.generation_events,
  public.generation_reviews, public.generation_billing_events to authenticated;
grant select, insert on public.generation_jobs to authenticated;
grant all privileges on public.generation_jobs, public.generation_attempts, public.generation_assets,
  public.generation_events, public.generation_reviews, public.generation_billing_events,
  public.workflow_registry, public.model_registry, public.lora_registry,
  public.workflow_model_compatibility, public.workflow_lora_compatibility,
  public.provider_configs, public.prompt_templates, public.prompt_versions,
  public.generation_presets to service_role;
-- Harden the pre-existing exposed SECURITY DEFINER helper without changing its behavior.
revoke all on function public.current_profile_role() from public;
grant execute on function public.current_profile_role() to authenticated, service_role;
insert into public.provider_configs (id, provider_type, display_name, status, capabilities, public_config)
values ('mock', 'mock', 'Mock Provider', 'production', '{"image": true, "video": true}', '{"phase": 1}')
on conflict (id) do nothing;
insert into public.model_registry (
  id, name, model_type, base_architecture, version, provider, status, license_metadata
) values (
  'model-placeholder-v1', 'Phase 1 model placeholder', 'placeholder', 'provider-neutral',
  '1.0.0', 'mock', 'testing', '{"placeholder": true, "contains_model_files": false}'
) on conflict (id) do nothing;
insert into public.workflow_registry (id, version, status, manifest, capability, provider_ids, model_binding_ids, priority)
values
  (
    'mock-image-single-closeup-v1', '1.0.0', 'production',
    '{"id":"mock-image-single-closeup-v1","version":"1.0.0","status":"production","capability":{"media_types":["image"],"creation_modes":["text_to_image","image_to_image"],"accepts_reference_image":true,"supports_character":true,"supports_pose_preservation":false,"supports_face_preservation":true,"supported_aspect_ratios":["1:1","4:5","3:4","16:9","9:16","21:9"],"max_output_count":4},"provider_ids":["mock"],"model_binding_ids":["model-placeholder-v1"],"lora_binding_ids":[],"priority":10}',
    '{"media_types":["image"],"creation_modes":["text_to_image","image_to_image"],"accepts_reference_image":true,"supports_character":true,"supports_pose_preservation":false,"supports_face_preservation":true,"supported_aspect_ratios":["1:1","4:5","3:4","16:9","9:16","21:9"],"max_output_count":4}',
    array['mock'], array['model-placeholder-v1'], 10
  ),
  (
    'mock-image-single-fullbody-v1', '1.0.0', 'production',
    '{"id":"mock-image-single-fullbody-v1","version":"1.0.0","status":"production","capability":{"media_types":["image"],"creation_modes":["text_to_image","image_to_image"],"accepts_reference_image":true,"supports_character":true,"supports_pose_preservation":false,"supports_face_preservation":true,"supported_aspect_ratios":["1:1","4:5","3:4","16:9","9:16","21:9"],"max_output_count":4},"provider_ids":["mock"],"model_binding_ids":["model-placeholder-v1"],"lora_binding_ids":[],"priority":20}',
    '{"media_types":["image"],"creation_modes":["text_to_image","image_to_image"],"accepts_reference_image":true,"supports_character":true,"supports_pose_preservation":false,"supports_face_preservation":true,"supported_aspect_ratios":["1:1","4:5","3:4","16:9","9:16","21:9"],"max_output_count":4}',
    array['mock'], array['model-placeholder-v1'], 20
  ),
  (
    'mock-image-reference-pose-v1', '1.0.0', 'production',
    '{"id":"mock-image-reference-pose-v1","version":"1.0.0","status":"production","capability":{"media_types":["image"],"creation_modes":["image_to_image"],"accepts_reference_image":true,"supports_character":true,"supports_pose_preservation":true,"supports_face_preservation":true,"supported_aspect_ratios":["1:1","4:5","3:4","16:9","9:16","21:9"],"max_output_count":4},"provider_ids":["mock"],"model_binding_ids":["model-placeholder-v1"],"lora_binding_ids":[],"priority":5}',
    '{"media_types":["image"],"creation_modes":["image_to_image"],"accepts_reference_image":true,"supports_character":true,"supports_pose_preservation":true,"supports_face_preservation":true,"supported_aspect_ratios":["1:1","4:5","3:4","16:9","9:16","21:9"],"max_output_count":4}',
    array['mock'], array['model-placeholder-v1'], 5
  ),
  (
    'mock-image-edit-v1', '1.0.0', 'production',
    '{"id":"mock-image-edit-v1","version":"1.0.0","status":"production","capability":{"media_types":["image"],"creation_modes":["image_edit"],"accepts_reference_image":true,"supports_character":true,"supports_pose_preservation":false,"supports_face_preservation":true,"supported_aspect_ratios":["1:1","4:5","3:4","16:9","9:16","21:9"],"max_output_count":4},"provider_ids":["mock"],"model_binding_ids":["model-placeholder-v1"],"lora_binding_ids":[],"priority":5}',
    '{"media_types":["image"],"creation_modes":["image_edit"],"accepts_reference_image":true,"supports_character":true,"supports_pose_preservation":false,"supports_face_preservation":true,"supported_aspect_ratios":["1:1","4:5","3:4","16:9","9:16","21:9"],"max_output_count":4}',
    array['mock'], array['model-placeholder-v1'], 5
  ),
  (
    'mock-video-text-to-video-v1', '1.0.0', 'production',
    '{"id":"mock-video-text-to-video-v1","version":"1.0.0","status":"production","capability":{"media_types":["video"],"creation_modes":["text_to_video"],"accepts_reference_image":false,"supports_character":true,"supports_pose_preservation":false,"supports_face_preservation":true,"supported_aspect_ratios":["1:1","4:5","3:4","16:9","9:16","21:9"],"max_duration_seconds":60,"max_output_count":4},"provider_ids":["mock"],"model_binding_ids":["model-placeholder-v1"],"lora_binding_ids":[],"priority":10}',
    '{"media_types":["video"],"creation_modes":["text_to_video"],"accepts_reference_image":false,"supports_character":true,"supports_pose_preservation":false,"supports_face_preservation":true,"supported_aspect_ratios":["1:1","4:5","3:4","16:9","9:16","21:9"],"max_duration_seconds":60,"max_output_count":4}',
    array['mock'], array['model-placeholder-v1'], 10
  ),
  (
    'mock-video-image-to-video-v1', '1.0.0', 'production',
    '{"id":"mock-video-image-to-video-v1","version":"1.0.0","status":"production","capability":{"media_types":["video"],"creation_modes":["image_to_video"],"accepts_reference_image":true,"supports_character":true,"supports_pose_preservation":false,"supports_face_preservation":true,"supported_aspect_ratios":["1:1","4:5","3:4","16:9","9:16","21:9"],"max_duration_seconds":60,"max_output_count":4},"provider_ids":["mock"],"model_binding_ids":["model-placeholder-v1"],"lora_binding_ids":[],"priority":5}',
    '{"media_types":["video"],"creation_modes":["image_to_video"],"accepts_reference_image":true,"supports_character":true,"supports_pose_preservation":false,"supports_face_preservation":true,"supported_aspect_ratios":["1:1","4:5","3:4","16:9","9:16","21:9"],"max_duration_seconds":60,"max_output_count":4}',
    array['mock'], array['model-placeholder-v1'], 5
  ),
  (
    'mock-effect-preset-v1', '1.0.0', 'production',
    '{"id":"mock-effect-preset-v1","version":"1.0.0","status":"production","capability":{"media_types":["image","video"],"creation_modes":["effect_preset"],"accepts_reference_image":true,"supports_character":true,"supports_pose_preservation":false,"supports_face_preservation":true,"supported_aspect_ratios":["1:1","4:5","3:4","16:9","9:16","21:9"],"max_duration_seconds":60,"max_output_count":4},"provider_ids":["mock"],"model_binding_ids":["model-placeholder-v1"],"lora_binding_ids":[],"priority":5}',
    '{"media_types":["image","video"],"creation_modes":["effect_preset"],"accepts_reference_image":true,"supports_character":true,"supports_pose_preservation":false,"supports_face_preservation":true,"supported_aspect_ratios":["1:1","4:5","3:4","16:9","9:16","21:9"],"max_duration_seconds":60,"max_output_count":4}',
    array['mock'], array['model-placeholder-v1'], 5
  )
on conflict (id) do nothing;
insert into public.workflow_model_compatibility (workflow_id, model_id, status)
select id, 'model-placeholder-v1', 'testing' from public.workflow_registry
where id like 'mock-%'
on conflict (workflow_id, model_id) do nothing;
insert into public.prompt_templates (id, template_type, name, status)
values
  ('prompt-system-v1', 'system', 'Generation system template', 'production'),
  ('prompt-character-v1', 'character', 'Character template', 'production'),
  ('prompt-scene-v1', 'scene', 'Scene template', 'production'),
  ('prompt-pose-v1', 'pose', 'Pose template', 'production'),
  ('prompt-outfit-v1', 'outfit', 'Outfit template', 'production'),
  ('prompt-expression-v1', 'expression', 'Expression template', 'production'),
  ('prompt-camera-v1', 'camera', 'Camera template', 'production'),
  ('prompt-lighting-v1', 'lighting', 'Lighting template', 'production'),
  ('prompt-style-v1', 'style', 'Style template', 'production'),
  ('prompt-platform-v1', 'platform_adapter', 'Platform adapter', 'production'),
  ('prompt-model-v1', 'model_adapter', 'Mock model adapter', 'production'),
  ('prompt-negative-v1', 'negative', 'Negative prompt template', 'production')
on conflict (id) do nothing;
insert into public.prompt_versions (id, template_id, version, content, variables)
select id || '-1.0.0', id, '1.0.0', '{{value}}', '["value"]'::jsonb
from public.prompt_templates
where id like 'prompt-%-v1'
on conflict (template_id, version) do nothing;
insert into public.generation_presets (id, name, media_type, creation_mode, public_options, status)
values
  ('mock-image-square', 'Mock square image', 'image', 'text_to_image', '{"aspect_ratio":"1:1","output_count":1}', 'production'),
  ('mock-video-vertical', 'Mock vertical video', 'video', 'text_to_video', '{"aspect_ratio":"9:16","duration_seconds":6}', 'production'),
  ('mock-effect', 'Mock effect preset', 'image', 'effect_preset', '{"aspect_ratio":"1:1"}', 'production')
on conflict (id) do nothing;
