# Database API Contract — Wave 3

## Status

**PLANNING AUTHORITY — Wave 2 gate satisfied; W3-A/B design accepted; W3-C+ pending in `core`**

This document defines the database-governance Wave 3 (`DB-W3`) target for `jackpot-site`.

It is intentionally distinct from `JSE-S3`:

```text
JSE-S3
= migrate / harden curated-discovery application behavior into jackpot-site

DB-W3
= establish the governed Supabase application-read contract consumed by jackpot-site
```

Wave 2 is complete at the database-governance level:

- greenfield serving projections were moved from `public.*` to restricted `publish.*`;
- `publish` is exposed through PostgREST for approved server-side access;
- producer access is service-role only at the schema/relation layer;
- the legacy overlap consumer was cut over to explicit `publish`;
- Wave 2 closeout evidence exists in `rewards-maxxing-frontend`.

The refreshed `DATABASE_PUBLISH_CONTRACT_HANDOFF.md` is on `jackpot-site/main` and records Wave 2 as complete.

W3-A inventory and W3-B design acceptance are recorded under `docs/evidence/db-wave-3/`. Migration SQL remains `core` authority (W3-C).

This document does not itself apply DDL.

---

## 1. Goal

Create a stable, low-privilege application contract between internal producer state and `jackpot-site`.

Target separation:

```text
canonical / processing truth
        ↓
core producer jobs
        ↓
Supabase publish.*
internal serving projections
        ↓
Supabase api.*
approved application read contracts
        ↓
jackpot-site domain repository
        ↓
public DTOs / UI
```

The application must not depend directly on `publish.*`.

The producer schema may evolve without forcing the public site to understand producer-table topology, provided the accepted `api.*` contract remains stable.

---

## 2. Initial Wave 3 consumer

Initial consumer:

```text
git-ben18/jackpot-site
```

Initial product capability:

```text
curated promo discovery
```

Initial proposed API contract:

```text
api.v_curated_promo_discovery
```

This name is the working target for DB-W3 planning. W3-A and W3-B must verify the existing `public.v_curated_promo_discovery` definition, dependencies, ownership, grants, view options, and selected columns before the migration is finalized.

Do not create additional `api.*` objects merely because equivalent producer tables exist.

---

## 3. Initial selected-column contract

DB-W3 should preserve the public curated-discovery contract already frozen by JSE-S3 unless a reviewed contract change is required.

Initial allowlist:

```text
promo_id
promo_slug
brand
market_slug
location_label
title
subtitle
source_kind
source_url
primary_asset_url
active_status
visible_start_date
visible_end_date
observed_at
signal_families
signal_types
gameplay_tags
badges
top_signals_json
signals_json
evidence_json
```

Rules:

- no `select('*')` in `jackpot-site`;
- no lineage/debug/admin columns are added without a contract decision;
- the database view contract and application repository allowlist must agree;
- mapper/DTO boundaries remain the application-level protection against database-shape leakage.

---

## 4. Event overlap disposition

Initial DB-W3 does **not** require an event-overlap public contract.

Existing JSE-S3 decision remains:

```text
event overlap UI = deferred
```

Therefore this wave must not create:

```text
api.v_curated_offer_event_overlaps
```

unless a separate explicit decision reopens that product capability and defines:

- consumer requirement;
- selected columns;
- producer dependencies;
- low-privilege contract;
- UI/runtime ownership;
- acceptance evidence.

Existing `publish.published_curated_offer_event_overlaps` remains internal producer/legacy-support state.

---

## 5. Producer boundary

Wave 2 established `publish.*` as the internal greenfield serving domain.

DB-W3 must inventory the exact producer dependencies of the curated-discovery contract rather than guessing them.

Likely relevant producer relations include members of the moved Wave 2 family such as:

```text
publish.published_curated_offer_instances_raw
publish.published_curated_offer_signals_raw
publish.published_curated_offer_day
```

The exact view dependency graph must be taken from the live/database-authoritative view definition and migration history during W3-A.

Do not grant `jackpot-site` direct SELECT on producer tables for convenience.

---

## 6. Schema and privilege model

Target posture (DB-W3 v1, as accepted in W3-B):

| Identity / role class | `publish.*` | `api.*` |
|---|---:|---:|
| **`anon`** (frozen v1 site role) | NO | `USAGE` schema + `SELECT` approved views only |
| `authenticated` | NO | **no new grants in DB-W3 v1** |
| `service_role` | internal/admin as required | allowed as administrative capability |
| producer writers | approved producer DML | no application dependency |

Frozen grants:

```sql
GRANT USAGE ON SCHEMA api TO anon;
GRANT SELECT ON api.v_curated_promo_discovery TO anon;
```

Wave 3 must prove behavior, not merely document intended grants.

Required invariants:

```text
anon SELECT api.v_curated_promo_discovery
→ succeeds for all rows the view returns

INSERT / UPDATE / DELETE api contract
→ denied for anon

SELECT publish.*
→ denied for anon

SELECT unrelated legacy/internal tables
→ not newly enabled by Wave 3
```

---

## 7. PostgREST / Data API exposure

`api` must not be assumed reachable simply because the schema exists.

Wave 3 must explicitly address:

- Supabase Data API exposed-schema configuration;
- `authenticator.pgrst.db_schemas`;
- schema `USAGE`;
- relation `SELECT`;
- schema cache reload;
- explicit schema selection from Supabase/PostgREST.

Expected application form:

```ts
client
  .schema('api')
  .from('v_curated_promo_discovery')
```

The exact Supabase-js implementation may vary, but schema selection must be explicit once the contract moves out of `public`.

---

## 8. View execution / RLS / grants

W3-B accepted posture (see evidence):

```text
owner = postgres
security_invoker = false
```

Explicit public-safety decision:

```text
Underlying publish RLS is intentionally bypassed for this API view.
The API view itself is the public disclosure boundary.
Every row reachable through its definition is classified public-safe.
```

Application filters such as `activeOnly` are not disclosure controls.

Do not solve view access by broadly granting producer-table SELECT to `anon`.

If a future row class is not public-safe under owner-rights, revise the view definition (or abandon owner-rights) before exposing it through `api`.

---

## 9. Migration authority

Supabase schema / view / grant / RLS / PostgREST configuration changes for DB-W3 belong to the current greenfield migration authority:

```text
git-ben18/core
```

`jackpot-site` must not start a second database migration history and must not apply ad-hoc production DDL.

Expected responsibility split:

```text
core
  → api schema/view migration
  → grants / RLS / view options
  → PostgREST schema configuration when required
  → operator/evidence SQL

jackpot-site
  → low-privilege domain repository
  → explicit api schema selection
  → selected-column query
  → mapper / DTO / UI integration
```

---

## 10. Relationship to JSE-S3

JSE-S3 work already completed remains valid where it is independent of the physical database schema.

Preserve:

- S3-A baseline/decisions except the superseded physical view location;
- S3-B DTOs, mapper, fixtures, tests;
- S3-C leaf presentation;
- S3-D hardened/composed fixture-driven presentation;
- low-privilege/no-service-role security invariant;
- selected-column allowlist;
- fail-closed behavior;
- event-overlap deferral;
- analytics deferral.

Refresh or supersede:

```text
D-S3-04
public.v_curated_promo_discovery
```

to the accepted DB-W3 contract:

```text
api.v_curated_promo_discovery
```

after W3-D acceptance.

S3-E must not merge against the old `public` physical contract if DB-W3 has not yet accepted the replacement.

S3-G remains blocked until the API contract is accepted and S3-E is updated.

---

## 11. Compatibility strategy for `public.v_curated_promo_discovery`

Wave 3 does not automatically drop the old public view.

Lifecycle:

```text
inventory current consumers
        ↓
create / accept api contract
        ↓
cut jackpot-site to api.*
        ↓
search all active consumers
        ↓
classify remaining public-view dependency
        ↓
retain temporarily OR retire through reviewed migration
```

Historical docs do not count as runtime consumers.

Do not remove the old view until W3-F proves its disposition.

---

## 12. Work packets

Sequential implementation packets:

```text
W3-A  Contract inventory
  ↓
W3-B  API schema / view design
  ↓
W3-C  Migration + privileges
  ↓
W3-D  Low-privilege acceptance
  ↓
W3-E  jackpot-site cutover
  ↓
W3-F  public contract retirement decision
  ↓
W3-G  evidence + closeout
```

Task files live under:

```text
docs/tasks/db-wave-3/
```

Hand agents one packet at a time.

---

## 13. Stop conditions

Stop and resolve the boundary before continuing when:

- the exact current discovery-view definition cannot be established;
- the API contract would require site access to producer tables;
- a service-role credential appears necessary for ordinary public rendering;
- the low-privilege identity can write to the API contract;
- unrelated `publish.*` or legacy objects become readable;
- selected columns diverge from the accepted DTO contract without review;
- `api` is assumed PostgREST-visible without evidence;
- migration work is attempted from `jackpot-site`;
- event-overlap scope is silently reintroduced;
- a compatibility view is dropped before consumer inventory is complete.

---

## 14. Wave 3 acceptance

DB-W3 is complete only when all are true:

- [ ] exact old public-view definition/dependencies recorded;
- [ ] accepted `api.v_curated_promo_discovery` contract recorded;
- [ ] `api` schema/view migration merged in `core`;
- [ ] required production/operator apply completed;
- [ ] low-privilege explicit-`api` SELECT succeeds;
- [ ] low-privilege writes are denied;
- [ ] low-privilege `publish.*` reads are denied;
- [ ] unrelated legacy/internal reads were not introduced;
- [ ] PostgREST `api` routing is proven;
- [ ] `jackpot-site` repository queries explicit `api` schema;
- [ ] selected-column allowlist remains enforced;
- [ ] tests/typecheck/build pass;
- [ ] `public.v_curated_promo_discovery` consumer sweep is complete;
- [ ] retain/retire disposition for the old public view is recorded;
- [ ] DB-W3 closeout evidence is committed.

Only then should DB-W3 be marked **COMPLETE**.
