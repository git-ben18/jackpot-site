# S4 newsletter contract matrix (frozen for S4-A)

Status: **verified** against `jackpot-api-newsletter@c6cfaa4ccf9e09f801c3ae4f23dd43b0c88d8cd8` (`newsletter/subscribers/public-contracts.ts` + public route handlers) and `jackpot-news@5bba8b11bf424734ede5eda44e8f5687ca3117d1` (EC-05A).

Service contract docs: `jackpot-api-newsletter` `docs/contracts/newsletter-acquisition-api-contract.md` and `docs/contracts/frontend-workload-identity-contract.md`.

This matrix is the S4-C translation authority. Do not use the Cloud Agent provisional matrix on `cursor/jse-s4-a-b-doi-acquisition-feca`.

## Route map

| Concern | Browser → `jackpot-site` BFF | BFF → `jackpot-api-newsletter` |
|---|---|---|
| Subscribe | `POST /api/newsletter/subscribe` | `POST /api/public/newsletter/subscribe` |
| Confirm validate | `POST /api/newsletter/confirm/validate` | `POST /api/public/newsletter/confirm/validate` |
| Confirm consume | `POST /api/newsletter/confirm` | `POST /api/public/newsletter/confirm` |

Forbidden browser targets: any `jackpot-api-newsletter` hostname; `POST /api/subscribe`.

Shared service envelope (`app/api/public/newsletter/_shared.ts`):

- `Content-Type` must include `application/json`;
- body bounded to **4096** characters;
- unsupported type / malformed JSON → `400 invalid_request`;
- oversized body → `413 invalid_request`.

Confirmation responses also set `Cache-Control: no-store` (and related no-cache headers). The BFF should preserve that intent while returning only its own browser-safe body.

---

# 1. Subscribe

## Browser DTO (target allowlist)

| Field | Type | Rules |
|---|---|---|
| `email` | string | Required; trim; 3–320 chars; plausible email shape |
| `consentAccepted` | boolean | Must be `true` |
| `ageConfirmed` | boolean | Must be `true` (21+ attestation) |
| `consentPolicyVersion` | string | Required; **must** be `newsletter-consent-us-v1-2026-07-31` |
| `signupSource` | string | Required; browser allowlist below |
| `website` | string optional | Honeypot (source name). Must be empty/absent to proceed. **Never forward upstream** |

Browser allowlisted `signupSource` values:

```text
newsletter_landing
website_footer
```

`website_footer` is only valid if a footer DOI placement actually ships. Do not send `admin_import`, `event_page`, `other`, `rewards_gate`, `feed_modal`, or `region_spotlight` from public UI.

Source BFF still uses `consentTextVersion`. Target must **not**.

## Canonical service request

```ts
{
  email: string,                 // 3–320
  consentPolicyVersion: string, // 1–120; unknown/stale rejected by registry
  consentAccepted: true,
  ageConfirmed: true,
  signupSource?: string          // 1–64; unknown/missing normalize to `other` in the service
}
```

BFF translation must be explicit. Do not rely on service `normalizeSignupSource()` as a substitute for an allowlist. Do not send `website` or `turnstileToken`.

## Canonical success (non-enumerating)

```json
{
  "ok": true,
  "status": "confirmation_if_eligible",
  "message": "Check your email to confirm your subscription."
}
```

Must not reveal new / pending / confirmed / suppressed / known.

## Canonical error codes

```text
invalid_request
invalid_email
consent_required
age_required
rate_limited
temporarily_unavailable
```

Observed route-level HTTP (not a complete flow table):

| Condition | HTTP | Body |
|---|---|---|
| Bad content-type / JSON | 400 | `invalid_request` |
| Oversized body | 413 | `invalid_request` |
| Origin allowlist reject | 403 | `invalid_request` |
| IP rate limited | 429 | `rate_limited` |
| SendGrid real-send enabled but misconfigured | 503 | `temporarily_unavailable` |
| Missing Supabase client | 503 | `invalid_request` (message generic) |
| Flow result | `result.httpStatus` | `runPublicSubscribeFlow()` |

Age/consent/email validation failures are **user-correctable** and must not echo membership/suppression (EC-05A).

## Browser-safe subscribe response (BFF → browser)

Clients key on JSON `status`, not raw upstream bodies.

| Browser `status` | Maps from | UI meaning |
|---|---|---|
| `accepted` | service `ok: true` + `confirmation_if_eligible` | Generic non-enumerating success |
| `invalid` | `invalid_request`, `invalid_email`, `consent_required`, `age_required`, or browser-schema failure | User-correctable; still non-enumerating of membership |
| `rate_limited` | `rate_limited` / 429 | Cooldown-safe |
| `unavailable` | `temporarily_unavailable`, 503, timeout, network, missing config, unknown/malformed `2xx` | Fail closed; not signup success |

Browser `status` is `accepted` on canonical success. Display the generic check-email message. Do **not** expose the service status string `confirmation_if_eligible`, subscriber-state flags, tokens, credentials, stack traces, or raw upstream JSON.

HTTP: S4-C may finalize status codes. S4-B clients must not treat arbitrary `2xx` JSON as success.

Side effects: **may** create/update pending subscriber state, issue a confirmation token, and enqueue DOI email. **Not required** for S4 local completion.

Authorization: workload identity (ADR-0003) before those side effects. Origin is defense-in-depth only. S4-C/D attach identity on the server transport; local tests may fake it.

---

# 2. Confirm validate

## Browser / canonical request

```ts
{ token: string }  // 16–128 chars; base64url `[A-Za-z0-9_-]+`
```

Do not log or render the token.

## Canonical status vocabulary (verified)

```text
ready_to_confirm
already_complete
invalid_or_unusable
unable_to_confirm
```

Response: `{ status: PublicConfirmValidateStatus }`.

Also:

| Condition | HTTP | Status |
|---|---|---|
| GET | 405 | `invalid_or_unusable` |
| Disallowed Origin | 403 | `invalid_or_unusable` |
| Missing persistence | 503 | `unable_to_confirm` |
| IP rate limit | 429 | `unable_to_confirm` |

Does **not** consume the token.

## Browser-safe mapping

| Service | Browser |
|---|---|
| `ready_to_confirm` | `ready_to_confirm` |
| `already_complete` | `already_complete` |
| `invalid_or_unusable` | `invalid_or_unusable` |
| `unable_to_confirm` | `unable_to_confirm` |
| unknown / malformed `2xx` | `unable_to_confirm` (fail closed; never `ready_to_confirm`) |

Do **not** copy source `confirm-client` synonym `valid`.

---

# 3. Confirm consume

Same token contract as validate. GET never consumes (`405` + `invalid_or_unusable`).

## Canonical status vocabulary (verified)

```text
success
already_complete
invalid_or_unusable
unable_to_confirm
```

| Service | Browser |
|---|---|
| `success` | `success` |
| `already_complete` | `already_complete` |
| `invalid_or_unusable` | `invalid_or_unusable` |
| `unable_to_confirm` | `unable_to_confirm` |
| unknown / malformed `2xx` | `unable_to_confirm` (never `success`) |

Validation success is not confirmation. Consume is the state-transition endpoint.

Consume Origin rejection currently returns the shared `invalid_request` error body instead of remapping to `invalid_or_unusable`. S4-C must fail closed on unexpected confirm bodies rather than treating that as success.

Side effects: **may** move `pending → confirmed`. Not required for S4 local completion.

---

# 4. Timeouts, retries, correlation

| Concern | Freeze |
|---|---|
| Service-documented timeout | **None** on the public handlers |
| Source BFF timeout | `UPSTREAM_TIMEOUT_MS = 10_000` in `core-proxy.ts` (REIMPLEMENT; do not copy the module) |
| S4 BFF → service | Bounded abort (~10s unless S4-C records a classified replacement). Treat timeout as `unavailable` / `unable_to_confirm` |
| Browser retry | Single attempt; no automatic multi-retry that could amplify abuse |
| Correlation / request id | Server-generated on the service/consent path (EC-05A). Not a browser DTO field. Do not require it in browser responses |

---

# 5. Authorization

| Layer | Freeze |
|---|---|
| Browser → site BFF | Same-origin only; no service hostname |
| BFF → service | Workload identity required before subscriber/token/Supabase/SendGrid side effects (ADR-0003). S4-D implements caller-side only |
| Current service runtime | Origin allowlist + missing-Origin allowed. **Not** the accepted production authorization end-state |
| Health / SendGrid webhook | Out of S4 acquisition BFF scope |

Arbitrary preview must not gain production newsletter mutation authority.

---

# 6. Explicit non-goals

- Not a generic proxy of arbitrary JSON.
- Not permission to deploy, send real email, or enable public DOI.
- Not permission to invent privacy-policy URL/version while the registry still has `null`.
- Not permission to copy source `doi-constants` / `core-proxy` field names as the canonical contract.
