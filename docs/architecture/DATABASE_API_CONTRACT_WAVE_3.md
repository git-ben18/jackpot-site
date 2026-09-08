# Database API Contract — Wave 3

## Status

**AUTHORITY — live `api` contract applied and W3-D accepted; W3-E next**

| Packet | Status |
|---|---|
| W3-A | **COMPLETE** |
| W3-B | **APPROVED** |
| W3-C | **APPLIED AND VERIFIED** (core migration-history reconciliation required) |
| W3-D | **ACCEPTED** |
| W3-E | **NEXT** |
| W3-F | pending |
| W3-G | pending |

This document defines the database-governance Wave 3 (`DB-W3`) contract for `jackpot-site`.

It is intentionally distinct from `JSE-S3`:

```text
JSE-S3
= migrate / harden curated-discovery application behavior into jackpot-site

DB-W3
= establish the governed Supabase application-read contract consumed by jackpot-site
```

Wave 2 is complete at the database-governance level. W3-A–D evidence lives under `docs/evidence/db-wave-3/`.

`git-ben18/core` remains Supabase migration authority. Live W3-C was applied/verified in Supabase; a convergent `core` migration is still required so history matches production.

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
- mapper/DTO boundaries remain the application-level protection against database-shape leakage;
- the API view also enforces `WHERE active_status IN ('active','unknown')` as part of the publication contract (`promo_id` is `text`).

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

Accepted API view dependencies (exact):

```text
publish.published_curated_offer_instances_raw
publish.published_curated_offer_signals_raw
```

Do not grant `jackpot-site` / `anon` direct SELECT on producer tables.

Do not define `api.v_curated_promo_discovery` by chaining through `public.v_curated_promo_discovery`.

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
→ succeeds for rows matching the view predicate
   (active_status IN ('active','unknown'))

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

Accepted posture:

```text
owner            = postgres
security_invoker = false
security_barrier = true
```

Public disclosure boundary (both required):

```text
1. explicit 21-column projection
2. WHERE i.active_status IN ('active', 'unknown')
```

```text
Underlying publish RLS is intentionally not relied upon to filter rows
for api.v_curated_promo_discovery.

The API view itself is the public disclosure boundary.

anon receives SELECT on the API view only and receives no direct
publish privileges.
```

Application filters such as `activeOnly` may be redundant UX shaping; public safety must not depend on them.

Do not solve view access by broadly granting producer-table SELECT to `anon`.

---

## 9. Migration authority

Supabase schema / view / grant / RLS / PostgREST configuration changes for DB-W3 belong to:

```text
git-ben18/core
```

`jackpot-site` must not start a second database migration history.

Live W3-C was applied and verified in Supabase (SQL Editor). An equivalent convergent migration in `core` remains required so repository migration history matches the accepted production state. That follow-up is not authored from `jackpot-site`.

Expected responsibility split:

```text
core
  → api schema/view migration (incl. history reconciliation)
  → grants / view options
  → PostgREST schema configuration when required
  → operator/evidence SQL

jackpot-site
  → low-privilege domain repository (W3-E)
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

W3-D is **ACCEPTED**. W3-E / S3-E must cut over to the explicit `api` contract (not `public`).

S3-G remains blocked until W3-E cutover is complete.

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
W3-A  COMPLETE — Contract inventory
  ↓
W3-B  APPROVED — API schema / view design
  ↓
W3-C  APPLIED AND VERIFIED — Migration + privileges
      (core migration-history reconciliation tracked)
  ↓
W3-D  ACCEPTED — Low-privilege acceptance
  ↓
W3-E  NEXT — jackpot-site cutover
  ↓
W3-F  pending — public contract retirement decision
  ↓
W3-G  pending — evidence + closeout
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

- [x] exact old public-view definition/dependencies recorded;
- [x] accepted `api.v_curated_promo_discovery` contract recorded;
- [ ] `api` schema/view migration merged in `core` (live apply done; history reconciliation pending);
- [x] required production/operator apply completed;
- [x] low-privilege explicit-`api` SELECT succeeds;
- [x] low-privilege writes are denied;
- [x] low-privilege `publish.*` reads are denied;
- [x] unrelated legacy/internal reads were not introduced by `api`;
- [x] PostgREST `api` routing is proven;
- [ ] `jackpot-site` repository queries explicit `api` schema;
- [ ] selected-column allowlist remains enforced in site repository;
- [ ] tests/typecheck/build pass for cutover;
- [ ] `public.v_curated_promo_discovery` consumer sweep is complete;
- [ ] retain/retire disposition for the old public view is recorded;
- [ ] DB-W3 closeout evidence is committed.

Only then should DB-W3 be marked **COMPLETE**.
