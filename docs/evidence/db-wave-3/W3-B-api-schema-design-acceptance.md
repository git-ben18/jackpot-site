# W3-B — API schema / view design acceptance

| Field | Value |
|---|---|
| Packet | DB-W3-B |
| Date | 2026-09-08 |
| Depends on | [W3-A-contract-inventory.md](./W3-A-contract-inventory.md) → `READY FOR W3-B` |
| State | **APPROVED** (design only; no DDL) |
| Branch | `docs/db-w3-a-b-contract-design` |

## 1. Contract name

```text
api.v_curated_promo_discovery
```

## 2. API schema purpose

| Field | Decision |
|---|---|
| Schema | `api` |
| Purpose | Application-facing **low-privilege read contracts** for approved public surfaces |
| Not | Producer-write schema; not a mirror of all `publish.*` tables; not an admin/debug surface |

`publish.*` remains internal serving projections written by `core` producers. `jackpot-site` must never depend directly on `publish.*`.

---

## 3. Column contract (exact)

Approve **only** the JSE-S3 public allowlist (no lineage columns):

| Column | Type (contract) |
|---|---|
| `promo_id` | `uuid` (exposed as string in app DTOs) |
| `promo_slug` | `text` |
| `brand` | `text` |
| `market_slug` | `text` |
| `location_label` | `text` |
| `title` | `text` |
| `subtitle` | `text` |
| `source_kind` | `text` |
| `source_url` | `text` |
| `primary_asset_url` | `text` |
| `active_status` | `text` |
| `visible_start_date` | `date` |
| `visible_end_date` | `date` |
| `observed_at` | `timestamptz` |
| `signal_families` | `text[]` |
| `signal_types` | `text[]` |
| `gameplay_tags` | `text[]` |
| `badges` | `text[]` |
| `top_signals_json` | `jsonb` |
| `signals_json` | `jsonb` |
| `evidence_json` | `jsonb` |

**Explicitly excluded from `api` view projection:**

```text
observation_id
source_folder_slug
import_run_id
created_at
updated_at
```

Application rule (unchanged): repository uses an explicit `.select(...)` allowlist matching this set — never `select('*')`.

No embedded `ORDER BY` / `LIMIT` in the view. Filtering (e.g. active statuses) and limits remain application concerns (as today in legacy `curatedPromos.ts`).

---

## 4. Dependency design

| Decision | Value |
|---|---|
| Source strategy | **Adapted copy** of the curated-discovery aggregation from the current public view |
| Direct references | `publish.published_curated_offer_instances_raw` and `publish.published_curated_offer_signals_raw` |
| Intermediate public view | **Do not** define `api` as `SELECT … FROM public.v_curated_promo_discovery` (avoids chaining invoker semantics and keeps public retirement independent) |
| Signal rollup | Same CTE/aggregation family as Epic A / live public view; W3-C must align SQL to live `pg_get_viewdef` then project **only** allowlisted columns |
| Event-day / overlap tables | **Not** dependencies of this contract |

W3-C preflight: capture live view definition, then author `api.v_curated_promo_discovery` SQL that preserves aggregation semantics while narrowing the outer `SELECT` list.

---

## 5. Compatibility strategy

**Chosen: A — create `api` view while retaining `public.v_curated_promo_discovery` temporarily.**

Reasons:

- ACTIVE RUNTIME consumer remains in `rewards-maxxing-frontend` against the public view name.
- Minimizes cutover coupling between DB-W3-C and legacy frontend.
- Public disposition / retirement is explicitly W3-F.

Do **not** drop or rename the public view in W3-C.

---

## 6. Owner / view security model

| Property | Approved choice |
|---|---|
| Owner | `postgres` (same class as current public view) |
| `security_invoker` | **`false`** (default / owner-rights for underlying relation access) |
| Rationale | W3-A established `security_invoker=true` on the public view is incompatible with Wave 2 producer isolation for low-privilege site reads. Invoker mode would require granting `USAGE`/`SELECT` on `publish.*` to the site identity — **rejected**. |
| RLS interaction | Base `publish` tables keep RLS enabled; site identity is **not** a table grantee. View owner (`postgres`) accesses underlying relations under owner-rights view semantics. Site identity only needs schema `USAGE` + view `SELECT` on `api`. |
| Mutations | No `INSERT`/`UPDATE`/`DELETE` grants on the API view |

### Rejected alternative

```text
security_invoker=true + grant SELECT on publish producers to site identity
```

Rejected because it weakens the Wave 2 producer boundary and contradicts DB-W3 / JSE-S3 invariants.

### Service-role rule

Ordinary curated rendering **must not** use `service_role`. Service-role may retain administrative `SELECT` on `api` objects but is not the site read path.

---

## 7. Privilege matrix

| Identity | `USAGE api` | `SELECT api.v_curated_promo_discovery` | DML on `api` view | `USAGE publish` | `SELECT publish.*` |
|---|---|---|---|---|---|
| Site / anon-compatible low-privilege identity | **yes** | **yes** | **no** | **no** | **no** |
| `authenticated` | only if a later product decision requires it; **default no new grants** | default no | no | no | no |
| `service_role` | yes (admin) | yes (admin) | no (reads only for this contract) | as already granted for producers | as already granted |
| `postgres` / owner | yes | yes | N/A (DDL authority) | yes | yes |

Invariant summary:

```text
site → SELECT api.v_curated_promo_discovery     = succeed (approved rows)
site → INSERT/UPDATE/DELETE api.*                = deny
site → SELECT publish.*                        = deny
site → service_role for ordinary promo reads   = forbid by architecture
```

---

## 8. PostgREST / Data API exposure

Required configuration for W3-C/D:

```text
authenticator.pgrst.db_schemas includes api
  (alongside existing public / graphql_public / publish as already accepted)
Supabase Data API exposed schemas includes api
PostgREST schema cache reload after migration
```

Verification expectations (W3-D):

1. Explicit schema selection reaches PostgreSQL (`Accept-Profile: api` / supabase-js `.schema('api')`).
2. Low-privilege `SELECT` on `api.v_curated_promo_discovery` succeeds.
3. Low-privilege attempts against `publish.*` continue to fail.
4. Unrelated legacy/internal objects are not newly exposed by adding `api`.

---

## 9. Site query contract

Target application shape (server-side, low-privilege client only):

```ts
client
  .schema('api')
  .from('v_curated_promo_discovery')
  .select(EXPLICIT_COLUMN_LIST)
```

Where `EXPLICIT_COLUMN_LIST` is the JSE-S3 allowlist join (same columns as §3).

This cutover is **W3-E** (`jackpot-site` repository). W3-B does not change runtime code.

---

## 10. Rollback (for W3-C)

If W3-C must be reversed:

1. Drop `api.v_curated_promo_discovery` (and revoke related grants).
2. Drop empty `api` schema only if no other approved objects exist.
3. Revert PostgREST/`pgrst.db_schemas` / Data API exposure of `api` if it was added solely for this wave.
4. **Do not** mutate or drop `publish.*` producer tables.
5. **Do not** drop `public.v_curated_promo_discovery` as part of rollback or initial apply.

---

## 11. Out of scope (reconfirmed)

- Migration SQL authoring/apply (W3-C in `core`)
- Low-privilege runtime proof (W3-D)
- `jackpot-site` repository cutover (W3-E)
- Public view retirement (W3-F)
- Event-overlap API contract

---

## 12. Conclusion

```text
APPROVED FOR W3-C
```

Approved package for migration implementation in `git-ben18/core`:

```text
contract name:     api.v_curated_promo_discovery
column contract:   JSE-S3 allowlist only (§3)
dependency design: adapted aggregation over publish instances + signals
compatibility:     A — retain public view
owner:             postgres
view security:     security_invoker=false (owner-rights for base access)
schema grants:     USAGE api for site identity
relation grants:   SELECT on api view only for site identity
PostgREST:         expose api; explicit .schema('api')
rollback:          §10
```
