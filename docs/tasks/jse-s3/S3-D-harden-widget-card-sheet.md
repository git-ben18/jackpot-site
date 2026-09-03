# S3-D — Harden Widget / Card / DetailSheet

| Field | Value |
|---|---|
| Track | S3-D |
| Type | Code |
| Depends on | S3-C |
| Blocks | S3-E |
| Estimate | M |
| PR grouping | PR 3 (with S3-C) |

## Goal

Adopt the remaining curated UI with **COPY + HARDEN** so hidden legacy couplings (tracker, event overlaps) are severed before the tree is treated as target-safe.

## Decisions to assume

- **D-S3-02** — remove overlap imports/presentation for initial S3
- **D-S3-03** — remove `useTracker` network behavior; no-op seam with no network side effects is allowed
- Card / DetailSheet source CTAs must keep working without `/api/log-click`
- Empty/error states must remain usable

## Source artifacts (COPY + HARDEN)

```text
src/components/v2/curated-promos/CuratedPromoDiscoveryWidget.tsx
src/components/v2/curated-promos/CuratedPromoCard.tsx
src/components/v2/curated-promos/CuratedPromoDetailSheet.tsx
src/lib/constants/nicheMap.ts
```

Optional in this task if needed only for fixture composition (still not live data):

- a thin local fixture→widget wrapper
- **Do not** adopt `CuratedPromoLandingSection` live-data wiring yet (that is S3-G). A LandingSection shell that accepts preloaded DTOs as props is allowed if it avoids source `curatedPromos.ts`.

## Hardening requirements (mandatory)

1. **Tracker:** delete or replace `useTracker` with an internal no-op (`track() {}` / optional injected sink). No calls to `/api/log-interaction`, `/api/log-click`, or session logging routes.
2. **Overlaps:** remove imports of `curated-offer-event-overlap-display` and any transitive `event-display` / events components. Do not render overlap badges/sections in initial S3.
3. **Source CTAs:** outbound `source_url` links remain usable; logging is optional/absent.
4. **DTO:** do not add lineage/raw/debug fields to satisfy UI.
5. **Dependencies:** add packages only if an adopted module truly needs them after hardening. Still no `date-fns` solely for overlaps, no `recharts`, no intersection-observer unless a remaining import still requires it after audit — prefer deleting unused imports.
6. Wire the hardened Widget to S3-C children and S3-B fixture DTOs so the full presentation tree renders without Supabase.
7. Update provenance with disposition **COPY + HARDEN** and explicit hardening notes per file.
8. Stop if TypeScript only passes by copying EXCLUDED modules.

## Suggested deliverables

- Hardened Widget / Card / DetailSheet (+ nicheMap)
- Fixture-driven full curated tree render path
- Provenance ledger rows with harden notes
- `_status-S3-D.md` including excluded-import audit grep results

## Out of scope

- `@supabase/supabase-js` and repository implementation (S3-E)
- Pointing LandingSection at live published view (S3-G)
- Restoring analytics or overlaps
- Newsletter DOI hero (S4)

## Acceptance checklist

- [ ] Widget/Card/DetailSheet adopted with harden notes recorded
- [ ] No `useTracker` / log-interaction / log-click network behavior
- [ ] No overlap/event-display/events imports remain
- [ ] Full curated tree renders from fixtures
- [ ] Source CTAs still work without analytics
- [ ] `npm run typecheck` and `npm run build` succeed
- [ ] Dependency graph contains no dashboard/event/newsletter-BFF modules
- [ ] Provenance + excluded-import audit recorded

## Agent prompt

```text
Implement only S3-D from docs/tasks/jse-s3/S3-D-harden-widget-card-sheet.md
COPY+HARDEN Widget/Card/DetailSheet: remove tracker network behavior and
all event-overlap imports. Render full tree from fixtures. No Supabase.
Record provenance and an excluded-import audit.
```
