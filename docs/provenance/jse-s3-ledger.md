# JSE-S3 provenance ledger

| Field | Value |
|---|---|
| Slice | `JSE-S3` |
| Status | S3-E complete — low-privilege curated repository reimplemented; homepage not live-wired |
| S2 / S3 start baseline | `jackpot-site main@7abb209f7bafd0da53d08027e5773eff272fa39a` |
| Current `main` descendant at S3-A | `eb154a74652c537f2bc6a428e0c290bd11fe0e28` (S3 plan merge; contains `7abb209`) |
| Functional source baseline | `rewards-maxxing-frontend@466bfb065a9c34010ee0f0de22b419299259fa46` |
| Verification SHA for §5 paths | `466bfb065a9c34010ee0f0de22b419299259fa46` |
| Authority | [docs/JSE-S3-CURATED-DISCOVERY-PLAN.md](../JSE-S3-CURATED-DISCOVERY-PLAN.md) D-S3-01..D-S3-10 |

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

## Adopted runtime artifacts

| Source path | Source SHA | JSE-003 disposition | Target path | Copy vs harden vs reimplement | Hardening changes | Tests/fixtures | Deferred/excluded deps |
|---|---|---|---|---|---|---|---|
| `src/types/curatedPromos.ts` | `466bfb065a9c34010ee0f0de22b419299259fa46` | COPY | `src/types/curatedPromos.ts` | COPY + path cleanup | Replaced `CuratedOfferEventOverlap` import with optional `eventOverlaps?: unknown[]` (D-S3-02) | — | Did not copy `curatedOfferEventOverlap.ts` |
| `src/lib/mappers/curatedPromoDiscoveryMapper.ts` | `466bfb065a9c34010ee0f0de22b419299259fa46` | COPY | `src/lib/mappers/curatedPromoDiscoveryMapper.ts` | COPY | None. Does not emit lineage/debug or `eventOverlaps` | mapper tests | no overlap attach |
| `src/lib/__fixtures__/curatedPromoDiscoveryRow.fixtures.ts` | `466bfb065a9c34010ee0f0de22b419299259fa46` | COPY | `src/lib/__fixtures__/curatedPromoDiscoveryRow.fixtures.ts` | COPY | None | used by mapper tests | no overlap fixtures |
| `src/lib/__tests__/curatedPromoDiscoveryMapper.test.ts` | `466bfb065a9c34010ee0f0de22b419299259fa46` | COPY | `src/lib/__tests__/curatedPromoDiscoveryMapper.test.ts` | COPY | Assert mapper omits `eventOverlaps` / `lineage` | self | — |
| `src/lib/curated-promo-display.ts` | `466bfb065a9c34010ee0f0de22b419299259fa46` | COPY | `src/lib/curated-promo-display.ts` | COPY | None | display tests | — |
| `src/lib/__tests__/curated-promo-display.test.ts` | `466bfb065a9c34010ee0f0de22b419299259fa46` | COPY | `src/lib/__tests__/curated-promo-display.test.ts` | COPY | None | self | — |
| `src/lib/curated-promo-card-display.ts` | `466bfb065a9c34010ee0f0de22b419299259fa46` | COPY | `src/lib/curated-promo-card-display.ts` | COPY | None | no dedicated source test | — |
| `src/lib/constants/curatedPromoSignalCategory.ts` | `466bfb065a9c34010ee0f0de22b419299259fa46` | COPY | `src/lib/constants/curatedPromoSignalCategory.ts` | COPY | Title/slug hint args accept null so target `strict` typecheck matches DTO nulls | category tests | — |
| `src/lib/__tests__/curatedPromoSignalCategory.test.ts` | `466bfb065a9c34010ee0f0de22b419299259fa46` | COPY | `src/lib/__tests__/curatedPromoSignalCategory.test.ts` | COPY | None | self | — |
| `src/components/v2/curated-promos/CuratedPromoEmptyState.tsx` | `466bfb065a9c34010ee0f0de22b419299259fa46` | COPY | `src/components/v2/curated-promos/CuratedPromoEmptyState.tsx` | COPY | Explicit `import React` for node:test/`tsx` fixture exercise | leaf presentation tests | — |
| `src/components/v2/curated-promos/CuratedPromoEvidenceBlock.tsx` | `466bfb065a9c34010ee0f0de22b419299259fa46` | COPY | `src/components/v2/curated-promos/CuratedPromoEvidenceBlock.tsx` | COPY | Explicit `import React` for node:test/`tsx` fixture exercise | leaf presentation tests | — |
| `src/components/v2/curated-promos/CuratedPromoSignalList.tsx` | `466bfb065a9c34010ee0f0de22b419299259fa46` | COPY | `src/components/v2/curated-promos/CuratedPromoSignalList.tsx` | COPY | Explicit `import React` for node:test/`tsx` fixture exercise | leaf presentation tests | — |
| source `globals.css` Tailwind utilities subset | n/a (reconstruct) | reconstruct | `src/app/globals.css` + `tailwind.config.js` + `postcss.config.js` | REIMPLEMENT tooling | S3-C: minimal Tailwind v3. S3-D: added `.scrollbar-hide` and `.chip-strip-fade` only. No brand theme, no blog typography | composed presentation tests | no pulse-marker / blog CSS |
| `src/components/v2/curated-promos/CuratedPromoFilterChips.tsx` | `466bfb065a9c34010ee0f0de22b419299259fa46` | COPY | `src/components/v2/curated-promos/CuratedPromoFilterChips.tsx` | COPY | Explicit `import React` for node:test/`tsx` fixture exercise | composed presentation tests | — |
| `src/components/v2/curated-promos/CuratedPromoCarousel.tsx` | `466bfb065a9c34010ee0f0de22b419299259fa46` | COPY | `src/components/v2/curated-promos/CuratedPromoCarousel.tsx` | COPY | Explicit `import React` for node:test/`tsx` fixture exercise | composed presentation tests | — |
| `src/lib/constants/nicheMap.ts` | `466bfb065a9c34010ee0f0de22b419299259fa46` | COPY + HARDEN | `src/lib/constants/nicheMap.ts` | COPY + HARDEN | Presentation taxonomy only; no runtime change required | composed presentation tests | no dashboard/overlap deps |
| `src/components/v2/curated-promos/CuratedPromoCard.tsx` | `466bfb065a9c34010ee0f0de22b419299259fa46` | COPY + HARDEN | `src/components/v2/curated-promos/CuratedPromoCard.tsx` | COPY + HARDEN | Removed overlap import and primary-overlap badge (D-S3-02). Explicit `import React` | composed presentation tests | `curated-offer-event-overlap-display`, `event-display` |
| `src/components/v2/curated-promos/CuratedPromoDetailSheet.tsx` | `466bfb065a9c34010ee0f0de22b419299259fa46` | COPY + HARDEN | `src/components/v2/curated-promos/CuratedPromoDetailSheet.tsx` | COPY + HARDEN | Removed overlap/related-events UI and `useTracker` / `trackClick` (D-S3-02/03). Source CTA remains a plain outbound link | composed presentation tests | `useTracker`, `/api/log-click`, overlap display |
| `src/components/v2/curated-promos/CuratedPromoDiscoveryWidget.tsx` | `466bfb065a9c34010ee0f0de22b419299259fa46` | COPY + HARDEN | `src/components/v2/curated-promos/CuratedPromoDiscoveryWidget.tsx` | COPY + HARDEN | Removed `useTracker` and all interaction/view tracking effects (D-S3-03). Filter + open handlers are local state only | composed presentation tests | `useTracker`, `/api/log-interaction` |
| `src/lib/server/curatedPromos.ts` | `466bfb065a9c34010ee0f0de22b419299259fa46` | REIMPLEMENT | `src/lib/server/curatedPromoRepository.ts` + `curatedPromoQuery.ts` | REIMPLEMENT | Low-privilege client only. Explicit column allowlist. No overlap attach. Fail-closed structured errors. No silent fixture fallback. | repository tests | source file, `artifact-queries.ts`, `getSupabaseAdminClient()`, overlap fetch, `CURATED_PROMO_DISCOVERY_MOCK` |
| n/a (target helper) | n/a | REIMPLEMENT | `src/lib/server/publicSupabase.ts` + `publicSupabaseConfig.ts` | REIMPLEMENT | Reads `SUPABASE_URL` + `SUPABASE_PUBLISHABLE_KEY`, anon fallback only. Never reads service-role/secret. | repository tests | `supabase-server.ts`, `NEXT_PUBLIC_*` keys for this path |

## Deferred for initial S3 (do not adopt)

| Source path / family | Reason |
|---|---|
| Overlap package (`curatedOfferEventOverlap*`, overlap mapper/display/fixtures) | D-S3-02 |
| `src/lib/event-display.ts`, `src/types/events.ts`, `src/components/v2/events/**` | D-S3-02 |
| `src/hooks/useTracker.ts` and logging routes | D-S3-03 — no-op seam only, no network |
| `date-fns` | overlaps deferred |
| source `src/lib/server/curatedPromos.ts` file | REIMPLEMENT behavior only; file not copied |
| `src/lib/artifact-queries.ts`, `src/lib/supabase-server.ts` | EXCLUDE; S3-E must not import |

## Excluded (must not enter the S3 graph)

See plan §5 EXCLUDE and `_status-S3-A.md`. Source files exist at `466bfb0` and remain behind the boundary.
