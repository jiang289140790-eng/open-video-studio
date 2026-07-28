-- Phase 3 fail-closed foundation for one adult single-character reference-remake workflow.
-- No model, LoRA, endpoint, signed URL, or credential is stored by this migration.

alter table public.characters
  add column if not exists display_name text,
  add column if not exists is_adult boolean not null default false,
  add column if not exists declared_age integer,
  add column if not exists base_model_id text,
  add column if not exists lora_id text,
  add column if not exists lora_version text,
  add column if not exists default_lora_weight numeric(5, 3),
  add column if not exists min_lora_weight numeric(5, 3),
  add column if not exists max_lora_weight numeric(5, 3),
  add column if not exists trigger_words text[] not null default '{}',
  add column if not exists reference_asset_ids text[] not null default '{}',
  add column if not exists status text not null default 'draft';

update public.characters
set display_name = coalesce(nullif(display_name, ''), nullif(name, ''), id)
where display_name is null or display_name = '';

alter table public.characters alter column display_name set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'characters_phase3_status_valid'
      and conrelid = 'public.characters'::regclass
  ) then
    alter table public.characters
      add constraint characters_phase3_status_valid
      -- "active" is a preserved legacy consumer-app state. It is intentionally
      -- not accepted by the Phase 3 Gateway, which only routes testing/production.
      check (status in ('draft', 'testing', 'production', 'deprecated', 'disabled', 'active'));
  end if;
  if not exists (
    select 1 from pg_constraint
    where conname = 'characters_phase3_adult_gate'
      and conrelid = 'public.characters'::regclass
  ) then
    alter table public.characters
      add constraint characters_phase3_adult_gate
      check (
        status not in ('testing', 'production')
        or (
          is_adult
          and declared_age >= 18
          and base_model_id is not null
          and lora_id is not null
          and lora_version is not null
          and default_lora_weight between min_lora_weight and max_lora_weight
        )
      );
  end if;
end $$;

create table if not exists public.character_versions (
  id text primary key,
  character_id text not null references public.characters(id) on delete cascade,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  version text not null,
  base_model_id text not null references public.model_registry(id),
  lora_id text not null references public.lora_registry(id),
  lora_version text not null,
  default_lora_weight numeric(5, 3) not null,
  min_lora_weight numeric(5, 3) not null,
  max_lora_weight numeric(5, 3) not null,
  trigger_words text[] not null default '{}',
  status text not null check (status in ('draft', 'testing', 'production', 'deprecated', 'disabled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (character_id, version),
  check (min_lora_weight <= default_lora_weight and default_lora_weight <= max_lora_weight)
);

create table if not exists public.character_reference_assets (
  id text primary key,
  character_id text not null references public.characters(id) on delete cascade,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  asset_id text not null,
  purpose text not null default 'identity_reference'
    check (purpose in ('identity_reference', 'preview', 'benchmark')),
  status text not null default 'testing'
    check (status in ('draft', 'testing', 'production', 'deprecated', 'disabled')),
  created_at timestamptz not null default now(),
  unique (character_id, asset_id, purpose)
);

create table if not exists public.character_lora_bindings (
  id text primary key,
  character_id text not null references public.characters(id) on delete cascade,
  character_version_id text not null references public.character_versions(id) on delete cascade,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  lora_id text not null references public.lora_registry(id),
  lora_version text not null,
  weight numeric(5, 3) not null,
  status text not null default 'testing'
    check (status in ('draft', 'testing', 'production', 'deprecated', 'disabled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (character_version_id, lora_id, lora_version)
);

create table if not exists public.reference_analyses (
  id text primary key,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  reference_asset_id text not null,
  analysis jsonb not null,
  analyzer_version text not null,
  confirmed_analysis jsonb,
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists character_versions_owner_idx
  on public.character_versions(owner_user_id, updated_at desc);
create index if not exists character_reference_assets_owner_idx
  on public.character_reference_assets(owner_user_id, created_at desc);
create index if not exists character_lora_bindings_owner_idx
  on public.character_lora_bindings(owner_user_id, updated_at desc);
create index if not exists reference_analyses_owner_idx
  on public.reference_analyses(owner_user_id, created_at desc);

alter table public.character_versions enable row level security;
alter table public.character_reference_assets enable row level security;
alter table public.character_lora_bindings enable row level security;
alter table public.reference_analyses enable row level security;

drop policy if exists "characters owner read" on public.characters;
drop policy if exists "characters_owner_read" on public.characters;
create policy "characters_owner_read" on public.characters
  for select to authenticated
  using (
    (select auth.uid()) = owner_user_id
    or coalesce((select auth.jwt() -> 'app_metadata' ->> 'role'), '') in ('admin', 'operator')
  );

drop policy if exists "characters owner write" on public.characters;
drop policy if exists "characters_owner_write" on public.characters;

create policy "character_versions_owner_read" on public.character_versions
  for select to authenticated
  using (
    (select auth.uid()) = owner_user_id
    or coalesce((select auth.jwt() -> 'app_metadata' ->> 'role'), '') in ('admin', 'operator')
  );
create policy "character_reference_assets_owner_read" on public.character_reference_assets
  for select to authenticated
  using (
    (select auth.uid()) = owner_user_id
    or coalesce((select auth.jwt() -> 'app_metadata' ->> 'role'), '') in ('admin', 'operator')
  );
create policy "character_lora_bindings_owner_read" on public.character_lora_bindings
  for select to authenticated
  using (
    (select auth.uid()) = owner_user_id
    or coalesce((select auth.jwt() -> 'app_metadata' ->> 'role'), '') in ('admin', 'operator')
  );
create policy "reference_analyses_owner_read" on public.reference_analyses
  for select to authenticated
  using (
    (select auth.uid()) = owner_user_id
    or coalesce((select auth.jwt() -> 'app_metadata' ->> 'role'), '') in ('admin', 'operator')
  );

revoke all privileges on public.characters, public.character_versions,
  public.character_reference_assets, public.character_lora_bindings,
  public.reference_analyses from anon, authenticated;
grant select on public.characters, public.character_versions,
  public.character_reference_assets, public.character_lora_bindings,
  public.reference_analyses to authenticated;
grant all privileges on public.characters, public.character_versions,
  public.character_reference_assets, public.character_lora_bindings,
  public.reference_analyses to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'generation-inputs',
  'generation-inputs',
  false,
  10485760,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "generation_inputs_owner_insert" on storage.objects;
create policy "generation_inputs_owner_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'generation-inputs'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
drop policy if exists "generation_inputs_owner_select" on storage.objects;
create policy "generation_inputs_owner_select" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'generation-inputs'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
drop policy if exists "generation_inputs_owner_delete" on storage.objects;
create policy "generation_inputs_owner_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'generation-inputs'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

alter table public.lora_registry
  add column if not exists filename text,
  add column if not exists storage_path text,
  add column if not exists sha256 text,
  add column if not exists tested_weight_range jsonb not null default '{}'::jsonb,
  add column if not exists license text,
  add column if not exists source text,
  add column if not exists preview_assets text[] not null default '{}',
  add column if not exists benchmark_score numeric(5, 4);

insert into public.model_registry (
  id, name, model_type, base_architecture, version, provider, storage_path,
  status, minimum_vram_gb, recommended_resolution, checksum, license_metadata
) values (
  'persephone-flux-2-q8-v1',
  'Persephone Flux 2.0 Q8 staging binding',
  'diffusion_model',
  'flux',
  '1.0.0',
  'portable',
  'registry://models/persephone-flux-2-q8-v1/1.0.0',
  'testing',
  24,
  '1024x1024 or 768x1024',
  null,
  '{"model_files_committed":false,"download_automatic":false,"license_verification_required":true,"license_status":"pending"}'::jsonb
)
on conflict (id) do update
set name = excluded.name,
    model_type = excluded.model_type,
    base_architecture = excluded.base_architecture,
    version = excluded.version,
    provider = excluded.provider,
    storage_path = excluded.storage_path,
    status = excluded.status,
    minimum_vram_gb = excluded.minimum_vram_gb,
    recommended_resolution = excluded.recommended_resolution,
    license_metadata = excluded.license_metadata,
    updated_at = now();

-- This registry row is intentionally draft and contains no fabricated filename,
-- checksum, source, or license. It keeps the workflow fail-closed until a real
-- reviewed LoRA manifest is supplied.
insert into public.lora_registry (
  id, name, category, base_architecture, version, trigger_words,
  default_weight, min_weight, max_weight, compatible_model_ids, status
) values (
  'phase3-character-lora-v1',
  'Phase 3 character LoRA (manifest pending)',
  'character',
  'flux',
  '1.0.0',
  '{}',
  1.0,
  0.6,
  1.2,
  array['persephone-flux-2-q8-v1'],
  'draft'
)
on conflict (id) do update
set name = excluded.name,
    category = excluded.category,
    base_architecture = excluded.base_architecture,
    compatible_model_ids = excluded.compatible_model_ids,
    status = case when public.lora_registry.sha256 is null then 'draft' else public.lora_registry.status end,
    updated_at = now();

insert into public.workflow_registry (
  id, version, status, manifest, capability, provider_ids,
  model_binding_ids, lora_binding_ids, priority
) values (
  'single-character-reference-remake-v1',
  '1.0.0',
  'testing',
  '{
    "id":"single-character-reference-remake-v1",
    "version":"1.0.0",
    "status":"testing",
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
    "provider_ids":["autodl"],
    "model_binding_ids":["persephone-flux-2-q8-v1"],
    "lora_binding_ids":["phase3-character-lora-v1"],
    "priority":1
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
  array['autodl'],
  array['persephone-flux-2-q8-v1'],
  array['phase3-character-lora-v1'],
  1
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
  'single-character-reference-remake-v1',
  'persephone-flux-2-q8-v1',
  'testing',
  '{
    "workflow_registry_ref":"registry://workflows/single-character-reference-remake-v1/1.0.0",
    "base_architecture":"flux",
    "minimum_vram_gb":24,
    "timeout_ms":600000,
    "max_output_count":4,
    "reference_image":true,
    "character_lora":true,
    "pose_control":true,
    "composition_reference":true,
    "staging_only":true,
    "node_mapping_status":"pending",
    "silent_mock_fallback":false
  }'::jsonb
)
on conflict (workflow_id, model_id) do update
set status = excluded.status,
    constraints_json = excluded.constraints_json;

insert into public.workflow_lora_compatibility (
  workflow_id, lora_id, status, constraints_json
) values (
  'single-character-reference-remake-v1',
  'phase3-character-lora-v1',
  'draft',
  '{"license_required":true,"sha256_required":true,"node_mapping_status":"pending","staging_only":true}'::jsonb
)
on conflict (workflow_id, lora_id) do update
set status = excluded.status,
    constraints_json = excluded.constraints_json;
