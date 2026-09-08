# Database Publish Contract Handoff — `core` → `jackpot-site`

## Status

| Field | Value |
|---|---|
| Document role | Architecture dependency record — no runtime implementation |
| Wave 2 | **COMPLETE** |
| `publish.*` topology | **accepted** |
| Producer relations | **11** migrated and verified |
| `api.*` contract | **next governed step** (DB-W3) |
| JSE-S3 live integration | **paused pending DB-W3** |

This document records the database-governance result of Waves 1–2 that affects the future curated-discovery integration in `jackpot-site`.

It does not authorize S3 live-data integration and does not override `AGENTS.md`, JSE-001, JSE-003, or accepted `jackpot-news` decisions.

---

## 1. Why this handoff exists

The current Supabase project contains legacy Jackpot Homie application/scoring objects and newer greenfield `core` serving projections together in `public`.

The target architecture is being separated so `jackpot-site` does not accidentally inherit the physical storage topology or high-privilege access patterns of `rewards-maxxing-frontend`.

Wave 1 classifies the old offer/Bayesian/snapshot family as legacy compatibility state.

Wave 2 selects a dedicated Supabase `publish.*` domain for greenfield serving projections produced by `core`.

**Wave 2 outcome:** the `publish.*` topology is accepted, and **11 producer relations** have been migrated and verified. The next governed step is the deliberate `api.*` read contract (DB-W3). JSE-S3 live integration remains paused until that contract wave completes.

---

## 2. Legacy dependencies are not target dependencies

The following legacy family is intentionally outside the initial target architecture:

```text
public.emails
public.offers
public.offer_value_components
public.clusters

public.offer_scores
public.offer_rankings
public.offer_hybrid_score
public.brand_efficiency_by_week

public.landing_snapshots
public.landing_snapshot_by_brand

public.latest_strength_with_trend
public.latest_valid_strength_index
public.offers_groupable_with_received_at
public.offers_with_received_at
```

The fact that `rewards-maxxing-frontend` uses any of these objects does not authorize `jackpot-site` to query them.

`public.offer_feedback` is separately classified as legacy frontend interaction telemetry, not as canonical/scoring state for the target.

---

## 3. Greenfield producer topology

The database-governance target is:

```text
core raw/canonical/event data
        ↓
DuckDB publish.*
        ↓
core Python sync writers
        ↓
Supabase publish.*
```

**Wave 2 acceptance:** this `publish.*` producer topology is accepted. **11 producer relations** are migrated and verified under that topology.

Confirmed writer-backed projections include the future equivalents of:

```text
publish.published_offer_instances_raw
publish.published_offer_signals_raw
publish.published_offer_day

publish.published_events_raw
publish.published_event_windows_raw

publish.published_curated_offer_instances_raw
publish.published_promo_event_matchup_candidates
```

`core` remains responsible for producer lineage and the current Supabase migration history while that authority remains in force.

---

## 4. `publish.*` is not the public website API

The target site must not treat the new `publish` schema as an unrestricted application contract.

Desired separation:

```text
Supabase publish.*
        ↓
deliberate read/API projection
        ↓
low-privilege jackpot-site server repository
        ↓
public DTO / UI
```

The future application-facing schema is expected to be evaluated as a dedicated `api.*` contract layer.

**Next governed step (DB-W3):** accept the `api.*` / read-contract location and selected columns. The first likely contract remains curated promo discovery, but its final schema/object name must be accepted by that wave before S3 live integration resumes.

---

## 5. Relationship to current JSE-S3 planning

The current S3 planning document names:

```text
public.v_curated_promo_discovery
```

as its read contract.

Database governance has since identified a stronger target separation:

```text
publish producer objects
        ↓
api/read contract
        ↓
jackpot-site
```

Therefore:

- do **not** implement or broaden live S3 database access merely to satisfy the older physical `public` location;
- keep the current low-privilege, selected-column, domain-repository, no-service-role invariants;
- treat the final schema/object location of the curated discovery view as **pending DB-W3 (`api.*` contract)**;
- amend/refresh the S3 planning decision before live cutover once the database contract is approved.

This is a tightening of storage/API separation, not permission to weaken JSE-S3 security requirements.

---

## 6. Security invariants that remain unchanged

Ordinary public curated rendering must still:

- use a low-privilege server-side identity;
- never use `SUPABASE_SERVICE_ROLE_KEY`;
- never fall back to an admin/service-role client;
- use an explicit selected-column allowlist;
- map database rows to public DTOs at the repository boundary;
- deny browser writes;
- fail safely for visitors;
- produce useful server-side operational evidence;
- avoid exposing producer/internal objects merely to make the widget work.

---

## 7. Curated/event serving objects still requiring producer-resolution work

The current governance review identified several serving objects whose standardized `core` writer path is not yet fully resolved:

```text
published_curated_offer_signals_raw
published_curated_offer_day
published_curated_offer_event_days
published_curated_offer_event_overlaps
```

The site must not infer a target contract directly from these physical tables until their producer/provenance and target placement are confirmed.

Event-overlap UI remains deferred under the existing S3 decision unless separately reopened.

---

## 8. S3 restart prerequisites

### Wave 2 progress (complete)

```text
[x] Wave 2 COMPLETE
[x] publish.* topology accepted
[x] 11 producer relations migrated and verified
```

### Still required before live curated discovery (DB-W3+)

```text
[ ] accepted api/read contract location and selected columns (DB-W3 — next governed step)
[ ] low-privilege SELECT evidence against that contract
[ ] INSERT / UPDATE / DELETE denial evidence
[ ] evidence that producer/internal tables are not newly public to jackpot-site
[ ] documented view execution / RLS / grant behavior
```

**JSE-S3 live integration remains paused pending DB-W3.**

At that point, update the authoritative S3 planning document and resume its live-integration acceptance work.

---

## 9. What `jackpot-site` should do now

While DB-W3 defines the `api.*` contract:

```text
continue fixture/DTO/UI work only where already authorized
keep live DB integration paused pending DB-W3
avoid adding service-role configuration
avoid binding code to public.published_* or publish.* storage tables as the site API
avoid copying legacy frontend Supabase helpers
```

---

## 10. No-change confirmation

```text
No jackpot-site runtime code changed.
No Supabase dependency was added.
No credential/configuration changed.
No JSE route boundary changed.
No live database contract was accepted by this document alone.
Wave 2 publish.* topology acceptance does not authorize S3 live integration.
```
