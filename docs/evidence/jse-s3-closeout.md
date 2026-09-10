# JSE-S3 closeout evidence

| Field | Value |
|---|---|
| Date | 2026-09-10 |
| Slice | `JSE-S3` curated discovery |
| Result | **Implemented and accepted at the target-repo level** |
| Production authority | **Not transferred.** Build/local render ≠ hosted acceptance or ADR-0004 cutover. |

## Required SHAs

| Item | SHA / status |
|---|---|
| S2 baseline | `jackpot-site main@7abb209f7bafd0da53d08027e5773eff272fa39a` |
| Current `main` HEAD at closeout writing | `359ecfb880a751a8a5e1028926eb78c6c3f7280b` (`359ecfb` — S4-G merge) |
| S3-G / S3-H closeout candidate | Uncommitted working tree on that HEAD (homepage repair + this evidence). Merge SHA is recorded when the PR lands. |
| Functional source baseline | `rewards-maxxing-frontend@466bfb065a9c34010ee0f0de22b419299259fa46` |
| Source authority baseline | `rewards-maxxing-frontend@0f75f8b596e9e208b02d54cdf48e2011b5217ff3` |

Do not treat `359ecfb` as the S3-G implementation SHA until the homepage repair is committed.

## Provenance

Completed ledger: [`docs/provenance/jse-s3-ledger.md`](../provenance/jse-s3-ledger.md).

### COPY / COPY+HARDEN / REIMPLEMENT summary

| Disposition | Adopted target artifacts |
|---|---|
| COPY | DTO/types, mapper + fixtures/tests, display helpers, signal-category helpers, EmptyState, EvidenceBlock, SignalList, FilterChips, Carousel |
| COPY + HARDEN | Card, DetailSheet, DiscoveryWidget, nicheMap, **LandingSection** (S3-G; target repository + 300s cache; brand tokens remapped) |
| REIMPLEMENT | `curatedPromoRepository.ts` + `publicSupabase.ts` (behavior of source `curatedPromos.ts`); Tailwind tooling subset |
| Implemented (target-only) | `CuratedPromoLandingSectionView.tsx`, `curatedPromoLandingCache.ts`, homepage composition with S4 DOI hero |

## Package / dependency audit

Recorded from `package.json` on 2026-09-10. Values not recorded.

**Production**

```text
next
react
react-dom
@supabase/supabase-js
@vercel/oidc
server-only
```

**Development (S3-relevant)**

```text
tsx
typescript
tailwindcss / postcss / autoprefixer
@types/node / @types/react / @types/react-dom
```

S4 testing libraries (`@testing-library/*`, `jsdom`) are present and out of S3 scope except that they remain on the shared `npm test` script.

**Denylist absences (not in package.json)**

```text
recharts
react-intersection-observer
classnames
date-fns
```

## Excluded-import audit

Searched `src/**/*.ts` and `src/**/*.tsx` on 2026-09-10 for:

```text
useTracker
log-interaction
log-click
artifact-queries
LandingDashboardClient
HottestOffers
getSupabaseAdminClient
SUPABASE_SERVICE_ROLE_KEY
/api/subscribe
fetchCuratedPromoDiscoveryItems
event-display
curated-offer-event-overlap
lib/server/curatedPromos
```

Matches exist only as **denylist strings inside tests** asserting absence. No runtime module imports those families. LandingSection calls `getCuratedPromos`, not source `curatedPromos.ts`.

## Mapper / helper / UI tests

Command: `npm test`

Result (2026-09-10, this working tree): **PASS — 161 tests, 0 fail**.

Includes S3 mapper/display/category/leaf/composed/repository/landing tests and the existing S4 suite. S3-G landing tests cover success, empty publish, fail-soft error, excluded couplings, and homepage mounts of both `InlineNewsletterHero` and `CuratedPromoLandingSection`.

## Typecheck / build

| Command | Result |
|---|---|
| `npm run typecheck` | **PASS** |
| `npm run build` | **PASS** — Next.js 15.5.25 |

Build route table (excerpt):

```text
┌ ○ /                                    … Revalidate 5m
├ ƒ /api/newsletter/confirm
├ ƒ /api/newsletter/confirm/validate
├ ƒ /api/newsletter/subscribe
├ ○ /newsletter/confirm
└ ○ /privacy
```

During static generation, the repository logged `getCuratedPromos missing config` with the non-secret config-missing message. It did not substitute fixtures.

## Live public-view behavior

This environment has no `.env.local` Supabase credentials. S3-G requirement 7 therefore could not re-query published rows here.

Verified locally via production `next start` + `GET /`:

| Surface | Observed |
|---|---|
| Newsletter DOI hero | Rendered: email field, consent + 21+ checkboxes, Subscribe, honeypot |
| Curated landing shell | Rendered: “Curated casino promos” / “Promos we're tracking now” |
| Curated body | Visitor-safe empty-error: “Curated promo discovery is temporarily unavailable.” |
| Debug banner | Absent (`isSupabaseConfigured` not restored) |
| Secrets | Not present in HTML or the structured missing-config log |

Live SELECT against `api.v_curated_promo_discovery` remains evidenced by S3-F / DB-W3-D, not re-run in this closeout.

## Low-privilege DB matrix

S3-F **ACCEPTED**. Evidence: [`docs/evidence/jse-s3-db-privilege.md`](./jse-s3-db-privilege.md) citing DB-W3-D + W3-E. S3-F-RLS **N/A**.

## No service-role / secret fallback

- `publicSupabase.ts` reads only `SUPABASE_URL` + `SUPABASE_PUBLISHABLE_KEY` (or documented anon compatibility fallback).
- Repository tests assert no `process.env.SUPABASE_SERVICE_ROLE_KEY` and no `getSupabaseAdminClient`.
- Mock path requires `CURATED_PROMO_DISCOVERY_MOCK=1` and non-production `NODE_ENV`.
- Production build missing-config path did not serve fixtures.

## Cache / revalidation (S3-G)

```text
CURATED_PROMO_LANDING_REVALIDATE_SECONDS = 300
page.tsx export const revalidate = 300
unstable_cache(..., { revalidate: 300 })
```

Build reports `/` revalidate **5m**. Rationale: Supabase JS is not Next `fetch`; `unstable_cache` bounds the query.

## Visitor empty / error behavior (S3-G)

| Result | Visitor UX |
|---|---|
| `ok: true`, rows | Discovery widget (filters / cards / detail / source links) |
| `ok: true`, empty | “No curated promos published yet…” |
| `ok: false` | “Curated promo discovery is temporarily unavailable.” |

Newsletter signup remains mounted independently of curated read success.

## Deferred decisions (not blocking S4)

| Decision | Restatement |
|---|---|
| **D-S3-02** | Event overlaps, `event-display`, and `src/components/v2/events/**` remain deferred. |
| **D-S3-03** | Production analytics / `useTracker` / click-logging remain deferred no-op. |
| Tailwind polish | Brand tokens remapped to standard utilities; further visual polish is not an S3 blocker. |
| Live row visual QA | Requires a safe environment with publishable credentials; not performed in this closeout. |

S4 already proceeded independently and is present on this `main` HEAD. Homepage repair restores the JSE-001 composition (`InlineNewsletterHero` + `CuratedPromoLandingSection`) after that merge.

## Explicit non-claims

This closeout does **not** claim:

- production public-site authority transfer (ADR-0004);
- hosted Vercel/OIDC/Supabase operational acceptance;
- public DOI enablement;
- DNS/Cloudflare cutover;
- that missing local Supabase config is a production incident.
