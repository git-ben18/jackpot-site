# JSE-S5 agent task packets

Hand an agent **one task file at a time**. Each file is a self-contained implementation or acceptance packet.

| Field | Value |
|---|---|
| Slice | `JSE-S5` |
| Planning authority | [../../JSE-S5-PUBLIC-SHELL-PRIVACY-TELEMETRY-PLAN.md](../../JSE-S5-PUBLIC-SHELL-PRIVACY-TELEMETRY-PLAN.md) |
| Architecture / trust | target `docs/architecture/JACKPOT_SITE_EXTRACTION_PLAN.md` (`JSE-001`) + source `JSE-003` |
| Product / release / legal authority | `git-ben18/jackpot-news` |
| Repo | `git-ben18/jackpot-site` only |
| Start baseline | Freeze in S5-A after S4-H and DB-W3-F/G program prerequisites are complete |

## How to brief an agent

```text
Implement only task <ID> from:
docs/tasks/jse-s5/<file>

Follow docs/JSE-S5-PUBLIC-SHELL-PRIVACY-TELEMETRY-PLAN.md.
Read AGENTS.md and docs/architecture/SOURCE_BOUNDARY.md before runtime changes.
Use S5-A frozen SHAs and decisions; do not reopen them inside later packets.
Do not invent legal/privacy/operator values or a telemetry storage schema.
Do not expand scope to hosted acceptance, deployment, DNS, SendGrid, or production authority.
Record provenance for every source-derived runtime artifact.
Open a focused PR for this task (or approved grouping) when done.
```

## Order

```text
S5-A → S5-B → S5-C → S5-D → S5-E → S5-F → S5-G → S5-H
```

Allowed parallelism after S5-A:

```text
S5-B ───────────────┐
S5-C ──────┐        │
S5-D ──────┼─> S5-F ├─> S5-G -> S5-H
S5-E ──────┘        │
                    ┘
```

S5-F must not begin before S5-D and S5-E are accepted.

S5-C may implement route/rendering structure while operator-approved privacy inputs are pending, but it must remain **blocked** rather than marking placeholders complete.

## Index

| ID | File | Track | Depends on | Type |
|---|---|---|---|---|
| S5-A | [S5-A-baseline-authority-policy-freeze.md](./S5-A-baseline-authority-policy-freeze.md) | Baseline / analysis / policy freeze | program prerequisites | Docs / inventory |
| S5-B | [S5-B-public-shell-allowlist.md](./S5-B-public-shell-allowlist.md) | Public shell | S5-A | Code + tests |
| S5-C | [S5-C-privacy-policy-integration.md](./S5-C-privacy-policy-integration.md) | Privacy Policy | S5-A | Content integration + tests |
| S5-D | [S5-D-consent-enforcement.md](./S5-D-consent-enforcement.md) | Cookie / analytics consent | S5-A | Code + tests |
| S5-E | [S5-E-first-release-telemetry-contract.md](./S5-E-first-release-telemetry-contract.md) | Telemetry semantics | S5-A | Docs / contracts / tests |
| S5-F | [S5-F-telemetry-implementation-guardrails.md](./S5-F-telemetry-implementation-guardrails.md) | Telemetry implementation/security | S5-D, S5-E | Code + tests + evidence |
| S5-G | [S5-G-local-integration-acceptance.md](./S5-G-local-integration-acceptance.md) | Local acceptance | S5-B..F accepted | Integration / build evidence |
| S5-H | [S5-H-implementation-closeout.md](./S5-H-implementation-closeout.md) | Closeout | S5-G accepted | Docs / evidence / handoff |

Supporting analysis:

- [s5-shell-and-global-runtime-inventory.md](./s5-shell-and-global-runtime-inventory.md)
- [s5-telemetry-contract-template.md](./s5-telemetry-contract-template.md)

## Recommended PR grouping

```text
PR 1 — S5-A
PR 2 — S5-B
PR 3 — S5-C
PR 4 — S5-D + S5-E (separate commits acceptable)
PR 5 — S5-F
PR 6 — S5-G
PR 7 — S5-H
```

Keep S5-C separate if human/operator privacy inputs are still pending so the rest of the implementation is not falsely represented as legally complete.

## Global constraints

1. Build the root shell from an allowlist.
2. Root-layout reachability counts as public dependency reachability.
3. No `ExploreFAB`, legacy dashboard navigation, source-only routes, or footer fallback acquisition by inference.
4. No invented Privacy Policy URL/version/operator/contact/legal claims.
5. If optional analytics ship, essential-only/rejected consent emits **zero** non-essential beacons.
6. Only S5-E-approved event names/payload fields may emit.
7. Newsletter request is not confirmation.
8. Never emit raw email, confirmation token, token-bearing URL/referrer, secret, backend error body, or arbitrary metadata.
9. Session identity is omitted unless S5-A/E explicitly justifies it.
10. Do not copy the source `SessionInit` / generic `useTracker` / legacy telemetry routes by convenience.
11. Telemetry failure must never block product UX.
12. S5 does not create or migrate a Supabase telemetry persistence schema.
13. No hosted deployment, OIDC operational acceptance, SendGrid, DNS, public DOI enablement, or authority transfer.
14. Distinguish **implemented**, **configured**, **deployed**, **provider-accepted**, and **production-authoritative**.
