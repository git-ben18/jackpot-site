# S4-F status — Security, failure, and abuse guardrails

| Field | Value |
|---|---|
| Date | 2026-09-10 |
| Packet | [S4-F-security-failure-and-abuse-guardrails.md](./S4-F-security-failure-and-abuse-guardrails.md) |
| Result | **accepted-with-documented-deferred-hosted-controls** |
| Base | `main@6d285ec` (includes merged S4-C/D/E + prior HTTP-status remediation) |
| Tip | `feat/jse-s4-f-security-guardrails@PENDING` |
| Prior partial | [_status-S4-F-http-status-remediation.md](./_status-S4-F-http-status-remediation.md) folded into S4-C lineage |

## Conclusion

Local newsletter acquisition boundaries are security-reviewable for S4-G. Hosted identity, network, SendGrid, perimeter, and production secret-scope proofs remain deferred and are **not** claimed here.

## Runtime artifacts added/hardened in this slice

```text
src/lib/newsletter/newsletter-acquisition-gate.ts   # kill switch (server-only)
src/lib/newsletter/newsletter-abuse-controls.ts     # honeypot + deferred bot-challenge policy
src/lib/newsletter/newsletter-bff.ts                # gate wired before transport
.env.example                                        # NEWSLETTER_ACQUISITION_ENABLED documented
src/lib/__tests__/newsletter-security-guardrails.test.ts
```

## Route inventory

| Route | Role | Mutation |
|---|---|---|
| `POST /api/newsletter/subscribe` | BFF subscribe | yes (upstream) |
| `GET /api/newsletter/subscribe` | 405 / unavailable | no |
| `POST /api/newsletter/confirm/validate` | BFF validate | no (read-like) |
| `GET /api/newsletter/confirm/validate` | 405 / invalid | no |
| `POST /api/newsletter/confirm` | BFF consume | yes (upstream) |
| `GET /api/newsletter/confirm` | 405 / invalid | no |
| `/newsletter/confirm` | Confirmation UX | browser → same-origin BFF only |
| `/` | Homepage (no DOI mount yet) | none |

No legacy `POST /api/subscribe` route exists.

## Client / server boundary inventory

| Module | Boundary |
|---|---|
| `newsletter-public-contract.ts` | browser-safe |
| `newsletter-abuse-controls.ts` | browser-safe policy (no secrets) |
| `confirm-client.ts` / controller / copy / `NewsletterConfirmClient.tsx` | browser |
| `newsletter-bff.ts` | `server-only` |
| `newsletter-canonical-contract.ts` | `server-only` |
| `newsletter-service-client.ts` | `server-only` |
| `newsletter-service-auth.ts` | `server-only` |
| `newsletter-service-env.ts` | `server-only` |
| `newsletter-acquisition-gate.ts` | `server-only` |

## Secret / env-name inventory (names only)

| Name | Scope |
|---|---|
| `NEWSLETTER_SERVICE_BASE_URL` | server |
| `NEWSLETTER_ACQUISITION_ENABLED` | server kill switch |
| `NEWSLETTER_WORKLOAD_IDENTITY_MODE` | server |
| `NEWSLETTER_WORKLOAD_OIDC_AUDIENCE` | server optional |
| `NEWSLETTER_WORKLOAD_IDENTITY_FAKE_ASSERTION` | local/test fake only |
| `VERCEL_OIDC_TOKEN` | Vercel / local OIDC pull |
| `SUPABASE_URL` / `SUPABASE_PUBLISHABLE_KEY` / `SUPABASE_ANON_KEY` | curated discovery (not newsletter mutation) |

No newsletter secret uses `NEXT_PUBLIC_*`.

## Active-runtime search evidence (`src/`)

Commands (equivalent coverage also encoded in `newsletter-security-guardrails.test.ts`):

```text
rg "/api/subscribe|email_signups|SUPABASE_SERVICE_ROLE_KEY|getSupabaseAdminClient|reward_access_token|subscriber_email_hash|NEXT_PUBLIC_NEWSLETTER|doi-flag" src
```

| Pattern | Active `src/` runtime (non-test) |
|---|---|
| `/api/subscribe` | **absent** (docs/tests may mention as forbidden) |
| `email_signups` | **absent** |
| `SUPABASE_SERVICE_ROLE_KEY` | **absent** from newsletter path; curated tests assert non-use |
| `getSupabaseAdminClient` | **absent** |
| `reward_access_token` | **absent** |
| `subscriber_email_hash` | **absent** |
| `NEXT_PUBLIC_*NEWSLETTER*` | **absent** |
| `doi-flag` | **absent** (replaced by `newsletter-acquisition-gate.ts`) |
| Browser `Authorization` forwarding | transport does not accept browser auth; workload auth is server-acquired |

## Guardrails verified

1. Request allowlists reject extras (`turnstileToken`, etc.).
2. Unknown/malformed upstream success fails closed (S4-C + prior HTTP remediation).
3. Subscribe success is non-enumerating (`{ status: 'accepted' }` only).
4. Tokens/credentials do not appear in BFF logs or browser responses (fixed log strings; confirm `no-store` headers).
5. Missing workload identity fails before protected fetch (S4-D tests).
6. Fake identity rejected in production / hosted preview (S4-D tests).
7. Kill switch (`NEWSLETTER_ACQUISITION_ENABLED=0`) prevents subscribe/validate/consume transport calls; returns bounded `unavailable` / `unable_to_confirm`.
8. Backend unavailable/timeout/401/403/429/5xx map to bounded statuses (S4-C tests).
9. No legacy persistence/fallback path in active runtime.
10. Direct browser newsletter-service URL use absent from confirmation/UI modules.
11. Client modules do not import server-only newsletter modules.
12. Confirmation-token handling remains bounded (S4-E tests; no raw-token controller accessor).

## Abuse-control boundary

| Control | Status |
|---|---|
| Honeypot `website` | **Implemented** — server short-circuit; never forwarded |
| Turnstile / equivalent | **Deferred** — Hosted Acceptance / release; fields not accepted on DTO |
| Browser-only checks authoritative? | **No** |

## Kill switch / rollback

- Disable with `NEWSLETTER_ACQUISITION_ENABLED=0` (or unknown value → fail closed).
- Rollback is code-level revert or kill switch only — no dual canonical subscriber system.

## Residual risks (documented, non-blocking for S4-F)

- S4-B DOI acquisition UI is not mounted; honeypot/kill-switch UX in the browser form remains future work. Server gate still blocks mutations.
- Confirm BFF maps all transport failures to `unable_to_confirm` (coarser than subscribe). Acceptable for S4-F privacy posture.
- Local default when env unset is **enabled** for developer BFF testing; this is **not** a public-acquisition launch claim.

## Deferred to Hosted Acceptance

- Real Vercel project/environment claim validation
- Staging/production identity separation in provider config
- Hosted newsletter-service reachability
- Hosted Supabase mutation path (if any beyond newsletter service)
- Real SendGrid delivery/webhook behavior
- Cloudflare/DNS/perimeter controls
- Production secrets scope in Vercel UI
- Production public exposure / DOI enablement
- Turnstile (or equivalent) provider wiring

## Local verification

| Command | Result |
|---|---|
| `npm test` | **PASS** — 130 tests, 0 fail |
| `npm run typecheck` | **PASS** |
| `npm run build` | **PASS** |

## Checklist

- [x] Request/response schemas and allowlists are enforced
- [x] Non-enumeration behavior is proven
- [x] No browser-visible/server-secret crossover exists
- [x] Legacy newsletter persistence/fallbacks are absent from active runtime
- [x] Confirmation tokens are handled hygienically
- [x] Missing identity and dependency failures fail closed
- [x] Kill switch prevents mutation without fallback
- [x] Abuse-control boundary/deferred hosted controls are documented
- [x] Repository security searches are recorded
- [x] Security-focused tests pass
- [x] S4-F conclusion is acceptable before S4-G
- [x] No deployment/production mutation is performed
