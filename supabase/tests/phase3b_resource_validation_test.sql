begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select extensions.plan(18);

select extensions.has_column('public', 'lora_registry', 'file_size_bytes', 'LoRA registry records declared file size');
select extensions.has_column('public', 'lora_registry', 'file_exists', 'LoRA registry records verified file existence');
select extensions.has_column('public', 'lora_registry', 'observed_sha256', 'LoRA registry records observed SHA-256');
select extensions.has_column('public', 'lora_registry', 'observed_size_bytes', 'LoRA registry records observed file size');
select extensions.has_column('public', 'lora_registry', 'validation_status', 'LoRA registry records validation status');
select extensions.has_column('public', 'lora_registry', 'validation_verifier', 'LoRA registry records the verifier');
select extensions.has_column('public', 'lora_registry', 'validation_errors', 'LoRA registry records validation errors');
select extensions.has_column('public', 'lora_registry', 'validated_at', 'LoRA registry records validation time');

select extensions.has_column('public', 'workflow_registry', 'workflow_import_status', 'Workflow registry records import status');
select extensions.has_column('public', 'workflow_registry', 'workflow_json_sha256', 'Workflow registry records Workflow JSON SHA-256');
select extensions.has_column('public', 'workflow_registry', 'node_mapping', 'Workflow registry records node mapping');
select extensions.has_column('public', 'workflow_registry', 'node_mapping_sha256', 'Workflow registry records node mapping SHA-256');
select extensions.has_column('public', 'workflow_registry', 'resource_validation_errors', 'Workflow registry records validation errors');
select extensions.has_column('public', 'workflow_registry', 'resource_validated_at', 'Workflow registry records validation time');

select extensions.ok(
  exists (
    select 1 from pg_constraint
    where conname = 'lora_registry_promotion_requires_resources'
      and conrelid = 'public.lora_registry'::regclass
  ),
  'database enforces the real LoRA promotion gate'
);

select extensions.ok(
  exists (
    select 1 from pg_constraint
    where conname = 'workflow_registry_import_status_check'
      and conrelid = 'public.workflow_registry'::regclass
  ),
  'database enforces Workflow import status values'
);

select extensions.throws_ok(
  $sql$
    update public.lora_registry
       set status = 'testing'
     where id = 'phase3-character-lora-v1'
  $sql$,
  '23514',
  null,
  'a real LoRA cannot enter testing without verified resource evidence'
);

select extensions.is(
  (select status from public.lora_registry where id = 'phase3a-mock-character-lora-v1'),
  'testing',
  'the explicit Phase 3A mock-only fixture remains available for regression'
);

select * from extensions.finish();
rollback;
