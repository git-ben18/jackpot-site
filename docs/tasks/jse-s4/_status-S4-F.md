# S4-F status — Security, failure, and abuse guardrails

| Field | Value |
|---|---|
| Date | 2026-09-10 |
| Packet | [S4-F-security-failure-and-abuse-guardrails.md](./S4-F-security-failure-and-abuse-guardrails.md) |
| Result | **accepted-with-documented-deferred-hosted-controls** |
| Base | `main@f384674` (S4-B DOI UI merged + S4-C/D/E + prior HTTP-status remediation) |
| Tip | `feat/jse-s4-f-security-guardrails@cc2de57e441f0092eafbd327b7cfeb3874fdcc76` |
| Prior partial | [_status-S4-F-http-status-remediation.md](./_status-S4-F-http-status-remediation.md) folded into S4-C lineage |
| S4-B | [_status-S4-B.md](./_status-S4-B.md) — DOI hero/form present on `/` |

## Conclusion

Local newsletter acquisition boundaries (including assembled S4-B browser modules) are security-reviewable for S4-G. Hosted identity, network, SendGrid, perimeter, production secret-scope, and **ACQ-05 privacy URL/version** proofs remain deferred and are **not** claimed here.

## Runtime artifacts added/hardened in this slice

```text
src/lib/newsletter/newsletter-acquisition-gate.ts   # kill switch (server-only; unset fail-closed)
src/lib/newsletter/newsletter-abuse-controls.ts     # honeypot + deferred bot-challenge policy
src/lib/newsletter/newsletter-bff.ts                # gate wired before transport
.env.example                                        # NEWSLETTER_ACQUISITION_ENABLED documented
src/lib/__tests__/newsletter-security-guardrails.test.ts
```

S4-B browser modules reviewed in this closure pass (not authored here):

```text
src/lib/newsletter/subscribe-client.ts
src/lib/newsletter/newsletter-subscribe-controller.ts
src/lib/newsletter/doi-copy.ts
src/components/newsletter/DoiNewsletterSignupForm.tsx
src/components/InlineNewsletterHero.tsx
src/app/page.tsx
```

## Route inventory

| Route | Role | Mutation |
|---|---|---|
| `POST /api/newsletter/subscribe` | BFF subscribe | yes (upstream; gated) |
| `GET /api/newsletter/subscribe` | 405 / unavailable | no |
| `POST /api/newsletter/confirm/validate` | BFF validate | no (read-like; gated) |
| `GET /api/newsletter/confirm/validate` | 405 / invalid | no |
| `POST /api/newsletter/confirm` | BFF consume | yes (upstream; gated) |
| `GET /api/newsletter/confirm` | 405 / invalid | no |
| `/newsletter/confirm` | Confirmation UX | browser → same-origin BFF only |
| `/` | Homepage with S4-B DOI hero mounted | browser → same-origin subscribe BFF |
| `/privacy` | Scaffold privacy page only | **not** ACQ-05-approved privacy URL/version |

No legacy `POST /api/subscribe` route exists.

## Client / server boundary inventory

| Module | Boundary |
|---|---|
| `newsletter-public-contract.ts` | browser-safe |
| `newsletter-abuse-controls.ts` | browser-safe policy (no secrets) |
| `doi-copy.ts` | browser-safe (EC-05A copy) |
| `subscribe-client.ts` / `newsletter-subscribe-controller.ts` | browser (S4-B) |
| `DoiNewsletterSignupForm.tsx` / `InlineNewsletterHero.tsx` / `app/page.tsx` | browser (S4-B) |
| `confirm-client.ts` / controller / copy / `NewsletterConfirmClient.tsx` | browser (S4-E) |
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
| `NEWSLETTER_ACQUISITION_ENABLED` | server kill switch (**explicit true-like required**) |
| `NEWSLETTER_WORKLOAD_IDENTITY_MODE` | server |
| `NEWSLETTER_WORKLOAD_OIDC_AUDIENCE` | server optional |
| `NEWSLETTER_WORKLOAD_IDENTITY_FAKE_ASSERTION` | local/test fake only |
| `VERCEL_OIDC_TOKEN` | Vercel / local OIDC pull |
| `SUPABASE_URL` / `SUPABASE_PUBLISHABLE_KEY` / `SUPABASE_ANON_KEY` | curated discovery (not newsletter mutation) |

No newsletter secret uses `NEXT_PUBLIC_*`.

## Active-runtime search evidence (`src/`)

Commands (equivalent coverage also encoded in `newsletter-security-guardrails.test.ts`):

```text
rg "/api/subscribe|email_signups|SUPABASE_SERVICE_ROLE_KEY|getSupabaseAdminClient|reward_access_token|access_token|subscriber_email_hash|NEXT_PUBLIC_NEWSLETTER|doi-flag" src
```

| Pattern | Active `src/` runtime (non-test) |
|---|---|
| `/api/subscribe` | **absent** (docs/tests may mention as forbidden) |
| `email_signups` | **absent** |
| `SUPABASE_SERVICE_ROLE_KEY` | **absent** from newsletter path; curated tests assert non-use |
| `getSupabaseAdminClient` | **absent** |
| `reward_access_token` | **absent** |
| `access_token` | **absent** (generic coverage) |
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
7. Kill switch: unset/empty/`0`/unknown prevent subscribe/validate/consume transport; returns bounded `unavailable` / `unable_to_confirm`. Explicit `NEWSLETTER_ACQUISITION_ENABLED=1` (or true-like) required to allow.
8. Backend unavailable/timeout/401/403/429/5xx map to bounded statuses (S4-C tests).
9. No legacy persistence/fallback path in active runtime.
10. Direct browser newsletter-service URL use absent from confirmation **and** S4-B DOI UI modules.
11. Client modules (S4-B + S4-E + public contracts) do not import server-only newsletter modules.
12. Confirmation-token handling remains bounded (S4-E tests; no raw-token controller accessor).

## Abuse-control boundary

| Control | Status |
|---|---|
| Honeypot `website` | **Implemented** — server short-circuit; never forwarded |
| Turnstile / equivalent | **Deferred** — Hosted Acceptance / release; fields not accepted on DTO |
| Browser-only checks authoritative? | **No** |

## Kill switch / rollback

- **Fail closed when unset/empty** — unset cannot silently enable production acquisition.
- Disable with `NEWSLETTER_ACQUISITION_ENABLED=0` (or unknown value).
- Enable only with explicit true-like env value (local/dev/tests inject or set env).
- Rollback is code-level revert or kill switch only — no dual canonical subscriber system.

## Unresolved launch authority — ACQ-05

| Item | Status |
|---|---|
| Privacy policy **URL** | **Unresolved** (ACQ-05) — live registry remains `null` per S4-A |
| Privacy policy **version** | **Unresolved** (ACQ-05) |
| Scaffold route `/privacy` | Present for site shell only; **not** treated as approved product privacy URL/version |
| DOI consent copy | Keeps EC-05A “See the Privacy Policy.” wording as plain text; does **not** link `/privacy` as approved authority |

Public DOI enablement must not proceed until ACQ-05 freezes privacy URL/version.

## Residual risks (documented, non-blocking for S4-F)

- Confirm BFF maps all transport failures to `unable_to_confirm` (coarser than subscribe). Acceptable for S4-F privacy posture.
- Local/explicit enablement of `NEWSLETTER_ACQUISITION_ENABLED` is still **not** a public-acquisition launch claim.
- ACQ-05 privacy URL/version unresolved (see above).

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
- **ACQ-05 privacy URL/version freeze and wiring**

## Local verification

| Field | Value |
|---|---|
| Date | 2026-09-10 |
| SHA | `cc2de57e441f0092eafbd327b7cfeb3874fdcc76` (`cc2de57`) |
| Branch | `feat/jse-s4-f-security-guardrails` (rebased on `main@f384674`) |
| Subject | `Close S4-F against main with S4-B and fail-closed acquisition gate.` |

| Command | Result |
|---|---|
| `npm test` | **PASS** — 141 tests, 0 fail |
| `npm run typecheck` | **PASS** |
| `npm run build` | **PASS** — `/` DOI hero + newsletter BFF routes present |

## Checklist

- [x] Request/response schemas and allowlists are enforced
- [x] Non-enumeration behavior is proven
- [x] No browser-visible/server-secret crossover exists
- [x] Legacy newsletter persistence/fallbacks are absent from active runtime
- [x] Confirmation tokens are handled hygienically
- [x] Missing identity and dependency failures fail closed
- [x] Kill switch prevents mutation without fallback (unset fail-closed)
- [x] Abuse-control boundary/deferred hosted controls are documented
- [x] Repository security searches are recorded (includes `access_token`)
- [x] S4-B browser modules included in assembled boundary audit
- [x] ACQ-05 privacy URL/version recorded as unresolved; `/privacy` not treated as approved
- [x] Security-focused tests pass
- [x] S4-F conclusion is acceptable before S4-G
- [x] No deployment/production mutation is performed
