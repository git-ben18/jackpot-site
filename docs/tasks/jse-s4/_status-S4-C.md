# S4-C status

| Field | Value |
|---|---|
| Date | 2026-09-09 |
| Packet | [S4-C-same-origin-bff-contract.md](./S4-C-same-origin-bff-contract.md) |
| Result | Complete (local contract; no hosted connectivity) |
| Baseline | `jackpot-site main@7e7931d` (S4-A freeze merged, PR #17) |
| Evidence | [s4-newsletter-contract-matrix.md](./s4-newsletter-contract-matrix.md), [jse-s4-ledger.md](../../provenance/jse-s4-ledger.md) |

## Runtime artifacts

| Target path | Disposition |
|---|---|
| `src/lib/newsletter/newsletter-public-contract.ts` | implemented (browser-safe DTO/status freeze) |
| `src/lib/newsletter/newsletter-canonical-contract.ts` | implemented (explicit translation + upstream parse) |
| `src/lib/newsletter/newsletter-service-env.ts` | REIMPLEMENT (`NEWSLETTER_SERVICE_BASE_URL` only) |
| `src/lib/newsletter/newsletter-service-auth.ts` | implemented seam; default fail-closed until S4-D |
| `src/lib/newsletter/newsletter-service-client.ts` | REIMPLEMENT of source `core-proxy` fetch (new name); S4-F harden: callers consult `httpStatus` (see `_status-S4-F-http-status-remediation.md`) |
| `src/lib/newsletter/newsletter-bff.ts` | implemented pipeline |
| `src/app/api/newsletter/subscribe/route.ts` | REIMPLEMENT |
| `src/app/api/newsletter/confirm/validate/route.ts` | REIMPLEMENT |
| `src/app/api/newsletter/confirm/route.ts` | REIMPLEMENT |

No `core-proxy.ts` name. No `/api/subscribe`. No service-role. No `NEXT_PUBLIC_` newsletter hostname.

## Contract notes

- Browser subscribe statuses: `accepted` / `invalid` / `rate_limited` / `unavailable`.
- Confirm validate/consume map frozen service statuses 1:1; unknown/malformed fail closed to `unable_to_confirm`.
- Honeypot `website` never forwarded; filled honeypot returns `accepted` without upstream mutation.
- Live HTTP transport requires workload identity headers before fetch. **S4-D** fills `newsletter-service-auth` with Vercel OIDC (local fake for tests). Deferred auth remains available for explicit fail-closed test injection.
- Timeout: 10s (`UPSTREAM_TIMEOUT_MS`), matching source BFF, classified as S4-C choice.
- Subscribe transport binds body to HTTP class (`classifySubscribeHttpResponse`): 2xx success only; 400/413 validation errors only; 429 + `rate_limited` only; 5xx (including 503 + `invalid_request`) → unavailable.

## Tests

`src/lib/__tests__/newsletter-bff-contract.test.ts` (mocked/fake transport).

## Acceptance checklist

- [x] Browser calls same-origin BFF only.
- [x] All browser inputs are schema validated/allowlisted.
- [x] Canonical backend DTO translation is explicit and tested.
- [x] Canonical backend responses are schema validated before mapping.
- [x] Unknown/malformed `2xx` responses fail closed.
- [x] Subscribe remains non-enumerating.
- [x] Confirmation status mapping is exhaustive for the frozen contract.
- [x] Raw upstream errors/credentials/tokens never reach browser responses.
- [x] No legacy subscriber write/fallback exists.
- [x] Server transport seam is ready for S4-D workload identity.
- [x] No deployment or real mutation is required/performed.
