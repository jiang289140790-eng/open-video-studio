begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(61);

create or replace function pg_temp.try_sql(statement text)
returns text
language plpgsql
as $$
begin
  execute statement;
  return 'ok';
exception when others then
  return sqlstate;
end
$$;

insert into auth.users (
  id, email, aud, role, raw_app_meta_data, raw_user_meta_data,
  email_confirmed_at, created_at, updated_at
) values
  ('10000000-0000-0000-0000-000000000001', 'generation-a@example.test', 'authenticated', 'authenticated', '{"role":"user"}', '{}', now(), now(), now()),
  ('10000000-0000-0000-0000-000000000002', 'generation-b@example.test', 'authenticated', 'authenticated', '{"role":"user"}', '{}', now(), now(), now()),
  ('10000000-0000-0000-0000-000000000003', 'generation-admin@example.test', 'authenticated', 'authenticated', '{"role":"admin"}', '{}', now(), now(), now()),
  ('10000000-0000-0000-0000-000000000004', 'generation-operator@example.test', 'authenticated', 'authenticated', '{"role":"operator"}', '{}', now(), now(), now());

update public.profiles set role = 'admin' where id = '10000000-0000-0000-0000-000000000003';
update public.profiles set role = 'operator' where id = '10000000-0000-0000-0000-000000000004';

insert into public.generation_jobs (
  id, user_id, media_type, status, prompt, provider, model, aspect_ratio,
  cost_credits, safety_status, provider_job_id, final_cost, error_message,
  selected_workflow_id, idempotency_key
) values
  ('rls-job-a', '10000000-0000-0000-0000-000000000001', 'image', 'queued', 'user A image', 'mock', 'model-placeholder-v1', '1:1', 1, 'pending_review', 'provider-a', 0.1, 'internal-a', 'mock-image-single-closeup-v1', 'rls-a'),
  ('rls-job-b', '10000000-0000-0000-0000-000000000002', 'video', 'queued', 'user B video', 'mock', 'model-placeholder-v1', '16:9', 1, 'pending_review', 'provider-b', 0.2, 'internal-b', 'mock-video-text-to-video-v1', 'rls-b');

insert into public.generation_assets (
  id, job_id, user_id, media_type, mime_type, storage_path
) values
  ('rls-asset-a', 'rls-job-a', '10000000-0000-0000-0000-000000000001', 'image', 'image/png', 'mock/a.png'),
  ('rls-asset-b', 'rls-job-b', '10000000-0000-0000-0000-000000000002', 'video', 'video/mp4', 'mock/b.mp4');

insert into public.lora_registry (
  id, name, category, base_architecture, version, status
) values ('rls-lora-draft', 'RLS draft LoRA', 'test', 'provider-neutral', '1.0.0', 'testing');

select has_table('public', 'generation_jobs', 'generation_jobs exists');
select has_table('public', 'generation_assets', 'generation_assets exists');
select has_table('public', 'generation_attempts', 'generation_attempts exists');
select has_table('public', 'generation_events', 'generation_events exists');
select has_table('public', 'generation_billing_events', 'generation_billing_events exists');
select has_table('public', 'workflow_registry', 'workflow_registry exists');
select has_table('public', 'model_registry', 'model_registry exists');
select has_table('public', 'lora_registry', 'lora_registry exists');
select has_table('public', 'prompt_templates', 'prompt_templates exists');
select has_index('public', 'generation_jobs', 'generation_jobs_user_idempotency_idx', 'job idempotency index exists');
select has_index('public', 'generation_events', 'generation_events_idempotency_idx', 'event idempotency index exists');
select has_function('public', 'current_profile_role', array[]::text[], 'role lookup function exists');
select has_trigger('auth', 'users', 'on_auth_user_profile_sync', 'auth profile trigger exists');

set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
select is(pg_temp.try_sql('select count(*) from public.generation_jobs'), '42501', 'anon cannot read generation jobs');
select is(pg_temp.try_sql('select count(*) from public.generation_assets'), '42501', 'anon cannot read generation assets');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-000000000001","role":"authenticated","app_metadata":{"role":"user"}}', true);
select is((select count(*)::integer from public.generation_jobs), 1, 'user A reads own job');
select is((select count(*)::integer from public.generation_jobs where user_id = '10000000-0000-0000-0000-000000000002'), 0, 'user A cannot read user B job');
select is((select count(*)::integer from public.generation_assets), 1, 'user A reads own asset');
select is((select count(*)::integer from public.generation_assets where user_id = '10000000-0000-0000-0000-000000000002'), 0, 'user A cannot read user B asset');
select ok(
  pg_temp.try_sql($sql$update public.generation_jobs set provider_job_id='attacker', final_cost=999, error_message='changed', selected_workflow_id='attacker-route' where id='rls-job-a'$sql$) in ('ok', '42501'),
  'user A sensitive update is rejected or filters to zero rows'
);
reset role;
select is(
  (select provider_job_id || '|' || final_cost::text || '|' || error_message || '|' || selected_workflow_id from public.generation_jobs where id = 'rls-job-a'),
  'provider-a|0.1000|internal-a|mock-image-single-closeup-v1',
  'provider job, final cost, internal error and routing fields remain unchanged'
);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-000000000001","role":"authenticated","app_metadata":{"role":"user"}}', true);
select lives_ok(
  $sql$insert into public.generation_jobs (id,user_id,media_type,status,prompt,provider,model,aspect_ratio,cost_credits,safety_status,idempotency_key)
       values ('rls-job-a-created','10000000-0000-0000-0000-000000000001','image','queued','own insert','mock','model-placeholder-v1','1:1',1,'pending_review','rls-a-created')$sql$,
  'user A can create own job'
);
select throws_ok(
  $sql$insert into public.generation_jobs (id,user_id,media_type,status,prompt,provider,model,aspect_ratio,cost_credits,safety_status,idempotency_key)
       values ('rls-job-cross','10000000-0000-0000-0000-000000000002','image','queued','cross insert','mock','model-placeholder-v1','1:1',1,'pending_review','rls-cross')$sql$,
  '42501', null, 'user A cannot create a job for user B'
);
select ok(pg_temp.try_sql($sql$update public.workflow_registry set priority=999 where id='mock-image-single-closeup-v1'$sql$) in ('ok', '42501'), 'ordinary user workflow mutation is denied or filtered');
reset role;
select isnt((select priority from public.workflow_registry where id='mock-image-single-closeup-v1'), 999, 'workflow registry was not modified');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-000000000001","role":"authenticated","app_metadata":{"role":"user"}}', true);
select ok(pg_temp.try_sql($sql$update public.model_registry set name='attacker' where id='model-placeholder-v1'$sql$) in ('ok', '42501'), 'ordinary user model mutation is denied or filtered');
reset role;
select isnt((select name from public.model_registry where id='model-placeholder-v1'), 'attacker', 'model registry was not modified');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-000000000001","role":"authenticated","app_metadata":{"role":"user"}}', true);
select ok(pg_temp.try_sql($sql$update public.lora_registry set name='attacker' where id='rls-lora-draft'$sql$) in ('ok', '42501'), 'ordinary user LoRA mutation is denied or filtered');
reset role;
select isnt((select name from public.lora_registry where id='rls-lora-draft'), 'attacker', 'LoRA registry was not modified');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-000000000001","role":"authenticated","app_metadata":{"role":"user"}}', true);
select ok(pg_temp.try_sql($sql$update public.prompt_templates set name='attacker' where id='prompt-system-v1'$sql$) in ('ok', '42501'), 'ordinary user prompt mutation is denied or filtered');
reset role;
select isnt((select name from public.prompt_templates where id='prompt-system-v1'), 'attacker', 'prompt registry was not modified');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-000000000002","role":"authenticated","app_metadata":{"role":"user"}}', true);
select is((select count(*)::integer from public.generation_jobs), 1, 'user B reads own job');
select is((select count(*)::integer from public.generation_jobs where user_id = '10000000-0000-0000-0000-000000000001'), 0, 'user B cannot read user A jobs');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-000000000003","role":"authenticated","app_metadata":{"role":"admin"}}', true);
select is((
  select count(*)::integer
  from public.generation_jobs
  where user_id in (
    '10000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000002'
  )
), 3, 'admin reads all test jobs');
select is((select count(*)::integer from public.generation_assets), 2, 'admin reads all assets');
select is((select count(*)::integer from public.provider_configs), 2, 'admin reads Mock and testing RunPod provider configurations');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-000000000004","role":"authenticated","app_metadata":{"role":"operator"}}', true);
select is((
  select count(*)::integer
  from public.generation_jobs
  where user_id in (
    '10000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000002'
  )
), 3, 'operator reads all test jobs');
select is((select count(*)::integer from public.generation_assets), 2, 'operator reads all assets');
select is((select count(*)::integer from public.provider_configs), 2, 'operator reads Mock and testing RunPod provider configurations');
reset role;

set local role service_role;
select lives_ok(
  $sql$update public.generation_jobs set status='completed', provider_job_id='provider-a-final', final_cost=0.25, progress=100 where id='rls-job-a'$sql$,
  'service role updates provider status and result fields'
);
reset role;
select is(
  (select status || '|' || provider_job_id || '|' || final_cost::text || '|' || progress::text from public.generation_jobs where id='rls-job-a'),
  'completed|provider-a-final|0.2500|100',
  'service role provider update persisted'
);

set local role service_role;
select lives_ok(
  $sql$insert into public.generation_assets (id,job_id,user_id,media_type,mime_type,storage_path)
       values ('rls-service-asset','rls-job-a','10000000-0000-0000-0000-000000000001','image','image/png','mock/service.png')$sql$,
  'service role writes generated result asset'
);
reset role;
select is((select count(*)::integer from public.generation_assets where id='rls-service-asset'), 1, 'service role result asset persisted');

set local role service_role;
select lives_ok(
  $sql$insert into public.generation_events (id,job_id,user_id,event_type,idempotency_key)
       values ('event-first','rls-job-a','10000000-0000-0000-0000-000000000001','provider_webhook','webhook-same')$sql$,
  'first webhook event is accepted'
);
select throws_ok(
  $sql$insert into public.generation_events (id,job_id,user_id,event_type,idempotency_key)
       values ('event-duplicate','rls-job-a','10000000-0000-0000-0000-000000000001','provider_webhook','webhook-same')$sql$,
  '23505', null, 'duplicate webhook event is rejected'
);
select lives_ok(
  $sql$insert into public.generation_billing_events (id,user_id,job_id,operation,amount,idempotency_key)
       values ('billing-first','10000000-0000-0000-0000-000000000001','rls-job-a','capture',0.25,'billing-same')$sql$,
  'first billing event is accepted'
);
select throws_ok(
  $sql$insert into public.generation_billing_events (id,user_id,job_id,operation,amount,idempotency_key)
       values ('billing-duplicate','10000000-0000-0000-0000-000000000001','rls-job-a','capture',0.25,'billing-same')$sql$,
  '23505', null, 'duplicate billing event is rejected'
);
select lives_ok(
  $sql$insert into public.generation_jobs (id,user_id,media_type,status,prompt,provider,model,aspect_ratio,cost_credits,safety_status,idempotency_key)
       values ('idem-first','10000000-0000-0000-0000-000000000001','image','queued','idem','mock','model-placeholder-v1','1:1',1,'pending_review','job-idem-same')$sql$,
  'first job idempotency key is accepted'
);
select throws_ok(
  $sql$insert into public.generation_jobs (id,user_id,media_type,status,prompt,provider,model,aspect_ratio,cost_credits,safety_status,idempotency_key)
       values ('idem-duplicate','10000000-0000-0000-0000-000000000001','image','queued','idem','mock','model-placeholder-v1','1:1',1,'pending_review','job-idem-same')$sql$,
  '23505', null, 'duplicate per-user job idempotency key is rejected'
);
select lives_ok(
  $sql$insert into public.generation_attempts
       (id,job_id,user_id,attempt_number,provider,provider_job_id,provider_attempt_id,status,estimated_cost)
       values ('attempt-real-first','rls-job-a','10000000-0000-0000-0000-000000000001',1,'runpod','rp-job-1','rp-attempt-1','submitted',0.01)$sql$,
  'first real provider attempt is accepted'
);
select throws_ok(
  $sql$insert into public.generation_attempts
       (id,job_id,user_id,attempt_number,provider,provider_job_id,provider_attempt_id,status,estimated_cost)
       values ('attempt-real-duplicate','rls-job-b','10000000-0000-0000-0000-000000000002',1,'runpod','rp-job-2','rp-attempt-1','submitted',0.01)$sql$,
  '23505', null, 'duplicate provider attempt is rejected'
);
select lives_ok(
  $sql$insert into public.generation_assets
       (id,job_id,user_id,media_type,storage_bucket,storage_path,mime_type)
       values ('asset-real-first','rls-job-a','10000000-0000-0000-0000-000000000001','image','generation-results','generation-results/10000000-0000-0000-0000-000000000001/rls-job-a/output-0.png','image/png')$sql$,
  'first owner-isolated storage asset is accepted'
);
select throws_ok(
  $sql$insert into public.generation_assets
       (id,job_id,user_id,media_type,storage_bucket,storage_path,mime_type)
       values ('asset-real-duplicate','rls-job-a','10000000-0000-0000-0000-000000000001','image','generation-results','generation-results/10000000-0000-0000-0000-000000000001/rls-job-a/output-0.png','image/png')$sql$,
  '23505', null, 'duplicate job storage asset is rejected'
);
reset role;

select ok(not has_function_privilege('anon', 'public.current_profile_role()', 'EXECUTE'), 'anon cannot execute privileged role helper');
select ok(has_function_privilege('authenticated', 'public.current_profile_role()', 'EXECUTE'), 'authenticated may execute hardened role helper');
select ok((
  select bool_and(c.relrowsecurity)
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname in (
      'generation_jobs', 'generation_assets', 'generation_attempts', 'generation_events',
      'generation_billing_events', 'workflow_registry', 'model_registry', 'lora_registry',
      'prompt_templates', 'prompt_versions', 'provider_configs'
    )
), 'all exposed Generation Engine tables have RLS enabled');
select is(
  (select count(*)::integer from public.provider_configs where id not in ('mock', 'runpod')),
  0,
  'only the approved Mock and RunPod provider records are configured'
);
select is(
  (select status from public.provider_configs where id = 'runpod'),
  'testing',
  'RunPod provider remains testing-only'
);
select ok(
  (select secret_reference = 'RUNPOD_API_KEY' and not (public_config ? 'endpoint_id')
   from public.provider_configs where id = 'runpod'),
  'RunPod configuration stores only an environment reference and no concrete endpoint'
);
select is(
  (select public from storage.buckets where id = 'generation-results'),
  false,
  'real generation result bucket is private'
);
select is(
  (select license_metadata ->> 'contains_model_files' from public.model_registry where id='model-placeholder-v1'),
  'false',
  'model registry contains metadata only and no model files'
);

do $$
declare
  diagnostic text;
begin
  for diagnostic in select * from finish() loop
    if diagnostic like '# Looks like you failed%' then
      raise exception 'pgTAP acceptance failed: %', diagnostic;
    end if;
  end loop;
end
$$;
rollback;
