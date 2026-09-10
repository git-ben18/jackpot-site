# S4-H status — JSE-S4 implementation closeout

| Field | Value |
|---|---|
| Date | 2026-09-10 |
| Packet | [S4-H-implementation-closeout.md](./S4-H-implementation-closeout.md) |
| Result | **IMPLEMENTATION COMPLETE** — not production ready, not hosted-accepted |
| Base | `main@359ecfb` (S4-G PR #24 merged) |
| S4-G tested runtime SHA | `6871c6c354441eec270831e05b2086413931b732` (`6871c6c`) |
| S4-G evidence status body | `7a89be8317f23f1996dc6b1a9cbf354967439381` (`7a89be8`) |
| S4 merge SHA on `main` | `359ecfb` (includes evidence-only S4-G commits after the tested runtime) |
| S4-H evidence | this document on `docs/jse-s4-h-implementation-closeout`; **not** a production deployment SHA |

```text
JSE-S4 — Newsletter Acquisition Implementation
STATUS: IMPLEMENTATION COMPLETE

Implemented / locally accepted:
✓ DOI acquisition UI
✓ confirmation UX
✓ same-origin BFF
✓ canonical request translation
✓ canonical response validation/sanitization
✓ non-enumerating subscribe behavior
✓ caller-side workload-identity integration
✓ token/secret/client-server security guardrails
✓ failure / kill-switch behavior
✓ controlled local integration
✓ tests / typecheck / production build

Not asserted by S4:
○ Vercel staging deployment
○ real Vercel OIDC operational acceptance
○ production/staging Supabase newsletter mutation acceptance
○ real SendGrid DOI delivery
○ SendGrid webhook hosted acceptance
○ production hostname / Cloudflare cutover
○ public DOI enablement
○ production workload authorization
○ transfer of public-site authority
```

S4-H is docs/evidence/handoff only. No deployment, production mutation, public DOI enablement, DNS/Cloudflare change, or production-authority transfer was performed.

## Prerequisite evidence (S4-A through S4-G)

| Track | Status | Result |
|---|---|---|
| S4-A | [_status-S4-A.md](./_status-S4-A.md) | accepted freeze (PR #17 → `7e7931d`) |
| S4-B | [_status-S4-B.md](./_status-S4-B.md) | DOI UI complete locally (PR #23 → `f384674`; tip `681309f`) |
| S4-C | [_status-S4-C.md](./_status-S4-C.md) | same-origin BFF complete locally (lineage landed with S4-D PR #20) |
| S4-D | [_status-S4-D.md](./_status-S4-D.md) | caller-side identity **IMPLEMENTED**, not hosted-accepted (PR #20 → `4214ab3`; tip `ca40a3b`) |
| S4-E | [_status-S4-E.md](./_status-S4-E.md) | confirmation UX complete locally (PR #21 → `6d285ec`; tip `5f38367`) |
| S4-F | [_status-S4-F.md](./_status-S4-F.md) | `accepted-with-documented-deferred-hosted-controls` (PR #22 → `e1f7379`; tip `cc2de57`) |
| S4-G | [_status-S4-G.md](./_status-S4-G.md) | **accepted** at tested runtime `6871c6c` (PR #24 → `359ecfb`) |

HTTP-status fail-closed remediation is folded into S4-C/S4-F: [_status-S4-F-http-status-remediation.md](./_status-S4-F-http-status-remediation.md).

Do **not** use Cloud Agent draft PR #16 / `cursor/jse-s4-a-b-doi-acquisition-feca` as S4 authority.

## Authority baselines (S4-A freeze)

| Authority | SHA |
|---|---|
| `jackpot-news` `main` | `5bba8b11bf424734ede5eda44e8f5687ca3117d1` |
| Functional source baseline | `rewards-maxxing-frontend@466bfb065a9c34010ee0f0de22b419299259fa46` |
| Source authority baseline | `rewards-maxxing-frontend@0f75f8b596e9e208b02d54cdf48e2011b5217ff3` |
| JSE-003 inspected | `rewards-maxxing-frontend@3aa256df708667a8286ddcd2f7056db7b39939c3` |
| `jackpot-api-newsletter` `main` | `c6cfaa4ccf9e09f801c3ae4f23dd43b0c88d8cd8` |
| S4 start `jackpot-site` `main` | `3063eb1eb88419eaa88124694cb64d1fcdf2b3e1` |
| S4-A freeze merge | `jackpot-site@7e7931d` |

Product freeze remains: consent `newsletter-consent-us-v1-2026-07-31`; browser subscribe statuses `accepted` / `invalid` / `rate_limited` / `unavailable`; confirm validate/consume frozen statuses; honeypot `website` never forwarded; no `/api/subscribe`. Matrix: [s4-newsletter-contract-matrix.md](./s4-newsletter-contract-matrix.md).

## Implemented topology (not hosted)

```text
Browser
  ↓ same-origin
jackpot-site UI / confirmation UX
  ↓
jackpot-site newsletter BFF
  ↓
server-only newsletter transport
  ↓
server-only workload identity adapter
  ↓
canonical jackpot-api-newsletter contract

S4 proof boundary:
controlled local/test service (S4-G fixture)

Future Hosted Acceptance boundary:
restricted Vercel staging + real OIDC + accepted staging API/Supabase/SendGrid
```

## Implementation inventory

### Target UI components

| Path | Role |
|---|---|
| `src/components/InlineNewsletterHero.tsx` | DOI-only hero (REIMPLEMENT) |
| `src/components/newsletter/DoiNewsletterSignupForm.tsx` | DOI form (COPY + HARDEN) |
| `src/components/newsletter/NewsletterConfirmClient.tsx` | Confirmation UX (COPY + HARDEN) |
| `src/app/page.tsx` | Mounts DOI hero |
| `src/app/newsletter/confirm/page.tsx` | Confirmation page |
| `src/lib/newsletter/doi-copy.ts` | EC-05A visitor copy |
| `src/lib/newsletter/newsletter-subscribe-controller.ts` | Browser subscribe controller |
| `src/lib/newsletter/newsletter-confirm-copy.ts` | Bounded confirm copy |
| `src/lib/newsletter/newsletter-confirm-controller.ts` | Confirm retry / token / consume lock |
| `src/lib/newsletter/newsletter-abuse-controls.ts` | Browser-safe honeypot policy (no secrets) |

### Browser newsletter clients

| Path | Role |
|---|---|
| `src/lib/newsletter/newsletter-public-contract.ts` | Browser-safe DTO/status freeze |
| `src/lib/newsletter/subscribe-client.ts` | Same-origin `POST /api/newsletter/subscribe` |
| `src/lib/newsletter/confirm-client.ts` | Same-origin validate + consume |

### BFF routes and server-only transport

| Path | Role |
|---|---|
| `src/app/api/newsletter/subscribe/route.ts` | Subscribe BFF |
| `src/app/api/newsletter/confirm/validate/route.ts` | Confirm validate BFF |
| `src/app/api/newsletter/confirm/route.ts` | Confirm consume BFF |
| `src/lib/newsletter/newsletter-bff.ts` | Pipeline (`server-only`) |
| `src/lib/newsletter/newsletter-canonical-contract.ts` | Translation + parse (`server-only`) |
| `src/lib/newsletter/newsletter-service-client.ts` | HTTP transport (`server-only`) |
| `src/lib/newsletter/newsletter-service-env.ts` | `NEWSLETTER_SERVICE_BASE_URL` only |
| `src/lib/newsletter/newsletter-acquisition-gate.ts` | Kill switch (`server-only`) |

### Workload identity adapter

| Path | Role |
|---|---|
| `src/lib/newsletter/newsletter-service-auth.ts` | `resolveWorkloadIdentityAuth` — Vercel OIDC or explicit local fake; fake forbidden in production/preview |

### Tests and fixtures

| Path | Role |
|---|---|
| `src/lib/__tests__/newsletter-bff-contract.test.ts` | BFF contract + HTTP class mapping |
| `src/lib/__tests__/workloadIdentity.test.ts` | Caller-side identity fail-closed |
| `src/lib/__tests__/newsletter-doi-ui.test.ts` | DOI UI |
| `src/lib/__tests__/newsletter-confirm-ux.test.ts` | Confirmation UX |
| `src/lib/__tests__/newsletter-security-guardrails.test.ts` | S4-F searches + gate |
| `src/lib/__tests__/newsletter-local-integration.test.ts` | S4-G assembled path |
| `src/lib/newsletter/__fixtures__/canonical-newsletter-service.ts` | Controlled canonical fixture |

Provenance rows: [jse-s4-ledger.md](../../provenance/jse-s4-ledger.md).

## Route inventory

| Route | Kind |
|---|---|
| `/` | Static — DOI hero mounted |
| `/newsletter/confirm` | Static — confirmation UX |
| `/privacy` | Static — scaffold only (**not** ACQ-05 approved privacy URL/version) |
| `POST /api/newsletter/subscribe` | Dynamic BFF |
| `POST /api/newsletter/confirm/validate` | Dynamic BFF |
| `POST /api/newsletter/confirm` | Dynamic BFF |

Absent from active runtime: `POST /api/subscribe`, `src/app/api/subscribe/`, legacy `email_signups` writers.

## Credential / environment inventory (names only)

| Name | Scope | Purpose |
|---|---|---|
| `NEWSLETTER_SERVICE_BASE_URL` | server | Newsletter-service origin |
| `NEWSLETTER_ACQUISITION_ENABLED` | server | Kill switch; unset/empty/unknown fail closed |
| `NEWSLETTER_WORKLOAD_IDENTITY_MODE` | server | `vercel_oidc` (default) or `fake` (local/test) |
| `NEWSLETTER_WORKLOAD_OIDC_AUDIENCE` | server optional | OIDC audience; unset until EB-03 |
| `NEWSLETTER_WORKLOAD_IDENTITY_FAKE_ASSERTION` | local/test | Fake assertion when mode=`fake` |
| `VERCEL_OIDC_TOKEN` | Vercel / local pull | Runtime OIDC material |
| `NODE_ENV` / `VERCEL_ENV` | runtime | Fake-identity prohibition in production/preview |
| `SUPABASE_URL` / `SUPABASE_PUBLISHABLE_KEY` / `SUPABASE_ANON_KEY` | server (S3) | Curated discovery only — not newsletter mutation |

No values recorded. No newsletter secret uses `NEXT_PUBLIC_*`.

## Security evidence references

- S4-F: [_status-S4-F.md](./_status-S4-F.md)
- HTTP class mapping: [_status-S4-F-http-status-remediation.md](./_status-S4-F-http-status-remediation.md)
- Active-runtime searches (S4-F + S4-G tests): `/api/subscribe`, `email_signups`, `SUPABASE_SERVICE_ROLE_KEY`, `getSupabaseAdminClient`, `reward_access_token`, `access_token`, `subscriber_email_hash`, `NEXT_PUBLIC_NEWSLETTER`, SendGrid client usage
- No service-role/client leak on the newsletter path
- Confirmation token hygiene (S4-E): never logged/rendered; cleared on terminal states and unmount
- Workload identity fail-closed when missing/invalid; fake mode rejected when `NODE_ENV=production` or `VERCEL_ENV` is `preview`/`production`
- Kill switch prevents subscribe/validate/consume transport unless explicitly enabled

## Integration evidence references

S4-G local verification at tested runtime `6871c6c`:

| Command | Result |
|---|---|
| `npm test` | **PASS** — 155 tests, 0 fail |
| `npm run typecheck` | **PASS** |
| `npm run build` | **PASS** — DOI `/`, confirm page, newsletter BFF routes present |

S4-G did not re-test evidence-only commits after `6871c6c`. Those commits document SHA distinction only.

## Known residual risks / deferred controls

These remain **hosted / product / release** items. They are not unresolved S4 implementation defects:

| Item | Why deferred |
|---|---|
| Real Vercel-issued OIDC + verifier acceptance | Epic B / Hosted Acceptance |
| Staging newsletter-service reachability | Hosted Acceptance |
| Hosted Supabase newsletter mutation path | newsletter-service + DB authority, not this repo |
| Controlled real SendGrid DOI / webhooks | Hosted Acceptance |
| Cloudflare / DNS / production hostname | release/cutover |
| Public DOI enablement | kill switch + Hosted Acceptance / release |
| ACQ-05 privacy policy URL/version | live registry still `null`; `/privacy` is scaffold only |
| Turnstile (or equivalent) | documented deferred abuse control |
| S3-G live homepage / S3-H | **not on `main`**; S4-A discrepancy; does not block newsletter implementation closeout and does **not** transfer public-site authority |

No S4 implementation blocker is being relabeled as a hosted deferral.

## No-authority-transfer statement

S4 implementation complete:

- does not make a Vercel preview or staging deployment production-authoritative;
- does not authorize `jackpot-site` as the production BFF workload;
- does not authorize production newsletter mutations;
- does not enable public acquisition;
- does not deauthorize the currently accepted production frontend/workload;
- does not modify DNS/Cloudflare;
- does not imply real SendGrid delivery acceptance.

Production authority remains a later release/cutover decision under `jackpot-news` architecture/release authority (ADR-0003 / ADR-0004).

## Future Hosted Acceptance handoff

Create/activate a cross-repository Hosted Acceptance layer only after explicit frontend, newsletter-backend, and Supabase security-readiness review permits restricted hosting. Placeholder proof areas (IDs only; S4-H does not execute them):

```text
HA-01 restricted Vercel staging topology
HA-02 environment / secret / preview isolation
HA-03 real Vercel OIDC caller + verifier proof
HA-04 hosted BFF → newsletter API contract proof
HA-05 hosted Supabase newsletter path acceptance
HA-06 controlled real SendGrid DOI E2E
HA-07 hosted failure / rollback / security evidence
HA-08 hosted acceptance closeout
```

## Cross-repository responsibilities

| Repo / authority | Responsibility |
|---|---|
| `jackpot-site` | S4 implementation and implementation evidence (this closeout) |
| `jackpot-api-newsletter` | Canonical newsletter service and hosted runtime/OIDC verifier acceptance |
| `jackpot-news` | Product/release/architecture authority and future hosted/cutover gate |
| `jackpot-docs` | Cross-repo summary/navigation only |
| current Supabase migration authority | Any required DB schema/grant/RLS changes; **never** ad-hoc DDL from this repo |

## Checklist

- [x] S4-G is accepted with exact tested SHA (`6871c6c`)
- [x] All S4-A through S4-G evidence is linked
- [x] Provenance ledger is complete for adopted S4 artifacts
- [x] Target route/dependency/credential inventory is complete
- [x] Legacy `/api/subscribe` and legacy persistence are absent from active runtime
- [x] Security and local integration evidence is summarized
- [x] No unresolved implementation blocker is mislabeled as a hosted deferral
- [x] Closeout prominently says `IMPLEMENTATION COMPLETE` rather than `PRODUCTION READY`
- [x] Hosted/OIDC/Supabase/SendGrid/public-cutover assertions are explicitly excluded
- [x] Future Hosted Acceptance handoff is documented
- [x] No deployment, production mutation, or public enablement is performed as part of S4-H
