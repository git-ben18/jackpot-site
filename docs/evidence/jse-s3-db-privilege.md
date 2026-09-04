# S3-F — Database privilege evidence

| Field | Value |
|---|---|
| Date | 2026-09-04 |
| Packet | [S3-F-db-privilege-acceptance.md](../tasks/jse-s3/S3-F-db-privilege-acceptance.md) |
| Conclusion | **`blocked`** |
| Environment | Live privilege matrix **not executed**. This workspace has `.env.example` names only (`SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, optional `SUPABASE_ANON_KEY`). No approved host or key was supplied. |
| Role class | S3-E: publishable preferred → Postgres role **`anon`**. Documented `SUPABASE_ANON_KEY` fallback is the same role class. Service-role / secret keys are not used and were not used here. |
| Follow-up | [S3-F-RLS](../tasks/jse-s3/S3-F-RLS-public-read-remediation.md) opened. Suggested SQL: [jse-s3-f-rls-suggested-migration.sql](./jse-s3-f-rls-suggested-migration.sql). Probe SQL: [jse-s3-db-privilege-probe.sql](./jse-s3-db-privilege-probe.sql). |

This file is **implemented** evidence (definition inventory + acceptance decision). It is not operational acceptance and not a deployed result.

## Why `blocked`

Two independent blockers. Either one is enough to keep S3-G closed.

1. **Live D-S3-06 / D-S3-11 matrix was not run.** No approved non-production (or production) connection exists in this repository. Catalog owner, grants, RLS, invoker, and PostgREST behavior are therefore unproven.
2. **The authorized view definition does not match D-S3-11**, even if it were applied as written. S3-F now treats that shape as a gap, not as N/A.

A security-definer view that only GRANTs the view, or an invoker view whose producers remain in `public`, cannot be marked `accepted`.

## S3-E identity (no secrets)

| Item | Record |
|---|---|
| Config | `src/lib/server/publicSupabaseConfig.ts` |
| Preferred env | `SUPABASE_URL` + `SUPABASE_PUBLISHABLE_KEY` |
| Fallback env | `SUPABASE_ANON_KEY` (same low-privilege class) |
| Never read | `SUPABASE_SERVICE_ROLE_KEY` / secret keys |
| Query | `public.v_curated_promo_discovery` + D-S3-04 column allowlist |
| Postgres role | **`anon`** (publishable JWT still maps to `anon` when there is no user) |

## Authorized definition inventory (not live)

Source of the view/table proposal (not a `jackpot-site` migration; not confirmed applied):

```text
rewards-maxxing-frontend
  _docs/planning/epic-a-curated-promo-discovery/epic-a-v0-supabase-migration-proposal.sql
  _docs/planning/epic-a-curated-promo-discovery/2026052180000_publish_curated_offer_instance.sql
```

`jackpot-etl/scripts/migrations/curated_web_004_supabase_public_tables.sql` and `curated_web_005_supabase_rls.sql` define **`public.curated_web_promos`**, a different product surface. They are **not** the S3 discovery producers.

| Object | Proposed schema | Role vs D-S3-11 |
|---|---|---|
| `v_curated_promo_discovery` | `public` | Published contract. Proposal already sets `security_invoker = true`. |
| `published_curated_offer_instances_raw` | **`public`** | View-backing producer. API-exposed schema → **gap**. |
| `published_curated_offer_signals_raw` | **`public`** | View-backing producer. API-exposed schema → **gap**. |
| `published_curated_offer_day` | **`public`** | FK-adjacent Epic B mirror. Not selected by the view. Must not be GRANTed to `anon`. Move with instances if present. |
| View GRANT | `service_role` only | Site identity is `anon` → **gap** (no `GRANT SELECT` to `anon`). |
| Producer RLS | `ENABLE` on the three tables | Anon `SELECT` policies are **commented out**. With invoker, `anon` cannot read the view until private-schema GRANTs + policies exist. |
| Producer GRANT to `anon` | none in the proposal | Required for invoker, but only after producers leave the API schema. |

Proposal view columns include fields outside the D-S3-04 allowlist (`observation_id`, `source_folder_slug`, `import_run_id`, `created_at`, `updated_at`). S3-E does not select them. Narrowing the view is a separate contract change and is not required to close S3-F-RLS.

## Acceptance matrix

| Check | Result | Notes |
|---|---|---|
| SELECT `public.v_curated_promo_discovery` (D-S3-04 columns) | **not executed** | Needs publishable/anon Data API call in an approved env. |
| INSERT / UPDATE / DELETE on the view | **not executed** | Expect deny. Proposal view is non-simple (CTE/aggregate). |
| Unrelated internal object reads | **not executed** | |
| Producers not Data API resources | **blocked (definition)** | Proposal leaves producers in `public`. Live exposure unproven. |
| `security_invoker = true` | **blocked pending live** | True in the proposal; not confirmed on a live view. |
| Producer schema not API-exposed | **blocked (definition)** | `public` is the default exposed schema. |
| `anon` PostgREST GET `/rest/v1/<producer>` | **not executed** | Must be 404 or 403 after remediation. |
| View owner | **not executed** | |

## Suggested S3-F-RLS change (handoff)

Do **not** apply from `jackpot-site`. Name the migration authority first.

Target shape:

```text
curation_private (not in PGRST_DB_SCHEMAS / Dashboard Exposed schemas)
  published_curated_offer_instances_raw
  published_curated_offer_signals_raw
  published_curated_offer_day          -- move if present; no anon GRANT

public.v_curated_promo_discovery
  security_invoker = true
  GRANT SELECT to anon
```

See [jse-s3-f-rls-suggested-migration.sql](./jse-s3-f-rls-suggested-migration.sql). Review notes for the owner:

- Invoker GRANTs on **private** view-backing tables are required. That is not “exposing” producers.
- Do not add `curation_private` to Exposed schemas so supabase-js writers keep working. Those writers must use direct Postgres (or a `public` `SECURITY DEFINER` facade).
- `FORCE ROW LEVEL SECURITY` is in the suggestion; confirm the ETL writer role (`service_role` bypasses RLS in Supabase; table-owner sessions may not).
- `USING (true)` on publish-mirror rows matches “all rows in the publish tables are published.” The site still filters `active_status` in S3-E. Tighten later if product wants DB-side active-only.
- Do not fold `curated_web_*` into this migration.

## Live probe (not run — needs approval)

This workspace cannot fill the matrix without an approved environment. When ops supplies a non-production (or explicitly approved) `SUPABASE_URL` + publishable/anon key, run:

1. Catalog queries in [jse-s3-db-privilege-probe.sql](./jse-s3-db-privilege-probe.sql) as a privileged inspector.
2. Data API checks with the S3-E key class (do not commit the key or response bodies that include unpublished/PII fields):

```text
GET {SUPABASE_URL}/rest/v1/v_curated_promo_discovery?select=promo_id,brand,title,active_status&limit=1
POST / PATCH / DELETE {SUPABASE_URL}/rest/v1/v_curated_promo_discovery
GET {SUPABASE_URL}/rest/v1/published_curated_offer_instances_raw?select=promo_id&limit=1
GET {SUPABASE_URL}/rest/v1/published_curated_offer_signals_raw?select=signal_id&limit=1
```

Re-run this file after S3-F-RLS is `remediated`. S3-F may move to `accepted` only when the live matrix matches D-S3-06 and D-S3-11.

## What this packet did not do

- No homepage wiring (S3-G).
- No `SUPABASE_SERVICE_ROLE_KEY` usage.
- No DDL applied from `jackpot-site`.
- No production cutover.
