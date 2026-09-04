# S3-F-RLS — Public-read RLS / grant remediation

| Field | Value |
|---|---|
| Track | S3-F-RLS |
| Type | Evidence + authorized migration (not `jackpot-site` DDL) |
| Depends on | S3-E (identity class known); usually triggered by an S3-F `blocked` finding |
| Blocks | S3-F conclusion `accepted`; therefore S3-G |
| Estimate | M |
| PR grouping | Migration-authority PR(s). Handoff / evidence may land in `jackpot-site` as docs only. |

## Goal

Close **missing or insufficient RLS / grants / `security_invoker`** on the S3 public-read path so the low-privilege site identity can SELECT only `public.v_curated_promo_discovery` (approved columns) and cannot mutate or read producer/internal objects.

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
3. ADR-0003 still treats `core` as acquisition migration authority where that remains documented. `jackpot-etl/scripts/migrations/` already contains published curated/artifact/newsletter RLS (for example `curated_web_005_supabase_rls.sql`, `artifact_003b_curated_offer_selections_rls.sql`). **Confirm which of those is authoritative for `public.v_curated_promo_discovery` and its producer tables** — do not guess.
4. Apply ENABLE/POLICY/GRANT/`security_invoker` changes only in that owner, via its normal review/apply path.
5. Never apply production DDL from `jackpot-site`.
6. Never introduce `SUPABASE_SERVICE_ROLE_KEY` usage in `jackpot-site` to paper over missing RLS.

## Scope

**In scope (S3 blocker):**

- `public.v_curated_promo_discovery` (owner, grants, `security_invoker`)
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

- [ ] Migration authority named (repo/process) before SQL is written
- [ ] In-scope relations listed (view + producers + reachable objects)
- [ ] Gaps recorded (missing RLS, policies, grants, `security_invoker`)
- [ ] Authorized migration applied or explicitly N/A
- [ ] D-S3-06 matrix re-run after apply
- [ ] No producer-table SELECT granted for convenience
- [ ] No service-role workaround in `jackpot-site`
- [ ] `_status-S3-F-RLS.md` conclusion `remediated` or `N/A` (no gaps)
- [ ] S3-F unblocked only when the matrix matches D-S3-06

## Agent prompt

```text
Implement only S3-F-RLS from docs/tasks/jse-s3/S3-F-RLS-public-read-remediation.md
Audit RLS/grants/security_invoker on the S3 public-read path. Apply
ENABLE/POLICY/GRANT fixes only in the named Supabase migration
authority — never from jackpot-site, never via service-role.
Re-run the D-S3-06 matrix. Do not mount the homepage.
```
