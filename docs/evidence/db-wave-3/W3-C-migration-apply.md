# W3-C — Migration apply evidence

| Field | Value |
|---|---|
| Packet | DB-W3-C |
| Date | 2026-09-08 |
| Environment | Approved Supabase project (SQL Editor + Data API settings) |
| State | **APPLIED AND VERIFIED** — core migration-history reconciliation required |
| Applied by | Operator (transactional SQL Editor apply) |
| Migration authority | Still `git-ben18/core` (see §4) |

## 1. Applied facts

The operator successfully executed a transactional W3-C SQL apply that:

```text
created/validated schema api
owner = postgres

re-established deny-by-default api schema ACL

created:
api.v_curated_promo_discovery

view options:
security_invoker=false
security_barrier=true

projected only the approved 21 columns

added:
WHERE i.active_status IN ('active','unknown')

revoked broad privileges on the api view

granted:
USAGE api → anon, service_role
SELECT api.v_curated_promo_discovery → anon, service_role

gave no new authenticated api grant

left anon without publish schema/table access

tightened legacy:
public.v_curated_promo_discovery
to service_role SELECT compatibility only

updated:
authenticator.pgrst.db_schemas
to include:
public, graphql_public, publish, api

reloaded PostgREST config/schema
```

Supabase Data API UI was updated and confirmed to expose exactly:

```text
public
publish
api
graphql_public
```

The transaction contained postcondition assertions and completed successfully.

### Production row note at apply time

```text
active_status = active
row_count     = 20
```

The `active_status IN ('active','unknown')` predicate did not remove any then-current public rows.

## 2. Objects / grants summary

| Object | Result |
|---|---|
| `api` schema | exists; owner `postgres`; deny-by-default |
| `api.v_curated_promo_discovery` | exists; owner-rights; `security_barrier=true` |
| `anon` | `USAGE api` + `SELECT` view only; no API DML; no `publish` |
| `authenticated` | no new `api` grants |
| `service_role` | `USAGE api` + `SELECT` view; existing publish access unchanged by intent |
| `public.v_curated_promo_discovery` | retained; tightened to **service_role SELECT** compatibility |

## 3. Runtime verification handoff

Low-privilege PostgREST proof is **W3-D** (`ACCEPTED`). See [W3-D-low-privilege-acceptance.md](./W3-D-low-privilege-acceptance.md).

## 4. Migration-authority note

```text
Operational W3-C state has been applied and verified in Supabase.

The equivalent convergent/reconciliation migration still belongs in
git-ben18/core so migration history matches the accepted production state.
```

Do **not** author that `core` migration from `jackpot-site`.

This is a **migration-history reconciliation follow-up**, not a blocker to the already-proven W3-D runtime contract.

## 5. Conclusion

```text
APPLIED AND VERIFIED
core migration-history reconciliation required
```

Alternate completion vocabulary:

```text
COMPLETE — live state applied/verified;
core migration-history reconciliation tracked
```
