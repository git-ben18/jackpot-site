# S6 hosted-acceptance inventory template

Filled by **S6-A** (authorities / blockers / HA map) and **S6-B** (route / dependency / env / credential facts). Do not paste secret values.

Copy into `_status-S6-A.md` / `_status-S6-B.md` rather than treating this template as evidence.

## Authorities inspected (S6-A)

| Authority | SHA / status | Notes |
|---|---|---|
| `jackpot-site` `main` | | S6 start SHA |
| Hosted candidate SHA | | must be a merged/main descendant, not an uncommitted S5-G tree |
| `jackpot-news` `main` | | ADR-0003/0004, ACQ-05/06 |
| `rewards-maxxing-frontend` JSE-001/003 | | dispositions unchanged unless classified |
| `jackpot-api-newsletter` `main` | | Epic B / EB-03 |
| S3-H | | curated implementation complete locally |
| S4-H | | newsletter implementation complete locally |
| S5-C / ACQ-05 | | expected BLOCKED until operator values exist |
| S5-G / S5-H | | do not claim complete if privacy still blocked |
| Restricted-hosting readiness review | permitted / blocked | S4-H precondition |

## HA-01…08 map (S6-A)

| ID | Proof | Owner repo | S6 packet | Status |
|---|---|---|---|---|
| HA-01 | Restricted Vercel staging topology | jackpot-site + operators | S6-C | |
| HA-02 | Env / secret / preview isolation | jackpot-site + operators | S6-C | |
| HA-03 | Real Vercel OIDC caller + verifier | jackpot-site caller; newsletter verifier | S6-D | |
| HA-04 | Hosted BFF → newsletter contract | both | S6-E | |
| HA-05 | Hosted Supabase newsletter path | newsletter-service + DB authority | S6-E handoff | |
| HA-06 | Controlled real SendGrid DOI E2E | newsletter-service + this confirm UX | S6-E | |
| HA-07 | Hosted failure / rollback / security | jackpot-site + operators | S6-G | |
| HA-08 | Hosted acceptance closeout | jackpot-site evidence; jackpot-news gate | S6-H | |

## First-release route inventory (S6-B)

Expected unless S6-A records a newer approved allowlist:

```text
/
/privacy
/newsletter/confirm
POST /api/newsletter/subscribe
POST /api/newsletter/confirm/validate
POST /api/newsletter/confirm
```

Record extras (including `_not-found`) and whether any new S5/S6 network route exists (default: none).

## Environment names only (S6-B)

| Name | Browser / server | Hosted expected | Notes |
|---|---|---|---|
| `NEWSLETTER_SERVICE_BASE_URL` | server | | |
| `NEWSLETTER_ACQUISITION_ENABLED` | server | fail-closed until gated | |
| `NEWSLETTER_WORKLOAD_IDENTITY_MODE` | server | | fake forbidden in prod |
| `NEWSLETTER_WORKLOAD_OIDC_AUDIENCE` | server | unset until EB-03 | |
| `SUPABASE_URL` | server | | public reader only |
| `SUPABASE_PUBLISHABLE_KEY` | server | | never service-role |
| `SUPABASE_ANON_KEY` | server | compatibility fallback only | |
| `NODE_ENV` / `VERCEL_ENV` | server | | |
| `NEXT_PUBLIC_*` | browser | | no secrets / no newsletter hostname |

Add rows found in inventory. Never record values.

## Guardrail search literals (S6-B)

```text
SessionInit
ExploreFAB
/api/log-session
/api/log-interaction
/api/log-click
/api/subscribe
email_signups
SUPABASE_SERVICE_ROLE_KEY
getSupabaseAdminClient
subscriber_email_hash
reward_access_token
```

Hits in non-test `src/` must be empty or explicitly justified.

## Hosted vs local claims (every packet)

| Claim | Allowed in S6-B | Allowed only after named packet |
|---|---|---|
| Tests/typecheck/build on SHA | yes | |
| Restricted staging URL exists | no | S6-C |
| Real OIDC token issued | no | S6-D |
| Real subscriber mutation | no | S6-E under kill-switch control |
| Public DOI on | no | release after S6-H, not S6 itself |
| DNS cutover | no | `jackpot-news` / operators |
