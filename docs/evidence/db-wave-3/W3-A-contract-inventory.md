# W3-A — Contract inventory evidence

| Field | Value |
|---|---|
| Packet | DB-W3-A |
| Date | 2026-09-08 |
| Environment | Documentation + read-only catalog evidence (no live DDL; no production probe in this packet) |
| State | **VERIFIED** (inventory) → conclusion **READY FOR W3-B** |
| Branch | `docs/db-w3-a-b-contract-design` |

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

## 2. Authoritative object identity

| Property | Value | Evidence |
|---|---|---|
| Schema / name | `public.v_curated_promo_discovery` | Wave 0/2 live catalog; Stage B smoke |
| Owner | `postgres` | Wave 0 closeout; Wave 2 Step 3C view evidence |
| `security_invoker` | `true` | Wave 0 closeout; `WAVE_2_STEP_3C_VIEW_TRIGGER_POLICY_EVIDENCE.csv` |
| Relkind | view | Wave 2 Step 3C |
| Dependent functions in view body | none | Wave 0: only related routine is `touch_published_curated_updated_at()` on **base tables**, not the view |

### Pre–Wave 2 dependency graph (live catalog)

```text
public.v_curated_promo_discovery
  ← public.published_curated_offer_instances_raw
  ← public.published_curated_offer_signals_raw
```

Source: `WAVE_2_STEP_3C_VIEW_TRIGGER_POLICY_EVIDENCE.csv` / Wave 0 closeout.

### Post–Wave 2 expected dependency graph

Wave 2 Stage B physically `SET SCHEMA` those two tables into `publish` and smoke-selects:

```sql
select count(*) as curated_discovery_rows
from public.v_curated_promo_discovery;
```

PostgreSQL preserves view OID references across `SET SCHEMA`, so after Stage B the same view object depends on:

```text
public.v_curated_promo_discovery
  ← publish.published_curated_offer_instances_raw
  ← publish.published_curated_offer_signals_raw
```

The view **intentionally remains in `public`** during Wave 2 (Wave 2A report / Stage B packet: Wave 3 consumer concern).

---

## 3. View definition (normalized)

Exact live `pg_get_viewdef` text was **not re-exported** in this packet. Authoritative **creation/shape** sources:

1. **Applied-style DDL with `security_invoker = true`:**  
   `rewards-maxxing-frontend/_docs/planning/epic-a-curated-promo-discovery/epic-a-v0-supabase-migration-proposal.sql`
2. **Richer read-model guide DDL (same contract family):**  
   `epic-a-slice-a2-supabase-read-model-guide.md` § Frontend view
3. **Live security/dependency confirmation:** Wave 0 / Wave 2 Step 3C evidence in `core`

Normalized behavior (both DDL variants):

```text
WITH signal_rollup AS (
  aggregate signal_families, signal_types, gameplay_tags/badges,
  signals_json, top_signals_json, evidence_json
  FROM …published_curated_offer_signals_raw
  GROUP BY promo_id
)
SELECT
  instance identity + display fields from …published_curated_offer_instances_raw i
  LEFT JOIN signal_rollup r ON r.promo_id = i.promo_id
```

No embedded `ORDER BY` / `LIMIT` in the view; consumers apply filters/limits in application SQL/PostgREST.

**Gap (documented, non-blocking):** byte-identical live view text vs planning SQL was not re-fetched. Identity, owner, `security_invoker`, producer deps, and Stage B executability are established. W3-C must `pg_get_viewdef('public.v_curated_promo_discovery', true)` in the approved environment before authoring the final `api` migration body.

---

## 4. Output columns and types

### Full public view contract (planning + frontend docs)

| Column | Inferred type | In JSE-S3 allowlist? |
|---|---|---|
| `promo_id` | `text` | yes |
| `promo_slug` | `text` | yes |
| `observation_id` | `uuid` | **no** (lineage) |
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

Types are inferred from Epic A DDL/expressions and mapper usage; live `information_schema.columns` was not re-queried here (**gap**, non-blocking for design).

### JSE-S3 allowlist comparison

Every JSE-S3 allowlist column is present on the public view contract. Extra public columns are lineage/admin fields already excluded by:

- legacy `CURATED_PROMO_DISCOVERY_SELECT` in `rewards-maxxing-frontend/src/lib/server/curatedPromos.ts`
- jackpot-site mapper `CuratedPromoDiscoveryRow` / S3 plan allowlist

**Material contract mismatch:** none for the public widget surface. No stop condition triggered.

---

## 5. Producer relation classification

| Relation | Current schema (post–Wave 2) | Wave 2 disposition | RLS enabled? | Site-role direct access today? | Intended DB-W3 direct access? |
|---|---|---|---|---|---|
| `published_curated_offer_instances_raw` | `publish` | moved; producer-only | yes (preserved on move) | **NO** (`USAGE`/`SELECT` revoked from `anon`/`authenticated`/`PUBLIC`) | **NO** |
| `published_curated_offer_signals_raw` | `publish` | moved; producer-only | yes | **NO** | **NO** |

Related curated producers **not** referenced by this view (out of W3-A dependency set, deferred with event overlap):

- `publish.published_curated_offer_day`
- `publish.published_curated_offer_event_days`
- `publish.published_curated_offer_event_overlaps`

### Privilege / execution observation (critical for W3-B)

```text
public.v_curated_promo_discovery
  security_invoker = true
+ publish.* denied to anon/authenticated
⇒ low-privilege invoker cannot satisfy base-table privilege checks
```

Stage B smoke `count(*)` runs as migration/`postgres` context — it does **not** prove anon/site-role readability.

Proposal DDL historically granted:

```sql
grant select on public.v_curated_promo_discovery to service_role;
```

**Gap:** live grant matrix on the view for `anon` / `authenticated` / site identity was not re-probed in this packet. Even if `SELECT` on the view exists, `security_invoker=true` plus Wave 2 producer isolation implies low-privilege reads are not a viable long-term model without redesign.

---

## 6. Cross-repo consumer inventory

| Repo | Match | Classification |
|---|---|---|
| `jackpot-site` | types, mapper, fixtures, composed UI, JSE-S3 docs; **no live repository against DB yet** | TEST/FIXTURE + CURRENT DOC (+ presentation code awaiting S3-E/DB-W3) |
| `rewards-maxxing-frontend` | `src/lib/server/curatedPromos.ts` reads `v_curated_promo_discovery` (default `public` schema) with explicit allowlist SELECT | **ACTIVE RUNTIME** |
| `rewards-maxxing-frontend` | mapper/types/fixtures/tests referencing the view | TEST/FIXTURE + CURRENT DOC |
| `rewards-maxxing-frontend` | overlap path already uses `publish.published_curated_offer_event_overlaps` (separate from discovery view) | ACTIVE RUNTIME (overlap; out of DB-W3 scope) |
| `core` | Stage B / operator smoke SQL selecting the view; Wave 0–2 governance docs | ACTIVE OPERATIONAL TOOL + CURRENT DOC |
| `jackpot-api-newsletter` | no references found | none |
| `jackpot-news` | no references found | none |

No undocumented critical consumer outside the legacy frontend + ops smoke path. ACTIVE RUNTIME on `rewards-maxxing-frontend` is expected and drives compatibility strategy A (retain public view until W3-F).

---

## 7. Event overlap

Confirmed **deferred** for initial DB-W3:

- no `api.v_curated_offer_event_overlaps` in this wave;
- `publish.published_curated_offer_event_overlaps` remains producer/legacy-support state;
- JSE-S3 event-overlap UI remains deferred.

---

## 8. Gaps / unknowns

1. Exact live `pg_get_viewdef` text (capture required in W3-C preflight).
2. Exact live column OID types via catalog (inferable; confirm in W3-C).
3. Exact live `GRANT` ACL on `public.v_curated_promo_discovery` for anon/authenticated (confirm in W3-C/D).
4. Whether any PostgREST client still successfully reads the public view as a low-privilege role after Wave 2 (operational; expected failure under invoker + publish isolation).

None of these block **design** of `api.*` (W3-B). They constrain W3-C apply/verification evidence.

---

## 9. Conclusion

```text
READY FOR W3-B
```

Reasons:

- Wave 2 handoff gate satisfied on `jackpot-site/main`.
- View identity, owner, `security_invoker=true`, and producer dependency pair are established.
- JSE-S3 allowlist is a subset of the public view contract (no material mismatch).
- Producer isolation after Wave 2 makes continuing `security_invoker=true` for site reads incompatible with low-privilege access — this is a design input for W3-B, not a W3-A blocker.
- Event overlap remains explicitly deferred.
- Active consumers are inventoried; compatibility retention of the public view is required until W3-F.
