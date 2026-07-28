delete from public.workflow_model_compatibility
where workflow_id = 'single-person-text-to-image-v1'
  and model_id = 'single-person-photorealistic-model-v1';

delete from public.workflow_registry where id = 'single-person-text-to-image-v1';
delete from public.model_registry where id = 'single-person-photorealistic-model-v1';
delete from public.provider_configs where id = 'runpod';

-- Supabase protects storage catalog rows from direct SQL deletion. The private,
-- empty bucket is intentionally retained on rollback and may be removed through
-- the Storage API by an operator after confirming it has no objects.

drop index if exists public.generation_assets_storage_path_idx;
drop index if exists public.generation_attempts_provider_attempt_idx;

alter table public.generation_billing_events
  drop constraint if exists generation_billing_output_count_valid,
  drop column if exists cost_per_output,
  drop column if exists output_count,
  drop column if exists generation_duration_ms,
  drop column if exists gpu_type,
  drop column if exists provider_attempt_id;

alter table public.generation_assets
  drop column if exists checksum_sha256,
  drop column if exists signed_url_expires_at;

alter table public.generation_attempts
  drop constraint if exists generation_attempts_output_count_valid,
  drop constraint if exists generation_attempts_duration_nonnegative,
  drop column if exists cost_per_output,
  drop column if exists output_count,
  drop column if exists generation_duration_ms,
  drop column if exists gpu_type,
  drop column if exists provider_attempt_id;
