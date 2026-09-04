# JSE-S3 agent task packets

Hand an agent **one task file** at a time. Each file is self-contained implementation requirements for that packet.

| Field | Value |
|---|---|
| Slice | `JSE-S3` |
| Planning authority | [../../JSE-S3-CURATED-DISCOVERY-PLAN.md](../../JSE-S3-CURATED-DISCOVERY-PLAN.md) |
| Target baseline (S2) | `jackpot-site main@7abb209f7bafd0da53d08027e5773eff272fa39a` |
| Functional source baseline | `rewards-maxxing-frontend@466bfb065a9c34010ee0f0de22b419299259fa46` |
| Architecture / trust | target `docs/architecture/JACKPOT_SITE_EXTRACTION_PLAN.md` (`JSE-001`) + source `JSE-003` |
| Repo | `git-ben18/jackpot-site` only |

## How to brief an agent

```text
Implement only task <ID> from:
docs/tasks/jse-s3/<file>

Follow docs/JSE-S3-CURATED-DISCOVERY-PLAN.md frozen decisions D-S3-01..D-S3-11.
Read AGENTS.md and docs/architecture/SOURCE_BOUNDARY.md before runtime changes.
Do not expand scope to other task IDs unless listed as in-scope dependency work.
Open a focused PR for this task (or the PR grouping noted in the plan) when done.
Record provenance for every source-derived runtime file you adopt.
```

## Order

```text
S3-A → S3-B → S3-C → S3-D → S3-E → S3-F → S3-F-RLS? → S3-G → S3-H
```

Do **not** start S3-E before S3-D exits. Do **not** start S3-G before S3-F exits with conclusion `accepted`. Fixture-first is mandatory (D-S3-08).

**S3-F-RLS** runs when S3-F (or an equivalent audit) finds the live database does not match **D-S3-11** (invoker + private producers, plus RLS/grants). It is required before S3-F may conclude `accepted` unless S3-F already proved there is no gap (then mark S3-F-RLS `N/A`). DDL is applied only in the Supabase migration authority — never from this repository.

Recommended PR grouping (from the plan):

```text
PR 1 — S3-A
PR 2 — S3-B
PR 3 — S3-C + S3-D
PR 4 — S3-E
PR 5 — S3-F privilege evidence; S3-F-RLS in the migration-authority repo if blocked; then S3-G
PR 6 — S3-H
```

Agents may still implement S3-C and S3-D as separate commits/PRs if that keeps review cleaner.

## Index

| ID | File | Track | Depends on | Type |
|---|---|---|---|---|
| S3-A | [S3-A-baseline-decisions.md](./S3-A-baseline-decisions.md) | Baseline + decisions | — | Docs / metadata |
| S3-B | [S3-B-contracts-mapper-tests.md](./S3-B-contracts-mapper-tests.md) | Public contracts | S3-A | Code + tests |
| S3-C | [S3-C-leaf-presentation.md](./S3-C-leaf-presentation.md) | Leaf presentation | S3-B | Code |
| S3-D | [S3-D-composed-hardened-presentation.md](./S3-D-composed-hardened-presentation.md) | Composed / hardened presentation | S3-C | Code |
| S3-E | [S3-E-curated-repository.md](./S3-E-curated-repository.md) | Low-privilege repo | S3-D | Code + tests |
| S3-F | [S3-F-db-privilege-acceptance.md](./S3-F-db-privilege-acceptance.md) | DB privilege evidence | S3-E | Evidence / spike |
| S3-F-RLS | [S3-F-RLS-public-read-remediation.md](./S3-F-RLS-public-read-remediation.md) | Public-read RLS / grant remediation | S3-F `blocked` (or equivalent audit) | Evidence + authorized migration |
| S3-G | [S3-G-live-homepage-integration.md](./S3-G-live-homepage-integration.md) | Live homepage | S3-F `accepted` | Code |
| S3-H | [S3-H-evidence-closeout.md](./S3-H-evidence-closeout.md) | Closeout | S3-G | Docs / evidence |

## Global constraints (every task)

1. Build from an allowlist. A source import is not permission to copy its dependency.
2. Never introduce `SUPABASE_SERVICE_ROLE_KEY`, `getSupabaseAdminClient()`, `artifact-queries.ts`, or service-role fallback.
3. Never restore `/api/subscribe`, `LandingDashboardClient`, Hottest Offers, dashboard/query surfaces, or full event-discovery UI.
4. Initial S3 defers event overlaps (D-S3-02) and production analytics (D-S3-03).
5. Read only `public.v_curated_promo_discovery` with the selected-column allowlist in D-S3-04.
6. Do not silently serve mock/fixture data in production (D-S3-08).
7. Do not pre-implement JSE-S4 newsletter BFF/OIDC or JSE-S5 consent analytics to unblock S3.
8. Record provenance at adoption time (`docs/provenance/rewards-maxxing-frontend.md` and/or an S3 ledger created in S3-A).
9. Distinguish **copied**, **adapted/hardened**, **implemented**, **configured**, **deployed**, and **operationally accepted**.
10. Stop on any condition in plan §9 and resolve the boundary before continuing.
11. `jackpot-site` does not own Supabase schema/grant/RLS/`security_invoker` migrations. If S3-F (or later) discovers those must change, stop and implement [S3-F-RLS](./S3-F-RLS-public-read-remediation.md) through the current Supabase migration authority — never apply ad-hoc production DDL from this repository.
