# S3-F-RLS — Public-read RLS / grant remediation

| Field | Value |
|---|---|
| Track | S3-F-RLS |
| Type | Evidence + authorized migration (not `jackpot-site` DDL) |
| Depends on | S3-E (identity class known); usually triggered by an S3-F `blocked` finding |
| Blocks | S3-F conclusion `accepted`; therefore S3-G |
| Estimate | L (schema isolation + invoker + grants + RLS, not a public-table RLS patch) |
| PR grouping | Migration-authority PR(s). Handoff / evidence may land in `jackpot-site` as docs only. |

## Goal

Close **missing or insufficient RLS / grants / schema isolation / `security_invoker`** on the S3 public-read path so the live database matches **D-S3-11**:

- `anon` can SELECT `public.v_curated_promo_discovery` (approved columns) via the Data API;
- `anon` cannot mutate that view;
- producers are not Data API resources;
- `security_invoker = true` on the published view.

This is the named follow-up that S3-F already required when the database does not match D-S3-06 / D-S3-11. It is not permission to apply ad-hoc SQL from `jackpot-site`.

Suggested SQL (review-only in this repo): [docs/evidence/jse-s3-f-rls-suggested-migration.sql](../../evidence/jse-s3-f-rls-suggested-migration.sql).

## Decisions to assume

- **D-S3-04** — only the published view is the site data contract
- **D-S3-05** — publishable (or documented anon compatibility) only; never service-role
- **D-S3-06** — acceptance matrix is mandatory; S3-F re-runs after this packet
- **D-S3-07** — app code stays on the domain repository; this packet does not widen the client
- **D-S3-11** — invoker + private producers is the accepted posture

## Migration authority (hard rule)

`jackpot-site` does **not** own Supabase schema, grant, RLS, or `security_invoker` migrations.

Before writing SQL:

1. Name the **current** repo/process that already owns published-view DDL for this project.
2. Do not start a third migration history.
3. ADR-0003 still treats `core` as acquisition migration authority where that remains documented. `jackpot-etl/scripts/migrations/` already contains published curated/artifact/newsletter RLS (for example `curated_web_005_supabase_rls.sql`, `artifact_003b_curated_offer_selections_rls.sql`). Those files are **not** the Epic A discovery producers. The authorized view definition currently lives as a **proposal** in `rewards-maxxing-frontend` (`_docs/planning/epic-a-curated-promo-discovery/epic-a-v0-supabase-migration-proposal.sql` and `2026052180000_publish_curated_offer_instance.sql`). **Confirm which repo is authoritative for `public.v_curated_promo_discovery` and its producer tables before applying anything** — do not guess, and do not treat the frontend proposal as already applied.
4. Apply schema / ENABLE / POLICY / GRANT / `security_invoker` changes only in that owner, via its normal review/apply path.
5. Never apply production DDL from `jackpot-site`.
6. Never introduce `SUPABASE_SERVICE_ROLE_KEY` usage in `jackpot-site` to paper over missing RLS.

## Scope

**In scope (S3 blocker):**

- `public.v_curated_promo_discovery` (owner, grants, `security_invoker`)
- producer tables/views that define that published view
- any other table/view the S3-E low-privilege role can currently `SELECT` / `INSERT` / `UPDATE` / `DELETE` in the environment under test

Authorized view-backing producers (from the Epic A proposal; confirm live with `pg_get_viewdef`):

```text
published_curated_offer_instances_raw
published_curated_offer_signals_raw
```

FK-adjacent, **not** selected by the view — move with instances if present, but do **not** GRANT SELECT to `anon`:

```text
published_curated_offer_day
```

Out of this packet: `public.curated_web_promos` / capture log (different product surface).

For each in-scope relation, the authorized migration must leave a documented posture:

```text
Producers live in a schema that is not Data API exposed
  + RLS enabled + explicit published-row SELECT policies for anon
  + GRANT SELECT to anon on view-backing private producers only
  (required for security_invoker; not API exposure)

public.v_curated_promo_discovery
  WITH (security_invoker = true)
  + GRANT SELECT to anon
  → SELECT on the published view succeeds for intended rows
  → mutations denied
  → /rest/v1/<producer> missing or denied
```

**Out of scope for this S3 packet (do not expand S3 to a whole-database sweep):**

- tables the low-privilege site role **cannot** reach, unless the audit shows an unexpected GRANT that puts them in scope
- newsletter subscriber RLS (S4 / existing `jackpot-etl` newsletter migrations)
- dashboard / Hottest Offers / artifact-admin surfaces that the public site must not use
- inventing new published contracts beyond D-S3-04
- adding `curation_private` (or equivalent) to Exposed schemas so supabase-js writers keep working

If the audit finds unrelated public-schema tables missing RLS **and** they are not reachable by the site role, record them as a **migration-repo follow-up**, not as a `jackpot-site` S3-G blocker.

## Implementation requirements

1. Start from S3-F evidence if it exists (`blocked` + relation list). If S3-F has not run, perform the same inventory first — do not skip the matrix.
2. Identify the S3-E role class (`publishable` or documented anon compatibility). Do not record key values.
3. Enumerate producer relations from the **authorized** view definition (migration that created `v_curated_promo_discovery`, or `pg_get_viewdef` in an approved environment).
4. For each in-scope relation, record:
   - schema name vs Data API exposed-schema list
   - `relrowsecurity` / RLS enabled?
   - policies (roles, commands, `USING` / `WITH CHECK` summary — no secrets)
   - grants to `anon` / `authenticated` / other public roles
   - gap: producers in `public`, missing invoker, missing anon view GRANT, missing private-schema GRANT, overly broad policy, etc.
5. In the migration-authority repo, add the migration that closes **S3-path** gaps to match D-S3-11:
   - create a private schema that will **not** be listed in Dashboard Exposed schemas / `PGRST_DB_SCHEMAS`
   - move (or recreate) view-backing producers into that schema
   - recreate `public.v_curated_promo_discovery` with `security_invoker = true`
   - `GRANT SELECT` on the view to `anon`
   - `GRANT USAGE` on the private schema and `GRANT SELECT` on view-backing producers to `anon` (required for invoker)
   - `ENABLE ROW LEVEL SECURITY` + published-row `SELECT` policies; no anon writes
   - revoke leftover GRANTs on `public` producer names
   - update ETL / publish writers to a **direct Postgres** connection (or a `public` `SECURITY DEFINER` writer facade). Do not expose the private schema to PostgREST.
6. Do **not** grant `SELECT` on producers that remain in an API-exposed schema “so the site works.” Private-schema GRANTs for invoker are required.
7. Re-run the D-S3-06 / D-S3-11 matrix in the same class of environment after the authorized migration is applied.
8. Record non-secret evidence in `docs/evidence/jse-s3-rls-remediation.md` (and update or unblock S3-F):
   - date / environment name
   - migration-authority repo + migration path/SHA
   - relation gap table (before → after)
   - matrix results
   - conclusion: `remediated` | `blocked`
9. S3-F may conclude `accepted` only after this packet is `remediated` **or** S3-F already proved D-S3-11 holds (then this packet is N/A with a one-line status).

## Suggested deliverables

- Handoff / evidence: `docs/evidence/jse-s3-rls-remediation.md` or `_status-S3-F-RLS.md`
- Migration PR in the named authority repo (not this repository’s `src/`)
- S3-F matrix re-run pointer
- Explicit N/A note if S3-F accepted with no gaps

## Out of scope

- Applying DDL from `jackpot-site`
- Homepage live wiring (S3-G)
- Copying source `curatedPromos.ts` / `artifact-queries.ts`
- Service-role fallback
- Choosing 1Password vs another vault (env *injection* is ops; this packet is database privilege)
- Wholesale RLS for every table in the project

## Acceptance checklist

- [ ] Migration authority named (repo/process) before SQL is written
- [ ] In-scope relations listed (view + producers + reachable objects)
- [ ] Gaps recorded (schema exposure, missing RLS, policies, grants, `security_invoker`)
- [ ] Authorized migration applied or explicitly N/A
- [ ] D-S3-06 / D-S3-11 matrix re-run after apply
- [ ] No producer-table SELECT granted on an API-exposed schema
- [ ] No service-role workaround in `jackpot-site`
- [ ] `_status-S3-F-RLS.md` conclusion `remediated` or `N/A` (no gaps)
- [ ] S3-F unblocked only when the matrix matches D-S3-06 and D-S3-11

## Agent prompt

```text
Implement only S3-F-RLS from docs/tasks/jse-s3/S3-F-RLS-public-read-remediation.md
Audit RLS/grants/security_invoker/schema isolation on the S3 public-read
path. Apply schema/ENABLE/POLICY/GRANT/invoker fixes only in the named
Supabase migration authority — never from jackpot-site, never via
service-role. Target D-S3-11. Re-run the D-S3-06 matrix. Do not mount
the homepage.
```
