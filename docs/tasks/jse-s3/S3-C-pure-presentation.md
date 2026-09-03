# S3-C — Pure curated presentation

| Field | Value |
|---|---|
| Track | S3-C |
| Type | Code |
| Depends on | S3-B |
| Blocks | S3-D |
| Estimate | M |
| PR grouping | PR 3 (with S3-D) |

## Goal

Render the pure curated presentation graph from **deterministic fixture DTOs** before adopting hardened Widget/Card/DetailSheet couplings and before any live database integration.

## Decisions to assume

- **D-S3-08** — fixture-first; no Supabase requirement
- **D-S3-09** — add Tailwind/PostCSS only if these components demonstrably require it; reconstruct the minimum theme/CSS, do not wholesale-copy source config
- **D-S3-02 / D-S3-03** — still deferred; do not pull overlap or tracker to make presentation compile

## Source artifacts (COPY)

From the SHA recorded in S3-A / ledger (default `466bfb0`):

```text
src/components/v2/curated-promos/CuratedPromoCarousel.tsx
src/components/v2/curated-promos/CuratedPromoEmptyState.tsx
src/components/v2/curated-promos/CuratedPromoEvidenceBlock.tsx
src/components/v2/curated-promos/CuratedPromoFilterChips.tsx
src/components/v2/curated-promos/CuratedPromoSignalList.tsx
```

Also adopt only the CSS utilities these components need (e.g. `scrollbar-hide`, `chip-strip-fade` subset from source `globals.css` if required) — COPY + HARDEN CSS subset, not full source stylesheet.

## Implementation requirements

1. Copy the five presentation components with import/path cleanup.
2. If Tailwind is required:
   - add the smallest PostCSS/Tailwind toolchain
   - reconstruct only needed tokens/utilities (plan notes brand tokens may wait until Card/Detail need them; prefer shared minimal setup if both S3-C and S3-D need it)
   - do not copy blog typography plugin unless a component uses `prose` (these five should not)
3. Provide a **fixture-driven exercise path** that does not require Supabase, e.g. one of:
   - a temporary dev-only section on `/` behind an explicit non-production condition, **or**
   - a small presentational harness/story/test page that is not a new public product route, **or**
   - component-level tests rendering fixture DTOs
4. Prefer not to invent a new public product route. If a temporary harness route is used, document it as non-production and remove or gate it before S3-G.
5. Preserve filtering chips, carousel, empty state, evidence, and signal list behavior against fixture DTOs from S3-B.
6. Do **not** adopt Widget, Card, DetailSheet, or LandingSection yet (those are S3-D / S3-G).
7. Update provenance ledger for every adopted file + CSS subset notes.
8. Stop if compiling requires EXCLUDED imports.

## Suggested deliverables

- Five presentation components under `src/components/.../curated-promos/`
- Minimal styling support actually required
- Fixture exercise path (test or gated harness)
- Provenance + `_status-S3-C.md` with build/typecheck notes

## Out of scope

- `CuratedPromoDiscoveryWidget`, `CuratedPromoCard`, `CuratedPromoDetailSheet`, `CuratedPromoLandingSection`
- Live Supabase / `@supabase/supabase-js`
- Analytics / tracker
- Event overlap UI
- Newsletter / BFF work

## Acceptance checklist

- [ ] Five COPY presentation components adopted
- [ ] Renders/exercises from fixture DTOs without Supabase
- [ ] Styling additions are minimal and justified
- [ ] No Widget/Card/DetailSheet/LandingSection yet
- [ ] No excluded tracker/event/dashboard imports
- [ ] Provenance updated
- [ ] `npm run typecheck` (and build if styling/app entry changed) succeeds

## Agent prompt

```text
Implement only S3-C from docs/tasks/jse-s3/S3-C-pure-presentation.md
Copy the five pure curated presentation components and only required CSS.
Exercise them from fixture DTOs. No Widget/Card/DetailSheet, no Supabase,
no analytics. Record provenance.
```
