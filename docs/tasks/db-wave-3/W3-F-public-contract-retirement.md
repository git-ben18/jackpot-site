# DB-W3-F — Public contract compatibility / retirement decision

| Field | Value |
|---|---|
| Track | DB-W3-F |
| Type | Cross-repo inventory + optional migration |
| Depends on | W3-E merged |
| Blocks | W3-G |
| Default action | retain until proven unused |

## Goal

Determine the disposition of:

```text
public.v_curated_promo_discovery
```

after `jackpot-site` has moved to the accepted `api.*` contract.

Do not assume retirement is required immediately.

## Consumer sweep

Search current active code across at least:

```text
jackpot-site
rewards-maxxing-frontend
core
jackpot-api-newsletter
jackpot-news
```

Also include any other repository identified by W3-A.

Search for:

```text
v_curated_promo_discovery
public.v_curated_promo_discovery
```

Classify every meaningful hit:

```text
ACTIVE RUNTIME
ACTIVE OPERATIONAL TOOL
TEST/FIXTURE
CURRENT DOC
HISTORICAL DOC
```

## Decision options

### RETAIN

Choose when a legitimate compatibility consumer remains.

Record:

- consumer;
- reason;
- owner;
- expected retirement trigger.

### RETIRE

Choose only when no legitimate runtime/operational dependency remains and rollback/retention concerns are understood.

Retirement DDL belongs in `core`.

### DEPRECATE / RETAIN TEMPORARILY

Choose when remaining consumers are known and scheduled for cutover.

## If retiring

Author a separate reviewed `core` migration.

Preconditions should verify:

- `api.v_curated_promo_discovery` exists;
- accepted contract is operational;
- no known required compatibility dependency remains according to evidence.

Do not combine retirement with unrelated schema cleanup.

## Documentation

Update current architecture docs to show:

```text
jackpot-site → api.v_curated_promo_discovery
```

Historical JSE-S3 evidence may retain the older `public` contract if clearly historical.

## Out of scope

- broad cleanup of legacy `public.*`;
- newsletter migration;
- telemetry migration;
- event-overlap cleanup;
- producer-table retirement.

## Acceptance checklist

- [ ] cross-repo consumer sweep complete
- [ ] all matches classified
- [ ] retain/deprecate/retire decision recorded
- [ ] owner/trigger recorded for remaining consumers
- [ ] optional retirement migration reviewed/applied if chosen
- [ ] no unrelated public-schema cleanup bundled
- [ ] ready for W3-G
