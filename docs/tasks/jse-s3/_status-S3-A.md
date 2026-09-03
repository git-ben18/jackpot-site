# S3-A status

| Field | Value |
|---|---|
| Date | 2026-09-03 |
| Packet | [S3-A-baseline-decisions.md](./S3-A-baseline-decisions.md) |
| Result | Complete (docs/metadata only) |

## Baselines

| Item | SHA |
|---|---|
| S2 / S3 start (D-S3-01) | `jackpot-site main@7abb209f7bafd0da53d08027e5773eff272fa39a` |
| `main` at S3-A start | `eb154a74652c537f2bc6a428e0c290bd11fe0e28` |
| Relationship | `7abb209` is an ancestor of `eb154a7`. Delta is docs-only: JSE-S3 curated discovery plan (PR #3). No runtime change. |
| Functional source verification | `rewards-maxxing-frontend@466bfb065a9c34010ee0f0de22b419299259fa46` |

No classified post-baseline source SHA was selected. S3-B+ must copy from `466bfb0` unless a later classified delta is recorded first.

## Source path verification (`466bfb0`)

All plan §5 COPY, COPY+HARDEN, and named EXCLUDE files exist at the functional baseline.

| Disposition | Path | At `466bfb0` |
|---|---|---|
| COPY | `src/components/v2/curated-promos/CuratedPromoCarousel.tsx` | present |
| COPY | `src/components/v2/curated-promos/CuratedPromoEmptyState.tsx` | present |
| COPY | `src/components/v2/curated-promos/CuratedPromoEvidenceBlock.tsx` | present |
| COPY | `src/components/v2/curated-promos/CuratedPromoFilterChips.tsx` | present |
| COPY | `src/components/v2/curated-promos/CuratedPromoSignalList.tsx` | present |
| COPY | `src/types/curatedPromos.ts` | present |
| COPY | `src/lib/mappers/curatedPromoDiscoveryMapper.ts` | present |
| COPY | `src/lib/__tests__/curatedPromoDiscoveryMapper.test.ts` | present |
| COPY | `src/lib/__fixtures__/curatedPromoDiscoveryRow.fixtures.ts` | present |
| COPY | `src/lib/curated-promo-display.ts` | present |
| COPY | `src/lib/__tests__/curated-promo-display.test.ts` | present |
| COPY | `src/lib/curated-promo-card-display.ts` | present |
| COPY | `src/lib/constants/curatedPromoSignalCategory.ts` | present |
| COPY | `src/lib/__tests__/curatedPromoSignalCategory.test.ts` | present |
| COPY+HARDEN | `src/components/v2/curated-promos/CuratedPromoLandingSection.tsx` | present |
| COPY+HARDEN | `src/components/v2/curated-promos/CuratedPromoDiscoveryWidget.tsx` | present |
| COPY+HARDEN | `src/components/v2/curated-promos/CuratedPromoCard.tsx` | present |
| COPY+HARDEN | `src/components/v2/curated-promos/CuratedPromoDetailSheet.tsx` | present |
| COPY+HARDEN | `src/lib/constants/nicheMap.ts` | present |
| REIMPLEMENT (behavior) / EXCLUDE (file) | `src/lib/server/curatedPromos.ts` | present |
| EXCLUDE | `src/lib/artifact-queries.ts` | present |
| EXCLUDE | `src/lib/supabase-server.ts` | present |
| EXCLUDE | `src/lib/supabase.ts` | present |
| EXCLUDE | `src/hooks/useTracker.ts` | present |
| EXCLUDE | `src/lib/event-display.ts` | present |
| EXCLUDE | `src/types/events.ts` | present |
| EXCLUDE | `src/lib/event-date-ranges.ts` | present |
| EXCLUDE | `src/components/v2/events/**` | present (7 files, including `EventLandingSection.tsx`) |
| EXCLUDE | `src/components/LandingDashboardClient.tsx` | present |
| EXCLUDE | `src/components/HottestOffersCard.tsx` | present |

Correctly absent from the **target** at S3-A: none of the above have been copied into `jackpot-site`.

## Package allowlist / denylist

S2 remain: `next`, `react`, `react-dom`, `typescript`, `@types/node`, `@types/react`, `@types/react-dom`.

May add only when a later S3 packet proves need:

| Package | Earliest packet |
|---|---|
| `tsx` | S3-B, if required to run source-style node tests |
| Tailwind / PostCSS (minimal reconstruct) | S3-C, only if adopted components require it |
| `@supabase/supabase-js` | S3-E |
| `server-only` | S3-E, if the server module needs the Next convention |

Must not add merely because they exist in the source app:

```text
recharts
react-intersection-observer
classnames
react-is
date-fns
```

`date-fns` stays out while event overlaps are deferred (D-S3-02).

## Deferred decisions restated for S3-B+

- **D-S3-02:** no overlap package, no `event-display`, no `src/types/events.ts`, no `src/components/v2/events/**`. Card/DetailSheet must drop those imports. Keep `eventOverlaps?` optional on the DTO only if a thin local stub avoids pulling overlap runtime.
- **D-S3-03:** no `useTracker` network side effects; no `/api/log-interaction`, `/api/log-click`, or `SessionInit`. A no-op seam with no network is allowed.

D-S3-04 through D-S3-10 remain binding and were not amended.

## Runtime copy

None. S3-A did not copy `src/types/curatedPromos.ts` or any curated component.
