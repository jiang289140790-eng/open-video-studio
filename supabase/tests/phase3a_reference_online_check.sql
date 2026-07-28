do $phase3a$
begin
  insert into auth.users (
    id, email, aud, role, raw_app_meta_data, raw_user_meta_data,
    email_confirmed_at, created_at, updated_at
  ) values
    ('3a000000-0000-4000-8000-000000000091', 'phase3a-online-a@example.test', 'authenticated', 'authenticated', '{"role":"user"}', '{}', now(), now(), now()),
    ('3a000000-0000-4000-8000-000000000092', 'phase3a-online-b@example.test', 'authenticated', 'authenticated', '{"role":"user"}', '{}', now(), now(), now())
  on conflict (id) do nothing;

  insert into public.media_assets (
    id, owner_user_id, asset_type, source_type, storage_key, display_name,
    processing_status, rights_status, moderation_status, visibility_status
  ) values (
    'phase3a_online_asset_b',
    '3a000000-0000-4000-8000-000000000092',
    'image',
    'phase3a_online_check',
    '3a000000-0000-4000-8000-000000000092/phase3a/asset-b.png',
    'asset-b.png',
    'ready',
    'user_uploaded',
    'pending',
    'private'
  ) on conflict (id) do nothing;

  perform set_config(
    'request.jwt.claims',
    json_build_object(
      'sub', '3a000000-0000-4000-8000-000000000091',
      'role', 'authenticated',
      'app_metadata', json_build_object('role', 'user')
    )::text,
    true
  );
  perform set_config('role', 'authenticated', true);

  if (select count(*) from public.workflow_registry_versions) <> 0 then
    raise exception 'ordinary user can read workflow registry history';
  end if;
  if (select count(*) from public.lora_registry_versions) <> 0 then
    raise exception 'ordinary user can read LoRA registry history';
  end if;
  if exists (select 1 from public.media_assets where id = 'phase3a_online_asset_b') then
    raise exception 'user A can read user B media asset';
  end if;

  insert into public.media_assets (
    id, owner_user_id, asset_type, source_type, storage_key, display_name,
    processing_status, rights_status, moderation_status, visibility_status
  ) values (
    'phase3a_online_asset_a',
    '3a000000-0000-4000-8000-000000000091',
    'image',
    'phase3a_online_check',
    '3a000000-0000-4000-8000-000000000091/phase3a/asset-a.png',
    'asset-a.png',
    'ready',
    'user_uploaded',
    'pending',
    'private'
  );

  if not exists (select 1 from public.media_assets where id = 'phase3a_online_asset_a') then
    raise exception 'user A cannot read own media asset';
  end if;

  begin
    insert into public.media_assets (
      id, owner_user_id, asset_type, source_type, storage_key, display_name,
      processing_status, rights_status, moderation_status, visibility_status
    ) values (
      'phase3a_online_asset_illegal',
      '3a000000-0000-4000-8000-000000000092',
      'image',
      'phase3a_online_check',
      '3a000000-0000-4000-8000-000000000092/phase3a/illegal.png',
      'illegal.png',
      'ready',
      'user_uploaded',
      'pending',
      'private'
    );
    raise exception 'user A inserted an asset for user B';
  exception
    when insufficient_privilege then null;
  end;

  perform set_config('role', 'postgres', true);
  delete from public.media_assets
    where id in ('phase3a_online_asset_a', 'phase3a_online_asset_b', 'phase3a_online_asset_illegal');
  delete from auth.users
    where id in ('3a000000-0000-4000-8000-000000000091', '3a000000-0000-4000-8000-000000000092');
end
$phase3a$;
