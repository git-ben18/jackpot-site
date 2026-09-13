# JSE-S6 agent task packets

Hand an agent **one task file at a time**. JSE-S6 is the production-hardening and release-candidate acceptance cycle for `jackpot-site`.

| Field | Value |
|---|---|
| Slice | `JSE-S6` |
| Planning authority | [JSE-S6-PRODUCTION-SAFETY-HOSTED-ACCEPTANCE-PLAN.md](./JSE-S6-PRODUCTION-SAFETY-HOSTED-ACCEPTANCE-PLAN.md) |
| Architecture / trust | target `docs/architecture/JACKPOT_SITE_EXTRACTION_PLAN.md` (`JSE-001`) + ADR-0003/0004 |
| Product / release / legal authority | `git-ben18/jackpot-news` |
| Newsletter runtime | `git-ben18/jackpot-api-newsletter` (Epic B) |
| Repo for these packets | `git-ben18/jackpot-site` |
| Final S6 result | `PRODUCTION-READY RELEASE CANDIDATE` or `BLOCKED` |

## Governing posture

Earlier MVP slices could carry safe hosted deferrals. S6 cannot.

A production safety control must be:

- implemented and proven;
- explicitly replaced by an approved equivalent control; or
- a release blocker.

The review is **not limited to surfaces named in the original S6 draft**. Agents must review production-reachable behavior inherited from earlier slices and general anonymous-Internet exposure: routes, dependencies, browser/server boundaries, headers, secrets, input abuse, rate limits, preview privilege, provider failures, logging/redaction, and rollback/recovery.

“Not part of my packet” does not make a production-reachable risk N/A. Record it and route it to the owning S6 packet or authority.

## Agent briefing

```text
Implement only task <ID> from:
docs/tasks/jse-s6/<file>

Follow docs/tasks/jse-s6/JSE-S6-PRODUCTION-SAFETY-HOSTED-ACCEPTANCE-PLAN.md.
Read AGENTS.md and docs/architecture/SOURCE_BOUNDARY.md.
Use the S6-A authority/control freeze.
Do not weaken a production control into an MVP deferral.
Do not invent privacy values, enable public DOI, cut over DNS, or transfer authority.
Never paste secret/token/email/assertion values into evidence.
Record packet execution conclusion separately from acceptance contribution.
Open a focused PR for this task (or approved grouping) when done.
```

## Order

```text
S6-A → S6-B → S6-C → S6-D → S6-E → S6-F → S6-G → S6-H
```

S6-C requires S6-B. There is no S6-B waiver.

S6-D requires a current backend verifier contract that explicitly covers `jackpot-site`.

S6-E is a controlled hosted/provider **preflight**, not ACQ-06.

S6-H requires accepted S5-H plus all required S6 acceptance contributions on the exact final candidate SHA.

## Index

| ID | Track | Required outcome |
|---|---|---|
| S6-A | Authority / control freeze | release controls, SHAs, cross-repo gates, no hidden deferrals |
| S6-B | Production-security inventory | full candidate and Internet-exposure review |
| S6-C | Vercel topology | production-equivalent restricted staging + negative isolation proof |
| S6-D | Workload identity | caller + verifier authorization matrix |
| S6-E | Newsletter/provider preflight | BFF + persistence + controlled provider lifecycle |
| S6-F | Public surface | live positive path + safe negative/fail-soft path + privacy/consent |
| S6-G | Operational security | abuse, failures, logging, kill switch, rollback drills |
| S6-H | Certification | exact candidate is production-ready or blocked |

Supporting template: [s6-hosted-acceptance-inventory-template.md](./s6-hosted-acceptance-inventory-template.md).

## Global constraints

1. S6 certifies a production-ready candidate; it does not transfer public authority.
2. Preview ≠ production mutation authority.
3. Acquisition stays fail-closed outside controlled acceptance windows.
4. Privacy and abuse controls are production blockers unless explicitly satisfied by authority.
5. HA-05 requires accepted EB-05/DB evidence; “out of repo” alone is not proof.
6. OIDC requires issuer/team/project/environment/audience authorization and negative tests.
7. Curated discovery requires both live hosted success and controlled fail-soft proof.
8. No legacy acquisition fallback, browser-direct newsletter calls, or ad-hoc DB DDL.
9. Runtime-affecting remediation invalidates affected older acceptance evidence.
10. Final candidate reruns tests/typecheck/build/guardrails before S6-H.
