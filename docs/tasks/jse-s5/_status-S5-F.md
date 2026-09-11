# S5-F status — Telemetry implementation and guardrails

| Field | Value |
|---|---|
| Date | 2026-09-11 |
| Packet | [S5-F-telemetry-implementation-guardrails.md](./S5-F-telemetry-implementation-guardrails.md) |
| Result | **accepted-with-provider-activation-deferred** |
| Depends on | S5-D + S5-E accepted |
| Base | `main@2bed903` (S5-E merged) |
| Tested runtime SHA | `a0bcdb01056c583523217aea316f673042fdab20` (`a0bcdb0`) |
| Branch | `feat/jse-s5-f-implemenetation-gaurdrails` |
| Contract | [s5-telemetry-contract.md](./s5-telemetry-contract.md) / S5-E |
| Consent | [_status-S5-D.md](./_status-S5-D.md) |
| Provenance | [jse-s5-ledger.md](../../provenance/jse-s5-ledger.md) |

## Conclusion

Application telemetry seam is complete: only S5-E events, S5-D-gated, fail-soft, with
explicit noop / recording transports. Production sink remains `disabled_by_default`
(S5-A). No DB telemetry schema/RPC/RLS and no production provider activation.

```text
BLOCKED-DB-W4: durable production telemetry sink / schema / grants / retention
(not required for S5-F local acceptance)
```

## Implementation paths

```text
src/lib/telemetry/first-release-telemetry-seam.ts       # emitApprovedEvent
src/lib/telemetry/first-release-telemetry-transport.ts  # noop | recording | throwing
src/lib/telemetry/first-release-telemetry-runtime.ts    # default singleton
src/lib/newsletter/newsletter-subscribe-controller.ts   # requested on accepted
src/lib/newsletter/newsletter-confirm-controller.ts     # confirmed on success only
src/components/v2/curated-promos/CuratedPromoDiscoveryWidget.tsx
src/components/v2/curated-promos/CuratedPromoDetailSheet.tsx
src/components/v2/curated-promos/CuratedPromoFilterChips.tsx  # toggle detail
src/components/v2/curated-promos/CuratedPromoEmptyStateTelemetryMount.tsx
src/components/v2/curated-promos/CuratedPromoLandingSectionView.tsx  # fail_soft mount
```

## Transport / sink

| Item | Status |
|---|---|
| Default consent | `unknown` |
| Default sink | `disabled_by_default` (explicit) |
| Default transport | `noop` (explicit kind) |
| Local acceptance | recording / throwing transports in tests |
| Production provider | deferred (S5-A) |
| Telemetry DB objects | not introduced — BLOCKED-DB-W4 |

## Instrumentation summary

| Event | Wired trigger |
|---|---|
| `curated_promo_discovery_view` | Widget first non-empty mount (once) |
| `curated_promo_filter_click` | FilterChips toggle (vocab-bound value; clear includes value) |
| `curated_promo_card_open` | Card open (`promoId` only) |
| `curated_promo_empty_state_view` | published_empty / filter_empty / fail_soft |
| `curated_promo_source_click` | View source click (`promoId` only; never href) |
| `newsletter_subscribe_requested` | Subscribe controller after browser `accepted` |
| `newsletter_subscription_confirmed` | Confirm consume `success` only (`already_complete` non-emit) |

## Prohibited-data audit

Emit path strips to allowlisted keys and rejects invalid promoId / filter vocabulary /
signupSource. Transport exceptions return bounded `transport_failed` without error bodies.
Active-runtime search found no legacy SessionInit / log-* routes / useTracker /
service-role / email_signups / reward tokens in `src/` (excluding `__tests__` /
`__fixtures__`).

## Tests

```text
src/lib/__tests__/first-release-telemetry-implementation.test.ts
```

Covers: unknown/rejected zero calls; accepted approved payload; revoke; unknown event;
extra-field strip/reject; email/hash/token/URL absent; requested trigger; confirmed
trigger; curated semantics; transport failure nonblocking; legacy audit; explicit noop/disabled sink.

## Verification

| Check | Result |
|---|---|
| `npm test` | **PASS** — 203 tests / 53 suites / 0 fail |
| `npm run typecheck` | **PASS** |
| `npm run build` | **PASS** |

Tested at runtime SHA `a0bcdb01056c583523217aea316f673042fdab20`.

## Acceptance checklist

- [x] Typed/validated telemetry seam exists
- [x] Optional events gated by S5-D
- [x] Only S5-E events can emit
- [x] Payloads bounded
- [x] Requested/confirmed instrumentation correct
- [x] Email/hash/token/full URL/referrer excluded
- [x] Telemetry failure nonblocking
- [x] Legacy tracker/session implementations absent
- [x] No service-role or telemetry DB migration introduced
- [x] Tests/security searches pass
- [x] DB-W4-only sink dependencies identified without blocking S5-F
