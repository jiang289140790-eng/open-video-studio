insert into public.provider_configs (
  id, provider_type, display_name, status, capabilities, public_config, secret_reference
) values (
  'autodl',
  'autodl_staging_worker',
  'AutoDL temporary GPU staging worker',
  'testing',
  '{"image":true,"video":false,"creation_modes":["text_to_image"],"max_output_count":4,"staging_only":true}'::jsonb,
  '{
    "base_url_env":"AUTODL_BASE_URL",
    "health_path_env":"AUTODL_HEALTH_PATH",
    "request_timeout_env":"AUTODL_REQUEST_TIMEOUT_MS",
    "poll_interval_env":"AUTODL_POLL_INTERVAL_MS",
    "max_poll_duration_env":"AUTODL_MAX_POLL_DURATION_MS",
    "enabled_env":"AUTODL_PROVIDER_ENABLED",
    "workflow_allowlist_env":"REAL_PROVIDER_ALLOWLIST"
  }'::jsonb,
  'AUTODL_API_TOKEN'
)
on conflict (id) do update
set provider_type = excluded.provider_type,
    display_name = excluded.display_name,
    status = excluded.status,
    capabilities = excluded.capabilities,
    public_config = excluded.public_config,
    secret_reference = excluded.secret_reference,
    updated_at = now();

update public.provider_configs
set status = 'disabled',
    updated_at = now()
where id = 'runpod';

update public.model_registry
set base_architecture = 'SDXL',
    provider = 'portable',
    storage_path = 'registry://models/single-person-photorealistic-model-v1/1.0.0',
    minimum_vram_gb = 16,
    license_metadata = jsonb_build_object(
      'model_files_committed', false,
      'download_automatic', false,
      'license_verification_required', true,
      'staging_checkpoint', 'juggernautXL_v8Rundiffusion_V8.safetensors',
      'temporary_provider', 'autodl'
    ),
    updated_at = now()
where id = 'single-person-photorealistic-model-v1';

update public.workflow_registry
set provider_ids = array['autodl', 'runpod'],
    manifest = jsonb_set(
      manifest,
      '{provider_ids}',
      '["autodl","runpod"]'::jsonb,
      true
    ),
    updated_at = now()
where id = 'single-person-text-to-image-v1';

update public.workflow_model_compatibility
set constraints_json = '{
      "comfyui_workflow_ref":"registry://workflows/single-person-text-to-image-v1/1.0.0",
      "model_manifest_ref":"registry://models/single-person-photorealistic-model-v1/1.0.0",
      "base_architecture":"SDXL",
      "minimum_vram_gb":16,
      "timeout_ms":600000,
      "max_output_count":4,
      "reference_image":false,
      "character_lora":false,
      "style_lora":false,
      "controlnet":false,
      "ip_adapter":false,
      "temporary_provider":"autodl",
      "future_provider_compatible":true
    }'::jsonb
where workflow_id = 'single-person-text-to-image-v1'
  and model_id = 'single-person-photorealistic-model-v1';
