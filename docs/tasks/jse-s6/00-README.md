# JSE-S6 agent task packets

Hand an agent **one task file at a time**. Each file is a self-contained audit, hosting, or evidence packet.

| Field | Value |
|---|---|
| Slice | `JSE-S6` |
| Planning authority | [JSE-S6-PRODUCTION-SAFETY-HOSTED-ACCEPTANCE-PLAN.md](./JSE-S6-PRODUCTION-SAFETY-HOSTED-ACCEPTANCE-PLAN.md) |
| Architecture / trust | target `docs/architecture/JACKPOT_SITE_EXTRACTION_PLAN.md` (`JSE-001`) + source `JSE-003` + ADR-0003/0004 |
| Product / release / legal authority | `git-ben18/jackpot-news` |
| Newsletter runtime | `git-ben18/jackpot-api-newsletter` (Epic B / EB-03) |
| Repo for these packets | `git-ben18/jackpot-site` only |
| Start baseline | Freeze in S6-A against current `main` plus accepted S3-H / S4-H; do not treat unmerged S5-C/G/H as hosted SHA |

## How to brief an agent

```text
Implement only task <ID> from:
docs/tasks/jse-s6/<file>

Follow docs/tasks/jse-s6/JSE-S6-PRODUCTION-SAFETY-HOSTED-ACCEPTANCE-PLAN.md.
Read AGENTS.md and docs/architecture/SOURCE_BOUNDARY.md before any runtime or hosting change.
Use S6-A frozen SHAs and decisions; do not reopen S3/S4/S5 contracts.
Do not invent Privacy Policy URL/version, enable public DOI, cut over DNS,
or transfer public-site authority.
Record env names only; never paste secret values.
Open a focused PR for this task (or approved grouping) when done.
```

## Order

```text
S6-A → S6-B → S6-C → S6-D → S6-E → S6-F → S6-G → S6-H
```

Allowed parallelism after S6-A:

```text
S6-B  (local; no deploy)
S6-C ──────┐
           ├─> S6-D ─> S6-E ─┐
readiness review required    ├─> S6-G ─> S6-H
S6-F (privacy items blocked on ACQ-05 / S5-C) ─┘
```

S6-C must not begin until S6-A records that restricted-hosting readiness review is permitted (or explicitly blocked).

S6-D must not fake production OIDC. Verifier proof is a `jackpot-api-newsletter` companion.

If S5-C remains blocked, S6-F/H must not mark Privacy Policy or public DOI complete.

## Index

| ID | File | Track | Depends on | Type | HA |
|---|---|---|---|---|---|
| S6-A | [S6-A-baseline-hosted-acceptance-freeze.md](./S6-A-baseline-hosted-acceptance-freeze.md) | Baseline / freeze | program facts | Docs / inventory | maps HA-01…08 |
| S6-B | [S6-B-production-safety-inventory.md](./S6-B-production-safety-inventory.md) | Production-safety audit | S6-A | Docs + repo searches | inventory |
| S6-C | [S6-C-restricted-vercel-topology.md](./S6-C-restricted-vercel-topology.md) | Restricted staging | S6-A + readiness review | Configure + evidence | HA-01, HA-02 |
| S6-D | [S6-D-hosted-workload-identity.md](./S6-D-hosted-workload-identity.md) | Real OIDC caller | S6-C, EB-03 | Hosted proof + handoff | HA-03 |
| S6-E | [S6-E-staging-newsletter-e2e.md](./S6-E-staging-newsletter-e2e.md) | Staging newsletter E2E | S6-D | Hosted E2E | HA-04, HA-05, HA-06 |
| S6-F | [S6-F-hosted-public-surface.md](./S6-F-hosted-public-surface.md) | Hosted discovery / privacy / consent | S6-C; ACQ-05 for privacy close | Hosted evidence | product surface |
| S6-G | [S6-G-failure-rollback-abuse.md](./S6-G-failure-rollback-abuse.md) | Failure / kill switch / rollback | S6-C | Hosted evidence | HA-07 |
| S6-H | [S6-H-hosted-acceptance-closeout.md](./S6-H-hosted-acceptance-closeout.md) | Eligibility closeout | S6-B…G | Docs / evidence | HA-08 |

Supporting:

- [s6-hosted-acceptance-inventory-template.md](./s6-hosted-acceptance-inventory-template.md) — filled by S6-A/B

## Recommended PR grouping

```text
PR 1 — S6-A + S6-B (docs/audit; no deploy)
PR 2 — S6-C (restricted staging evidence)
PR 3 — S6-D
PR 4 — S6-E
PR 5 — S6-F + S6-G (separate commits acceptable)
PR 6 — S6-H
```

Keep privacy/DOI enablement claims out of PRs that only prove staging topology or OIDC.

## Global constraints

1. S6 exit is **eligibility** for ACQ-06 and a cutover decision, not authority transfer.
2. Preview ≠ production newsletter mutation authority.
3. Kill switch stays fail-closed except controlled staging tests, then restored.
4. No invented ACQ-05 values; no `/privacy` as fake approved policy.
5. No GTM / SessionInit / telemetry DB from this slice by convenience.
6. No `/api/subscribe` or `email_signups` rollback path.
7. Browser never calls the newsletter-service hostname.
8. This repo does not apply Supabase DDL.
9. Companion proofs in `jackpot-api-newsletter` / `jackpot-news` are required; do not mark them done from frontend-only evidence.
10. Distinguish implemented, configured, deployed, provider-accepted, and production-authoritative.
