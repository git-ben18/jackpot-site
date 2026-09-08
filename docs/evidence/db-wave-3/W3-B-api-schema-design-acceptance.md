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
| `security_invoker` | **`false`** (owner-rights for underlying relation access) |
| Mutations | No `INSERT`/`UPDATE`/`DELETE` grants on the API view |

### Explicit public-safety decision (required before W3-C)

Owner-rights (`postgres` + `security_invoker=false`) is approved only because the answer to this question is **yes**:

```text
Are every row and every allowlisted value produced by
publish.published_curated_offer_instances_raw and
publish.published_curated_offer_signals_raw
(as projected by this API view definition)
safe for anonymous public retrieval,
independent of the application's activeOnly filtering?
```

**Decision: yes.** These producer tables are curated published serving projections. Rows and allowlisted columns reachable through `api.v_curated_promo_discovery` are classified **public-safe**. Application filters such as `activeOnly` are UX/product shaping, **not** a disclosure control.

Therefore, plainly:

```text
Underlying publish RLS is intentionally bypassed for this API view.
The API view itself is the public disclosure boundary.
Every row reachable through its definition is classified public-safe.
```

| Consequence | Meaning |
|---|---|
| RLS on `publish.*` base tables | Remains enabled for direct-table access control; it is **not** the gate for `api` reads |
| Owner-rights view execution | View owner (`postgres`) reads base relations without requiring `anon` table grants; base RLS does not filter the API result set |
| Disclosure boundary | Column projection + view definition (which producers join/aggregate) — not RLS, not `activeOnly` |
| Producer isolation preserved | `anon` still has **no** `USAGE`/`SELECT` on `publish.*`; only `api` is granted |

If a future producer row class is **not** public-safe, do not rely on RLS under this model — change the view definition (or stop using owner-rights) before publishing that class through `api`.

### Why not `security_invoker=true`

W3-A established `security_invoker=true` on the public view is incompatible with Wave 2 producer isolation for low-privilege site reads. Invoker mode would require granting `USAGE`/`SELECT` on `publish.*` to `anon` — **rejected**.

### Rejected alternative

```text
security_invoker=true + grant SELECT on publish producers to anon
```

Rejected because it weakens the Wave 2 producer boundary and contradicts DB-W3 / JSE-S3 invariants.

### Service-role rule

Ordinary curated rendering **must not** use `service_role`. Service-role may retain administrative `SELECT` on `api` objects but is not the site read path.

---

## 7. Privilege matrix

### Frozen DB-W3 v1 site role

```text
DB-W3 v1 site role = anon
```

Required grants (exact):

```sql
GRANT USAGE ON SCHEMA api TO anon;
GRANT SELECT ON api.v_curated_promo_discovery TO anon;
```

**No new `authenticated` grant in DB-W3 v1.**

| Identity | `USAGE api` | `SELECT api.v_curated_promo_discovery` | DML on `api` view | `USAGE publish` | `SELECT publish.*` |
|---|---|---|---|---|---|
| **`anon`** (DB-W3 v1 site role) | **yes** | **yes** | **no** | **no** | **no** |
| `authenticated` | **no** (v1) | **no** (v1) | no | no | no |
| `service_role` | yes (admin) | yes (admin) | no (reads only for this contract) | as already granted for producers | as already granted |
| `postgres` / owner | yes | yes | N/A (DDL authority) | yes | yes |

Invariant summary:

```text
anon → SELECT api.v_curated_promo_discovery     = succeed (all rows the view returns)
anon → INSERT/UPDATE/DELETE api.*                = deny
anon → SELECT publish.*                        = deny
anon → service_role for ordinary promo reads   = forbid by architecture
authenticated → no new api grants in DB-W3 v1
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
2. **`anon`** `SELECT` on `api.v_curated_promo_discovery` succeeds.
3. **`anon`** attempts against `publish.*` continue to fail.
4. **`authenticated`** has no new DB-W3 v1 grants on `api` (confirm absence).
5. Unrelated legacy/internal objects are not newly exposed by adding `api`.

---

## 9. Site query contract

Target application shape (server-side client authenticated as **`anon`** / publishable key equivalent):

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
view security:     security_invoker=false (owner-rights; publish RLS bypassed for this view)
disclosure:        API view is the public boundary; all reachable rows public-safe
site role (v1):    anon
schema grants:     GRANT USAGE ON SCHEMA api TO anon
relation grants:   GRANT SELECT ON api.v_curated_promo_discovery TO anon
authenticated:     no new grants in DB-W3 v1
PostgREST:         expose api; explicit .schema('api')
rollback:          §10
```
