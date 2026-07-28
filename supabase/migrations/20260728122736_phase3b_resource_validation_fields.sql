alter table public.lora_registry
  add column if not exists file_size_bytes bigint,
  add column if not exists file_exists boolean not null default false,
  add column if not exists observed_sha256 text,
  add column if not exists observed_size_bytes bigint,
  add column if not exists validation_status text not null default 'missing',
  add column if not exists validation_verifier text,
  add column if not exists validation_errors text[] not null default '{}',
  add column if not exists validated_at timestamptz;

alter table public.lora_registry
  drop constraint if exists lora_registry_file_size_positive,
  add constraint lora_registry_file_size_positive
    check (file_size_bytes is null or file_size_bytes > 0),
  drop constraint if exists lora_registry_observed_size_positive,
  add constraint lora_registry_observed_size_positive
    check (observed_size_bytes is null or observed_size_bytes > 0),
  drop constraint if exists lora_registry_validation_status_check,
  add constraint lora_registry_validation_status_check
    check (validation_status in ('missing', 'validating', 'invalid', 'ready')),
  drop constraint if exists lora_registry_validation_verifier_check,
  add constraint lora_registry_validation_verifier_check
    check (validation_verifier is null or validation_verifier in ('storage', 'worker')),
  drop constraint if exists lora_registry_observed_sha256_check,
  add constraint lora_registry_observed_sha256_check
    check (observed_sha256 is null or observed_sha256 ~ '^[a-f0-9]{64}$'),
  drop constraint if exists lora_registry_promotion_requires_resources,
  add constraint lora_registry_promotion_requires_resources check (
    status not in ('testing', 'production')
    or (base_architecture = 'mock' and source = 'phase3a-mock-only')
    or (
      filename is not null
      and storage_path ~ '^(registry|storage)://[A-Za-z0-9._/-]+$'
      and sha256 ~ '^[a-f0-9]{64}$'
      and file_size_bytes > 0
      and file_exists
      and observed_sha256 = sha256
      and observed_size_bytes = file_size_bytes
      and cardinality(compatible_model_ids) > 0
      and cardinality(trigger_words) > 0
      and base_architecture <> ''
      and source is not null and source <> ''
      and license is not null and license <> ''
      and min_weight <= default_weight and default_weight <= max_weight
      and validation_status = 'ready'
      and validation_verifier in ('storage', 'worker')
      and validated_at is not null
    )
  );

alter table public.workflow_registry
  add column if not exists workflow_import_status text not null default 'missing',
  add column if not exists workflow_json_sha256 text,
  add column if not exists node_mapping jsonb,
  add column if not exists node_mapping_sha256 text,
  add column if not exists resource_validation_errors text[] not null default '{}',
  add column if not exists resource_validated_at timestamptz;

alter table public.workflow_registry
  drop constraint if exists workflow_registry_import_status_check,
  add constraint workflow_registry_import_status_check
    check (workflow_import_status in ('missing', 'validating', 'invalid', 'ready')),
  drop constraint if exists workflow_registry_json_sha256_check,
  add constraint workflow_registry_json_sha256_check
    check (workflow_json_sha256 is null or workflow_json_sha256 ~ '^[a-f0-9]{64}$'),
  drop constraint if exists workflow_registry_mapping_sha256_check,
  add constraint workflow_registry_mapping_sha256_check
    check (node_mapping_sha256 is null or node_mapping_sha256 ~ '^[a-f0-9]{64}$');

comment on column public.lora_registry.validation_status is
  'Phase 3B resource validation state; ready requires verified file evidence in the Gateway.';
comment on column public.workflow_registry.workflow_import_status is
  'Phase 3B Workflow JSON and node mapping validation state.';
