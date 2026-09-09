# JSE-S4 provenance ledger

| Field | Value |
|---|---|
| Slice | `JSE-S4` |
| Status | S4-A contract freeze recorded with upstream-access and S3-closeout discrepancies; S4-B DOI UI reimplemented locally |
| S4 start `main` tip inspected | `jackpot-site main@3063eb1eb88419eaa88124694cb64d1fcdf2b3e1` |
| Accepted S3 descendant baseline | **Not recorded** — S3-G/S3-H not merged/accepted on `main` (see `_status-S4-A.md`) |
| Functional source baseline (intended) | `rewards-maxxing-frontend@466bfb065a9c34010ee0f0de22b419299259fa46` |
| Source authority baseline (intended) | `rewards-maxxing-frontend@0f75f8b596e9e208b02d54cdf48e2011b5217ff3` |
| Authority | S4 packets under `docs/tasks/jse-s4/`; JSE-001 adopted at `docs/architecture/JACKPOT_SITE_EXTRACTION_PLAN.md`; JSE-003 file-level verification blocked (source repo inaccessible from this environment) |

Do not pre-claim migration. Add a row when an artifact is actually copied, hardened, or reimplemented.

## Recording rule

| Column | Required |
|---|---|
| Source path | yes |
| Source commit/SHA | yes |
| JSE-003 disposition | yes (or explicit secondary-authority note when JSE-003 unread) |
| Target path | yes |
| COPY vs COPY+HARDEN vs REIMPLEMENT | yes |
| Hardening changes | when applicable |
| Tests/fixtures adopted | when applicable |
| Deferred/excluded dependencies | when applicable |

## Adopted runtime artifacts (S4-B)

| Source path | Source SHA | JSE-003 disposition | Target path | Copy vs harden vs reimplement | Hardening changes | Tests/fixtures | Deferred/excluded deps |
|---|---|---|---|---|---|---|---|
| `src/components/InlineNewsletterHero.tsx` | intended `466bfb0` (unread) | Expected **REIMPLEMENT** (JSE-001 §7.2; JSE-003 unread) | `src/components/InlineNewsletterHero.tsx` | REIMPLEMENT | DOI-only hero; no modal/slide-in/footer legacy fallback; mounts same-origin form only | DOI UI tests | AcquisitionSignup legacy branches, `/api/subscribe` |
| `src/components/newsletter/DoiNewsletterSignupForm.tsx` | intended `466bfb0` (unread) | Expected **COPY + HARDEN** (JSE-001 §7.2; JSE-003 unread) | `src/components/newsletter/DoiNewsletterSignupForm.tsx` | **REIMPLEMENT** (source inaccessible; COPY deferred) | Explicit consent + 21+ unchecked by default; honeypot; kill-switch; non-enumerating UX; no localStorage/cookie soft-gate | DOI UI tests | legacy subscribe client, reward tokens, analytics |
| `src/lib/newsletter/subscribe-client.ts` | intended `466bfb0` (unread) | Expected **COPY + HARDEN** (JSE-001 §7.2; JSE-003 unread) | `src/lib/newsletter/subscribe-client.ts` | **REIMPLEMENT** (source inaccessible; COPY deferred) | Same-origin `/api/newsletter/subscribe` only; narrow browser-safe status schema; no service hostname | DOI client tests | `NEXT_PUBLIC_*` service URL, direct `jackpot-api-newsletter` |
| `src/lib/newsletter/doi-constants.ts` | intended `466bfb0` (unread) | Expected verify product authority before copy (S4-A) | `src/lib/newsletter/doi-constants.ts` | REIMPLEMENT (provisional) | Consent policy version + signup-source allowlist marked provisional pending EC-05A / service verification | contract tests | inventing backend-only sources in UI |
| n/a (target seam) | n/a | n/a | `src/lib/newsletter/subscribe-browser-contract.ts` | implemented | Browser DTO validation + status vocabulary for S4-C BFF seam | contract tests | server transport |
| n/a (target seam) | n/a | n/a | `src/lib/newsletter/acquisition-kill-switch.ts` | implemented | `NEXT_PUBLIC_NEWSLETTER_DOI_ENABLED === "true"` opt-in; off → unavailable, no mutation | kill-switch tests | legacy writer fallback when off |
| n/a (target seam) | n/a | n/a | `src/lib/newsletter/newsletter-signup-controller.ts` | implemented | Pure validation/submit orchestration for UI tests without DOM | controller tests | — |

## Excluded (must not enter the S4 graph)

| Source path / family | Disposition |
|---|---|
| `POST /api/subscribe` | EXCLUDE |
| Legacy `email_signups` writes | EXCLUDE |
| Legacy access/reward token minting | EXCLUDE |
| Browser-direct `jackpot-api-newsletter` | EXCLUDE |
| `subscriber_email_hash` localStorage / `email_signup` cookie soft-gate | EXCLUDE by default |
| Footer/modal/slide-in legacy signup fallback | EXCLUDE |
| Confirmation page/BFF runtime (S4-E / S4-C) | Deferred to later S4 packets |
| Workload identity / OIDC (S4-D) | Deferred |
| Hosted acceptance / public DOI enablement | Out of S4 implementation scope |

## Upstream verification debt

| Authority | Status at S4-A |
|---|---|
| `jackpot-news` ADR-0003 / ADR-0004 / EC-05A | Not readable from this Cloud Agent environment (repo not in env `repos`) |
| `rewards-maxxing-frontend` JSE-003 | Not readable; dispositions below rely on adopted JSE-001 matrix + S4 packets |
| `jackpot-api-newsletter` live schemas | Not readable; canonical route inventory frozen as **provisional** from S4 packets |

S4-C must re-verify the provisional DTO matrix against the live newsletter-service contract before treating translation as authoritative.
