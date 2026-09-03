# JSE-S3 provenance ledger

| Field | Value |
|---|---|
| Slice | `JSE-S3` |
| Status | Stub — no runtime artifacts adopted yet |
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
| — | — | — | — | pending S3-B+ | — | — | — |

## Deferred for initial S3 (do not adopt)

| Source path / family | Reason |
|---|---|
| Overlap package (`curatedOfferEventOverlap*`, overlap mapper/display/fixtures) | D-S3-02 |
| `src/lib/event-display.ts`, `src/types/events.ts`, `src/components/v2/events/**` | D-S3-02 |
| `src/hooks/useTracker.ts` and logging routes | D-S3-03 — no-op seam only, no network |
| `date-fns` | overlaps deferred |

## Excluded (must not enter the S3 graph)

See plan §5 EXCLUDE and `_status-S3-A.md`. Source files exist at `466bfb0` and remain behind the boundary.
