-- Phase 2: one testing-only real image workflow. No credentials or concrete
-- provider endpoints are stored in the database.

alter table public.generation_attempts
  add column if not exists provider_attempt_id text,
  add column if not exists gpu_type text,
  add column if not exists generation_duration_ms bigint,
  add column if not exists output_count integer,
  add column if not exists cost_per_output numeric(14, 6);

alter table public.generation_assets
  add column if not exists signed_url_expires_at timestamptz,
  add column if not exists checksum_sha256 text;

alter table public.generation_billing_events
  add column if not exists provider_attempt_id text,
  add column if not exists gpu_type text,
  add column if not exists generation_duration_ms bigint,
  add column if not exists output_count integer,
  add column if not exists cost_per_output numeric(14, 6);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'generation_attempts_duration_nonnegative'
      and conrelid = 'public.generation_attempts'::regclass
  ) then
    alter table public.generation_attempts
      add constraint generation_attempts_duration_nonnegative
      check (generation_duration_ms is null or generation_duration_ms >= 0);
  end if;
  if not exists (
    select 1 from pg_constraint
    where conname = 'generation_attempts_output_count_valid'
      and conrelid = 'public.generation_attempts'::regclass
  ) then
    alter table public.generation_attempts
      add constraint generation_attempts_output_count_valid
      check (output_count is null or output_count between 1 and 4);
  end if;
  if not exists (
    select 1 from pg_constraint
    where conname = 'generation_billing_output_count_valid'
      and conrelid = 'public.generation_billing_events'::regclass
  ) then
    alter table public.generation_billing_events
      add constraint generation_billing_output_count_valid
      check (output_count is null or output_count between 1 and 4);
  end if;
end $$;

create unique index if not exists generation_attempts_provider_attempt_idx
  on public.generation_attempts(provider, provider_attempt_id)
  where provider_attempt_id is not null;

create unique index if not exists generation_assets_storage_path_idx
  on public.generation_assets(job_id, storage_path)
  where storage_path is not null;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'generation-results',
  'generation-results',
  false,
  20971520,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

insert into public.provider_configs (
  id, provider_type, display_name, status, capabilities, public_config, secret_reference
) values (
  'runpod',
  'runpod_serverless',
  'RunPod Serverless (Phase 2 image testing)',
  'testing',
  '{"image":true,"video":false,"creation_modes":["text_to_image"],"max_output_count":4}'::jsonb,
  '{
    "endpoint_id_env":"RUNPOD_ENDPOINT_ID",
    "request_timeout_env":"RUNPOD_REQUEST_TIMEOUT_MS",
    "poll_interval_env":"RUNPOD_POLL_INTERVAL_MS",
    "max_poll_duration_env":"RUNPOD_MAX_POLL_DURATION_MS",
    "workflow_allowlist_env":"REAL_PROVIDER_ALLOWLIST"
  }'::jsonb,
  'RUNPOD_API_KEY'
)
on conflict (id) do update
set provider_type = excluded.provider_type,
    display_name = excluded.display_name,
    status = excluded.status,
    capabilities = excluded.capabilities,
    public_config = excluded.public_config,
    secret_reference = excluded.secret_reference,
    updated_at = now();

insert into public.model_registry (
  id, name, model_type, base_architecture, version, provider, storage_path,
  status, minimum_vram_gb, recommended_resolution, checksum, license_metadata
) values (
  'single-person-photorealistic-model-v1',
  'Single-person photorealistic model binding',
  'checkpoint',
  'configuration-defined',
  '1.0.0',
  'runpod',
  'config://RUNPOD_MODEL_MANIFEST_REF',
  'testing',
  24,
  '1024x1024 or 1024x1280',
  null,
  '{
    "model_files_committed":false,
    "download_automatic":false,
    "license_verification_required":true
  }'::jsonb
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
    checksum = excluded.checksum,
    license_metadata = excluded.license_metadata,
    updated_at = now();

insert into public.workflow_registry (
  id, version, status, manifest, capability, provider_ids, model_binding_ids, priority
) values (
  'single-person-text-to-image-v1',
  '1.0.0',
  'testing',
  '{
    "id":"single-person-text-to-image-v1",
    "version":"1.0.0",
    "status":"testing",
    "capability":{
      "media_types":["image"],
      "creation_modes":["text_to_image"],
      "accepts_reference_image":false,
      "supports_character":false,
      "supports_pose_preservation":false,
      "supports_face_preservation":false,
      "supported_aspect_ratios":["1:1","4:5"],
      "max_output_count":4
    },
    "provider_ids":["runpod"],
    "model_binding_ids":["single-person-photorealistic-model-v1"],
    "lora_binding_ids":[],
    "priority":1
  }'::jsonb,
  '{
    "media_types":["image"],
    "creation_modes":["text_to_image"],
    "accepts_reference_image":false,
    "supports_character":false,
    "supports_pose_preservation":false,
    "supports_face_preservation":false,
    "supported_aspect_ratios":["1:1","4:5"],
    "max_output_count":4
  }'::jsonb,
  array['runpod'],
  array['single-person-photorealistic-model-v1'],
  1
)
on conflict (id) do update
set version = excluded.version,
    status = excluded.status,
    manifest = excluded.manifest,
    capability = excluded.capability,
    provider_ids = excluded.provider_ids,
    model_binding_ids = excluded.model_binding_ids,
    priority = excluded.priority,
    updated_at = now();

insert into public.workflow_model_compatibility (
  workflow_id, model_id, status, constraints_json
) values (
  'single-person-text-to-image-v1',
  'single-person-photorealistic-model-v1',
  'testing',
  '{
    "comfyui_workflow_ref_env":"RUNPOD_COMFYUI_WORKFLOW_REF",
    "model_manifest_ref_env":"RUNPOD_MODEL_MANIFEST_REF",
    "minimum_vram_gb":24,
    "timeout_ms":600000,
    "max_output_count":4,
    "reference_image":false,
    "character_lora":false,
    "style_lora":false,
    "controlnet":false,
    "ip_adapter":false
  }'::jsonb
)
on conflict (workflow_id, model_id) do update
set status = excluded.status,
    constraints_json = excluded.constraints_json;

