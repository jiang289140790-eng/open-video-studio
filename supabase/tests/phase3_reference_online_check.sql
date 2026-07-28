do $phase3$
declare
  user_a constant uuid := '31000000-0000-0000-0000-000000000001';
  user_b constant uuid := '31000000-0000-0000-0000-000000000002';
  admin_user constant uuid := '31000000-0000-0000-0000-000000000003';
  visible_count integer;
begin
  delete from auth.users where id in (user_a, user_b, admin_user);
  insert into auth.users (
    id, email, aud, role, raw_app_meta_data, raw_user_meta_data,
    email_confirmed_at, created_at, updated_at
  ) values
    (user_a, 'phase3-online-a@example.test', 'authenticated', 'authenticated', '{"role":"user"}', '{}', now(), now(), now()),
    (user_b, 'phase3-online-b@example.test', 'authenticated', 'authenticated', '{"role":"user"}', '{}', now(), now(), now()),
    (admin_user, 'phase3-online-admin@example.test', 'authenticated', 'authenticated', '{"role":"admin"}', '{}', now(), now(), now());

  insert into public.characters (id, owner_user_id, name, display_name, status)
  values
    ('phase3-online-char-a', user_a, 'A', 'A', 'draft'),
    ('phase3-online-char-b', user_b, 'B', 'B', 'draft');
  insert into public.reference_analyses (
    id, owner_user_id, reference_asset_id, analysis, analyzer_version
  ) values
    ('phase3-online-analysis-a', user_a, 'asset-a', '{"people_count":1}', 'online/1'),
    ('phase3-online-analysis-b', user_b, 'asset-b', '{"people_count":1}', 'online/1');

  if (select public from storage.buckets where id = 'generation-inputs') then
    raise exception 'generation-inputs bucket must remain private';
  end if;
  if (select count(*) from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname like 'generation_inputs_owner_%') <> 3 then
    raise exception 'generation-inputs owner policies are incomplete';
  end if;
  if (select status from public.lora_registry where id = 'phase3-character-lora-v1') <> 'draft' then
    raise exception 'Phase 3 LoRA must remain draft until its real manifest is supplied';
  end if;
  if (select status from public.workflow_lora_compatibility where workflow_id = 'single-character-reference-remake-v1') <> 'draft' then
    raise exception 'Phase 3 workflow/LoRA compatibility must fail closed';
  end if;

  begin
    insert into public.characters (
      id, owner_user_id, name, display_name, is_adult, declared_age,
      base_model_id, lora_id, lora_version, default_lora_weight,
      min_lora_weight, max_lora_weight, status
    ) values (
      'phase3-online-underage', user_a, 'Underage', 'Underage', false, 17,
      'persephone-flux-2-q8-v1', 'phase3-character-lora-v1', '1.0.0',
      1.0, 0.6, 1.2, 'testing'
    );
    raise exception 'underage character unexpectedly passed the database gate';
  exception when check_violation then
    null;
  end;

  perform set_config('request.jwt.claims', json_build_object(
    'sub', user_a, 'role', 'authenticated', 'app_metadata', json_build_object('role', 'user')
  )::text, true);
  execute 'set local role authenticated';
  select count(*) into visible_count from public.characters;
  if visible_count <> 1 then
    raise exception 'user A character isolation failed: % visible', visible_count;
  end if;
  select count(*) into visible_count from public.reference_analyses;
  if visible_count <> 1 then
    raise exception 'user A reference-analysis isolation failed: % visible', visible_count;
  end if;
  begin
    insert into public.characters (id, owner_user_id, name, display_name, status)
    values ('phase3-online-attacker', user_a, 'x', 'x', 'draft');
    raise exception 'ordinary user unexpectedly inserted trusted character metadata';
  exception when insufficient_privilege then
    null;
  end;
  execute 'reset role';

  perform set_config('request.jwt.claims', json_build_object(
    'sub', admin_user, 'role', 'authenticated', 'app_metadata', json_build_object('role', 'admin')
  )::text, true);
  execute 'set local role authenticated';
  select count(*) into visible_count
  from public.characters
  where id in ('phase3-online-char-a', 'phase3-online-char-b');
  if visible_count <> 2 then
    raise exception 'admin character read failed: % visible', visible_count;
  end if;
  execute 'reset role';

  execute 'set local role service_role';
  insert into public.characters (
    id, owner_user_id, name, display_name, is_adult, declared_age,
    base_model_id, lora_id, lora_version, default_lora_weight,
    min_lora_weight, max_lora_weight, status
  ) values (
    'phase3-online-adult', user_a, 'Adult', 'Adult', true, 25,
    'persephone-flux-2-q8-v1', 'phase3-character-lora-v1', '1.0.0',
    1.0, 0.6, 1.2, 'testing'
  );
  execute 'reset role';

  delete from auth.users where id in (user_a, user_b, admin_user);
  raise notice 'PHASE3_ONLINE_RLS_PASS';
end
$phase3$;
