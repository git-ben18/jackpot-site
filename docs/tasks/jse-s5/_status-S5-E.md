# S5-E status — First-release telemetry contract

| Field | Value |
|---|---|
| Date | 2026-09-11 |
| Packet | [S5-E-first-release-telemetry-contract.md](./S5-E-first-release-telemetry-contract.md) |
| Result | **accepted** (contract + static tests only; no provider/DB) |
| Depends on | S5-A accepted — [_status-S5-A.md](./_status-S5-A.md) D-S5-06..11 |
| Base | `main@8988e2f` (S5-D merged) |
| Tested runtime SHA | working tree on `main@8988e2f` (fill commit SHA after land) |
| Branch | `feat/jse-s5-e-first-release-telemtry` |
| Contract artifact | [s5-telemetry-contract.md](./s5-telemetry-contract.md) |
| Machine contract | `src/lib/telemetry/first-release-telemetry-contract.ts` |
| Provenance | [jse-s5-ledger.md](../../provenance/jse-s5-ledger.md) |

## Frozen event list (closed)

```text
curated_promo_discovery_view
curated_promo_filter_click
curated_promo_card_open
curated_promo_empty_state_view
curated_promo_source_click
newsletter_subscribe_requested
newsletter_subscription_confirmed
```

Schema family `jackpot-site.first_release_telemetry` / version `v1`. No expansion without newer jackpot-news authority.

## Per-event summary

| Event | Business question | Exact trigger (summary) |
|---|---|---|
| `curated_promo_discovery_view` | Did discovery render published promos? | Landing success render with `ok && promos.length > 0` |
| `curated_promo_filter_click` | Which filters do visitors toggle? | Filter chip toggle (`brand` / `marketSlug` / `signalCategory` / `signalType`) |
| `curated_promo_card_open` | Which promos do visitors open? | Card open for a rendered promo |
| `curated_promo_empty_state_view` | Is discovery empty or fail-soft? | EmptyState render with bounded `reason` |
| `curated_promo_source_click` | Do visitors leave to verify source? | DetailSheet “View source” click |
| `newsletter_subscribe_requested` | Did subscribe BFF return `accepted`? | Browser maps HTTP 200 + `{ status: "accepted" }` |
| `newsletter_subscription_confirmed` | Did confirm consume succeed newly? | Consume terminal `success` only |

## Consent / identity / sink / failure

```text
consent_class: optional_non_essential (every event)
session_user_identity: omit
sink_status: disabled_by_default
failure_behavior: swallow_nonblocking (never changes curated UI, source links, DOI, or confirm)
S5-D: unknown / essential_only => zero transport; accepted still requires authorized sink
```

## Requested ≠ confirmed

```text
newsletter_subscribe_requested  <= browser status "accepted" only
newsletter_subscription_confirmed <= consume status "success" only
already_complete / ready_to_confirm / invalid* / unable_to_confirm => non-emit for confirmed
subscribe "accepted" does not emit confirmed
confirm "success" does not emit requested
```

## Prohibited-data policy

Global denylist includes email / email hash / confirmation token / access token / session id /
sourceUrl / pageUrl / referrer / userAgent / ip / authorization / free-form metadata /
full error bodies. Payload keys are allowlisted per event; token values are charset-bounded.

## DB-W4 handoff (contract facts only)

```text
seven event names + schema_version v1
payload allowlists / enums in s5-telemetry-contract.md
consent_class: optional_non_essential
cardinality/dedupe per event in contract doc
identity: omit
sink_status: disabled-by-default
open retention questions: unresolved (not invented)
```

No Supabase tables, RPCs, grants, RLS, SECURITY DEFINER, retention jobs, or warehouse models.
Do not recreate legacy `session_logs` / `click_logs` / `interaction_logs` by default.

## Tests

```text
src/lib/__tests__/first-release-telemetry-contract.test.ts
```

Proves: closed allowlist; bounded payloads; prohibited fields absent; requested≠confirmed;
session omit; sink disabled-by-default; no URL/referrer/raw-error fields in allowlists.

## Out of scope (explicit)

Provider implementation, network transport, DB persistence, dashboards, BI, hosted delivery,
migrations, deployment, public authority transfer — deferred to S5-F / DB-W4 / later.

## Acceptance checklist

- [x] Event list frozen and minimal (seven)
- [x] Every event has exact trigger and business question
- [x] Payload schemas allowlisted and bounded
- [x] Requested != confirmed explicit
- [x] Email/token/raw URL/referrer prohibited
- [x] Session identity omit
- [x] Consent class per event
- [x] Failure behavior nonblocking
- [x] DB-W4 handoff is contract facts only
- [x] Contract tests pass

## Conclusion

**accepted** — first-release telemetry meaning is frozen. S5-F may implement a provider
only against this contract and S5-D consent; production sink remains disabled until
explicit sink authority.
