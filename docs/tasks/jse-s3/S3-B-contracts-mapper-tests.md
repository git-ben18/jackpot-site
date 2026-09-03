# S3-B — Public contracts / mapper / tests

| Field | Value |
|---|---|
| Track | S3-B |
| Type | Code + tests |
| Depends on | S3-A |
| Blocks | S3-C |
| Estimate | M |
| PR grouping | PR 2 |

## Goal

Establish the public curated data contract in `jackpot-site` independently of UI and Supabase. Mapper + helpers must run from fixtures only.

## Decisions to assume

- **D-S3-02** — keep `eventOverlaps?` optional on the public DTO if clean; do **not** copy the overlap package, mapper, fixtures, or `event-display`
- **D-S3-04** — mapper is the row → public DTO boundary; no lineage/admin/debug fields
- **D-S3-08** — no live Supabase in this task
- **D-S3-09** — add `tsx` only if needed to run source-style node tests

## Source artifacts (COPY)

From `rewards-maxxing-frontend@466bfb065a9c34010ee0f0de22b419299259fa46` unless S3-A recorded a classified replacement SHA:

```text
src/types/curatedPromos.ts
src/lib/mappers/curatedPromoDiscoveryMapper.ts
src/lib/__tests__/curatedPromoDiscoveryMapper.test.ts
src/lib/__fixtures__/curatedPromoDiscoveryRow.fixtures.ts
src/lib/curated-promo-display.ts
src/lib/__tests__/curated-promo-display.test.ts
src/lib/curated-promo-card-display.ts
src/lib/constants/curatedPromoSignalCategory.ts
src/lib/__tests__/curatedPromoSignalCategory.test.ts
```

Target paths should mirror under `src/` unless a short documented rename improves clarity without changing behavior.

## Implementation requirements

1. Read `AGENTS.md`, `SOURCE_BOUNDARY.md`, and the S3 plan before copying.
2. Copy the listed artifacts with path/import cleanup only.
3. Resolve the source `CuratedOfferEventOverlap` type import without pulling overlap runtime:
   - preferred: local minimal optional type (or `unknown[]` / thin stub type) so `eventOverlaps?` remains optional and unused
   - forbidden: copying `curatedOfferEventOverlap.ts`, overlap mapper/display/fixtures, `event-display.ts`, `types/events.ts`
4. Adopt mapper fixtures + mapper tests. Tests must pass with **no** Supabase client.
5. Add `tsx` and a `package.json` test script only if required, e.g. `tsx --test src/lib/__tests__/*.test.ts` scoped to S3-B tests.
6. Ensure mapper output stays public-DTO-only (no raw lineage fields).
7. Update `docs/provenance/jse-s3-ledger.md` for every adopted file (source path, SHA, disposition COPY, target path).
8. If a copied file imports an EXCLUDED or unclassified path, **stop** and classify/remove — do not copy more source to make TypeScript happy.

## Suggested deliverables

- Types / mapper / helpers / fixtures / tests under `src/`
- `package.json` test script + `tsx` only if needed
- Provenance ledger rows for all adopted files
- `docs/tasks/jse-s3/_status-S3-B.md` with test command + pass evidence

## Out of scope

- Any curated React components (S3-C leaf / S3-D composed)
- `@supabase/supabase-js`
- Tailwind unless a non-UI helper somehow requires it (it should not)
- Homepage wiring
- Source `curatedPromos.ts` / `artifact-queries.ts`

## Acceptance checklist

- [ ] Listed COPY artifacts adopted at recorded source SHA
- [ ] Mapper + helper tests pass without Supabase
- [ ] No overlap package / event-display / tracker imports
- [ ] No service-role or generic admin helpers
- [ ] Provenance ledger updated
- [ ] `npm run typecheck` succeeds
- [ ] Excluded imports absent from the new graph

## Agent prompt

```text
Implement only S3-B from docs/tasks/jse-s3/S3-B-contracts-mapper-tests.md
Copy public DTO/mapper/helpers/fixtures/tests from source baseline 466bfb0.
Keep eventOverlaps optional without copying overlap/event packages. No UI,
no Supabase. Record provenance. Stop if an excluded import is required.
```
