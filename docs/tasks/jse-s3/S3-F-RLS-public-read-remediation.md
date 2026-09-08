# S3-F-RLS — Public-read RLS / grant remediation

| Field | Value |
|---|---|
| Track | S3-F-RLS |
| Type | Evidence + authorized migration (not `jackpot-site` DDL) |
| Depends on | S3-E (identity class known); usually triggered by an S3-F `blocked` finding |
| Blocks | S3-F conclusion `accepted`; therefore S3-G |
| Estimate | M |
| PR grouping | Migration-authority PR(s). Handoff / evidence may land in `jackpot-site` as docs only. |
| Status (2026-09-08) | **N/A — original S3-F blocker resolved through DB-W3** — see [`_status-S3-F-RLS.md`](./_status-S3-F-RLS.md) |

## Disposition (current)

```text
S3-F-RLS
N/A — original S3-F blocker resolved through DB-W3
```

S3-F-RLS was opened because the original public view could not
simultaneously preserve publish isolation and serve anon under
`security_invoker=true`.

DB-W3 superseded that physical contract with
`api.v_curated_promo_discovery` and independently proved the required
D-S3-06 matrix.

No additional S3-F-RLS migration is required.

This packet remains **historically important**: it explains what would
happen when S3-F finds a database-layer failure on the public-read path.
Do **not** treat the remediation target below as current architecture —
`public.v_curated_promo_discovery` is superseded. Current accepted
contract: [`_status-S3-F.md`](./_status-S3-F.md).

## Goal (historical packet purpose)

Close **missing or insufficient RLS / grants / `security_invoker`** on the S3 public-read path so the low-privilege site identity can SELECT only the **approved published view** (approved columns) and cannot mutate or read producer/internal objects.

> **Historical wording:** early drafts of this packet named
> `public.v_curated_promo_discovery`. That is **no longer** the site
> contract. If this packet is ever reopened after a regression, remediate
> the **current** physical contract (`api.v_curated_promo_discovery` unless
> a later architecture decision changes it).

This is the named follow-up that S3-F already required when the database does not match D-S3-06. It is not permission to apply ad-hoc SQL from `jackpot-site`.

## Decisions to assume

- **D-S3-04** — only the published view is the site data contract
- **D-S3-05** — publishable (or documented anon compatibility) only; never service-role
- **D-S3-06** — acceptance matrix is mandatory; S3-F re-runs after this packet
- **D-S3-07** — app code stays on the domain repository; this packet does not widen the client

## Migration authority (hard rule)

`jackpot-site` does **not** own Supabase schema, grant, RLS, or `security_invoker` migrations.

Before writing SQL:

1. Name the **current** repo/process that already owns published-view DDL for this project.
2. Do not start a third migration history.
3. ADR-0003 still treats `core` as acquisition migration authority where that remains documented. `jackpot-etl/scripts/migrations/` already contains published curated/artifact/newsletter RLS (for example `curated_web_005_supabase_rls.sql`, `artifact_003b_curated_offer_selections_rls.sql`). **Confirm which of those is authoritative for the current published view (`api.v_curated_promo_discovery` after DB-W3) and its producer tables** — do not guess.
4. Apply ENABLE/POLICY/GRANT/`security_invoker` changes only in that owner, via its normal review/apply path.
5. Never apply production DDL from `jackpot-site`.
6. Never introduce `SUPABASE_SERVICE_ROLE_KEY` usage in `jackpot-site` to paper over missing RLS.

## Scope

**In scope (S3 blocker) — if this packet is reopened:**

- current published view (`api.v_curated_promo_discovery` after DB-W3; historically `public.v_curated_promo_discovery`) — owner, grants, `security_invoker` / `security_barrier`
- producer tables/views that define that published view
- any other table/view the S3-E low-privilege role can currently `SELECT` / `INSERT` / `UPDATE` / `DELETE` in the environment under test

For each in-scope relation, the authorized migration must leave a documented posture:

```text
RLS enabled on base tables that the low-privilege role can reach
  + explicit policies
  OR
a recorded reason that RLS is not the control (and what is)

View / security_invoker / grants
  → SELECT on the published view succeeds for intended rows
  → mutations denied
  → producer / internal objects not newly exposed
```

**Out of scope for this S3 packet (do not expand S3 to a whole-database sweep):**

- tables the low-privilege site role **cannot** reach, unless the audit shows an unexpected GRANT that puts them in scope
- newsletter subscriber RLS (S4 / existing `jackpot-etl` newsletter migrations)
- dashboard / Hottest Offers / artifact-admin surfaces that the public site must not use
- inventing new published contracts beyond D-S3-04

If the audit finds unrelated public-schema tables missing RLS **and** they are not reachable by the site role, record them as a **migration-repo follow-up**, not as a `jackpot-site` S3-G blocker.

## Implementation requirements

1. Start from S3-F evidence if it exists (`blocked` + relation list). If S3-F has not run, perform the same inventory first — do not skip the matrix.
2. Identify the S3-E role class (`publishable` or documented anon compatibility). Do not record key values.
3. Enumerate producer relations from the **authorized** view definition (migration that created `v_curated_promo_discovery`, or `pg_get_viewdef` in an approved environment).
4. For each in-scope relation, record:
   - `relrowsecurity` / RLS enabled?
   - policies (roles, commands, `USING` / `WITH CHECK` summary — no secrets)
   - grants to `anon` / `authenticated` / other public roles
   - gap: missing RLS, overly broad policy, GRANT on producer table, view runs as owner without `security_invoker` when that is required, etc.
5. In the migration-authority repo, add the smallest migration that closes **S3-path** gaps only:
   - `ENABLE ROW LEVEL SECURITY` on reachable base tables that lack it
   - policies that allow intended published reads and deny writes for the low-privilege role
   - revoke stray GRANTs on producer/internal objects
   - set/document `security_invoker` on the published view if the owner/audit requires it
6. Do not grant `SELECT` on raw/canonical producer tables “so the site works.”
7. Re-run the D-S3-06 matrix in the same class of environment after the authorized migration is applied.
8. Record non-secret evidence in `docs/evidence/jse-s3-rls-remediation.md` (and update or unblock S3-F):
   - date / environment name
   - migration-authority repo + migration path/SHA
   - relation gap table (before → after)
   - matrix results
   - conclusion: `remediated` | `blocked`
9. S3-F may conclude `accepted` only after this packet is `remediated` **or** S3-F already proved no RLS/grant gap exists (then this packet is N/A with a one-line status).

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

Disposition recorded 2026-09-08 — see [`_status-S3-F-RLS.md`](./_status-S3-F-RLS.md):

- [x] Authorized migration applied or explicitly N/A → **N/A (DB-W3)**
- [x] D-S3-06 matrix proven → via [DB-W3-D](../../evidence/db-wave-3/W3-D-low-privilege-acceptance.md)
- [x] No producer-table SELECT granted for convenience
- [x] No service-role workaround in `jackpot-site`
- [x] `_status-S3-F-RLS.md` conclusion `N/A`
- [x] S3-F unblocked — matrix matches D-S3-06 under `api.v_curated_promo_discovery`

If this packet is reopened after a regression, reset the checklist and complete the full audit/migration path above.

## Agent prompt

```text
Implement only S3-F-RLS from docs/tasks/jse-s3/S3-F-RLS-public-read-remediation.md
Audit RLS/grants/security_invoker on the S3 public-read path. Apply
ENABLE/POLICY/GRANT fixes only in the named Supabase migration
authority — never from jackpot-site, never via service-role.
Re-run the D-S3-06 matrix. Do not mount the homepage.
```
