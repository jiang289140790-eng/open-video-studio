update public.workflow_model_compatibility
set constraints_json = '{
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
where workflow_id = 'single-person-text-to-image-v1'
  and model_id = 'single-person-photorealistic-model-v1';

update public.workflow_registry
set provider_ids = array['runpod'],
    manifest = jsonb_set(manifest, '{provider_ids}', '["runpod"]'::jsonb, true),
    updated_at = now()
where id = 'single-person-text-to-image-v1';

update public.model_registry
set base_architecture = 'configuration-defined',
    provider = 'runpod',
    storage_path = 'config://RUNPOD_MODEL_MANIFEST_REF',
    minimum_vram_gb = 24,
    license_metadata = '{
      "model_files_committed":false,
      "download_automatic":false,
      "license_verification_required":true
    }'::jsonb,
    updated_at = now()
where id = 'single-person-photorealistic-model-v1';

update public.provider_configs
set status = 'testing',
    updated_at = now()
where id = 'runpod';

delete from public.provider_configs where id = 'autodl';

