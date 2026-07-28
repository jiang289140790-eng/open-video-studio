do $$
begin
  if to_regclass('public.social_accounts') is not null then
    alter table public.social_accounts
      add column if not exists user_id uuid,
      add column if not exists account_name text,
      add column if not exists account_url text,
      add column if not exists avatar text,
      add column if not exists account_category text not null default 'inspiration',
      add column if not exists account_role text not null default 'reference',
      add column if not exists api_status text not null default 'connected',
      add column if not exists target_audience jsonb not null default '[]'::jsonb,
      add column if not exists content_strategy jsonb not null default '{}'::jsonb,
      add column if not exists posting_frequency text,
      add column if not exists ops_notes text;

    update public.social_accounts
    set account_name = coalesce(account_name, display_name, username),
        account_url = coalesce(account_url, profile_url),
        avatar = coalesce(avatar, avatar_url)
    where account_name is null or account_url is null or avatar is null;

    create index if not exists idx_social_accounts_user_id
      on public.social_accounts(user_id);
  end if;
end
$$;
