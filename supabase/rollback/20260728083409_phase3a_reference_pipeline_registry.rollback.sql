delete from public.workflow_lora_compatibility
where workflow_id = 'mock-character-reference-remake-v1'
  and lora_id = 'phase3a-mock-character-lora-v1';

delete from public.workflow_model_compatibility
where workflow_id = 'mock-character-reference-remake-v1'
  and model_id = 'model-placeholder-v1';

delete from public.workflow_registry
where id = 'mock-character-reference-remake-v1';

delete from public.lora_registry
where id = 'phase3a-mock-character-lora-v1';

drop table if exists public.lora_registry_versions;
drop table if exists public.workflow_registry_versions;
