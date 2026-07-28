-- Phase 3A uploads create a private media_assets row after the object is stored.
-- Table privileges are the outer gate; existing RLS policies keep rows isolated.
grant select, insert on table public.media_assets to authenticated;
grant select on table public.media_assets to service_role;
