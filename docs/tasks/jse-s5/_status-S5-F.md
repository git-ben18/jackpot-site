# S5-F status — Telemetry implementation and guardrails

| Field | Value |
|---|---|
| Date | 2026-09-12 |
| Packet | [S5-F-telemetry-implementation-guardrails.md](./S5-F-telemetry-implementation-guardrails.md) |
| Result | **accepted-with-provider-activation-deferred** |
| Depends on | S5-D accepted — [_status-S5-D.md](./_status-S5-D.md); S5-E accepted — [_status-S5-E.md](./_status-S5-E.md) |
| Base | `main@2bed903` (S5-E merged) |
| Branch | `feat/jse-s5-f-initial-implementation` |
| Contract | [s5-telemetry-contract.md](./s5-telemetry-contract.md) |
| Consent | `src/lib/consent/analytics-consent.ts` + controller |
| Provenance | [jse-s5-ledger.md](../../provenance/jse-s5-ledger.md) |

## Seam

```text
emitApprovedEvent(eventName, payload)
  → validate S5-E name + closed payload (reject extra/prohibited keys; do not forward)
  → S5-D canEmitOptionalAnalytics (accepted AND authorized sink)
  → configured transport
  → swallow throw/reject/timeout; never change DOI / confirm / discovery UX
```

Default production emitter: unknown consent + explicit `kind: 'disabled'` transport.
Tests inject `analytics_accepted` + `sinkStatus: 'authorized'` + `kind: 'fake'`.

No GTM. No browser-direct Supabase. No telemetry DB schema / migration.

## Runtime artifacts

```text
src/lib/telemetry/first-release-telemetry-emitter.ts
src/lib/telemetry/first-release-telemetry-transport.ts
src/lib/telemetry/first-release-telemetry-validate.ts
src/lib/telemetry/first-release-telemetry-triggers.ts
src/components/v2/curated-promos/CuratedPromoEmptyStateTelemetryMount.tsx
src/lib/newsletter/newsletter-subscribe-controller.ts      # after setPhase(accepted)
src/lib/newsletter/newsletter-confirm-controller.ts        # after setPhase(success)
src/components/v2/curated-promos/CuratedPromoDiscoveryWidget.tsx
src/components/v2/curated-promos/CuratedPromoDetailSheet.tsx
src/components/v2/curated-promos/CuratedPromoLandingSectionView.tsx
src/lib/__tests__/first-release-telemetry-implementation.test.ts
```

Disposition: **REIMPLEMENT** (do not copy source tracker hooks or session-init modules).

## Transport / sink

| Kind | Use |
|---|---|
| `disabled` | Production default; labeled no-op, not a missing provider |
| `noop` | Explicit local drop sink |
| `fake` | Tests; can throw / reject / hang |

```text
S5-A production sink = disabled-by-default
authorized production provider = none (deferred)
DB-W4 schema / RPC / RLS / retention = BLOCKED-DB-W4 (sink-only; does not block this packet)
```

## Instrumentation (S5-E only)

| Event | Wired trigger |
|---|---|
| `curated_promo_discovery_view` | Non-empty widget first mount; once per emitter lifetime |
| `curated_promo_filter_click` | Chip toggle; clicked key only (category does not emit a second signalType event) |
| `curated_promo_card_open` | Card open; `promoId` only |
| `curated_promo_empty_state_view` | `published_empty` / `filter_empty` / `fail_soft`; once per reason |
| `curated_promo_source_click` | DetailSheet “View source”; `promoId` only; href unchanged |
| `newsletter_subscribe_requested` | Browser `accepted` + `signupSource: newsletter_landing` after `setPhase` |
| `newsletter_subscription_confirmed` | Consume terminal `success` only; `already_complete` / ready / invalid / unable are non-emit |

Pre-consent views are not replayed after a later accept (once-keys consumed even when gated).

## Consent proof

| Case | Result |
|---|---|
| unknown / essential_only | zero transport `send` |
| analytics_accepted + disabled sink | zero transport `send` |
| analytics_accepted + authorized + fake | S5-E envelopes only |
| revoke after emit | later events suppressed; discovery_view not replayed |

## Prohibited-data audit

Rejected (not stripped/forwarded): extra keys, prohibited keys, email-like / `http(s)://` string values, unknown event names, filterValue outside rendered vocabulary.

Forwarded envelopes in tests contain no email, confirmation token, sourceUrl, referrer, or full URL.

## Active-runtime search (src/, excluding tests/fixtures)

Searched contiguous literals:

```text
SessionInit
/api/log-session
/api/log-interaction
/api/log-click
useTracker
logEmailSignup
session_logs
interaction_logs
click_logs
SUPABASE_SERVICE_ROLE_KEY
/api/subscribe
email_signups
subscriber_email_hash
reward_access_token
```

Hits: **none**. Historical docs may still mention excluded names. No service-role or telemetry migration introduced.

## Tests

```text
src/lib/__tests__/first-release-telemetry-implementation.test.ts
```

Covers packet items 1–13: consent/revocation, unknown event, extra fields, email/hash/token/URL absence, requested vs confirmed, curated semantics, transport throw/reject/hang, explicit sink kinds, legacy scan.

## Verification

| Check | Result |
|---|---|
| `npm test` | **PASS** — 210 tests / 55 suites / 0 fail |
| `npm run typecheck` | **PASS** |
| `npm run build` | **PASS** |

Tested on working tree of `feat/jse-s5-f-initial-implementation` (base `2bed903`). Commit SHA pending.

## Hosted / provider residuals

None. No production provider, GTM container, or telemetry table was added.

## Out of scope (explicit)

New telemetry DB schema, legacy log-table migration, provider billing/admin, BI, production deployment, hosted delivery, ad targeting/session replay, DNS/cutover, S5-C privacy URL/version, consent banner/cookie.

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
- [x] DB-W4-only sink dependencies identified without blocking this packet

## Conclusion

```text
S5-F: ACCEPTED-WITH-PROVIDER-ACTIVATION-DEFERRED

Application wiring, S5-D gate, S5-E allowlist, fail-soft behavior, and
legacy-exclusion audit are complete. Production sink remains the explicit
disabled transport until a later sink-authority + DB-W4 decision.
S5-G is unblocked for local/application closeout that does not require a
live provider.
```
