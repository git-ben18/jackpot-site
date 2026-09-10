# S3-G status

| Field | Value |
|---|---|
| Date | 2026-09-10 |
| Packet | [S3-G-live-homepage-integration.md](./S3-G-live-homepage-integration.md) |
| Result | Complete — curated discovery mounted on `/` with S4 DOI hero |
| Prerequisite | S3-F **ACCEPTED** |
| Source SHA | `rewards-maxxing-frontend@466bfb065a9c34010ee0f0de22b419299259fa46` |
| Repair context | Unmerged PR #14 (`feat/jse-s3-g-live-homepage`) implemented S3-G against pre-S4 `page.tsx`. After S4-H, `/` only mounted `InlineNewsletterHero`. This repair restores `CuratedPromoLandingSection` without dropping the DOI hero. |

## Adopted

```text
src/components/v2/curated-promos/CuratedPromoLandingSection.tsx      # COPY + HARDEN
src/components/v2/curated-promos/CuratedPromoLandingSectionView.tsx  # implemented (presentation split)
src/lib/server/curatedPromoLandingCache.ts                           # implemented (shared revalidate constant)
src/app/page.tsx                                                     # DOI hero + curated mount + route revalidate
```

## Hardening

- Calls `getCuratedPromos` (S3-E / DB-W3 `api` contract) — never source `curatedPromos.ts`
- Defaults: `activeOnly: true`, `limit` = S3-E default (50)
- Fail-soft: `ok: false` shows visitor-safe message; does **not** substitute fixtures/mocks
- Empty publish (`ok: true`, zero rows) uses widget empty copy
- No tracker / overlaps / service-role / Supabase debug banner
- Source brand tokens (`shadow-warm`, `brand-hot`, `animate-glow`) remapped to standard Tailwind
- Homepage composition matches JSE-001 / JSE-003: `InlineNewsletterHero` then `CuratedPromoLandingSection`

## Cache / revalidation

```text
CURATED_PROMO_LANDING_REVALIDATE_SECONDS = 300

page.tsx:
  export const revalidate = 300

LandingSection:
  unstable_cache(getCuratedPromos, ['curated-promo-discovery-landing'], { revalidate: 300 })
```

Rationale: Supabase JS is not Next `fetch`, so route `revalidate` alone does not cache the query. `unstable_cache` bounds the repository read; matching route ISR keeps the page segment on the same cadence (~5 minutes, appropriate for publish sync).

## Empty / error behavior

| Result | Visitor UX |
|---|---|
| `ok: true`, rows | Discovery widget (filters / cards / detail / source links) |
| `ok: true`, empty | “No curated promos published yet…” |
| `ok: false` | “Curated promo discovery is temporarily unavailable.” (structured server log in repository; no secrets) |

Production never catches failure and serves mock data (`CURATED_PROMO_DISCOVERY_MOCK` is non-production opt-in only). Newsletter signup remains mounted independently of curated read success.

## Checklist

- [x] S3-F was `accepted` before merge intent
- [x] Homepage renders curated discovery from `api.v_curated_promo_discovery`
- [x] Homepage still renders S4 DOI newsletter signup
- [x] Empty and error states are visitor-safe
- [x] No silent production mock fallback
- [x] No high-privilege credential used
- [x] No tracker/event/dashboard dependency regression
- [x] Cache/revalidation documented
- [x] `npm run typecheck` and `npm run build` succeed
- [x] Provenance updated

Evidence (2026-09-10, local `main@359ecfb` working tree):

| Command | Result |
|---|---|
| `npm test` | **PASS** — 161 tests, 0 fail (includes S3-G landing + homepage composition) |
| `npm run typecheck` | **PASS** |
| `npm run build` | **PASS** — `/` static, **revalidate 5m**; missing-config fail-soft logged without secrets |
| `GET /` (production `next start`) | DOI hero + curated landing both in HTML; curated body is visitor-safe unavailable (no local Supabase credentials) |
