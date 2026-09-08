# DB-W3-G — Wave 3 evidence and closeout

| Field | Value |
|---|---|
| Track | DB-W3-G |
| Type | Documentation / evidence |
| Depends on | W3-A through W3-F complete |
| Output | DB-W3 closeout |
| Database mutation | None |

## Goal

Record enough evidence to declare the database API-contract wave complete without relying on memory or transient operator output.

## Required closeout evidence

### Baselines / authority

Record:

- Wave 2 handoff/closeout reference;
- `jackpot-site` starting SHA for DB-W3;
- `core` migration-authority SHA/PR(s);
- final `jackpot-site` SHA/PR(s).

### Contract

Record:

```text
api.v_curated_promo_discovery
```

including:

- selected columns;
- view owner/security model;
- producer dependencies;
- compatibility/public-view disposition.

### Migration/config

Record:

- `api` schema creation;
- view migration path;
- grants/revokes;
- RLS/view execution design;
- PostgREST/Data API configuration;
- schema reload/config evidence.

### Low-privilege acceptance

Record W3-D results:

```text
api SELECT                 PASS
api write                  DENIED
publish direct read        DENIED
unrelated exposure         NOT INTRODUCED
explicit api routing       PASS
```

Do not include keys.

### Application cutover

Record:

- explicit `.schema('api')`;
- view name;
- selected-column guardrail;
- no service-role;
- tests/typecheck/build results;
- JSE-S3 docs refreshed;
- JSE-S3 live integration status after cutover.

### Compatibility disposition

Record the W3-F result:

```text
public.v_curated_promo_discovery
→ RETAIN / DEPRECATE / RETIRE
```

with reason and remaining consumers if retained.

### Deferred items

Explicitly list what Wave 3 did not solve, including as applicable:

- event overlap API/UI contract;
- stale Step 3A DuckDB freshness;
- newsletter schema separation (future Wave 4);
- telemetry;
- broad legacy public-schema retirement.

Do not mark deferred work as failure when it was intentionally out of scope.

## Recommended output

Create:

```text
docs/evidence/db-wave-3/WAVE_3_CLOSEOUT.md
```

## Completion statement

DB-W3 may be marked:

```text
COMPLETE
```

only when:

- application reads the accepted `api.*` contract;
- low-privilege acceptance passed;
- producer isolation is proven;
- compatibility disposition is recorded;
- evidence is committed.

## Acceptance checklist

- [ ] authority/baseline SHAs recorded
- [ ] contract recorded
- [ ] migration/config evidence recorded
- [ ] low-privilege matrix recorded
- [ ] application cutover evidence recorded
- [ ] compatibility disposition recorded
- [ ] deferred work recorded
- [ ] closeout committed
- [ ] DB-W3 marked COMPLETE
