# S4-C — Same-origin BFF contract

| Field | Value |
|---|---|
| Track | S4-C |
| Type | Code + contract tests |
| Depends on | S4-A |
| Blocks | S4-D, S4-G |
| Estimate | M |
| Repo | `git-ben18/jackpot-site` |

## Goal

Implement `jackpot-site` as the browser-facing anti-corruption boundary for newsletter acquisition. The browser calls only same-origin routes in this repository; those routes validate and allowlist browser DTOs, translate them to the canonical `jackpot-api-newsletter` contract, invoke a server-only upstream client, validate the upstream response, and return a deliberately narrow browser-safe response.

S4-C proves the BFF contract statically and locally. It does not require hosted service connectivity, production credentials, production Supabase mutation, or public deployment.

## Target route surface

Freeze exact route paths in S4-A. Expected site-facing routes are:

```text
POST /api/newsletter/subscribe
POST /api/newsletter/confirm/validate
POST /api/newsletter/confirm
```

These are `jackpot-site` BFF routes. They are distinct from canonical service routes such as:

```text
POST /api/public/newsletter/subscribe
POST /api/public/newsletter/confirm/validate
POST /api/public/newsletter/confirm
```

The browser must not receive or construct the canonical service hostname.

## BFF pipeline

Every route must preserve this shape:

```text
browser request
   ↓
parse + validate browser DTO
   ↓
allowlist fields
   ↓
explicit DTO translation
   ↓
server-only upstream client
   ↓
validate canonical service response
   ↓
map/sanitize to browser-safe status
   ↓
bounded same-origin response
```

Do not pass arbitrary browser JSON through to the backend and do not proxy arbitrary backend JSON back to the browser.

## Contract requirements

### Subscribe

1. Accept only the browser-facing fields approved in S4-A/product authority.
2. Translate to the backend canonical fields, including consent evidence and signup-source mapping where required.
3. Preserve the backend's non-enumerating outcome. Do not expose whether the email is new, pending, confirmed, suppressed, or otherwise known.
4. Treat unknown backend success payloads/status values as an invalid upstream response, not as signup success.
5. Do not create legacy subscriber state locally.

### Confirm validate

1. Accept only the confirmation token representation approved by product/security authority.
2. Do not log the token.
3. Forward only to the canonical validation route through the server-only upstream client.
4. Exhaustively map known canonical validation statuses to browser-safe states.
5. Unknown status vocabulary must fail closed to a generic safe state.

### Confirm consume

1. Accept only the approved token/confirmation request.
2. Do not treat validation success as confirmation success; confirmation is a distinct operation.
3. Exhaustively map known canonical completion states.
4. Preserve idempotent/already-complete semantics if provided by the canonical service without exposing subscriber-specific detail.
5. Unknown or malformed `2xx` responses must not become confirmed success.

## Server-only configuration

The upstream base URL is server-only configuration. It must not be required by browser code or exposed through a `NEXT_PUBLIC_*` variable.

The BFF upstream client should expose a narrow internal interface so S4-D can attach workload identity without coupling browser routes to Vercel APIs.

Conceptually:

```ts
interface NewsletterServiceTransport {
  subscribe(input: CanonicalSubscribeInput): Promise<CanonicalSubscribeResponse>
  validateConfirmation(input: CanonicalValidateInput): Promise<CanonicalValidateResponse>
  confirm(input: CanonicalConfirmInput): Promise<CanonicalConfirmResponse>
}
```

Exact names are implementation choices; the boundary is not.

## Failure semantics

Define bounded mappings for:

- invalid browser request;
- unsupported signup source;
- missing required consent/age evidence;
- upstream timeout;
- upstream network unavailable;
- upstream unauthorized/forbidden;
- upstream rate/cooldown behavior if exposed;
- malformed upstream JSON;
- unknown upstream status;
- upstream `5xx`;
- internal configuration missing.

Caller-facing errors must be sanitized. Do not echo raw upstream bodies, stack traces, environment values, provider details, database errors, or subscriber-specific state.

## Required tests

Use mocked/fake transport at the server boundary. At minimum prove:

1. browser body is rejected when extra/unapproved fields attempt to cross the boundary if strict schemas are intended;
2. approved browser DTO maps exactly to canonical backend DTO;
3. source vocabulary translation is explicit;
4. generic subscribe success remains non-enumerating;
5. unknown `2xx` backend status fails closed;
6. malformed backend JSON fails closed;
7. timeout/network failure returns bounded browser-safe failure;
8. backend `401/403` does not expose auth details;
9. confirmation token never appears in structured logs/tested logger calls;
10. no route writes legacy subscriber persistence;
11. no route references `/api/subscribe` fallback;
12. browser-facing modules do not import server-only transport/config.

## Security invariants

- BFF is not a generic reverse proxy.
- Upstream destination is configured, not browser-selectable.
- Request and response schemas are both enforced.
- Workload authentication is added by the server transport/auth layer, never supplied by browser input.
- `Origin` may be used later as defense-in-depth but never substitutes for workload identity on the downstream service.
- No subscriber enumeration is introduced by status or message mapping.

## Evidence / deliverables

- Target same-origin route handlers.
- Browser DTO schemas/types.
- Canonical DTO translation functions.
- Sanitized response mapping.
- Server-only newsletter-service transport interface/client seam.
- Contract tests.
- Provenance/status evidence with source paths/SHA and reimplementation notes.

## Out of scope

- Operational Vercel OIDC proof.
- Hosted `jackpot-api-newsletter` connectivity.
- Backend route/schema changes unless a separately approved backend task is required.
- Supabase changes.
- SendGrid changes or real sends.
- Vercel/Cloudflare configuration.
- Public DOI enablement.

## Acceptance checklist

- [ ] Browser calls same-origin BFF only.
- [ ] All browser inputs are schema validated/allowlisted.
- [ ] Canonical backend DTO translation is explicit and tested.
- [ ] Canonical backend responses are schema validated before mapping.
- [ ] Unknown/malformed `2xx` responses fail closed.
- [ ] Subscribe remains non-enumerating.
- [ ] Confirmation status mapping is exhaustive for the frozen contract.
- [ ] Raw upstream errors/credentials/tokens never reach browser responses.
- [ ] No legacy subscriber write/fallback exists.
- [ ] Server transport seam is ready for S4-D workload identity.
- [ ] No deployment or real mutation is required/performed.

## Agent prompt

```text
Implement only S4-C from docs/tasks/jse-s4/S4-C-same-origin-bff-contract.md.
Create the narrow same-origin newsletter BFF with strict browser DTOs, explicit
canonical translation, validated/sanitized backend responses, and a server-only
transport seam. No generic proxy, legacy fallback, deployment, Supabase change,
or real newsletter mutation.
```
