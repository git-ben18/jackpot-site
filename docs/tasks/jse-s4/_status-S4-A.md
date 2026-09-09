# S4-A status

| Field | Value |
|---|---|
| Date | 2026-09-09 |
| Packet | [S4-A-baseline-and-contract-freeze.md](./S4-A-baseline-and-contract-freeze.md) |
| Result | Complete with recorded discrepancies (docs/metadata only) |
| Inspected `main` tip | `3063eb1eb88419eaa88124694cb64d1fcdf2b3e1` |
| Evidence | [jse-s4-ledger.md](../../provenance/jse-s4-ledger.md), [s4-newsletter-contract-matrix.md](./s4-newsletter-contract-matrix.md) |

## Baselines

| Item | SHA / status |
|---|---|
| S4 start `main` tip | `jackpot-site@3063eb1eb88419eaa88124694cb64d1fcdf2b3e1` (includes S4 packet merge PR #15) |
| Accepted S3 descendant | **DISCREPANCY** — no `_status-S3-G.md` / `_status-S3-H.md`; curated live homepage remains on unmerged `origin/feat/jse-s3-g-live-homepage` (`709039a…`). S4 docs/UI work proceeds from current `main` with this gap explicit. Runtime S4 must not pretend S3 closeout transferred authority. |
| S2 / S3 start (historical) | `jackpot-site main@7abb209f7bafd0da53d08027e5773eff272fa39a` |
| Functional source baseline (intended) | `rewards-maxxing-frontend@466bfb065a9c34010ee0f0de22b419299259fa46` |
| Source authority baseline (intended) | `rewards-maxxing-frontend@0f75f8b596e9e208b02d54cdf48e2011b5217ff3` |

## Upstream authority SHAs

| Authority | SHA inspected at S4-A | Notes |
|---|---|---|
| `jackpot-news` ADR-0003 | **Unavailable** | Repo not in Cloud Agent environment; not readable via `gh` |
| `jackpot-news` ADR-0004 | **Unavailable** | Local provenance notes merge via PR #10 on 2026-08-30 only |
| `jackpot-news` EC-05A | **Unavailable** | Product consent/copy/confirmation authority unread |
| `rewards-maxxing-frontend` JSE-001 | Secondary: adopted target copy | `docs/architecture/JACKPOT_SITE_EXTRACTION_PLAN.md` |
| `rewards-maxxing-frontend` JSE-003 | **Unavailable** | File-level dispositions not re-audited at source SHA |
| `jackpot-api-newsletter` HEAD | **Unavailable** | Canonical schemas unread; inventory provisional |

## Frozen target topology

```text
Browser
  |
  | same-origin only
  v
jackpot-site
  |  newsletter UI (S4-B)
  |  confirmation UI (S4-E)
  |  same-origin BFF (S4-C)
  |
  | authenticated server-to-server (S4-D)
  v
jackpot-api-newsletter
  |                 \
  v                  v
Supabase            SendGrid
```

Browser must never call the newsletter-service hostname directly.

## Source dispositions (secondary authority)

Verified only against adopted JSE-001 §7.2 + S4-A expectations. **JSE-003 line audit blocked.**

| Source path | Expected disposition | S4-A note |
|---|---|---|
| `src/components/InlineNewsletterHero.tsx` | REIMPLEMENT | DOI-only; no legacy writer fallback |
| `src/components/newsletter/DoiNewsletterSignupForm.tsx` | COPY + HARDEN | Source unread → S4-B must REIMPLEMENT and record debt |
| `src/lib/newsletter/subscribe-client.ts` | COPY + HARDEN | Source unread → S4-B REIMPLEMENT, same-origin only |
| `src/lib/newsletter/confirm-client.ts` | verify in JSE-003 | Deferred to S4-E; same-origin if adopted |
| `src/lib/newsletter/doi-constants.ts` | verify product authority | Provisional constants only until EC-05A readable |
| source newsletter BFF subscribe/confirm routes | REIMPLEMENT | S4-C |
| `POST /api/subscribe` | EXCLUDE | Global S4 invariant |

## Canonical newsletter-service contract inventory

Routes expected (provisional until service repo readable):

```text
POST /api/public/newsletter/subscribe
POST /api/public/newsletter/confirm/validate
POST /api/public/newsletter/confirm
```

Target BFF counterparts (frozen for S4-B/C):

```text
POST /api/newsletter/subscribe
POST /api/newsletter/confirm/validate
POST /api/newsletter/confirm
```

Full browser → BFF → service → browser matrix: [s4-newsletter-contract-matrix.md](./s4-newsletter-contract-matrix.md).

Consent fields expected equivalent to:

```text
consentPolicyVersion
consentAccepted: true
ageConfirmed: true
signupSource
```

Signup-source vocabulary expected to include at least: `website_footer`, `newsletter_landing`, `event_page`, `admin_import`, `other`. Do not silently rename backend vocabulary; BFF translation must be explicit (S4-C).

## Product-owned values (authoritative upstream, not invented)

| Value | Owner | S4-A status |
|---|---|---|
| Consent policy version string | EC-05A / product | Provisional placeholder in target until upstream readable |
| Signup-source semantics | newsletter-service + product | Allowlist mirrored provisionally; BFF must not invent new backend values |
| Confirmation UI states | EC-05A + service status map | Deferred detail to S4-E; fail-closed unknown |
| Age/consent evidence shape | EC-05A + service schema | Boolean `consentAccepted` + `ageConfirmed` required for subscribe |

## Workload-identity boundary

S4 implements **caller-side** integration code only (S4-D). Operational Vercel OIDC proof, production identity binding, and hosted acceptance are **Hosted Acceptance**, not S4 implementation completion.

## Release / hosted boundary

S4 does **not** authorize:

- Vercel deployment as production acceptance;
- public DOI enablement;
- real SendGrid traffic;
- production Supabase mutation acceptance;
- production identity binding;
- DNS/Cloudflare cutover;
- transfer of public-site authority.

## Global S4 invariants (frozen)

1. No `POST /api/subscribe` in `jackpot-site`.
2. No writes to legacy `email_signups` or equivalent.
3. No legacy access-token / reward-token minting as newsletter signup.
4. No browser-to-`jackpot-api-newsletter` direct request.
5. No newsletter acquisition fallback that bypasses the canonical newsletter service.
6. No Supabase service-role credential in browser or newsletter BFF merely to implement acquisition.
7. No production mutation or real email send required for S4 implementation completion.
8. No arbitrary preview deployment gains production newsletter authority.

## Runtime copy

None in S4-A. Documentation / provenance / contract freeze only.

## Acceptance checklist

- [x] Accepted S3 descendant SHA recorded as S4 baseline, **or discrepancy explicitly recorded**.
- [x] Upstream authority SHAs recorded (**unavailable** called out where unread).
- [x] JSE-003 source dispositions verified **or verification debt recorded** (secondary JSE-001 used).
- [x] Canonical backend route/request/response matrix frozen (**provisional** pending service access).
- [x] Product-owned consent/source/confirmation semantics identified.
- [x] Legacy `/api/subscribe` and legacy persistence explicitly excluded.
- [x] Browser→service direct calls explicitly prohibited.
- [x] S4 implementation vs Hosted Acceptance boundary recorded.
- [x] No production deployment/configuration/mutation performed.

## Next

- S4-B may implement DOI UI against the frozen same-origin browser/BFF seam.
- Before S4-C treats translation as final, grant environment read access to `jackpot-api-newsletter` (+ ideally `jackpot-news` / `rewards-maxxing-frontend`) and replace provisional schemas with verified ones.
