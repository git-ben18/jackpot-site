# S5-E status — First-release telemetry contract

| Field | Value |
|---|---|
| Date | 2026-09-11 |
| Packet | [S5-E-first-release-telemetry-contract.md](./S5-E-first-release-telemetry-contract.md) |
| Result | **accepted** (contract + static tests only; no provider/DB) |
| Depends on | S5-A accepted — [_status-S5-A.md](./_status-S5-A.md) D-S5-06..11 |
| Base | `main@8988e2f` (S5-D merged) |
| Tested runtime SHA | `d6e900ca514feb2a0a3ebef2ff5ea0492cd69c8f` (`d6e900c`) |
| Branch | `feat/jse-s5-e-first-release-telemtry` |
| Contract artifact | [s5-telemetry-contract.md](./s5-telemetry-contract.md) |
| Machine contract | `src/lib/telemetry/first-release-telemetry-contract.ts` |
| Provenance | [jse-s5-ledger.md](../../provenance/jse-s5-ledger.md) |

## Review corrections applied

```text
filterValue: membership in currently-rendered public CuratedPromoFilterOptions vocabulary
             (not charset-only). Multi-word brands allowed when rendered.
clear: includes the clicked bounded filterValue (same as apply).
payload schemas: closed TypeScript event→payload shapes for S5-F consumption.
discovery_view trigger: non-empty CuratedPromoDiscoveryWidget first committed/mounted
             render from successful landing, once per page/widget lifetime.
```

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

| Event | Business question | Exact trigger (summary) | Payload shape |
|---|---|---|---|
| `curated_promo_discovery_view` | Did discovery render published promos? | Non-empty widget first mount from successful landing | `{}` |
| `curated_promo_filter_click` | Which filters do visitors toggle? | Filter chip toggle | `filterKey` + `action` + vocabulary-bound `filterValue` |
| `curated_promo_card_open` | Which promos do visitors open? | Card open for a rendered promo | `promoId` |
| `curated_promo_empty_state_view` | Is discovery empty or fail-soft? | EmptyState render | `reason` enum |
| `curated_promo_source_click` | Do visitors leave to verify source? | DetailSheet “View source” click | `promoId` |
| `newsletter_subscribe_requested` | Did subscribe BFF return `accepted`? | Browser maps HTTP 200 + `{ status: "accepted" }` | `signupSource: newsletter_landing` |
| `newsletter_subscription_confirmed` | Did confirm consume succeed newly? | Consume terminal `success` only | `{}` |

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
full error bodies. Payloads are typed per event; filterValue is vocabulary-membership-bound,
not free text.

## DB-W4 handoff (contract facts only)

```text
seven event names + schema_version v1
payload TypeScript shapes / enums in first-release-telemetry-contract.ts
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

Proves: closed allowlist; typed payload schemas; multi-word brand vocabulary membership;
bounded filter/empty/signup enums; promoId rules; zero-key events; requested≠confirmed;
session omit; sink disabled-by-default; prohibited fields absent.

## Verification

| Check | Result |
|---|---|
| `npm test` | **PASS** — 188 tests / 49 suites / 0 fail |
| `npm run typecheck` | **PASS** |
| `npm run build` | **PASS** |

Tested at runtime SHA `d6e900ca514feb2a0a3ebef2ff5ea0492cd69c8f`.

## Out of scope (explicit)

Provider implementation, network transport, DB persistence, dashboards, BI, hosted delivery,
migrations, deployment, public authority transfer — deferred to S5-F / DB-W4 / later.

## Acceptance checklist

- [x] Event list frozen and minimal (seven)
- [x] Every event has exact trigger and business question
- [x] Payload schemas allowlisted, typed, and bounded
- [x] Requested != confirmed explicit
- [x] Email/token/raw URL/referrer prohibited
- [x] Session identity omit
- [x] Consent class per event
- [x] Failure behavior nonblocking
- [x] DB-W4 handoff is contract facts only
- [x] Contract tests pass (188 / 188 at `d6e900c`)

## Conclusion

**accepted** — first-release telemetry meaning and closed payload TypeScript shapes are frozen.
S5-F may implement a provider only against this contract and S5-D consent; production sink
remains disabled until explicit sink authority.
