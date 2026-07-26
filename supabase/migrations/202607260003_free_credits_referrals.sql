-- Phase 10: server-authoritative free credits and referral rewards.
-- credit_transactions remains the only balance ledger.

create table if not exists public.reward_claims (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  reward_type text not null,
  reward_key text not null,
  credit_transaction_id text references public.credit_transactions(id) on delete set null,
  amount integer not null check (amount > 0),
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, reward_type, reward_key)
);

alter table public.reward_claims enable row level security;
drop policy if exists "reward claims owner read" on public.reward_claims;
create policy "reward claims owner read" on public.reward_claims
  for select to authenticated
  using ((select auth.uid()) = user_id);

alter table public.referral_events
  add column if not exists source text,
  add column if not exists event_day date not null default ((now() at time zone 'UTC')::date),
  add column if not exists device_hash text,
  add column if not exists ip_hash text,
  add column if not exists attributed_at timestamptz,
  add column if not exists verified_at timestamptz,
  add column if not exists rewarded_at timestamptz,
  add column if not exists risk_status text not null default 'pending',
  add column if not exists reward_transaction_id text references public.credit_transactions(id) on delete set null,
  add column if not exists metadata_json jsonb not null default '{}'::jsonb;

create unique index if not exists referral_events_referred_once_idx
  on public.referral_events (referred_user_id)
  where referred_user_id is not null;

create index if not exists referral_events_referrer_status_idx
  on public.referral_events (referrer_user_id, status, created_at desc);

create unique index if not exists referral_click_once_per_device_day_idx
  on public.referral_events (referral_code, device_hash, event_day)
  where referred_user_id is null and device_hash is not null;

drop policy if exists "Users can create own referral events" on public.referral_events;
drop policy if exists "Users can create own referral code" on public.referral_codes;

drop policy if exists "Users can read own referral code" on public.referral_codes;
create policy "referral code owner read" on public.referral_codes
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can read own referral events" on public.referral_events;
create policy "referral events participant read" on public.referral_events
  for select to authenticated
  using (
    (select auth.uid()) = referrer_user_id
    or (select auth.uid()) = referred_user_id
  );

create unique index if not exists credit_transactions_reward_once_idx
  on public.credit_transactions (user_id, source_type, source_id, operation_category)
  where source_type = 'reward' and operation_category = 'reward' and status = 'posted';

create or replace function public.grant_credit_reward(
  p_user_id uuid,
  p_reward_type text,
  p_reward_key text,
  p_amount integer,
  p_reason text,
  p_metadata jsonb default '{}'::jsonb
)
returns table (
  granted boolean,
  transaction_id text,
  amount integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_claim_id uuid;
  v_transaction_id text := 'ctx_' || replace(gen_random_uuid()::text, '-', '');
  v_daily_cap integer;
  v_daily_total integer;
begin
  if p_user_id is null or coalesce(trim(p_reward_type), '') = ''
    or coalesce(trim(p_reward_key), '') = '' or p_amount <= 0 then
    raise exception 'invalid reward request';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text || ':' || p_reward_type, 0));

  v_daily_cap := nullif(coalesce((p_metadata ->> 'daily_cap')::integer, 0), 0);
  if v_daily_cap is not null then
    select coalesce(sum(rc.amount), 0) into v_daily_total
    from public.reward_claims rc
    where rc.user_id = p_user_id
      and rc.reward_type = p_reward_type
      and rc.created_at >= date_trunc('day', now() at time zone 'UTC') at time zone 'UTC'
      and rc.created_at < (date_trunc('day', now() at time zone 'UTC') + interval '1 day') at time zone 'UTC';
    if v_daily_total + p_amount > v_daily_cap then
      return query select false, null::text, 0;
      return;
    end if;
  end if;

  insert into public.reward_claims (
    user_id, reward_type, reward_key, amount, metadata_json
  ) values (
    p_user_id, p_reward_type, p_reward_key, p_amount, coalesce(p_metadata, '{}'::jsonb)
  )
  on conflict (user_id, reward_type, reward_key) do nothing
  returning id into v_claim_id;

  if v_claim_id is null then
    return query
      select false, rc.credit_transaction_id, rc.amount
      from public.reward_claims rc
      where rc.user_id = p_user_id
        and rc.reward_type = p_reward_type
        and rc.reward_key = p_reward_key;
    return;
  end if;

  insert into public.credit_transactions (
    id, account_id, user_id, source_type, source_id, amount,
    balance_impact, operation_category, status, reason, created_at
  ) values (
    v_transaction_id, p_user_id, p_user_id, 'reward',
    p_reward_type || ':' || p_reward_key, p_amount, p_amount,
    'reward', 'posted', p_reason, now()
  );

  update public.reward_claims
  set credit_transaction_id = v_transaction_id
  where id = v_claim_id;

  return query select true, v_transaction_id, p_amount;
end;
$$;

revoke all on function public.grant_credit_reward(uuid, text, text, integer, text, jsonb) from public;
revoke all on function public.grant_credit_reward(uuid, text, text, integer, text, jsonb) from anon;
revoke all on function public.grant_credit_reward(uuid, text, text, integer, text, jsonb) from authenticated;
grant execute on function public.grant_credit_reward(uuid, text, text, integer, text, jsonb) to service_role;

comment on function public.grant_credit_reward(uuid, text, text, integer, text, jsonb) is
  'Service-role-only atomic and idempotent reward grant. credit_transactions remains the balance ledger.';
