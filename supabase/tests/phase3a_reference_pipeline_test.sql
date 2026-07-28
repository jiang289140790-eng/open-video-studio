begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select extensions.plan(17);

insert into auth.users (
  id, email, aud, role, raw_app_meta_data, raw_user_meta_data,
  email_confirmed_at, created_at, updated_at
) values
  ('3a000000-0000-4000-8000-000000000001', 'phase3a-user@example.test', 'authenticated', 'authenticated', '{"role":"user"}', '{}', now(), now(), now()),
  ('3a000000-0000-4000-8000-000000000002', 'phase3a-admin@example.test', 'authenticated', 'authenticated', '{"role":"admin"}', '{}', now(), now(), now());

select extensions.has_table('public', 'workflow_registry_versions', 'workflow registry revisions exist');
select extensions.has_table('public', 'lora_registry_versions', 'LoRA registry revisions exist');
select extensions.ok(
  (select relrowsecurity from pg_class where oid = 'public.workflow_registry_versions'::regclass),
  'workflow registry revisions have RLS'
);
select extensions.ok(
  (select relrowsecurity from pg_class where oid = 'public.lora_registry_versions'::regclass),
  'LoRA registry revisions have RLS'
);
select extensions.is(
  (select provider_ids from public.workflow_registry where id = 'mock-character-reference-remake-v1'),
  array['mock']::text[],
  'Phase 3A reference workflow is mock-only'
);
select extensions.is(
  (select status from public.workflow_registry where id = 'mock-character-reference-remake-v1'),
  'production',
  'Phase 3A mock workflow is routable'
);
select extensions.is(
  (select provider_ids from public.workflow_registry where id = 'single-character-reference-remake-v1'),
  array['autodl']::text[],
  'real Phase 3 workflow remains AutoDL-only'
);
select extensions.ok(
  (
    select filename is null and storage_path is null and sha256 is null
    from public.lora_registry
    where id = 'phase3a-mock-character-lora-v1'
  ),
  'mock LoRA registry row does not pretend to contain a real file'
);
select extensions.is(
  (
    select constraints_json ->> 'mock_only'
    from public.workflow_lora_compatibility
    where workflow_id = 'mock-character-reference-remake-v1'
      and lora_id = 'phase3a-mock-character-lora-v1'
  ),
  'true',
  'mock compatibility is explicitly labelled'
);
select extensions.ok(
  (select count(*) >= 1 from public.workflow_registry_versions where workflow_id = 'mock-character-reference-remake-v1'),
  'initial workflow version is recorded'
);
select extensions.ok(
  (select count(*) >= 1 from public.lora_registry_versions where lora_id = 'phase3a-mock-character-lora-v1'),
  'initial LoRA version is recorded'
);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"3a000000-0000-4000-8000-000000000001","role":"authenticated","app_metadata":{"role":"user"}}', true);
select extensions.is(
  (select count(*)::integer from public.workflow_registry_versions),
  0,
  'ordinary user cannot read workflow revision history'
);
select extensions.is(
  (select count(*)::integer from public.lora_registry_versions),
  0,
  'ordinary user cannot read LoRA revision history'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"3a000000-0000-4000-8000-000000000002","role":"authenticated","app_metadata":{"role":"admin"}}', true);
select extensions.ok(
  (select count(*) >= 1 from public.workflow_registry_versions),
  'admin can read registry revision history'
);
reset role;

select extensions.ok(
  has_table_privilege('authenticated', 'public.media_assets', 'SELECT'),
  'authenticated can select owner-scoped media assets through RLS'
);
select extensions.ok(
  has_table_privilege('authenticated', 'public.media_assets', 'INSERT'),
  'authenticated can insert owner-scoped media assets through RLS'
);
select extensions.ok(
  has_table_privilege('service_role', 'public.media_assets', 'SELECT'),
  'service role can validate reference asset ownership'
);

select * from extensions.finish();
rollback;
