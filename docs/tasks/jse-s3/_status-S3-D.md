# S3-D status

| Field | Value |
|---|---|
| Date | 2026-09-04 |
| Packet | [S3-D-composed-hardened-presentation.md](./S3-D-composed-hardened-presentation.md) |
| Result | Complete (composed / hardened presentation; fixture-driven; no Supabase) |
| Source SHA | `rewards-maxxing-frontend@466bfb065a9c34010ee0f0de22b419299259fa46` |
| Base | `main@87c9ae8` (S3-A + S3-B + S3-C merged) |

## Adopted

```text
src/components/v2/curated-promos/CuratedPromoFilterChips.tsx   # COPY
src/components/v2/curated-promos/CuratedPromoCarousel.tsx      # COPY
src/lib/constants/nicheMap.ts                                 # COPY + HARDEN
src/components/v2/curated-promos/CuratedPromoCard.tsx          # COPY + HARDEN
src/components/v2/curated-promos/CuratedPromoDetailSheet.tsx   # COPY + HARDEN
src/components/v2/curated-promos/CuratedPromoDiscoveryWidget.tsx # COPY + HARDEN
```

CSS: reconstructed `.scrollbar-hide` and `.chip-strip-fade` in `src/app/globals.css`. No brand theme and no blog typography plugin.

Fixture wrapper: `src/lib/__fixtures__/curatedPromoDiscoveryDto.fixtures.ts` maps S3-B rows to public DTOs. Not a production fallback. Widget is **not** mounted on `/` (S3-G).

## Hardening

- Card: overlap import and badge removed.
- DetailSheet: related-events UI and `useTracker` / `trackClick` removed. `source_url` remains a plain `target="_blank"` / `noopener noreferrer` link.
- Widget: `useTracker` and view/filter/open tracking effects removed. Filter and open handlers only update local state.

## Commands

```text
npm test
npm run typecheck
npm run build
```

Evidence (2026-09-04, local):

- `npm test` — 38 pass, 0 fail
- `npm run typecheck` — exit 0
- `npm run build` — exit 0; routes remain `/`, `/privacy`, `/newsletter/confirm` only

## Excluded-import audit

Searched `src/components` and `src/lib` (excluding the denylist strings in the S3-D test file) for:

```text
useTracker
log-interaction
log-click
curated-offer-event-overlap
event-display
artifact-queries
LandingDashboard
HottestOffers
@supabase
date-fns
recharts
```

No matches in adopted runtime modules. No `CuratedPromoLandingSection` under `src/app`.

## Next

S3-E — low-privilege curated repository (`@supabase/supabase-js` first justified here). Do not copy `curatedPromos.ts` / `artifact-queries.ts`.
