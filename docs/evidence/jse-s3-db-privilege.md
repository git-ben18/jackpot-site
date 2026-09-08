# S3-F — Database privilege / view acceptance evidence

| Field | Value |
|---|---|
| Packet | S3-F |
| Date | 2026-09-08 |
| Conclusion | **ACCEPTED** |
| Decision | D-S3-06 |
| Reconciliation | Evidence reused from DB-W3; no separate S3-F live re-probe required |

## Authority chain

S3-F acceptance is satisfied by the DB Wave 3 proofs that superseded the original `public.v_curated_promo_discovery` public-read path:

| Source | Role |
|---|---|
| [DB-W3-D low-privilege acceptance](./db-wave-3/W3-D-low-privilege-acceptance.md) | PostgREST / `anon` matrix for `api.v_curated_promo_discovery` — **ACCEPTED** |
| [W3-E repository cutover](../tasks/db-wave-3/_status-W3-E.md) | Application uses `.schema('api')` + allowlist; no service-role; no public-view fallback — **Complete** |
| [W3-C migration apply](./db-wave-3/W3-C-migration-apply.md) | Physical view options, owner, grants, row predicate — **APPLIED AND VERIFIED** |

S3-F-RLS is **N/A** — see [`_status-S3-F-RLS.md`](../tasks/jse-s3/_status-S3-F-RLS.md). The original public-view invoker conflict was resolved by DB-W3, not by an S3-F-RLS migration on `public.v_curated_promo_discovery`.

## Accepted contract record

```text
identity:
anon / publishable key class

physical contract:
api.v_curated_promo_discovery

owner:
postgres

security_invoker:
false

security_barrier:
true

row boundary:
active_status IN ('active','unknown')

SELECT api:
PASS

DML api:
DENIED

SELECT publish producers:
DENIED

service_role application path:
ABSENT

conclusion:
ACCEPTED
```

## D-S3-06 matrix mapping

| D-S3-06 requirement | Evidence | Result |
|---|---|---|
| `SELECT api.v_curated_promo_discovery` (approved columns) succeeds | W3-D cases A/B | **PASS** |
| `INSERT` / `UPDATE` / `DELETE` denied | W3-D cases C/D/E (ACL + non-updatable view) | **DENIED** |
| Unrelated / producer reads denied | W3-D cases F/G/H (`publish` schema denied; producers not in `api`) | **DENIED** |
| Raw/canonical tables not newly exposed for the site | W3-C grants + W3-D H; DB-W3 did not place producers into `api` | **PASS** |
| View owner / `security_invoker` understood | W3-C / W3-B: owner `postgres`; `security_invoker=false`; `security_barrier=true` | **Recorded** |
| No service-role for ordinary curated rendering | W3-E cutover + S3-E repository (`SUPABASE_PUBLISHABLE_KEY` / anon class only) | **ABSENT** |

## Application path (W3-E)

```text
curatedPromoRepository
  → publicSupabase (publishable / anon class)
  → .schema('api')
  → from('v_curated_promo_discovery')
  → explicit 21-column allowlist
  → curatedPromoDiscoveryMapper
```

No `SUPABASE_SERVICE_ROLE_KEY`, no `publish.*` direct read, no silent fallback to `public.v_curated_promo_discovery`.

## Re-open rule

Re-open S3-F (and consider S3-F-RLS only if the live DB contract regresses) when any of the following drift:

- physical contract leaves `api.v_curated_promo_discovery`;
- `security_invoker` / `security_barrier` / owner change without a new accepted matrix;
- `anon` loses SELECT or gains DML / `publish` reach;
- application reintroduces service-role or public-view fallback.

Until then, this packet remains **ACCEPTED**.
