# W3-B — API schema / view design acceptance

| Field | Value |
|---|---|
| Packet | DB-W3-B |
| Date | 2026-09-08 |
| Depends on | [W3-A-contract-inventory.md](./W3-A-contract-inventory.md) → `READY FOR W3-B` |
| State | **APPROVED** (design); W3-C later **applied and verified** |
| Branch | reconciled on `docs/db-w3-d-low-privilege-acceptance` |

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

## 3. Column contract (exact — 21)

| Column | Type |
|---|---|
| `promo_id` | `text` |
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

**Explicitly excluded:**

```text
observation_id
source_folder_slug
import_run_id
created_at
updated_at
```

Application rule: repository uses an explicit `.select(...)` allowlist matching this set — never `select('*')`.

No embedded `ORDER BY` / `LIMIT` in the view. Application may still apply redundant status filters or limits; public disclosure must not depend on the application doing so (see §6).

---

## 4. Dependency design

| Decision | Value |
|---|---|
| Source strategy | **Adapted copy** of the curated-discovery aggregation from the live public view |
| Direct references | `publish.published_curated_offer_instances_raw` and `publish.published_curated_offer_signals_raw` |
| Intermediate public view | **Do not** define `api` as `SELECT … FROM public.v_curated_promo_discovery` |
| Event-day / overlap tables | **Not** dependencies |

---

## 5. Compatibility strategy

**Chosen: A — create `api` view while retaining `public.v_curated_promo_discovery` temporarily** until W3-F.

Do **not** drop or rename the public view in W3-C.

---

## 6. Owner / view security model

| Property | Approved choice |
|---|---|
| Owner | `postgres` |
| `security_invoker` | **`false`** (owner-rights) |
| `security_barrier` | **`true`** |
| Mutations | No `INSERT`/`UPDATE`/`DELETE` grants for `anon` |

### Public disclosure boundary (accepted)

The owner-rights API view is the **database publication boundary**.

Underlying `publish` RLS is intentionally **not** relied upon to filter rows for `api.v_curated_promo_discovery`. Producer RLS remains useful for direct-table isolation only.

Public disclosure is constrained by **both**:

```text
1. the exact 21-column projection; and
2. WHERE i.active_status IN ('active', 'unknown')
```

This row predicate is part of the **database publication contract**, not merely application/UX shaping.

The application may redundantly filter those statuses (`activeOnly`), but public safety must not depend on the application doing so.

At W3-C apply time, production producer state was:

```text
active_status = active
row_count     = 20
```

Adding the database predicate did not remove any then-current public rows; it establishes the future-safe contract.

```text
Underlying publish RLS is intentionally not relied upon to filter API rows.
The API view itself is the public disclosure boundary
(column projection + active_status predicate).
anon receives SELECT on the API view only and receives no direct publish privileges.
```

### Why not `security_invoker=true`

Invoker mode would require granting `USAGE`/`SELECT` on `publish.*` to `anon` — **rejected**.

### Service-role rule

Ordinary curated rendering **must not** use `service_role`.

---

## 7. Privilege matrix

### Frozen DB-W3 v1 site role

```text
DB-W3 v1 site role = anon
```

```sql
GRANT USAGE ON SCHEMA api TO anon;
GRANT SELECT ON api.v_curated_promo_discovery TO anon;
```

Deny-by-default on `api`. **No new `authenticated` grant in DB-W3 v1.**

| Identity | `USAGE api` | `SELECT` API view | DML on API view | `USAGE publish` | `SELECT publish.*` |
|---|---|---|---|---|---|
| **`anon`** | **yes** | **yes** | **no** | **no** | **no** |
| `authenticated` | **no** (v1) | **no** (v1) | no | no | no |
| `service_role` | yes (admin) | yes (admin) | no (reads only for this contract) | as already granted | as already granted |
| `postgres` / owner | yes | yes | N/A | yes | yes |

```text
anon → SELECT api.v_curated_promo_discovery     = succeed (rows matching the view predicate)
anon → INSERT/UPDATE/DELETE api.*                = deny
anon → SELECT publish.*                        = deny
authenticated → no new api grants in DB-W3 v1
```

---

## 8. PostgREST / Data API exposure

```text
authenticator.pgrst.db_schemas includes:
  public, graphql_public, publish, api

Supabase Data API exposed schemas:
  public, publish, api, graphql_public
```

Site query shape (W3-E):

```ts
client
  .schema('api')
  .from('v_curated_promo_discovery')
  .select(EXPLICIT_COLUMN_LIST)
```

---

## 9. Rollback (for W3-C)

1. Drop `api.v_curated_promo_discovery` (and revoke related grants).
2. Drop empty `api` schema only if no other approved objects exist.
3. Revert PostgREST / Data API exposure of `api` if added solely for this wave.
4. **Do not** mutate or drop `publish.*`.
5. **Do not** drop `public.v_curated_promo_discovery` as part of rollback or initial apply.

---

## 10. Conclusion

```text
APPROVED FOR W3-C
```

Historical design outcome. Live apply and verification are recorded in W3-C / W3-D evidence.

```text
contract name:     api.v_curated_promo_discovery
column contract:   21-column allowlist; promo_id text
row predicate:     active_status IN ('active','unknown')
dependency design: adapted aggregation over publish instances + signals
compatibility:     A — retain public view until W3-F
owner:             postgres
view security:     security_invoker=false; security_barrier=true
disclosure:        API view = publication boundary (columns + predicate)
site role (v1):    anon (SELECT only; no authenticated grants)
PostgREST:         expose api; explicit .schema('api')
rollback:          §9
```
