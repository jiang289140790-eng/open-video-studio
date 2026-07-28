-- Remove broad grants left by the original remote project bootstrap.
-- RLS remains the row-level boundary, while these grants enforce least privilege.
revoke all privileges on
  public.generation_jobs,
  public.generation_attempts,
  public.generation_assets,
  public.generation_events,
  public.generation_reviews,
  public.generation_billing_events,
  public.workflow_registry,
  public.model_registry,
  public.lora_registry,
  public.workflow_model_compatibility,
  public.workflow_lora_compatibility,
  public.provider_configs,
  public.prompt_templates,
  public.prompt_versions,
  public.generation_presets
from anon, authenticated;

grant select, insert on public.generation_jobs to authenticated;
grant select on
  public.generation_attempts,
  public.generation_assets,
  public.generation_events,
  public.generation_reviews,
  public.generation_billing_events,
  public.workflow_registry,
  public.model_registry,
  public.lora_registry,
  public.workflow_model_compatibility,
  public.workflow_lora_compatibility,
  public.provider_configs,
  public.prompt_templates,
  public.prompt_versions,
  public.generation_presets
to authenticated;

grant all privileges on
  public.generation_jobs,
  public.generation_attempts,
  public.generation_assets,
  public.generation_events,
  public.generation_reviews,
  public.generation_billing_events,
  public.workflow_registry,
  public.model_registry,
  public.lora_registry,
  public.workflow_model_compatibility,
  public.workflow_lora_compatibility,
  public.provider_configs,
  public.prompt_templates,
  public.prompt_versions,
  public.generation_presets
to service_role;

revoke all on function public.current_profile_role() from public, anon;
grant execute on function public.current_profile_role() to authenticated, service_role;
