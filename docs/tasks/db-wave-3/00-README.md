# DB-W3 — Database API Contract task packets

## Purpose

These packets operationalize:

```text
docs/architecture/DATABASE_API_CONTRACT_WAVE_3.md
```

They are intentionally separate from `docs/tasks/jse-s3/`.

```text
JSE-S3
= curated-discovery application extraction

DB-W3
= governed Supabase api.* application contract
```

## Execution gate

Do not start W3-A until the refreshed Wave 2 handoff document is merged to `jackpot-site/main` and records Wave 2 as complete.

Wave 2 database state is already closed externally; this gate ensures `jackpot-site` documentation catches up before Wave 3 begins.

## Agent rule

Hand an agent **one packet at a time**.

Use:

```text
Implement only DB-W3 task <ID> from:
docs/tasks/db-wave-3/<file>

Read:
- AGENTS.md
- docs/architecture/DATABASE_API_CONTRACT_WAVE_3.md
- docs/architecture/DATABASE_PUBLISH_CONTRACT_HANDOFF.md
- docs/JSE-S3-CURATED-DISCOVERY-PLAN.md
- docs/architecture/JACKPOT_SITE_EXTRACTION_PLAN.md

Do not expand to later DB-W3 packets.
Do not apply database DDL from jackpot-site.
Record evidence and stop on the packet stop conditions.
```

## Order

```text
W3-A → W3-B → W3-C → W3-D → W3-E → W3-F → W3-G
```

## Index

| ID | File | Goal | Primary repo |
|---|---|---|---|
| W3-A | `W3-A-contract-inventory.md` | freeze current and target contract facts | jackpot-site + read-only core/live evidence |
| W3-B | `W3-B-api-schema-design.md` | approve exact API schema/view/security design | jackpot-site docs; core consulted |
| W3-C | `W3-C-migration-and-privileges.md` | implement reviewed migration/config | core |
| W3-D | `W3-D-low-privilege-acceptance.md` | prove runtime privilege/PostgREST matrix | evidence + approved environment |
| W3-E | `W3-E-jackpot-site-cutover.md` | update site repository to explicit `api` contract | jackpot-site |
| W3-F | `W3-F-public-contract-retirement.md` | inventory/decide old public-view disposition | cross-repo + core migration if retiring |
| W3-G | `W3-G-closeout.md` | record final evidence and close Wave 3 | jackpot-site docs |

## Global constraints

1. `publish.*` remains internal producer state.
2. The public site never uses service-role for ordinary curated rendering.
3. No direct `jackpot-site` reads from `publish.*`.
4. No database migration is authored/applied from `jackpot-site`.
5. Initial contract is curated promo discovery only.
6. Event overlap remains deferred unless separately reopened.
7. Reuse the JSE-S3 selected-column public DTO contract; do not widen it casually.
8. Do not drop `public.v_curated_promo_discovery` before W3-F.
9. Do not repeat already-accepted Wave 2 topology checks unless W3 work changes relevant state.
10. Never use stale Step 3A DuckDB to apply/prune/rebuild event-day or overlap production state.
11. Evidence must distinguish planned, implemented, applied, and operationally accepted state.
12. Every production-affecting DB step must be bounded and reviewed before execution.

## Recommended PR boundaries

A reasonable pattern:

```text
PR A — W3-A + W3-B planning/design docs
PR B — core W3-C migration/config
PR C — W3-D evidence
PR D — W3-E jackpot-site cutover
PR E — W3-F disposition/retirement if applicable
PR F — W3-G closeout
```

Do not force this grouping when smaller PRs improve reviewability.
