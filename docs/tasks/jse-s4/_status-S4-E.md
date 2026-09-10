# S4-E status

| Field | Value |
|---|---|
| Date | 2026-09-10 |
| Packet | [S4-E-confirmation-ux.md](./S4-E-confirmation-ux.md) |
| Result | Complete (local UX; no hosted confirmation mutation) |
| Base | `feat/jse-s4-d-workload-identity@ca40a3b` (includes S4-C BFF + S4-D identity) |
| Tip | `feat/jse-s4-e-confirmation-ux@5f38367e4aeee285c3f01599bf24bb3659c3447c` |
| Source SHA | `rewards-maxxing-frontend@466bfb065a9c34010ee0f0de22b419299259fa46` |

## Runtime artifacts

```text
src/lib/newsletter/confirm-client.ts                    # COPY + HARDEN
src/lib/newsletter/newsletter-confirm-copy.ts           # implemented (bounded copy)
src/lib/newsletter/newsletter-confirm-controller.ts     # implemented (retry / token / lock)
src/components/newsletter/NewsletterConfirmClient.tsx   # COPY + HARDEN
src/app/newsletter/confirm/page.tsx                     # mount client
src/lib/__tests__/newsletter-confirm-ux.test.ts
```

## Hardening (refinement)

- Manual retry for `unable_to_confirm` re-validates only (never auto-retry; never consume-first)
- `consumeLock` reset on `unable_to_confirm` / `ready_to_confirm` so a safe retry can proceed
- Token cleared on terminal `success` / `already_complete` / `invalid_or_unusable` and on unmount; retained while confirm/retry still needs it
- HTTP accept narrowed to **200 only** (S4-C BFF); HTTP **202** fails closed to `unable_to_confirm`
- Accessible focus moves to status / Confirm / Retry on async phase transitions (`tabIndex={-1}` + `aria-live`)
- Browser contract uses frozen `{ status }` vocabulary (`ready_to_confirm`, not source `valid` / `outcome`)
- Same-origin BFF only; never logs/renders token; no localStorage/sessionStorage
- No legacy `/api/subscribe` / subscriber writers

## Checklist

- [x] Placeholder route replaced with bounded confirmation UX
- [x] Validation and confirmation use same-origin BFF only
- [x] Token hygiene enforced/tested
- [x] Known canonical states map exhaustively to browser-safe states
- [x] Unknown/malformed successful responses fail closed
- [x] Already-complete behavior is safe/idempotent
- [x] Manual `unable_to_confirm` retry re-validates before consume
- [x] In-flight confirm clicks do not duplicate consume
- [x] Focus behavior verified for async transitions
- [x] No raw backend message or subscriber enumeration exposed
- [x] No legacy writer/fallback
- [x] Focused confirmation tests pass
- [x] No deployment or real confirmation mutation performed

## Local verification (tip)

| Field | Value |
|---|---|
| Date | 2026-09-10 |
| SHA | `5f38367e4aeee285c3f01599bf24bb3659c3447c` (`5f38367`) |
| Branch | `feat/jse-s4-e-confirmation-ux` |
| Subject | `Refine S4-E confirmation retry, token hygiene, and tests.` |

| Command | Result |
|---|---|
| `npm test` | **PASS** — 118 tests, 0 fail |
| `npm run typecheck` | **PASS** |
| `npm run build` | **PASS** — Next.js 15.5.25; `/newsletter/confirm` present |
