# S6-H — Hosted-acceptance closeout (eligibility only)

| Field | Value |
|---|---|
| Track | S6-H |
| Type | Docs / evidence / handoff |
| Depends on | S6-B…G executed with recorded conclusions |
| Blocks | ACQ-06 controlled DOI E2E and ADR-0004 cutover **decision** (those remain `jackpot-news` / release) |
| Estimate | M |
| Repo | git-ben18/jackpot-site |
| HA | HA-08 |

## Goal

Close JSE-S6 evidence as far as facts allow and state clearly whether `jackpot-site` is **eligible** for ACQ-06 controlled DOI E2E and a production cutover decision.

S6-H must not imply that public-site authority transferred, DNS cut over, or public DOI is on.

If ACQ-05, EB-03, SendGrid, or readiness review is still blocked, the required closeout is **blocked** (or a later authority’s explicit “accepted-with-named-blockers”). Do not use deferral wording to hide a required missing proof.

## Required closeout statement

Include this distinction prominently in `docs/tasks/jse-s6/_status-S6-H.md`:

~~~text
JSE-S6 — Production-Safety Audit and Hosted Acceptance
STATUS: <HOSTED ACCEPTANCE COMPLETE (eligibility only) | BLOCKED | BLOCKED-PENDING-…>

Proven in this slice (check only what evidence supports):
○ production-safety route/dep/env/credential inventory
○ restricted Vercel staging + preview isolation
○ real OIDC caller (verifier companion as recorded)
○ staging BFF → newsletter E2E
○ controlled SendGrid DOI (if permitted)
○ hosted curated fail-soft
○ privacy URL/version approved (ACQ-05 / S5-C)
○ kill switch / rollback without legacy writer
○ tests/typecheck/build on hosted SHA

Not asserted by S6:
○ public DOI enablement
○ Cloudflare/DNS production cutover
○ ACQ-03 production trust cutover complete
○ deauthorization of rewards-maxxing-frontend
○ transfer of public-site authority
○ production analytics/provider acceptance unless S6-A authorized a sink
○ DB-W4 telemetry schema
~~~

## Required closeout evidence

1. S6-A…G status links and tested/deployed SHAs.
2. Filled JSE-001 §18 table (routes, deps, newsletter hosted, identity, Supabase public read, secrets, privacy, cookies/analytics, abuse, curated, failure, Vercel, Cloudflare, rollback) — each cell `proven` / `blocked` / `N/A` with owner.
3. HA-01…08 final map.
4. Remaining owners: `jackpot-news`, `jackpot-api-newsletter`, operators.
5. Explicit: S6 does not perform ACQ-06 E2E if that remains a later release control; it only records eligibility.

## No-authority-transfer statement

S6 completion, even if hosted acceptance is complete:

- does not make preview/staging production-authoritative;
- does not authorize production newsletter mutations beyond the restricted staging pair already proven;
- does not enable public acquisition;
- does not modify production DNS/Cloudflare unless a separate release packet did so (default: did not);
- does not deauthorize the current production frontend.

## Blocker rule

S6-H must conclude blocked if:

- required HA proof is missing and not covered by an explicit upstream exception;
- ACQ-05 is still open **and** the closeout tries to call privacy complete;
- kill switch was left enabled on a non-restricted environment;
- secrets appear in git/evidence;
- a production-safety defect was relabeled as a hosted deferral.

## Out of scope

Executing the public cutover, writing Privacy Policy, DB-W4 implementation, production GTM, restoring legacy subscribe.

## Acceptance checklist

- [ ] §18 table filled honestly
- [ ] HA-01…08 mapped with owners
- [ ] Eligibility vs authority transfer distinguished
- [ ] Remaining S5-C/ACQ-05/EB-03/SendGrid items explicit
- [ ] No production-authority claim
- [ ] Provenance/status files linked

## Agent prompt

~~~text
Implement only S6-H from docs/tasks/jse-s6/S6-H-hosted-acceptance-closeout.md.
Close S6 with a section-18 evidence table and HA-01…08 map. State eligibility
for ACQ-06 / cutover decision only if proofs exist. Do not cut over DNS, enable
public DOI, or claim public-site authority. If ACQ-05 or verifier proof is
missing, conclude blocked rather than inventing completion.
~~~
