alter table public.workflow_registry
  drop column if exists resource_validated_at,
  drop column if exists resource_validation_errors,
  drop column if exists node_mapping_sha256,
  drop column if exists node_mapping,
  drop column if exists workflow_json_sha256,
  drop column if exists workflow_import_status;

alter table public.lora_registry
  drop column if exists validated_at,
  drop column if exists validation_errors,
  drop column if exists validation_verifier,
  drop column if exists validation_status,
  drop column if exists observed_size_bytes,
  drop column if exists observed_sha256,
  drop column if exists file_exists,
  drop column if exists file_size_bytes;
