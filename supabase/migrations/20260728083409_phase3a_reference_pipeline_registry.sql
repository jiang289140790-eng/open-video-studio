-- Phase 3A adds a mock-only reference pipeline and immutable registry revisions.
-- It does not add a GPU endpoint, model file, LoRA file, or Provider interface.

create table if not exists public.workflow_registry_versions (
  id text primary key,
  workflow_id text not null references public.workflow_registry(id) on delete cascade,
  version text not null,
  snapshot jsonb not null,
  changed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.lora_registry_versions (
  id text primary key,
  lora_id text not null references public.lora_registry(id) on delete cascade,
  version text not null,
  snapshot jsonb not null,
  changed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists workflow_registry_versions_lookup_idx
  on public.workflow_registry_versions(workflow_id, created_at desc);
create index if not exists lora_registry_versions_lookup_idx
  on public.lora_registry_versions(lora_id, created_at desc);

alter table public.workflow_registry_versions enable row level security;
alter table public.lora_registry_versions enable row level security;

drop policy if exists "workflow_registry_versions_admin_read" on public.workflow_registry_versions;
create policy "workflow_registry_versions_admin_read"
  on public.workflow_registry_versions for select to authenticated
  using (
    coalesce((select auth.jwt() -> 'app_metadata' ->> 'role'), '') in ('admin', 'operator')
  );

drop policy if exists "lora_registry_versions_admin_read" on public.lora_registry_versions;
create policy "lora_registry_versions_admin_read"
  on public.lora_registry_versions for select to authenticated
  using (
    coalesce((select auth.jwt() -> 'app_metadata' ->> 'role'), '') in ('admin', 'operator')
  );

revoke all privileges on public.workflow_registry_versions,
  public.lora_registry_versions from anon, authenticated;
grant select on public.workflow_registry_versions,
  public.lora_registry_versions to authenticated;
grant all privileges on public.workflow_registry_versions,
  public.lora_registry_versions to service_role;

insert into public.lora_registry (
  id, name, category, base_architecture, version, trigger_words,
  default_weight, min_weight, max_weight, compatible_model_ids, status,
  filename, storage_path, sha256, license, source, preview_assets
) values (
  'phase3a-mock-character-lora-v1',
  'Phase 3A mock character binding',
  'character',
  'mock',
  '1.0.0',
  array['phase3a_mock_character'],
  1.0,
  0.6,
  1.2,
  array['model-placeholder-v1'],
  'testing',
  null,
  null,
  null,
  'not-applicable-mock',
  'phase3a-mock-only',
  array['mock-preview-1', 'mock-preview-2', 'mock-preview-3']
)
on conflict (id) do update
set name = excluded.name,
    category = excluded.category,
    base_architecture = excluded.base_architecture,
    version = excluded.version,
    trigger_words = excluded.trigger_words,
    default_weight = excluded.default_weight,
    min_weight = excluded.min_weight,
    max_weight = excluded.max_weight,
    compatible_model_ids = excluded.compatible_model_ids,
    status = excluded.status,
    filename = null,
    storage_path = null,
    sha256 = null,
    license = excluded.license,
    source = excluded.source,
    preview_assets = excluded.preview_assets,
    updated_at = now();

insert into public.workflow_registry (
  id, version, status, manifest, capability, provider_ids,
  model_binding_ids, lora_binding_ids, priority
) values (
  'mock-character-reference-remake-v1',
  '1.0.0',
  'production',
  '{
    "id":"mock-character-reference-remake-v1",
    "version":"1.0.0",
    "status":"production",
    "capability":{
      "media_types":["image"],
      "creation_modes":["image_to_image"],
      "accepts_reference_image":true,
      "supports_character":true,
      "supports_pose_preservation":true,
      "supports_face_preservation":true,
      "supported_aspect_ratios":["1:1","3:4"],
      "max_output_count":4
    },
    "provider_ids":["mock"],
    "model_binding_ids":["model-placeholder-v1"],
    "lora_binding_ids":["phase3a-mock-character-lora-v1"],
    "priority":0
  }'::jsonb,
  '{
    "media_types":["image"],
    "creation_modes":["image_to_image"],
    "accepts_reference_image":true,
    "supports_character":true,
    "supports_pose_preservation":true,
    "supports_face_preservation":true,
    "supported_aspect_ratios":["1:1","3:4"],
    "max_output_count":4
  }'::jsonb,
  array['mock'],
  array['model-placeholder-v1'],
  array['phase3a-mock-character-lora-v1'],
  0
)
on conflict (id) do update
set version = excluded.version,
    status = excluded.status,
    manifest = excluded.manifest,
    capability = excluded.capability,
    provider_ids = excluded.provider_ids,
    model_binding_ids = excluded.model_binding_ids,
    lora_binding_ids = excluded.lora_binding_ids,
    priority = excluded.priority,
    updated_at = now();

insert into public.workflow_model_compatibility (
  workflow_id, model_id, status, constraints_json
) values (
  'mock-character-reference-remake-v1',
  'model-placeholder-v1',
  'testing',
  '{"mock_only":true,"gpu_required":false,"silent_real_fallback":false}'::jsonb
)
on conflict (workflow_id, model_id) do update
set status = excluded.status,
    constraints_json = excluded.constraints_json;

insert into public.workflow_lora_compatibility (
  workflow_id, lora_id, status, constraints_json
) values (
  'mock-character-reference-remake-v1',
  'phase3a-mock-character-lora-v1',
  'testing',
  '{
    "mock_only":true,
    "compatible_model_ids":["model-placeholder-v1"],
    "tested_weight_range":{"min":0.6,"default":1.0,"max":1.2},
    "real_lora_file_required":false
  }'::jsonb
)
on conflict (workflow_id, lora_id) do update
set status = excluded.status,
    constraints_json = excluded.constraints_json;

insert into public.workflow_registry_versions (
  id, workflow_id, version, snapshot
) values (
  'revision-mock-character-reference-remake-v1-1.0.0',
  'mock-character-reference-remake-v1',
  '1.0.0',
  (select manifest from public.workflow_registry where id = 'mock-character-reference-remake-v1')
)
on conflict (id) do nothing;

insert into public.lora_registry_versions (
  id, lora_id, version, snapshot
) values (
  'revision-phase3a-mock-character-lora-v1-1.0.0',
  'phase3a-mock-character-lora-v1',
  '1.0.0',
  (select to_jsonb(l) from public.lora_registry l where id = 'phase3a-mock-character-lora-v1')
)
on conflict (id) do nothing;
