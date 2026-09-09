# S4-A status

| Field | Value |
|---|---|
| Date | 2026-09-09 |
| Packet | [S4-A-baseline-and-contract-freeze.md](./S4-A-baseline-and-contract-freeze.md) |
| Result | Complete (docs/metadata only) — upstream authorities inspected in this environment |
| Inspected `main` tip | `jackpot-site@3063eb1eb88419eaa88124694cb64d1fcdf2b3e1` |
| Evidence | [jse-s4-ledger.md](../../provenance/jse-s4-ledger.md), [s4-newsletter-contract-matrix.md](./s4-newsletter-contract-matrix.md) |

This freeze replaces the earlier Cloud Agent S4-A pass on `cursor/jse-s4-a-b-doi-acquisition-feca`, which could not read `jackpot-news`, `rewards-maxxing-frontend` JSE-003, or `jackpot-api-newsletter`. That branch’s contract matrix remains **provisional and non-authoritative**.

## Baselines

| Item | SHA / status |
|---|---|
| S4 start `main` tip | `jackpot-site@3063eb1eb88419eaa88124694cb64d1fcdf2b3e1` (includes S4 packet merge PR #15) |
| Accepted S3 descendant | **DISCREPANCY** — S3-F is [`ACCEPTED`](../jse-s3/_status-S3-F.md) on `main`; S3-G live homepage is **not** merged ([PR #14](https://github.com/git-ben18/jackpot-site/pull/14) `feat/jse-s3-g-live-homepage@709039a…`); no `_status-S3-G.md` / `_status-S3-H.md` on `main`. S4 docs freeze from current `main` with this gap explicit. Runtime S4 must not pretend S3 closeout transferred public-site authority. |
| S2 / S3 start (historical) | `jackpot-site main@7abb209f7bafd0da53d08027e5773eff272fa39a` |
| Functional source baseline | `rewards-maxxing-frontend@466bfb065a9c34010ee0f0de22b419299259fa46` |
| Source authority baseline | `rewards-maxxing-frontend@0f75f8b596e9e208b02d54cdf48e2011b5217ff3` |

S4 implementation must branch from the accepted S3 descendant once S3-G/S3-H land, or record a later classified replacement. This packet does not wait on that merge to freeze contracts.

## Upstream authority SHAs inspected

| Authority | SHA inspected | Notes |
|---|---|---|
| `jackpot-news` `main` | `5bba8b11bf424734ede5eda44e8f5687ca3117d1` | Default branch tip at freeze time (ADR-0004 merge PR #10) |
| ADR-0003 | same | Accepted. Hosting + Vercel OIDC; browser never calls newsletter-service hostname |
| ADR-0004 | same | Merged to `main`. File header still says “Proposed — becomes accepted when merged”; treat as **accepted by merge**. Amends ADR-0003 frontend workload to `jackpot-site` **after** explicit acceptance + cutover |
| EC-05A | same | `docs/epics/epic-c-curated-newsletter-outbound/requirements/EC-05A-signup-confirmation-product-decisions.md` |
| P0 acquisition workplan | same | `docs/release/p0-acquisition-blockers-agent-workplan.md` (last updated 2026-08-16). Blocker list remains current release guidance. Website/runtime ownership lines still name `rewards-maxxing-frontend` / `core`; **superseded for ownership** by ADR-0003/0004 |
| `rewards-maxxing-frontend` `master` | `3aa256df708667a8286ddcd2f7056db7b39939c3` | JSE-003 last content change `2c093c1` (S2/S3 status facts only) |
| JSE-001 | `0f75f8b` authority baseline; target copy `docs/architecture/JACKPOT_SITE_EXTRACTION_PLAN.md` | Newsletter dispositions unchanged for S4 files |
| JSE-003 | same HEAD as frontend `master` above | Newsletter COPY / REIMPLEMENT / EXCLUDE rows **unchanged** vs `0f75f8b` |
| `jackpot-api-newsletter` `main` | `c6cfaa4ccf9e09f801c3ae4f23dd43b0c88d8cd8` | Includes contract docs PR #4. Docs cite runtime snapshot `239ab9f5ffd7f1f3f240cccbfddc550c07fcb95a`; live handlers/schemas at HEAD match those docs |

No stop-condition conflict was found: ADR-0003/0004 require workload identity before newsletter side effects; the service currently still allows missing Origin as server-to-server context. That is an **Epic B / Hosted Acceptance gap**, not permission for S4 to invent Origin-only production auth. EC-05A product copy and consent version match the live newsletter registry. JSE-003 still classifies every S4-A source path.

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
  | authenticated server-to-server (S4-D caller-side)
  v
jackpot-api-newsletter
  |                 \
  v                  v
Supabase            SendGrid
```

Browser must never call the newsletter-service hostname directly. Creating this repository, a preview URL, or local tests does not transfer production public-site or BFF authority (ADR-0004).

## Source dispositions (JSE-003 verified)

Verified against JSE-003 at `rewards-maxxing-frontend@3aa256d` (newsletter rows unchanged from `0f75f8b`). All listed paths exist at functional baseline `466bfb0`.

| Source path | JSE-003 disposition | S4-A freeze |
|---|---|---|
| `src/components/InlineNewsletterHero.tsx` | **REIMPLEMENT** | DOI-only; mount `DoiNewsletterSignupForm` directly; no `/api/subscribe` fallback |
| `src/components/newsletter/DoiNewsletterSignupForm.tsx` | **COPY + HARDEN** | Keep consent + 21+ unchecked, honeypot, generic success. Reconcile copy to EC-05A. Same-origin client only |
| `src/lib/newsletter/subscribe-client.ts` | **COPY + HARDEN** | Same-origin `/api/newsletter/subscribe` only. Reconcile DTO to canonical service fields (do not keep source `consentTextVersion`) |
| `src/lib/newsletter/confirm-client.ts` | **COPY + HARDEN** | POST-only validate + consume. Map service `ready_to_confirm`, **not** source synonym `valid` |
| `src/components/newsletter/NewsletterConfirmClient.tsx` | **COPY + HARDEN** | S4-E. No-server-token-read; in-memory token; `history.replaceState` |
| `src/lib/newsletter/doi-constants.ts` | **COPY + HARDEN** after product reconcile | **Not product authority.** Use EC-05A / newsletter registry for version + copy. Do not copy `newsletter_doi_v1` or extra FE signup sources |
| `src/lib/newsletter/core-proxy.ts` | **REIMPLEMENT** (rename) | Authenticated sanitizer/client. Source still forwards `consentTextVersion` / `website` / `turnstileToken` — do not copy that allowlist |
| `src/lib/newsletter/env.ts` | **REIMPLEMENT** | Server-only newsletter-service URL; no `doi-flag` re-export |
| `src/app/api/newsletter/subscribe/route.ts` | **REIMPLEMENT** | Same-origin BFF; OIDC; fail closed |
| `src/app/api/newsletter/confirm/validate/route.ts` | **REIMPLEMENT** | Same |
| `src/app/api/newsletter/confirm/route.ts` | **REIMPLEMENT** | Same |
| `src/components/newsletter/AcquisitionSignup.tsx` | **EXCLUDE** | Do not migrate |
| `src/lib/newsletter/doi-flag.ts` | **EXCLUDE / REPLACE** | Kill switch may disable acquisition; must not restore `/api/subscribe` |
| `src/app/api/subscribe/route.ts` | **EXCLUDE** | Global S4 invariant |
| `src/lib/newsletter/soft-gate.ts` | **OPTIONAL** | Default **out** of S4 unless a later packet explicitly authorizes non-authoritative UX only |

A source import is not permission to copy its transitive dependency.

## Canonical newsletter-service inventory

Authoritative implementation: `newsletter/subscribers/public-contracts.ts` + public route handlers at `jackpot-api-newsletter@c6cfaa4`.

```text
POST /api/public/newsletter/subscribe
POST /api/public/newsletter/confirm/validate
POST /api/public/newsletter/confirm
```

Target BFF counterparts (frozen for S4-B/C/E):

```text
POST /api/newsletter/subscribe
POST /api/newsletter/confirm/validate
POST /api/newsletter/confirm
```

Full browser → BFF → service → browser matrix: [s4-newsletter-contract-matrix.md](./s4-newsletter-contract-matrix.md).

## Product-owned values (authoritative upstream)

| Value | Owner | Frozen value |
|---|---|---|
| Consent policy version | EC-05A + newsletter registry | `newsletter-consent-us-v1-2026-07-31` |
| Consent checkbox copy | EC-05A | `I agree to receive the Jackpot Homie email newsletter with curated casino promotion and event information. Emails are generally sent weekly, with occasional additional updates. I can unsubscribe at any time. See the Privacy Policy.` |
| Age attestation copy | EC-05A | `I confirm that I am 21 years of age or older.` |
| Age boundary | EC-05A D-06 | 21+ self-attestation; no DOB/ID |
| Signup-source backend vocabulary | newsletter-service | `website_footer`, `newsletter_landing`, `admin_import`, `event_page`, `other` |
| Public-UI signup sources | JSE-003 + product | `newsletter_landing` (hero); `website_footer` only if footer signup ships. Do **not** send `rewards_gate`, `feed_modal`, `region_spotlight` |
| Subscribe success semantics | EC-05A §7 + service | Non-enumerating; generic check-email copy |
| Confirm validate statuses | newsletter-service | `ready_to_confirm`, `already_complete`, `invalid_or_unusable`, `unable_to_confirm` |
| Confirm consume statuses | newsletter-service | `success`, `already_complete`, `invalid_or_unusable`, `unable_to_confirm` |
| Visible confirmation sender name | EC-05A D-12 | `Jackpot Homie` (provisioning of `verify@…` is a launch gate, not S4) |
| Privacy policy URL / version | EC-05A | Still `null` in the live registry. **Do not invent.** Required before public DOI enablement, not for S4 implementation completion |

Source `doi-constants.ts` at `466bfb0` still uses `newsletter_doi_v1` and older “JackpotHomie” copy. Those strings are **not** to be copied as the target contract.

## Workload-identity boundary

S4 implements **caller-side** integration code only (S4-D).

At the inspected newsletter-service HEAD, public handlers still call `assertPublicNewsletterOrigin()` and allow missing Origin as server-to-server context. That is **not sufficient machine authorization** (ADR-0003; `docs/contracts/frontend-workload-identity-contract.md`).

Acceptable S4 claim: workload-identity caller integration implemented and locally verified.

Not acceptable at S4 closeout: Vercel OIDC operationally accepted; production `jackpot-site` identity authorized.

Operational proof belongs to `jackpot-api-newsletter` Epic B / Hosted Acceptance.

## Release / hosted boundary

S4 does **not** authorize:

- Vercel deployment as production acceptance;
- public DOI enablement;
- real SendGrid traffic;
- production Supabase mutation acceptance;
- production identity binding;
- DNS/Cloudflare cutover;
- transfer of public-site authority.

Privacy-policy URL/version remaining `null` is a **public-acquisition launch gate**, not an S4 invent-or-block.

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
- [x] Upstream authority SHAs recorded (inspected in this environment).
- [x] JSE-003 source dispositions verified at current source HEAD.
- [x] Canonical backend route/request/response matrix frozen against live service schemas.
- [x] Product-owned consent/source/confirmation semantics identified (EC-05A + service registry).
- [x] Legacy `/api/subscribe` and legacy persistence explicitly excluded.
- [x] Browser→service direct calls explicitly prohibited.
- [x] S4 implementation vs Hosted Acceptance boundary recorded.
- [x] No production deployment/configuration/mutation performed.

## Next

- S4-B may implement DOI UI against the frozen same-origin browser/BFF seam and EC-05A copy/version.
- S4-C must implement explicit DTO translation (including stripping honeypot; mapping `consentPolicyVersion`; never forwarding source `consentTextVersion`).
- Do not merge or treat `cursor/jse-s4-a-b-doi-acquisition-feca` as the S4-A authority.
