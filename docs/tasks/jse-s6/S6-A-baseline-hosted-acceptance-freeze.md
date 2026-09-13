# S6-A — Release-candidate authority and control freeze

| Field | Value |
|---|---|
| Track | S6-A |
| Type | Docs / analysis / contract inventory |
| Depends on | Accepted S3-H and S4-H; inspect current S5 state |
| Blocks | S6-B…H |
| Repo | git-ben18/jackpot-site |

## Goal

Freeze the production-readiness contract before hosted work begins.

S6-A records the exact authorities, candidate baseline, cross-repo gates, required production controls, inherited MVP deferrals, and whether restricted acceptance hosting is permitted. It must convert every known deferral into:

- required-and-planned-for-S6;
- explicitly N/A by authority;
- approved equivalent control; or
- release blocker.

This packet does not deploy.

## Required authority freeze

Record exact inspected SHAs/status for:

1. `jackpot-site`
   - current `main`;
   - accepted S3-H / S4-H;
   - S5-A…H status;
   - current route/build/runtime surface.
2. `jackpot-news`
   - ADR-0003 / ADR-0004;
   - ACQ-05;
   - ACQ-06;
   - any abuse-control, analytics, privacy, hosting, or cutover decisions.
3. `jackpot-api-newsletter`
   - current runtime SHA;
   - `HOSTED-ACCEPTANCE-ENTRY-GATE.md`;
   - EB-03 verifier contract;
   - EB-05 hosted Supabase proof status;
   - EB-06 hosted SendGrid proof status.
4. DB/migration authority relevant to HA-05.
5. Restricted-hosting readiness review required by S4-H.

S6-A must consume the newsletter backend hosted-entry gate directly rather than duplicating or weakening it.

## Required control register

Create a control table covering at least:

- privacy/legal linkage;
- server-side abuse control;
- backend rate-limit/cooldown/circuit-breaker posture;
- workload identity/authorization;
- public-reader least privilege;
- secret/env isolation;
- browser/server token and PII hygiene;
- provider/data/API failure behavior;
- logging/redaction/correlation;
- rollback/recovery;
- production analytics state;
- dependency/supply-chain review;
- security headers/referrer behavior where applicable;
- input/method/content-type abuse handling.

For each control record:

`required | N/A-by-authority | equivalent-approved | blocked`

If equivalent-approved, include owner, rationale, compensating controls, and review/expiry date.

## HA map semantics

For HA-01…08 record both:

- packet execution status: `not-started | complete | blocked | N/A`;
- acceptance contribution: `not-satisfied | proven | N/A-by-authority`.

Do not use “out of repo” as an acceptance result.

## Mandatory blockers

S6-H cannot become production-ready while any of the following remain unresolved unless the owning authority explicitly marks them N/A:

- ACQ-05 / accepted privacy integration;
- accepted S5-H;
- EB-03 updated for `jackpot-site`;
- HA-05 / EB-05 hosted persistence proof;
- required provider proof;
- accepted server-side abuse control;
- restricted-hosting readiness.

## Evidence output

Create `docs/tasks/jse-s6/_status-S6-A.md` with:

- inspected SHAs;
- S6 release-candidate posture decisions;
- backend hosted-entry-gate result;
- control register;
- HA map with two-state semantics;
- S5/ACQ/EB blockers;
- expected env names only;
- conclusion `accepted-freeze` or `blocked`.

## Stop conditions

Stop rather than weakening the plan if:

- an authority gate is unavailable;
- EB-03 still names only the legacy frontend;
- a required production control is proposed as “deferred after S6”;
- an arbitrary preview is proposed as the acceptance environment;
- legal values are invented;
- a legacy acquisition writer is proposed as rollback.

## Acceptance checklist

- [ ] Exact current SHAs/status recorded
- [ ] Newsletter hosted-entry gate consumed directly
- [ ] S5-H status explicit
- [ ] EB-03/05/06 status explicit
- [ ] Full production control register created
- [ ] Inherited MVP deferrals converted to S6 control/blocker outcomes
- [ ] HA map uses execution + acceptance semantics
- [ ] Restricted-hosting readiness permitted or blocked
- [ ] No deploy, secrets, invented legal values, or authority-transfer claim
