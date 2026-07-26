-- Phase 9: server-authoritative consumer credit checkout metadata.
-- Apply only after review; this migration is additive and does not alter balances.

alter table public.orders
  add column if not exists package_id text,
  add column if not exists offer_code text,
  add column if not exists idempotency_key text,
  add column if not exists order_metadata jsonb not null default '{}'::jsonb;

create unique index if not exists idx_orders_user_idempotency
  on public.orders (user_id, idempotency_key)
  where idempotency_key is not null;

create index if not exists idx_orders_package
  on public.orders (package_id, created_at desc);

create unique index if not exists idx_credit_transactions_order_grant_once
  on public.credit_transactions (source_type, source_id, operation_category)
  where source_type = 'order'
    and operation_category = 'grant'
    and status = 'posted';

comment on column public.orders.order_metadata is
  'Server-resolved package, credit grant, offer, and pricing-version metadata. Never trust client amounts.';
