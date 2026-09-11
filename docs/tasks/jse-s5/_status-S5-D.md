# S5-D status — Cookie and analytics consent enforcement

| Field | Value |
|---|---|
| Date | 2026-09-11 |
| Packet | [S5-D-consent-enforcement.md](./S5-D-consent-enforcement.md) |
| Result | **accepted** (fail-closed in-memory consent gate; no banner; no cookie write) |
| Depends on | S5-A accepted — [_status-S5-A.md](./_status-S5-A.md) D-S5-05 / D-S5-A-06/07 |
| Base | `main@62e4326` (S5-B merged) |
| Tested runtime SHA | `4066605fe46127997d8eefc2b572d2242b2fad17` (`4066605`) |
| Branch | `feat/jse-s5-d-consent` |
| Provenance | [jse-s5-ledger.md](../../provenance/jse-s5-ledger.md) |

## Consent decision (from S5-A)

```text
first-release analytics = contract + disabled-by-default
authorized production sink = none
decorative consent banner = none
preference cookie write = BLOCKED-PENDING-SINK-AUTHORITY
```

## State vocabulary

```text
unknown              (default)
essential_only       (alias: rejected)
analytics_accepted
```

Revoke maps to `essential_only`. Corrupt/untrusted hydrate values fail to `essential_only`.

## Emission rule (consent gate only)

```text
canEmitOptionalAnalytics =
  state === analytics_accepted
  AND sinkStatus === authorized
```

Production/default `sinkStatus` is `disabled_by_default`, so **zero** optional calls even after accept until a later sink authority decision. Tests inject `authorized` only to prove the consent gate.

S5-D does **not** define event names, payload schemas, or field allow/deny lists. Those belong to S5-E/F. The gated seam is a generic `createConsentGatedEmitter<TEvent>()`.

## Persistence

| Item | Value |
|---|---|
| Status | `BLOCKED-PENDING-SINK-AUTHORITY` |
| Cookie name | `null` (not invented) |
| Mechanism / lifetime | `null` |
| Runtime store | in-memory controller only |
| Excluded legacy keys | constructed denylist (no writes) |

`persistPreference()` returns `{ ok: false, reason: 'persistence_blocked' }`.

## Runtime artifacts

```text
src/lib/consent/analytics-consent.ts
src/lib/consent/analytics-consent-controller.ts
src/lib/consent/optional-analytics-transport.ts   # generic consent-gated emitter
src/components/shell/ConsentMountSeam.tsx          # still empty; data-consent-ui=none
src/lib/__tests__/analytics-consent.test.ts
docs/tasks/jse-s5/_status-S5-D.md
```

## UI

No decorative banner. Shell Privacy links remain `/privacy`. Newsletter DOI consent is unrelated and unchanged.

## Gate proof (tests)

| Case | Result |
|---|---|
| unknown → emit | suppressed |
| essential_only → emit | suppressed |
| analytics_accepted + disabled sink → emit | suppressed |
| analytics_accepted + authorized sink (test inject) → emit | permitted |
| revoke after accept → emit | suppressed |
| default unknown before any choice | no emit |
| no pre-consent replay/storage | absent |
| no event taxonomy / payload schema in S5-D | asserted |

## Product UX with analytics rejected

| Surface | Proof |
|---|---|
| Newsletter DOI | subscribe controller reaches `accepted` under `essential_only` |
| Confirmation | validate reaches `ready_to_confirm` under `essential_only` |
| Curated discovery | landing/widget do not import analytics-consent gates |

## Deferred

- Preference cookie name/lifetime (needs sink authority)
- Consent UI / banner (only when a non-essential sink is authorized)
- S5-E event contract / payload rules
- S5-F provider wiring (blocked until S5-E accepted)
- Hosted provider disable/delete semantics
- DB-W4 telemetry schema (out of scope)

## Local verification

| Field | Value |
|---|---|
| Date | 2026-09-11 |
| Tested runtime SHA | `4066605fe46127997d8eefc2b572d2242b2fad17` (`4066605`) |
| Branch | `feat/jse-s5-d-consent` |

| Command | Result |
|---|---|
| `npm test` | **PASS** - 181 tests, 0 fail |
| ``npm run typecheck`` | **PASS** |
| ``npm run build`` | **PASS** |

## Checklist

- [x] Consent model matches S5-A
- [x] Unknown/rejected emits no optional calls
- [x] Accepted permits only the consent-gated seam (still sink-gated)
- [x] Revocation stops future optional emissions
- [x] Preference storage is privacy-minimal (none written)
- [x] Product UX works with analytics rejected
- [x] Privacy linked in shell
- [x] No legacy signup/session cookie repurposed
- [x] Tests prove gate behavior, not banner rendering
- [x] No event taxonomy / payload schema / field filters in S5-D
- [x] No DB/provider production changes performed
- [x] No decorative banner controlling nothing

## Conclusion

```text
S5-D: ACCEPTED (fail-closed analytics consent gate)

S5-D consent controller + createConsentGatedEmitter are ready for S5-F consumption.
S5-F remains blocked until S5-E is accepted.
Persistence cookie / banner: remain blocked until sink authority.
```
