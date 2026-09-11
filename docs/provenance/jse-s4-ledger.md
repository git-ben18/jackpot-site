# JSE-S4 provenance ledger

| Field | Value |
|---|---|
| Slice | `JSE-S4` |
| Status | **IMPLEMENTATION COMPLETE** locally (S4-H). Not hosted-accepted. Not production-authoritative. See `docs/tasks/jse-s4/_status-S4-H.md`. |
| S4 start `main` tip inspected | `jackpot-site main@3063eb1eb88419eaa88124694cb64d1fcdf2b3e1` |
| Accepted S3 descendant baseline | S3-G/H merged on `main@47c911c` (PR #25). S4-A’s earlier “not on main” discrepancy is closed by that merge; this closeout supersedes it. |
| Functional source baseline | `rewards-maxxing-frontend@466bfb065a9c34010ee0f0de22b419299259fa46` |
| Source authority baseline | `rewards-maxxing-frontend@0f75f8b596e9e208b02d54cdf48e2011b5217ff3` |
| JSE-003 inspected | `rewards-maxxing-frontend@3aa256df708667a8286ddcd2f7056db7b39939c3` |
| Product / ADR inspected | `jackpot-news@5bba8b11bf424734ede5eda44e8f5687ca3117d1` |
| Newsletter service inspected | `jackpot-api-newsletter@c6cfaa4ccf9e09f801c3ae4f23dd43b0c88d8cd8` |
| Authority | S4 packets under `docs/tasks/jse-s4/`; JSE-001 adopted at `docs/architecture/JACKPOT_SITE_EXTRACTION_PLAN.md`; JSE-003 file-level dispositions verified at source HEAD |

Do not pre-claim migration. Add a row when an artifact is actually copied, hardened, or reimplemented.

## Recording rule

| Column | Required |
|---|---|
| Source path | yes |
| Source commit/SHA | yes |
| JSE-003 disposition | yes |
| Target path | yes |
| COPY vs COPY+HARDEN vs REIMPLEMENT | yes |
| Hardening changes | when applicable |
| Tests/fixtures adopted | when applicable |
| Deferred/excluded dependencies | when applicable |

## Adopted runtime artifacts (S4)

Later packets copy from `466bfb0` unless a classified post-baseline source SHA is recorded first. Product copy and consent version come from EC-05A / the newsletter registry, not from source `doi-constants.ts`.

| Source path | Source SHA | JSE-003 disposition | Target path | Copy vs harden vs reimplement | Hardening changes | Tests/fixtures | Deferred/excluded deps |
|---|---|---|---|---|---|---|---|
| `src/app/api/newsletter/subscribe/route.ts` | `466bfb0` | REIMPLEMENT | `src/app/api/newsletter/subscribe/route.ts` | REIMPLEMENT | Frozen browser DTO; no `consentTextVersion`; fake transport in tests; identity fail-closed until S4-D | `newsletter-bff-contract.test.ts` | source `doi-constants`, `core-proxy` name, `/api/subscribe` |
| `src/app/api/newsletter/confirm/validate/route.ts` | `466bfb0` | REIMPLEMENT | `src/app/api/newsletter/confirm/validate/route.ts` | REIMPLEMENT | Token allowlist; no-store; map `ready_to_confirm` not source `valid`; never log token | same | confirm UI (S4-E) |
| `src/app/api/newsletter/confirm/route.ts` | `466bfb0` | REIMPLEMENT | `src/app/api/newsletter/confirm/route.ts` | REIMPLEMENT | Distinct consume path; unexpected bodies → `unable_to_confirm` | same | GET never consumes |
| `src/lib/newsletter/core-proxy.ts` | `466bfb0` | REIMPLEMENT (rename) | `src/lib/newsletter/newsletter-service-client.ts` + `newsletter-canonical-contract.ts` + `newsletter-bff.ts` | REIMPLEMENT + HARDEN (S4-F) | Canonical DTOs; 10s timeout; no website/turnstile forward; sanitizer; **httpStatus consulted for success**; default auth is `resolveWorkloadIdentityAuth` (S4-D) | same + httpStatus + workload identity cases | hosted OIDC acceptance |
| `src/lib/newsletter/env.ts` | `466bfb0` | REIMPLEMENT | `src/lib/newsletter/newsletter-service-env.ts` | REIMPLEMENT | Single `NEWSLETTER_SERVICE_BASE_URL`; no `doi-flag` | same | `NEXT_PUBLIC_*` service URL |
| n/a (target seam) | n/a | n/a | `src/lib/newsletter/newsletter-public-contract.ts` | implemented | Browser-safe statuses/version from S4-A | same | UI (S4-B) |
| n/a (target seam) | n/a | n/a | `src/lib/newsletter/newsletter-service-auth.ts` | implemented (S4-D) | Vercel OIDC via `@vercel/oidc` + explicit local fake; production/preview forbid fake; `Authorization: Bearer` attachment | `workloadIdentity.test.ts` + HTTP transport cases | hosted OIDC acceptance |
| `src/lib/newsletter/confirm-client.ts` | `466bfb0` | COPY + HARDEN | `src/lib/newsletter/confirm-client.ts` | COPY + HARDEN | Frozen `{ status }` (`ready_to_confirm`); reject source `valid`/`outcome`; same-origin only; empty token no-fetch | `newsletter-confirm-ux.test.ts` | doi-constants |
| `src/components/newsletter/NewsletterConfirmClient.tsx` | `466bfb0` | COPY + HARDEN | `src/components/newsletter/NewsletterConfirmClient.tsx` | COPY + HARDEN | Token hygiene + replaceState; consume lock; bounded copy | same | analytics, doi-constants |
| n/a | n/a | implemented | `src/lib/newsletter/newsletter-confirm-copy.ts` | implemented | Visitor-safe confirm strings only | same | EC-05A email sender provisioning |
| `src/lib/newsletter/subscribe-client.ts` | `466bfb0` | COPY + HARDEN | `src/lib/newsletter/subscribe-client.ts` | COPY + HARDEN | Same-origin only; frozen `{ status }`; no `consentTextVersion`; reject arbitrary 2xx | `newsletter-doi-ui.test.ts` | service hostname, legacy subscribe |
| `src/components/newsletter/DoiNewsletterSignupForm.tsx` | `466bfb0` | COPY + HARDEN | `src/components/newsletter/DoiNewsletterSignupForm.tsx` | COPY + HARDEN | EC-05A consent/age; honeypot; kill-switch seam; bounded status copy | same | AcquisitionSignup, soft-gate, analytics |
| `src/components/InlineNewsletterHero.tsx` | `466bfb0` | REIMPLEMENT | `src/components/InlineNewsletterHero.tsx` | REIMPLEMENT | DOI-only mount of form; no modal/footer legacy fallback | same | EmailSignupForm |
| n/a | n/a | implemented | `src/lib/newsletter/doi-copy.ts` + `newsletter-subscribe-controller.ts` | implemented | EC-05A copy; client validation + in-flight lock | `newsletter-doi-ui.test.ts` | source doi-constants version strings |
| n/a | n/a | implemented | `src/lib/newsletter/newsletter-confirm-controller.ts` | implemented | Manual retry re-validates only; consume lock; token retained only while needed | `newsletter-confirm-ux.test.ts` | auto-retry consume, token logging |
| n/a | n/a | implemented | `src/lib/newsletter/newsletter-acquisition-gate.ts` | implemented | Unset/empty/unknown fail closed; never restores `/api/subscribe` | `newsletter-security-guardrails.test.ts` | source `doi-flag.ts` |
| n/a | n/a | implemented | `src/lib/newsletter/newsletter-abuse-controls.ts` | implemented | Honeypot policy; Turnstile fields not accepted | same | hosted Turnstile |
| n/a | n/a | implemented | `src/lib/newsletter/__fixtures__/canonical-newsletter-service.ts` | implemented | Literal frozen canonical paths/DTO; not imported by production runtime | `newsletter-local-integration.test.ts` | live SendGrid/Supabase |
| `src/app/page.tsx` | S2 scaffold + S4-B | REIMPLEMENT (DOI mount) | `src/app/page.tsx` | adapted | Mounts DOI hero; S3-G also mounts curated discovery on the same page; no `LandingDashboardClient` | `newsletter-doi-ui.test.ts` | dashboard |
| `src/app/newsletter/confirm/page.tsx` | S2 placeholder + S4-E | REIMPLEMENT | `src/app/newsletter/confirm/page.tsx` | adapted | Mounts confirmation client | `newsletter-confirm-ux.test.ts` | legacy token persistence |

## Source families not copied (classified, not adopted as files)

| Source path | Source SHA | JSE-003 disposition | Outcome |
|---|---|---|---|
| `src/lib/newsletter/doi-constants.ts` | `466bfb0` | COPY + HARDEN after reconcile | **Not copied.** Product copy/version from EC-05A via `doi-copy.ts` / public contract. Do not copy source `newsletter_doi_v1`. |

## Excluded (must not enter the S4 graph)

| Source path / family | Disposition |
|---|---|
| `POST /api/subscribe` / `src/app/api/subscribe/route.ts` | EXCLUDE |
| `EmailSignupForm` / `AcquisitionSignup` | EXCLUDE |
| `doi-flag.ts` as legacy off-path | EXCLUDE / REPLACE (kill switch must not restore legacy writer) |
| Legacy `email_signups` writes / `logEmailSignup` / `hash-email` | EXCLUDE |
| Legacy access/reward token minting | EXCLUDE |
| Browser-direct `jackpot-api-newsletter` | EXCLUDE |
| `subscriber_email_hash` localStorage / `email_signup` cookie | EXCLUDE by default |
| Footer/modal/slide-in legacy signup fallback | EXCLUDE |
| `core-proxy.ts` **name** in target | EXCLUDE (behavior reimplemented under a new name) |
| Hosted acceptance / public DOI enablement / real SendGrid | Out of S4 implementation scope |

## Upstream verification (S4-A)

| Authority | Status |
|---|---|
| `jackpot-news` ADR-0003 / ADR-0004 / EC-05A | Inspected at `5bba8b1` |
| P0 acquisition workplan | Inspected; ownership lines superseded by ADR-0003/0004; blocker list still current |
| `rewards-maxxing-frontend` JSE-003 | Inspected at `3aa256d`; newsletter dispositions unchanged from `0f75f8b` |
| `jackpot-api-newsletter` live schemas | Inspected at `c6cfaa4`; matrix is verified, not provisional |
