# S6 production-readiness inventory template

Filled across **S6-A/B** and reused by later packets. Never paste secret values, raw email addresses, confirmation tokens, workload assertions, or provider credentials into evidence.

## Authorities inspected (S6-A)

| Authority | SHA / status | Notes |
|---|---|---|
| `jackpot-site` `main` | | S6 baseline |
| Final candidate SHA | | filled/revalidated at S6-H |
| `jackpot-news` | | ADR-0003/0004, ACQ-05/06, release controls |
| `jackpot-api-newsletter` | | hosted-entry gate + EB-03/05/06 |
| DB/migration authority | | HA-05 authority |
| S3-H | | |
| S4-H | | |
| S5-H | | must be accepted before production-ready certification |
| Restricted-hosting readiness | permitted / blocked | |
| Abuse-control authority | | production challenge/equivalent decision |

## Production control register (S6-A)

| Control | Required? | Owner | Outcome | Evidence / blocker |
|---|---|---|---|---|
| Privacy/legal linkage | yes | jackpot-news | | |
| Server-side abuse control | yes | | | |
| Backend rate/cooldown/circuit-breaker | yes | newsletter backend | | |
| Workload identity authorization | yes | both repos | | |
| Public-reader least privilege | yes | jackpot-site/DB | | |
| Secret/env isolation | yes | jackpot-site/operators | | |
| Token/PII/assertion hygiene | yes | both repos | | |
| Failure/error disclosure | yes | | | |
| Safe request correlation | yes | | | |
| Rollback/recovery | yes | | | |
| Analytics sink | architecture-dependent | jackpot-news | | disabled is valid if authoritative |
| Dependency/supply-chain posture | yes | jackpot-site | | |
| Headers/referrer/cache controls | architecture-dependent | jackpot-site | | |
| Input/method/content-type abuse | yes | jackpot-site | | |

Allowed outcomes: `required-and-planned`, `proven`, `N/A-by-authority`, `equivalent-approved`, `blocked`.

For `equivalent-approved`, record approving authority, compensating controls, and review/expiry date.

## HA-01…08 map

Track execution separately from acceptance.

| ID | Proof | Owner | Packet | Packet execution | Acceptance contribution |
|---|---|---|---|---|---|
| HA-01 | Production-equivalent restricted staging | jackpot-site + operators | S6-C | | |
| HA-02 | Env/secret/preview isolation | jackpot-site + operators | S6-C | | |
| HA-03 | Real OIDC caller + verifier authorization | both repos | S6-D | | |
| HA-04 | Hosted BFF → newsletter contract | both repos | S6-E | | |
| HA-05 | Hosted Supabase newsletter path | newsletter + DB authority | S6-E | | |
| HA-06 | Controlled provider/DOI staging preflight | newsletter + site UX | S6-E | | |
| HA-07 | Failure/abuse/rollback/operational security | both + operators | S6-G | | |
| HA-08 | Exact-candidate production-readiness certification | jackpot-site + release authority | S6-H | | |

Execution: `not-started | complete | blocked | N/A`.

Acceptance: `not-satisfied | proven | N/A-by-authority`.

“Out of repo” is ownership metadata, not an acceptance result.

## Route and Internet-exposure inventory (S6-B)

Expected product routes are a starting allowlist, not the end of the audit:

```text
/
/privacy
/newsletter/confirm
POST /api/newsletter/subscribe
POST /api/newsletter/confirm/validate
POST /api/newsletter/confirm
```

Also record:

- framework-generated routes/error pages;
- methods accepted/rejected per route;
- redirects;
- static/public assets with configuration implications;
- any runtime network endpoint;
- cache/referrer/header behavior;
- unexpected routes discovered from the production build.

## Environment names only

| Name | Browser / server | Environment scope | Notes |
|---|---|---|---|
| `NEWSLETTER_SERVICE_BASE_URL` | server | | |
| `NEWSLETTER_ACQUISITION_ENABLED` | server | | fail-closed |
| `NEWSLETTER_WORKLOAD_IDENTITY_MODE` | server | | fake forbidden hosted |
| `NEWSLETTER_WORKLOAD_OIDC_AUDIENCE` | server | | from accepted EB-03 |
| `SUPABASE_URL` | server | | public-reader path |
| `SUPABASE_PUBLISHABLE_KEY` | server | | |
| `SUPABASE_ANON_KEY` | server | | compatibility only if retained |
| `NODE_ENV` / `VERCEL_ENV` | server | | |
| `NEXT_PUBLIC_*` | browser | | inspect bundle; no secrets/upstream authority |

Add all discovered names. Do not record values.

## Guardrail / bundle search areas

Include at least:

```text
SessionInit
/api/log-
/api/subscribe
email_signups
SUPABASE_SERVICE_ROLE_KEY
getSupabaseAdminClient
Authorization
Bearer
NEWSLETTER_SERVICE_BASE_URL
NEXT_PUBLIC_
subscriber_email_hash
reward_access_token
token
email
oidc
workload
console.log
console.error
```

Interpret legitimate hits.

## Internet-exposure checklist

For each public/mutation surface consider:

| Exposure | Result / evidence |
|---|---|
| malformed input | |
| oversized input | |
| unexpected method | |
| unexpected content type | |
| rapid/repeated calls | |
| auth/header spoofing | |
| upstream timeout/5xx | |
| DB/public-reader failure | |
| provider failure | |
| stack/upstream-body leakage | |
| token/PII/assertion logging | |
| cache/referrer leakage | |
| preview→production privilege | |
| bot/automation behavior | |
| safe request correlation | |

## Exact-candidate closeout

At S6-H record:

| Item | Value |
|---|---|
| Final jackpot-site SHA | |
| Newsletter backend SHA | |
| Acceptance environment | |
| `npm test` | |
| `npm run typecheck` | |
| `npm run build` | |
| Guardrail/bundle scan | |
| Route comparison | |
| Critical positive hosted checks | |
| Critical negative hosted checks | |
| Final status | `PRODUCTION-READY RELEASE CANDIDATE` / `BLOCKED` |
