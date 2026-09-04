-- SUGGESTED MIGRATION — do not apply from jackpot-site.
--
-- Packet: S3-F-RLS (D-S3-11 invoker + private producers)
-- Review / apply only in the current published-view migration authority
-- after that owner is named. Confirm live object names with pg_get_viewdef
-- before adapting this file.
--
-- Intent:
--   1. Keep public.v_curated_promo_discovery as the only Data API contract.
--   2. Set security_invoker = true.
--   3. Move Epic A producer tables into curation_private (not API-exposed).
--   4. GRANT SELECT on view-backing producers to anon (required for invoker).
--   5. Enable RLS; published-row SELECT only; no anon writes.
--
-- Do NOT add curation_private to Dashboard Exposed schemas / PGRST_DB_SCHEMAS.
-- Writers that used PostgREST + service_role on public.published_curated_offer_*
-- must switch to a direct Postgres connection or a public SECURITY DEFINER
-- writer facade. Exposing this schema would make producers Data API resources.
--
-- Out of scope: public.curated_web_promos, newsletter tables, overlaps.
--
-- View body is the authorized Epic A proposal with schema qualifiers changed
-- only. Extra view columns beyond D-S3-04 are unchanged on purpose.

begin;

do $$
begin
  if to_regclass('public.published_curated_offer_instances_raw') is null
     and to_regclass('curation_private.published_curated_offer_instances_raw') is null then
    raise exception
      'published_curated_offer_instances_raw not found in public or curation_private. Apply the authorized Epic A publish DDL first, then re-run this remediation.';
  end if;

  if to_regclass('public.published_curated_offer_signals_raw') is null
     and to_regclass('curation_private.published_curated_offer_signals_raw') is null then
    raise exception
      'published_curated_offer_signals_raw not found in public or curation_private. Apply the authorized Epic A publish DDL first, then re-run this remediation.';
  end if;
end
$$;

create schema if not exists curation_private;

comment on schema curation_private is
  'Curated publish producers for public.v_curated_promo_discovery. Must not be listed in PostgREST db schemas / Dashboard exposed schemas.';

revoke create on schema curation_private from public;

-- Drop the published view before moving its producers so dependents fail
-- loudly instead of silently rewriting.
drop view if exists public.v_curated_promo_discovery;

do $$
begin
  if to_regclass('public.published_curated_offer_instances_raw') is not null then
    execute 'alter table public.published_curated_offer_instances_raw set schema curation_private';
  end if;

  if to_regclass('public.published_curated_offer_signals_raw') is not null then
    execute 'alter table public.published_curated_offer_signals_raw set schema curation_private';
  end if;

  if to_regclass('public.published_curated_offer_day') is not null then
    execute 'alter table public.published_curated_offer_day set schema curation_private';
  end if;
end
$$;

create or replace view public.v_curated_promo_discovery
with (security_invoker = true)
as
with signal_rollup as (
  select
    s.promo_id,

    coalesce(
      array_agg(distinct s.signal_family order by s.signal_family)
        filter (where s.signal_family is not null and s.signal_family <> ''),
      '{}'::text[]
    ) as signal_families,

    coalesce(
      array_agg(distinct s.signal_type order by s.signal_type)
        filter (where s.signal_type is not null and s.signal_type <> ''),
      '{}'::text[]
    ) as signal_types,

    '{}'::text[] as gameplay_tags,

    coalesce(
      jsonb_agg(
        jsonb_build_object(
          'signal_id', s.signal_id,
          'signal_schema_version', s.signal_schema_version,
          'signal_type', s.signal_type,
          'signal_family', s.signal_family,
          'label', initcap(replace(s.signal_type, '_', ' ')),
          'value_raw', s.value_raw,
          'value_normalized', s.value_normalized,
          'value_display', coalesce(s.value_normalized, s.value_raw),
          'confidence', coalesce(s.confidence_score::text, s.confidence_raw),
          'evidence_text', s.evidence_text,
          'extraction_key', s.extraction_key,
          'sort_order', s.display_order
        )
        order by s.display_order asc, s.signal_id asc
      ) filter (where s.signal_id is not null),
      '[]'::jsonb
    ) as signals_json,

    coalesce(
      jsonb_agg(
        jsonb_build_object(
          'signal_id', s.signal_id,
          'signal_schema_version', s.signal_schema_version,
          'signal_type', s.signal_type,
          'signal_family', s.signal_family,
          'label', initcap(replace(s.signal_type, '_', ' ')),
          'value_raw', s.value_raw,
          'value_normalized', s.value_normalized,
          'value_display', coalesce(s.value_normalized, s.value_raw),
          'confidence', coalesce(s.confidence_score::text, s.confidence_raw),
          'evidence_text', s.evidence_text,
          'extraction_key', s.extraction_key,
          'sort_order', s.display_order
        )
        order by s.display_order asc, s.signal_id asc
      ) filter (
        where s.signal_id is not null
          and s.display_order < 3
      ),
      '[]'::jsonb
    ) as top_signals_json,

    coalesce(
      jsonb_agg(
        jsonb_build_object(
          'evidence_type', 'text',
          'label', s.evidence_text,
          'text', s.evidence_text,
          'extraction_key', s.extraction_key,
          'confidence', coalesce(s.confidence_score::text, s.confidence_raw)
        )
        order by s.display_order asc, s.signal_id asc
      ) filter (where s.evidence_text is not null and btrim(s.evidence_text) <> ''),
      '[]'::jsonb
    ) as evidence_json

  from curation_private.published_curated_offer_signals_raw s
  group by s.promo_id
)

select
  i.promo_id,
  i.promo_slug,
  i.observation_id,

  i.brand,
  i.market_slug,
  i.location_label,

  coalesce(nullif(btrim(i.title), ''), 'Untitled promo') as title,
  i.subtitle,

  i.source_kind,
  i.source_url,
  i.primary_asset_url,

  i.active_status,

  i.visible_start_date,
  i.visible_end_date,
  i.observed_at,

  coalesce(r.signal_families, '{}'::text[]) as signal_families,
  coalesce(r.signal_types, '{}'::text[]) as signal_types,
  coalesce(r.gameplay_tags, '{}'::text[]) as gameplay_tags,

  coalesce(
    nullif(
      array_remove(array[
        i.offer_category,
        i.primary_value_theme,
        i.source_kind
      ], null),
      '{}'::text[]
    ),
    '{}'::text[]
  ) as badges,

  coalesce(r.top_signals_json, '[]'::jsonb) as top_signals_json,
  coalesce(r.signals_json, '[]'::jsonb) as signals_json,
  coalesce(r.evidence_json, '[]'::jsonb) as evidence_json,

  i.source_folder_slug,
  i.import_run_id,

  i.created_at,
  i.updated_at

from curation_private.published_curated_offer_instances_raw i
left join signal_rollup r
  on r.promo_id = i.promo_id;

comment on view public.v_curated_promo_discovery is
  'S3 / Epic A public discovery contract. security_invoker=true over curation_private producers. Site must SELECT the D-S3-04 allowlist only.';

revoke all on schema curation_private from public;
grant usage on schema curation_private to anon, authenticated, service_role;

revoke all on table curation_private.published_curated_offer_instances_raw from public;
revoke all on table curation_private.published_curated_offer_signals_raw from public;

grant select on table curation_private.published_curated_offer_instances_raw
  to anon, authenticated;
grant select on table curation_private.published_curated_offer_signals_raw
  to anon, authenticated;

grant all on table curation_private.published_curated_offer_instances_raw to service_role;
grant all on table curation_private.published_curated_offer_signals_raw to service_role;

do $$
begin
  if to_regclass('curation_private.published_curated_offer_day') is not null then
    execute 'revoke all on table curation_private.published_curated_offer_day from public';
    execute 'revoke all on table curation_private.published_curated_offer_day from anon, authenticated';
    execute 'grant all on table curation_private.published_curated_offer_day to service_role';
  end if;
end
$$;

grant select on table public.v_curated_promo_discovery to anon, authenticated, service_role;
revoke insert, update, delete on table public.v_curated_promo_discovery from anon, authenticated;

alter table curation_private.published_curated_offer_instances_raw enable row level security;
alter table curation_private.published_curated_offer_signals_raw enable row level security;
alter table curation_private.published_curated_offer_instances_raw force row level security;
alter table curation_private.published_curated_offer_signals_raw force row level security;

do $$
begin
  if to_regclass('curation_private.published_curated_offer_day') is not null then
    execute 'alter table curation_private.published_curated_offer_day enable row level security';
    execute 'alter table curation_private.published_curated_offer_day force row level security';
  end if;
end
$$;

drop policy if exists anon_select_published_instances
  on curation_private.published_curated_offer_instances_raw;
create policy anon_select_published_instances
  on curation_private.published_curated_offer_instances_raw
  for select
  to anon
  using (true);

drop policy if exists authenticated_select_published_instances
  on curation_private.published_curated_offer_instances_raw;
create policy authenticated_select_published_instances
  on curation_private.published_curated_offer_instances_raw
  for select
  to authenticated
  using (true);

drop policy if exists anon_select_published_signals
  on curation_private.published_curated_offer_signals_raw;
create policy anon_select_published_signals
  on curation_private.published_curated_offer_signals_raw
  for select
  to anon
  using (true);

drop policy if exists authenticated_select_published_signals
  on curation_private.published_curated_offer_signals_raw;
create policy authenticated_select_published_signals
  on curation_private.published_curated_offer_signals_raw
  for select
  to authenticated
  using (true);

-- No anon/authenticated policies on published_curated_offer_day.
-- service_role bypasses RLS in Supabase; FORCE RLS still applies to table owners
-- unless they are supabase_admin / bypassrls. Confirm the ETL writer role.

commit;
