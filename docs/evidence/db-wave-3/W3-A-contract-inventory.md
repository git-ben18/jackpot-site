# W3-A — Contract inventory evidence

| Field | Value |
|---|---|
| Packet | DB-W3-A |
| Date | 2026-09-08 |
| Environment | Live Supabase catalog (operator queries) + Wave 0/2 evidence |
| State | **COMPLETE** → conclusion **READY FOR W3-B** |
| Branch | reconciled on `docs/db-w3-d-low-privilege-acceptance` |

## 1. Baselines recorded

| Item | Value |
|---|---|
| `jackpot-site` `main` SHA (inventory start) | `814931bde8ffda93be433d882700ddbe6e20da87` |
| Wave 2 handoff on `main` | `docs/architecture/DATABASE_PUBLISH_CONTRACT_HANDOFF.md` — Wave 2 **COMPLETE**; `publish.*` accepted; **11** producer relations; `api.*` next (DB-W3) |
| `core` HEAD consulted (sparse clone) | `f04188d4ae7f2ce764d8fa99c2f9fa3fd5633300` |
| Wave 2 Stage B migration | `core` `supabase/migrations/20260908001000_move_greenfield_publish_tables.sql` @ commit `21fdc1a` |
| Functional frontend baseline (JSE-S3) | `rewards-maxxing-frontend@466bfb065a9c34010ee0f0de22b419299259fa46` |
| Legacy frontend `origin/master` at inventory | `143093af18edba443204876c03c8245596b04ee3` |

Gate check: refreshed Wave 2 handoff is on `jackpot-site/main` → **W3-A may proceed**.

---

## 2. Authoritative object identity (live)

| Property | Value |
|---|---|
| Schema / name | `public.v_curated_promo_discovery` |
| Owner | `postgres` |
| Relkind | view |
| `security_invoker` | `true` |
| Dependent functions in view body | none (related routine `touch_published_curated_updated_at()` is on base tables only) |

### Live dependency graph

Exact live definition references only:

```text
public.v_curated_promo_discovery
  ← publish.published_curated_offer_instances_raw
  ← publish.published_curated_offer_signals_raw
```

No event-day or event-overlap relation is in this view.

### Normalized live behavior

```text
signal_rollup CTE
    ↓
aggregate signal families/types/JSON evidence from
publish.published_curated_offer_signals_raw

LEFT JOIN

publish.published_curated_offer_instances_raw
```

No embedded `ORDER BY` / `LIMIT` in the view.

### Historical pre–Wave 2 dependency note

Wave 0 / Wave 2 Step 3C catalog previously recorded the same OID pair while tables still lived in `public`. Stage B `SET SCHEMA` moved those producers to `publish`; the public view remained in `public` as a Wave 3 consumer concern.

---

## 3. Exact live public-view columns / types (26)

Verified live catalog types:

| Column | Type | In JSE-S3 / API allowlist? |
|---|---|---|
| `promo_id` | `text` | yes |
| `promo_slug` | `text` | yes |
| `observation_id` | `text` | **no** (lineage) |
| `brand` | `text` | yes |
| `market_slug` | `text` | yes |
| `location_label` | `text` | yes |
| `title` | `text` | yes |
| `subtitle` | `text` | yes |
| `source_kind` | `text` | yes |
| `source_url` | `text` | yes |
| `primary_asset_url` | `text` | yes |
| `active_status` | `text` | yes |
| `visible_start_date` | `date` | yes |
| `visible_end_date` | `date` | yes |
| `observed_at` | `timestamptz` | yes |
| `signal_families` | `text[]` | yes |
| `signal_types` | `text[]` | yes |
| `gameplay_tags` | `text[]` | yes |
| `badges` | `text[]` | yes |
| `top_signals_json` | `jsonb` | yes |
| `signals_json` | `jsonb` | yes |
| `evidence_json` | `jsonb` | yes |
| `source_folder_slug` | `text` | **no** (lineage) |
| `import_run_id` | `text` | **no** (lineage) |
| `created_at` | `timestamptz` | **no** |
| `updated_at` | `timestamptz` | **no** |

Corrections vs early draft inventory:

```text
promo_id       = text   (not uuid)
observation_id = text   (not uuid)
```

The JSE-S3 / DB-W3 API public allowlist is the **21-column** subset excluding lineage columns above.

**Material contract mismatch:** none for the public widget surface.

---

## 4. Producer relation classification

| Relation | Current schema | Wave 2 disposition | RLS enabled? | Site-role direct access | Intended DB-W3 direct access? |
|---|---|---|---|---|---|
| `published_curated_offer_instances_raw` | `publish` | moved; producer-only | yes | **NO** | **NO** |
| `published_curated_offer_signals_raw` | `publish` | moved; producer-only | yes | **NO** | **NO** |

Related curated producers **not** referenced by this view (deferred with event overlap):

- `publish.published_curated_offer_day`
- `publish.published_curated_offer_event_days`
- `publish.published_curated_offer_event_overlaps`

### Privilege / execution observation (design input for W3-B)

```text
public.v_curated_promo_discovery
  security_invoker = true
+ publish.* denied to anon/authenticated
⇒ low-privilege invoker cannot satisfy base-table privilege checks
```

This made continuing invoker-mode site reads incompatible with Wave 2 producer isolation — resolved later by the owner-rights `api` view (W3-B/C), not by granting `publish` to `anon`.

---

## 5. Former public-view ACL (historical pre–W3-C)

Live catalog evidence **before W3-C cleanup** showed broad legacy grants on `public.v_curated_promo_discovery` to:

```text
anon
authenticated
postgres
service_role
```

including:

```text
SELECT
INSERT
UPDATE
DELETE
TRUNCATE
REFERENCES
TRIGGER
```

This is **historical pre-W3-C evidence only**. It is **not** the current accepted ACL state. W3-C tightened `public.v_curated_promo_discovery` to **service_role SELECT compatibility only** (see W3-C evidence).

---

## 6. Cross-repo consumer inventory

| Repo | Match | Classification |
|---|---|---|
| `jackpot-site` | types, mapper, fixtures, composed UI, JSE-S3 docs; **no live repository against DB yet** | TEST/FIXTURE + CURRENT DOC (+ presentation awaiting S3-E / W3-E) |
| `rewards-maxxing-frontend` | `src/lib/server/curatedPromos.ts` reads `v_curated_promo_discovery` (default `public`) with explicit allowlist SELECT | **ACTIVE RUNTIME** |
| `rewards-maxxing-frontend` | mapper/types/fixtures/tests referencing the view | TEST/FIXTURE + CURRENT DOC |
| `rewards-maxxing-frontend` | overlap path uses `publish.published_curated_offer_event_overlaps` | ACTIVE RUNTIME (overlap; out of DB-W3 scope) |
| `core` | Stage B / operator smoke SQL; Wave 0–2 governance docs | ACTIVE OPERATIONAL TOOL + CURRENT DOC |
| `jackpot-api-newsletter` | no references found | none |
| `jackpot-news` | no references found | none |

ACTIVE RUNTIME on `rewards-maxxing-frontend` drives compatibility strategy A (retain public view until W3-F). After W3-C, anon can no longer SELECT that public view; service_role compatibility remains.

---

## 7. Event overlap

Confirmed **deferred** for initial DB-W3:

- no `api.v_curated_offer_event_overlaps` in this wave;
- `publish.published_curated_offer_event_overlaps` remains producer/legacy-support state;
- JSE-S3 event-overlap UI remains deferred.

---

## 8. Gaps closed

Former inventory gaps are **closed** by operator live catalog queries:

| Former gap | Resolution |
|---|---|
| live `pg_get_viewdef` / dependency graph | verified: instances + signals under `publish` only |
| live column types | verified 26 columns; `promo_id`/`observation_id` = `text` |
| live grant matrix on public view | verified broad legacy ACL (historical); post–W3-C state recorded in W3-C evidence |

---

## 9. Conclusion

```text
COMPLETE
READY FOR W3-B
```

Reasons:

- Wave 2 handoff gate satisfied on `jackpot-site/main`.
- Live view identity, owner, `security_invoker=true`, and producer dependency pair are verified.
- Exact live columns/types are verified; JSE-S3 allowlist is the 21-column subset.
- Event overlap remains deferred.
- Consumers inventoried; public-view retention until W3-F remains required for compatibility planning.
