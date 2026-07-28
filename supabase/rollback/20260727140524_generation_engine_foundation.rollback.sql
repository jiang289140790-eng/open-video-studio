-- Manual rollback for 20260727140524_generation_engine_foundation.sql.
-- Review backups and stop the Generation Gateway before running.

drop table if exists public.generation_billing_events;
drop table if exists public.generation_reviews;
drop table if exists public.generation_events;
drop table if exists public.generation_assets;
drop table if exists public.generation_attempts;
drop table if exists public.generation_presets;
drop table if exists public.prompt_versions;
drop table if exists public.prompt_templates;
drop table if exists public.provider_configs;
drop table if exists public.workflow_lora_compatibility;
drop table if exists public.workflow_model_compatibility;
drop table if exists public.lora_registry;
drop table if exists public.model_registry;
drop table if exists public.workflow_registry;

drop index if exists public.generation_jobs_user_idempotency_idx;
drop index if exists public.generation_jobs_provider_job_idx;
drop index if exists public.generation_jobs_workflow_idx;

alter table public.generation_jobs
  drop column if exists creation_mode,
  drop column if exists original_prompt,
  drop column if exists parsed_brief,
  drop column if exists generation_plan,
  drop column if exists selected_workflow_id,
  drop column if exists selected_model_id,
  drop column if exists selected_lora_ids,
  drop column if exists provider_job_id,
  drop column if exists output_count,
  drop column if exists estimated_cost,
  drop column if exists final_cost,
  drop column if exists idempotency_key,
  drop column if exists retry_of_job_id,
  drop column if exists attempt_count,
  drop column if exists started_at,
  drop column if exists cancelled_at;

grant execute on function public.current_profile_role() to public;
