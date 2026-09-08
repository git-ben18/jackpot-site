# DB-W3-A — Contract inventory

| Field | Value |
|---|---|
| Track | DB-W3-A |
| Type | Read-only inventory + documentation |
| Depends on | refreshed Wave 2 handoff merged |
| Blocks | DB-W3-B |
| Primary repo | `jackpot-site` docs |
| Database mutation | **None** |

## Goal

Freeze the exact current curated-discovery database contract before designing `api.*`.

The working target is:

```text
api.v_curated_promo_discovery
```

but this packet must establish the facts from the current `public.v_curated_promo_discovery` implementation rather than assuming its dependency graph.

## Required inputs

Read:

```text
docs/architecture/DATABASE_PUBLISH_CONTRACT_HANDOFF.md
docs/architecture/DATABASE_API_CONTRACT_WAVE_3.md
docs/JSE-S3-CURATED-DISCOVERY-PLAN.md
docs/tasks/jse-s3/S3-E-curated-repository.md
```

Also use the current greenfield migration authority (`core`) and approved live catalog evidence where necessary.

## Tasks

1. Record current `jackpot-site/main` SHA.
2. Record accepted Wave 2 closeout reference / producer topology.
3. Fetch the authoritative definition of:

```text
public.v_curated_promo_discovery
```

using the migration that created/last changed it and/or `pg_get_viewdef` in an approved environment.

4. Record:
   - owner;
   - schema/name;
   - view definition;
   - `security_invoker` setting/current execution behavior;
   - grants;
   - dependent relations;
   - dependent functions if any;
   - selected output columns and types.

5. For every producer relation referenced by the view, classify:

```text
relation
current schema
Wave 2 disposition
RLS enabled?
site-role direct access today?
intended DB-W3 direct access? (must normally be NO)
```

6. Compare the actual view columns to the JSE-S3 allowlist:

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

7. Identify current active consumers of:

```text
public.v_curated_promo_discovery
```

At minimum search:

```text
jackpot-site
rewards-maxxing-frontend
core
jackpot-api-newsletter
jackpot-news
```

Classify matches:

```text
ACTIVE RUNTIME
ACTIVE OPERATIONAL TOOL
TEST/FIXTURE
CURRENT DOC
HISTORICAL DOC
```

8. Confirm event-overlap remains out of initial DB-W3 scope.
9. Create an inventory evidence file, recommended:

```text
docs/evidence/db-wave-3/W3-A-contract-inventory.md
```

## Deliverable requirements

The evidence must include:

- exact view SQL or a concise normalized representation;
- exact output columns;
- exact producer dependencies;
- current privilege/view-execution observations;
- current consumer inventory;
- explicit gaps/unknowns;
- conclusion:

```text
READY FOR W3-B
```

or:

```text
BLOCKED
```

with reasons.

## Out of scope

- creating `api`;
- altering view definitions;
- grants/RLS changes;
- editing `jackpot-site` runtime;
- dropping the public view;
- event-overlap contract design.

## Stop conditions

Stop if:

- the authoritative view definition cannot be established;
- a producer dependency appears outside the accepted Wave 2 topology without explanation;
- the actual column contract materially differs from JSE-S3;
- consumer inventory reveals an undocumented critical runtime dependency needing architectural review.

## Acceptance checklist

- [x] current view definition captured
- [x] owner/security/grants captured
- [x] producer dependency graph captured
- [x] actual columns/types captured
- [x] JSE-S3 allowlist comparison complete
- [x] cross-repo consumer inventory complete
- [x] event overlap confirmed deferred
- [x] evidence document committed
- [x] conclusion `READY FOR W3-B`

Status: [_status-W3-A.md](./_status-W3-A.md) · Evidence: [W3-A-contract-inventory.md](../../evidence/db-wave-3/W3-A-contract-inventory.md)
