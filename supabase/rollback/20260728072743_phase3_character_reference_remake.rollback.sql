delete from public.workflow_lora_compatibility
where workflow_id = 'single-character-reference-remake-v1';
delete from public.workflow_model_compatibility
where workflow_id = 'single-character-reference-remake-v1';
delete from public.workflow_registry
where id = 'single-character-reference-remake-v1';
delete from public.lora_registry
where id = 'phase3-character-lora-v1'
  and status = 'draft'
  and sha256 is null;
delete from public.model_registry
where id = 'persephone-flux-2-q8-v1';

drop policy if exists "generation_inputs_owner_delete" on storage.objects;
drop policy if exists "generation_inputs_owner_select" on storage.objects;
drop policy if exists "generation_inputs_owner_insert" on storage.objects;
-- Supabase protects direct deletion from storage schema tables. Keep the empty,
-- private bucket during rollback; platform operators may remove it through the
-- Storage API after confirming that it contains no objects.

drop table if exists public.reference_analyses;
drop table if exists public.character_lora_bindings;
drop table if exists public.character_reference_assets;
drop table if exists public.character_versions;

drop policy if exists "characters_owner_read" on public.characters;
drop policy if exists "characters owner read" on public.characters;
drop policy if exists "characters owner write" on public.characters;
create policy "characters owner read" on public.characters
  for select using (
    auth.uid() = owner_user_id
    or public.current_profile_role() in ('admin', 'operator')
  );
create policy "characters owner write" on public.characters
  for insert with check (auth.uid() = owner_user_id);

alter table public.characters
  drop constraint if exists characters_phase3_adult_gate,
  drop constraint if exists characters_phase3_status_valid,
  drop column if exists display_name,
  drop column if exists is_adult,
  drop column if exists declared_age,
  drop column if exists base_model_id,
  drop column if exists lora_id,
  drop column if exists lora_version,
  drop column if exists default_lora_weight,
  drop column if exists min_lora_weight,
  drop column if exists max_lora_weight,
  drop column if exists trigger_words,
  drop column if exists reference_asset_ids,
  drop column if exists status;

alter table public.lora_registry
  drop column if exists filename,
  drop column if exists storage_path,
  drop column if exists sha256,
  drop column if exists tested_weight_range,
  drop column if exists license,
  drop column if exists source,
  drop column if exists preview_assets,
  drop column if exists benchmark_score;
