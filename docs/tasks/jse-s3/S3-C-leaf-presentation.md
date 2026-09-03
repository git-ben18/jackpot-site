# S3-C — Leaf presentation

| Field | Value |
|---|---|
| Track | S3-C |
| Type | Code |
| Depends on | S3-B |
| Blocks | S3-D |
| Estimate | S |
| PR grouping | PR 3 (with S3-D, or separate) |

## Goal

Adopt only the **leaf** curated presentation components that do not compose Card / Carousel / FilterChips / Widget. Exercise them from deterministic fixture DTOs before any composed/hardened UI or live database integration.

## Decisions to assume

- **D-S3-08** — fixture-first; no Supabase requirement
- **D-S3-09** — add Tailwind/PostCSS only if these leaf components demonstrably require it; reconstruct the minimum CSS, do not wholesale-copy source config
- **D-S3-02 / D-S3-03** — still deferred; do not pull overlap or tracker to make presentation compile

## Source artifacts (COPY)

From the SHA recorded in S3-A / ledger (default `466bfb0`):

```text
src/components/v2/curated-promos/CuratedPromoEmptyState.tsx
src/components/v2/curated-promos/CuratedPromoEvidenceBlock.tsx
src/components/v2/curated-promos/CuratedPromoSignalList.tsx
```

Also adopt only the CSS utilities these **three** components need — COPY + HARDEN CSS subset, not full source stylesheet. Chip-strip / carousel utilities (`scrollbar-hide`, `chip-strip-fade`, etc.) wait for S3-D unless a leaf component already requires them.

## Implementation requirements

1. Copy the three leaf components with import/path cleanup.
2. If Tailwind is required for these leaves only:
   - add the smallest PostCSS/Tailwind toolchain
   - reconstruct only needed tokens/utilities
   - do not copy blog typography plugin unless a leaf uses `prose` (these should not)
3. Provide a **fixture-driven exercise path** that does not require Supabase, e.g. one of:
   - component-level tests rendering fixture DTOs / props, **or**
   - a temporary non-production harness that is not a new public product route
4. Prefer not to invent a new public product route. If a temporary harness is used, document it as non-production and remove or gate it before S3-G.
5. Preserve empty-state, evidence, and signal-list behavior against S3-B fixture DTOs / public types.
6. Do **not** adopt in this task:
   - `CuratedPromoCarousel`
   - `CuratedPromoFilterChips`
   - `CuratedPromoCard`
   - `CuratedPromoDetailSheet`
   - `CuratedPromoDiscoveryWidget`
   - `CuratedPromoLandingSection`
   - `nicheMap`
7. Update provenance ledger for every adopted file + CSS subset notes.
8. Stop if compiling requires EXCLUDED imports.

## Suggested deliverables

- Three leaf components under `src/components/.../curated-promos/`
- Minimal styling support actually required by those leaves
- Fixture exercise path (test or gated harness)
- Provenance + `_status-S3-C.md` with build/typecheck notes

## Out of scope

- Carousel, FilterChips, Card, DetailSheet, Widget, LandingSection, nicheMap (S3-D / S3-G)
- Live Supabase / `@supabase/supabase-js`
- Analytics / tracker
- Event overlap UI
- Newsletter / BFF work

## Acceptance checklist

- [ ] Three leaf COPY components adopted (EmptyState, EvidenceBlock, SignalList)
- [ ] Renders/exercises from fixture DTOs without Supabase
- [ ] Styling additions are minimal and justified for leaves only
- [ ] No Carousel / FilterChips / Card / DetailSheet / Widget / LandingSection / nicheMap
- [ ] No excluded tracker/event/dashboard imports
- [ ] Provenance updated
- [ ] `npm run typecheck` (and build if styling/app entry changed) succeeds

## Agent prompt

```text
Implement only S3-C from docs/tasks/jse-s3/S3-C-leaf-presentation.md
Copy only EmptyState, EvidenceBlock, SignalList and required CSS.
Exercise from fixture DTOs. No Carousel/FilterChips/Card/DetailSheet/Widget.
No Supabase, no analytics. Record provenance.
```
