-- S3-F verification queries — no credentials.
-- Run in an approved environment after naming the connection.
-- Catalog queries run as a privileged inspector (SQL editor / postgres).
-- Privilege probes that use SET ROLE anon require a session that can become anon.
-- Data API rows are proven with the publishable/anon key via PostgREST, not these SELECTs alone.

-- ---------------------------------------------------------------------------
-- 1. View owner, invoker flag, schema
-- ---------------------------------------------------------------------------

select
  n.nspname as view_schema,
  c.relname as view_name,
  pg_get_userbyid(c.relowner) as view_owner,
  c.reloptions as reloptions
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname = 'v_curated_promo_discovery'
  and c.relkind = 'v';

-- Expect reloptions to include security_invoker=true (D-S3-11).

-- ---------------------------------------------------------------------------
-- 2. View definition / producers
-- ---------------------------------------------------------------------------

select pg_get_viewdef('public.v_curated_promo_discovery'::regclass, true);

-- Expect FROM/JOIN targets in curation_private (or equivalent non-exposed schema),
-- not public.published_curated_offer_* after S3-F-RLS.

-- ---------------------------------------------------------------------------
-- 3. Producer schema + RLS
-- ---------------------------------------------------------------------------

select
  n.nspname as schema_name,
  c.relname as rel_name,
  c.relkind,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where c.relname in (
  'published_curated_offer_instances_raw',
  'published_curated_offer_signals_raw',
  'published_curated_offer_day',
  'v_curated_promo_discovery'
)
order by n.nspname, c.relname;

-- ---------------------------------------------------------------------------
-- 4. Grants (anon / authenticated / service_role)
-- ---------------------------------------------------------------------------

select
  table_schema,
  table_name,
  grantee,
  privilege_type
from information_schema.role_table_grants
where table_name in (
  'v_curated_promo_discovery',
  'published_curated_offer_instances_raw',
  'published_curated_offer_signals_raw',
  'published_curated_offer_day'
)
  and grantee in ('anon', 'authenticated', 'service_role', 'PUBLIC')
order by table_schema, table_name, grantee, privilege_type;

-- ---------------------------------------------------------------------------
-- 5. Policies
-- ---------------------------------------------------------------------------

select
  schemaname,
  tablename,
  policyname,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where tablename in (
  'published_curated_offer_instances_raw',
  'published_curated_offer_signals_raw',
  'published_curated_offer_day'
)
order by schemaname, tablename, policyname;

-- ---------------------------------------------------------------------------
-- 6. SET ROLE anon probes (only if the session may become anon)
-- ---------------------------------------------------------------------------

-- set role anon;
-- select promo_id from public.v_curated_promo_discovery limit 1;
-- insert into public.v_curated_promo_discovery (promo_id) values ('s3-f-should-fail');
-- update public.v_curated_promo_discovery set title = 's3-f-should-fail' where false;
-- delete from public.v_curated_promo_discovery where false;
-- select promo_id from curation_private.published_curated_offer_instances_raw limit 1;
--   -- SQL SELECT on the private table may succeed (invoker GRANT). That is not
--   -- Data API exposure. Prove API isolation with PostgREST, not this query.
-- reset role;

-- ---------------------------------------------------------------------------
-- 7. Data API isolation (run with publishable/anon key; do not record the key)
-- ---------------------------------------------------------------------------

-- GET {SUPABASE_URL}/rest/v1/v_curated_promo_discovery?select=promo_id,brand,title&limit=1
--   expect 200
-- POST / PATCH / DELETE same path
--   expect 401 / 403 / 405
-- GET {SUPABASE_URL}/rest/v1/published_curated_offer_instances_raw?select=promo_id&limit=1
--   expect 404 or 403 (not a public resource)
-- GET {SUPABASE_URL}/rest/v1/published_curated_offer_signals_raw?select=signal_id&limit=1
--   expect 404 or 403
