# S4-F remediation — HTTP status ignored on transport success

| Field | Value |
|---|---|
| Date | 2026-09-10 |
| Packet | [S4-F-security-failure-and-abuse-guardrails.md](./S4-F-security-failure-and-abuse-guardrails.md) |
| Result | **Partial remediation** — significant blocker fixed; full S4-F acceptance still requires S4-D/S4-E + remaining guardrail review |
| Reviewed SHA (before) | `feat/jse-s4-c-same-origin-bff@e6d91f72c89ea93e871554020ece79690f81336b` |
| Target path | `src/lib/newsletter/newsletter-service-client.ts` |

## Blocker

`authorizedPost()` correctly returned `{ kind: 'http', httpStatus, body }`, but `subscribe()`, `validateConfirmation()`, and `confirm()` parsed **only the body**. `httpStatus` was never consulted when deciding success.

Impact: a non-`2xx` upstream response whose JSON happened to match a success DTO (for example HTTP `500` + `{ ok: true, status: 'confirmation_if_eligible', ... }` or confirm `{ status: 'success' }`) would be treated as success. That violates S4-C/S4-F fail-closed rules for upstream `5xx` and unknown success conditions.

## Remediation (implemented)

| Method | Rule |
|---|---|
| `subscribe` | Success only when `httpStatus` is `2xx` **and** body parses as canonical success. Error bodies are further bound to HTTP class (400/413 validation, 429 `rate_limited`). 5xx (including 503 + `invalid_request`) fail closed as `unavailable`. Error-shaped bodies on `2xx` fail closed (`unknown_status`). |
| `validateConfirmation` | Parsed canonical validate status accepted only on `2xx`. Non-`2xx` → `unavailable` / `unknown_status`. |
| `confirm` | Parsed canonical consume status accepted only on `2xx`. Non-`2xx` → `unavailable` / `unknown_status`. |

Evidence class: **adapted/hardened** (S4-C transport REIMPLEMENT).

## Tests added

In `src/lib/__tests__/newsletter-bff-contract.test.ts`:

1. success-shaped subscribe body + HTTP `500` → transport `unavailable`, browser `unavailable`;
2. subscribe error body + HTTP `429` still maps to `rate_limited`;
3. error-shaped subscribe body + HTTP `200` fails closed;
4. confirm validate success-shaped body + HTTP `503` → `unavailable`;
5. confirm consume success-shaped body + HTTP `500` → browser `unable_to_confirm`.

## Out of scope for this remediation

- Full S4-F security evidence packet / acceptance conclusion.
- S4-D workload identity provider.
- S4-E confirmation UX.
- Hosted Acceptance controls.

## Follow-up — HTTP class for subscribe errors (folded into S4-C)

Body shape on non-2xx is not enough. `classifySubscribeHttpResponse()` now requires:

- 2xx + canonical success → success; anything else → unavailable
- 400 / 413 + approved validation error → `error` / invalid; anything else → unavailable
- 429 + `rate_limited` → `rate_limited`; anything else → unavailable
- 401 / 403 → unauthorized / unavailable
- 5xx → unavailable regardless of body (covers live 503 + `invalid_request` when Supabase is down)
- other non-2xx → unavailable

This correction lives on `feat/jse-s4-c-same-origin-bff` (PR #19 folded in).

## Follow-up refinement (same branch)

`BrowserSubscribeRequest` now includes optional honeypot `website?: string` to match the frozen S4-A browser DTO. `parseBrowserSubscribeBody()` already accepted/stripped it; `translateBrowserSubscribeToCanonical()` continues to omit it via explicit field pick.

