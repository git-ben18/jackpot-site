# S3-G — Live homepage integration

| Field | Value |
|---|---|
| Track | S3-G |
| Type | Code |
| Depends on | S3-F with conclusion `accepted` |
| Blocks | S3-H |
| Estimate | M |
| PR grouping | PR 5 (with S3-F) |

## Goal

Mount curated discovery on the approved homepage using the S3-E repository and published view, with safe empty/error behavior and no silent mock fallback.

## Decisions to assume

- S3-F privilege matrix is **accepted**
- Homepage composition remains within the public acquisition/discovery surface
- Newsletter hero remains out of scope unless already a placeholder; do not implement S4 DOI in this task
- **D-S3-08** — production must not silently switch to fixtures on failure

## Source artifacts (COPY + HARDEN)

```text
src/components/v2/curated-promos/CuratedPromoLandingSection.tsx
```

Hardening:

- call target `getCuratedPromos` / repository — never source `curatedPromos.ts`
- preserve fail-soft visitor UX
- no tracker / overlap regressions from S3-D

Also update:

```text
src/app/page.tsx
```

Mount curated discovery on `/`. Do not restore dashboard banner/`isSupabaseConfigured` debug UX as a production feature.

## Implementation requirements

1. Confirm S3-F status is `accepted` before coding. If blocked, stop.
2. Adopt/harden `CuratedPromoLandingSection` to use the target repository.
3. Mount it on `src/app/page.tsx` below/within the approved public homepage composition.
4. Add bounded caching/revalidation appropriate for publish cadence (e.g. `revalidate` / `unstable_cache` / fetch cache policy — choose the smallest Next 15-appropriate approach and document it).
5. Define behaviors:
   - empty published result → empty state UI
   - upstream/config/data error → safe visitor message; structured server log without secrets/raw dumps
   - production must not catch and replace with fixture/mock data
6. Keep `activeOnly` + bounded `limit` defaults aligned with S3-E.
7. Manually or automatically verify against real published rows when credentials for a safe environment exist: filters, cards, detail sheet, source links.
8. Remove or disable any temporary S3-C harness route/section that would confuse the public surface.
9. Update provenance for LandingSection + page composition notes.
10. Do not add analytics, overlaps, newsletter BFF, or service-role.

## Suggested deliverables

- Hardened LandingSection + homepage mount
- Cache/revalidation note in `_status-S3-G.md`
- Empty/error behavior note
- Provenance updates

## Out of scope

- S4 newsletter DOI form/BFF
- S5 cookie/consent analytics
- Event overlaps
- Production DNS cutover / S6 hosted acceptance

## Acceptance checklist

- [ ] S3-F was `accepted` before merge intent
- [ ] Homepage renders curated discovery from `public.v_curated_promo_discovery`
- [ ] Empty and error states are visitor-safe
- [ ] No silent production mock fallback
- [ ] No high-privilege credential used
- [ ] No tracker/event/dashboard dependency regression
- [ ] Cache/revalidation documented
- [ ] `npm run typecheck` and `npm run build` succeed
- [ ] Provenance updated

## Agent prompt

```text
Implement only S3-G from docs/tasks/jse-s3/S3-G-live-homepage-integration.md
Only if S3-F is accepted. Harden LandingSection onto the target repository,
mount on /, add bounded revalidation, fail soft without mock fallback.
No S4/S5 work.
```
