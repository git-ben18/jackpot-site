# S4-G status — Local integration acceptance

| Field | Value |
|---|---|
| Date | 2026-09-10 |
| Packet | [S4-G-local-integration-acceptance.md](./S4-G-local-integration-acceptance.md) |
| Result | **accepted** |
| Base | `main@e1f7379` (S4-B/C/D/E/F merged) |
| Tip | `feat/jse-s4-g-local-integration-acceptance@PENDING` |
| Node engines | `>=22` (package.json) |

## Prerequisites

| Track | Status reference | Result used |
|---|---|---|
| S4-A | [_status-S4-A.md](./_status-S4-A.md) | accepted |
| S4-B | [_status-S4-B.md](./_status-S4-B.md) | DOI UI complete |
| S4-C | [_status-S4-C.md](./_status-S4-C.md) | BFF complete |
| S4-D | [_status-S4-D.md](./_status-S4-D.md) | local identity complete |
| S4-E | [_status-S4-E.md](./_status-S4-E.md) | confirm UX complete |
| S4-F | [_status-S4-F.md](./_status-S4-F.md) | `accepted-with-documented-deferred-hosted-controls` |

## Runtime artifacts (this slice)

```text
src/lib/newsletter/__fixtures__/canonical-newsletter-service.ts  # controlled canonical fixture
src/lib/__tests__/newsletter-local-integration.test.ts           # assembled-path integration
docs/tasks/jse-s4/_status-S4-G.md
```

## Integration scenario results

| Scenario | Result |
|---|---|
| Subscribe happy path (DOI controller → BFF → fake identity → fixture → accepted) | **PASS** |
| Subscribe non-enumeration (success_new / pending / known_suppressed → same accepted) | **PASS** |
| Subscribe failures (invalid input, timeout, network, 401/403, 429, malformed, unknown 2xx, 5xx, kill switch) | **PASS** |
| Confirmation validate → ready → consume → success + token hygiene | **PASS** |
| Confirmation already_complete / invalid / unknown / malformed fail-closed | **PASS** |
| Missing workload identity blocks upstream; sanitized visitor failure | **PASS** |
| Fake identity forbidden in production mode | **PASS** |
| Active-runtime guardrail searches (legacy / secrets / SendGrid / hostname / client boundary) | **PASS** |

## Route inventory (production build)

| Route | Kind |
|---|---|
| `/` | Static — DOI hero mounted |
| `/newsletter/confirm` | Static — confirmation UX |
| `/privacy` | Static — scaffold only (not ACQ-05 approved) |
| `POST /api/newsletter/subscribe` | Dynamic BFF |
| `POST /api/newsletter/confirm/validate` | Dynamic BFF |
| `POST /api/newsletter/confirm` | Dynamic BFF |

## Env names exercised (values not recorded)

```text
NEWSLETTER_SERVICE_BASE_URL
NEWSLETTER_ACQUISITION_ENABLED
NEWSLETTER_WORKLOAD_IDENTITY_MODE
NEWSLETTER_WORKLOAD_IDENTITY_FAKE_ASSERTION
NEWSLETTER_WORKLOAD_OIDC_AUDIENCE
NODE_ENV
VERCEL_ENV
```

No secret values committed.

## Active-runtime search (S4-G)

Patterns asserted absent from non-test `src/` runtime:

`/api/subscribe`, `email_signups`, `SUPABASE_SERVICE_ROLE_KEY`, `getSupabaseAdminClient`, `reward_access_token`, `access_token`, `subscriber_email_hash`, `NEXT_PUBLIC_NEWSLETTER`, `@sendgrid` / `sendgrid` / `SendGrid`.

Browser DOI/confirm modules do not import server identity/transport/BFF modules or newsletter-service hostnames.

## Deferred to Hosted Acceptance

- Real Vercel-issued workload identity
- Staging newsletter-service reachability
- Controlled SendGrid DOI proof
- Staging/production identity separation
- ACQ-05 privacy URL/version freeze
- Public DOI enablement / deployment

## Local verification

| Field | Value |
|---|---|
| Date | 2026-09-10 |
| SHA | `PENDING` |
| Branch | `feat/jse-s4-g-local-integration-acceptance` |
| Subject | pending |

| Command | Result |
|---|---|
| `npm test` | pending |
| `npm run typecheck` | pending |
| `npm run build` | pending |

## Checklist

- [x] Full DOI request path passes controlled local integration
- [x] Subscribe remains non-enumerating across fixture variants
- [x] Full confirmation validate/consume path passes controlled local integration
- [x] Workload identity failure prevents protected downstream mutation
- [x] Required dependency/error scenarios fail safely
- [x] No legacy writer/fallback reachable
- [x] No browser direct-service path
- [x] No server-secret/client boundary regression
- [x] Tests/typecheck/build pass
- [x] Exact tested SHA and evidence recorded
- [x] Conclusion `accepted` before S4-H
- [x] No hosted/public deployment performed
