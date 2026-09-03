# S3-A — Baseline + decisions

| Field | Value |
|---|---|
| Track | S3-A |
| Type | Docs / metadata |
| Depends on | — |
| Blocks | S3-B |
| Estimate | S |
| PR grouping | PR 1 |

## Goal

Freeze the S3 starting point and decision set so later agents can copy contracts without reopening architecture questions. Do **not** copy curated runtime modules in this task.

## Decisions to assume

From [docs/JSE-S3-CURATED-DISCOVERY-PLAN.md](../../JSE-S3-CURATED-DISCOVERY-PLAN.md):

- **D-S3-01** — start from `main@7abb209f7bafd0da53d08027e5773eff272fa39a`
- **D-S3-02** — event overlaps deferred
- **D-S3-03** — production analytics deferred / no-op
- **D-S3-04..D-S3-10** — remain binding; do not amend them here unless an upstream conflict is found

## Implementation requirements

1. Confirm local `main` contains `7abb209` (or record the explicit descendant SHA if S3 work already branched from a later merge). Prefer branching S3 work from `7abb209` or documenting the delta.
2. Reconcile target docs so S2 is recorded as **merged/complete**:
   - `docs/architecture/JACKPOT_SITE_EXTRACTION_PLAN.md` S2 progress / exit criteria
   - `docs/architecture/SOURCE_BOUNDARY.md` status if still wording S2 as unmerged
   - `README.md` S2 wording if stale
3. Create an S3 provenance ledger stub, e.g. `docs/provenance/jse-s3-ledger.md`, with columns matching the provenance recording rule (source path, source SHA, disposition, target path, harden notes, deferred/excluded deps). Leave rows empty or “pending S3-B+”.
4. For every path listed in plan §5 (COPY / COPY+HARDEN / REIMPLEMENT / EXCLUDE), confirm it still exists (or is correctly absent) at source baseline `466bfb0`. Record the exact source SHA used for verification (baseline unless a classified post-baseline delta is intentionally chosen).
5. Record the initial S3 package-addition allowlist in the ledger or a short `docs/tasks/jse-s3/_status-S3-A.md`:
   - may add later: `@supabase/supabase-js` (S3-E), `tsx` (S3-B if needed), Tailwind/PostCSS only if S3-C proves required
   - must not add for convenience: `recharts`, `react-intersection-observer`, `classnames`, `react-is`, `date-fns` (while overlaps deferred)
6. Explicitly restate deferred decisions for agents:
   - no overlap package / `event-display` / events UI
   - no `useTracker` network side effects
7. Do not copy `src/types/curatedPromos.ts` or any curated component in this task.

## Suggested deliverables

- `docs/provenance/jse-s3-ledger.md` (new stub)
- `docs/tasks/jse-s3/_status-S3-A.md` (baseline SHA, source verification date, package allowlist)
- Doc reconciliations for S2-complete wording
- Optional one-line pointer update in `docs/JSE-S3-CURATED-DISCOVERY-PLAN.md` §11 only if needed to note task packets exist (do not check “S3 acceptance evidence exists”)

## Out of scope

- Any curated runtime COPY / HARDEN
- Adding npm packages
- Supabase client work
- Homepage composition changes beyond docs

## Acceptance checklist

- [ ] S2 baseline `7abb209` recorded as S3 start (or explicit descendant documented)
- [ ] Target docs no longer claim S2 is incomplete after merge
- [ ] Provenance ledger stub exists
- [ ] Source artifact paths verified against `466bfb0` (or recorded classified SHA)
- [ ] Package allowlist / denylist recorded
- [ ] Overlap + analytics deferrals restated for implementers
- [ ] No curated runtime source files copied

## Agent prompt

```text
Implement only S3-A from docs/tasks/jse-s3/S3-A-baseline-decisions.md
Docs/metadata only. Freeze baseline, reconcile S2-complete wording, create
provenance ledger stub, verify source paths at 466bfb0. Do not copy curated
runtime modules or add packages.
```
