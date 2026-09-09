# S4 newsletter contract matrix (frozen for S4-A)

Status: **provisional** where marked. Browser/BFF columns are the target seam S4-B binds to and S4-C must implement. Canonical service columns are expected inventory from S4 packets / JSE-001 and were **not** verified against a readable `jackpot-api-newsletter` SHA in this environment.

## Route map

| Concern | Browser → `jackpot-site` BFF | BFF → `jackpot-api-newsletter` |
|---|---|---|
| Subscribe | `POST /api/newsletter/subscribe` | `POST /api/public/newsletter/subscribe` |
| Confirm validate | `POST /api/newsletter/confirm/validate` | `POST /api/public/newsletter/confirm/validate` |
| Confirm consume | `POST /api/newsletter/confirm` | `POST /api/public/newsletter/confirm` |

Forbidden browser targets: any `jackpot-api-newsletter` hostname; `POST /api/subscribe`.

## Subscribe — browser DTO (target)

Allowlisted JSON body only:

| Field | Type | Rules |
|---|---|---|
| `email` | string | Required; trim; basic email shape; max 320 chars |
| `consentAccepted` | boolean | Must be `true` |
| `ageConfirmed` | boolean | Must be `true` (21+ attestation) |
| `consentPolicyVersion` | string | Required; must match target allowlisted policy version |
| `signupSource` | string | Required; must be in browser allowlist below |
| `website` | string optional | Honeypot; must be empty/absent to proceed |

Browser allowlisted `signupSource` values for public UI (subset):

```text
newsletter_landing
website_footer
```

Additional backend sources such as `event_page`, `admin_import`, `other` may exist on the service; the public browser UI must not invent them. S4-C translates only approved mappings.

### Browser-safe subscribe response

Narrow schema. Unknown keys ignored by clients; unknown `status` → treat as error (fail closed).

| `status` | Meaning for UI |
|---|---|
| `accepted` | Generic non-enumerating success (“check your email if eligible”) |
| `rate_limited` | Cooldown/rate-safe state; do not imply account existence |
| `unavailable` | Kill-switch / config / upstream unavailable |
| `error` | Recoverable generic failure |

Must **not** appear in browser responses: new/pending/confirmed/suppressed/known flags; raw upstream bodies; tokens; credentials; stack traces.

HTTP: prefer `200` with bounded `status` for accepted/rate_limited/unavailable/error outcomes that are safe to show. Invalid browser input may be `400` with `status: "error"` (still non-enumerating). Exact status-code map is finalized in S4-C; S4-B clients key primarily on JSON `status`.

## Subscribe — canonical service DTO (provisional)

Expected request fields equivalent to:

| Field | Notes |
|---|---|
| `email` | Subscriber address |
| `consentPolicyVersion` | Product-owned |
| `consentAccepted` | `true` |
| `ageConfirmed` | `true` |
| `signupSource` | Backend vocabulary; do not silently rename |

Authorization: workload identity (ADR-0003); not browser-supplied. Side effects: may create/update subscriber pending state and enqueue DOI email via SendGrid — **not required for S4 local completion**.

Response vocabulary: **unverified** here. BFF must validate before mapping; unknown success payloads fail closed (S4-C). Non-enumeration is mandatory regardless of upstream detail.

## Confirm validate / confirm (inventory only; S4-E/C)

Browser DTOs (expected):

| Route | Browser body (allowlist) |
|---|---|
| validate | `{ token: string }` (or product-approved token representation) |
| confirm | `{ token: string }` |

Browser-safe confirmation states expected (provisional; S4-E finalizes copy):

```text
ready_to_confirm
success
already_complete
invalid_or_unusable
unable_to_confirm
```

Unknown upstream status → fail closed to `unable_to_confirm` / equivalent safe state. Tokens must never be logged or rendered.

## Correlation / timeouts

| Concern | S4-A freeze |
|---|---|
| Correlation / request id | If upstream returns one, BFF may keep server-side only; do not require it in browser DTO |
| Timeout / retry | Browser client: single attempt; no automatic multi-retry that could amplify abuse. Server timeouts defined in S4-C/D |

## Explicit non-goals of this matrix

- Not a generic proxy of arbitrary JSON.
- Not permission to deploy or send real email.
- Not a substitute for reading the live `jackpot-api-newsletter` OpenAPI/schemas once accessible.
