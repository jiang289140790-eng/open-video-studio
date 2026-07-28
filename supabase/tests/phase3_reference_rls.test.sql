begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select extensions.plan(19);

insert into auth.users (
  id, email, aud, role, raw_app_meta_data, raw_user_meta_data,
  email_confirmed_at, created_at, updated_at
) values
  ('30000000-0000-0000-0000-000000000001', 'phase3-a@example.test', 'authenticated', 'authenticated', '{"role":"user"}', '{}', now(), now(), now()),
  ('30000000-0000-0000-0000-000000000002', 'phase3-b@example.test', 'authenticated', 'authenticated', '{"role":"user"}', '{}', now(), now(), now()),
  ('30000000-0000-0000-0000-000000000003', 'phase3-admin@example.test', 'authenticated', 'authenticated', '{"role":"admin"}', '{}', now(), now(), now());

insert into public.characters (
  id, owner_user_id, name, display_name, status
) values
  ('phase3-char-a', '30000000-0000-0000-0000-000000000001', 'A', 'A', 'draft'),
  ('phase3-char-b', '30000000-0000-0000-0000-000000000002', 'B', 'B', 'draft');

insert into public.reference_analyses (
  id, owner_user_id, reference_asset_id, analysis, analyzer_version
) values
  ('phase3-analysis-a', '30000000-0000-0000-0000-000000000001', 'asset-a', '{"people_count":1}', 'test/1'),
  ('phase3-analysis-b', '30000000-0000-0000-0000-000000000002', 'asset-b', '{"people_count":1}', 'test/1');

select extensions.has_table('public', 'character_versions', 'character_versions exists');
select extensions.has_table('public', 'character_reference_assets', 'character_reference_assets exists');
select extensions.has_table('public', 'character_lora_bindings', 'character_lora_bindings exists');
select extensions.has_table('public', 'reference_analyses', 'reference_analyses exists');
select extensions.ok((select relrowsecurity from pg_class where oid = 'public.character_versions'::regclass), 'character_versions has RLS');
select extensions.ok((select relrowsecurity from pg_class where oid = 'public.reference_analyses'::regclass), 'reference_analyses has RLS');
select extensions.is((select public from storage.buckets where id = 'generation-inputs'), false, 'reference input bucket is private');
select extensions.is(
  (select count(*)::integer from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname like 'generation_inputs_owner_%'),
  3,
  'reference input bucket has owner insert/select/delete policies'
);
select extensions.is((select status from public.lora_registry where id = 'phase3-character-lora-v1'), 'draft', 'LoRA remains draft until real manifest exists');
select extensions.ok(
  (select sha256 is null and license is null and source is null from public.lora_registry where id = 'phase3-character-lora-v1'),
  'missing LoRA facts are not fabricated'
);
select extensions.is((select status from public.workflow_lora_compatibility where workflow_id = 'single-character-reference-remake-v1'), 'draft', 'workflow LoRA binding fails closed');
select extensions.is(
  (select provider_ids from public.workflow_registry where id = 'single-character-reference-remake-v1'),
  array['autodl']::text[],
  'reference workflow is AutoDL-only with no mock fallback'
);

select extensions.throws_ok(
  $sql$insert into public.characters (
    id, owner_user_id, name, display_name, is_adult, declared_age,
    base_model_id, lora_id, lora_version, default_lora_weight,
    min_lora_weight, max_lora_weight, status
  ) values (
    'phase3-underage', '30000000-0000-0000-0000-000000000001', 'Underage', 'Underage',
    false, 17, 'persephone-flux-2-q8-v1', 'phase3-character-lora-v1', '1.0.0',
    1.0, 0.6, 1.2, 'testing'
  )$sql$,
  '23514',
  null,
  'underage or unverified character cannot enter testing'
);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"30000000-0000-0000-0000-000000000001","role":"authenticated","app_metadata":{"role":"user"}}', true);
select extensions.is((select count(*)::integer from public.characters), 1, 'user A reads only own character');
select extensions.is((select count(*)::integer from public.reference_analyses), 1, 'user A reads only own reference analysis');
select extensions.throws_ok(
  $sql$insert into public.characters (id,owner_user_id,name,display_name,status)
       values ('phase3-attacker','30000000-0000-0000-0000-000000000001','x','x','draft')$sql$,
  '42501',
  null,
  'ordinary user cannot create or mutate trusted character metadata'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"30000000-0000-0000-0000-000000000003","role":"authenticated","app_metadata":{"role":"admin"}}', true);
select extensions.is((select count(*)::integer from public.characters), 2, 'admin reads both test characters');
select extensions.is((select count(*)::integer from public.reference_analyses), 2, 'admin reads both reference analyses');
reset role;

set local role service_role;
select extensions.lives_ok(
  $sql$insert into public.characters (
    id, owner_user_id, name, display_name, is_adult, declared_age,
    base_model_id, lora_id, lora_version, default_lora_weight,
    min_lora_weight, max_lora_weight, status
  ) values (
    'phase3-adult', '30000000-0000-0000-0000-000000000001', 'Adult', 'Adult',
    true, 25, 'persephone-flux-2-q8-v1', 'phase3-character-lora-v1', '1.0.0',
    1.0, 0.6, 1.2, 'testing'
  )$sql$,
  'service role may create a verified adult testing character'
);
reset role;

select * from extensions.finish();
rollback;
