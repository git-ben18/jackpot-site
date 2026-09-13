# S6-A — Baseline and hosted-acceptance freeze

| Field | Value |
|---|---|
| Track | S6-A |
| Type | Docs / analysis / contract inventory |
| Depends on | S3-H and S4-H on `main`; S5 local work may still be open |
| Blocks | S6-B…H |
| Estimate | M |
| Repo | git-ben18/jackpot-site |

## Goal

Freeze the JSE-S6 starting point **before** restricted hosting or production-shaped configuration. S6-A establishes inspected SHAs, HA-01…08 ownership, remaining S5/ACQ-05/EB-03 blockers, and whether restricted-hosting readiness review permits S6-C.

S6-A must prevent later agents from treating a preview URL, local S5-G working tree, or invented privacy URL as hosted acceptance.

This packet is documentation only. It does not deploy, configure Vercel, enable DOI, or transfer authority.

## Required authority freeze

Record exact SHAs inspected for:

1. `jackpot-site`
   - `main` tip used as S6 start;
   - accepted S3-H and S4-H evidence;
   - S5-A freeze and S5-B/D/E/F status;
   - honest S5-C / S5-G / S5-H status (blocked vs unmerged vs absent);
   - current first-release route list.
2. `jackpot-news`
   - ADR-0003, ADR-0004;
   - ACQ-05 privacy URL/version guidance (expect still unresolved);
   - any ACQ-03/ACQ-06 or analytics-provider decision newer than S5-A.
3. `rewards-maxxing-frontend`
   - JSE-001 / JSE-003 only as extraction dispositions; not hosting authority.
4. `jackpot-api-newsletter`
   - current acquisition routes;
   - Epic B / EB-03 OIDC verifier status (expect not operationally accepted).
5. Restricted-hosting readiness
   - S4-H required frontend + newsletter-backend + Supabase security-readiness review;
   - conclude `permitted` or `blocked` with evidence, not hope.

Historical planning SHAs are not execution-time authority. Re-freeze when this task runs.

Planning decisions D-S6-01…08 in [JSE-S6-PRODUCTION-SAFETY-HOSTED-ACCEPTANCE-PLAN.md](./JSE-S6-PRODUCTION-SAFETY-HOSTED-ACCEPTANCE-PLAN.md) should be accepted or explicitly amended with upstream authority. Do not weaken them to make hosting easier.

## HA map

Fill the HA-01…08 table in [s6-hosted-acceptance-inventory-template.md](./s6-hosted-acceptance-inventory-template.md): owner repo, S6 packet, current status (`not-started` / `blocked-on` / `out-of-this-repo`).

HA-05 must remain a newsletter-service + DB-authority item. Do not schedule Supabase DDL from `jackpot-site`.

## Kill switch and analytics freeze

Record:

- acquisition remains fail-closed on hosted envs until named gates close;
- production telemetry sink remains S5-F explicit `disabled` unless `jackpot-news` now authorizes a provider (quote that decision; do not invent GTM);
- session identity remains omit unless a new measurement requirement exists.

## Evidence output

Create `docs/tasks/jse-s6/_status-S6-A.md` with:

- inspected SHAs;
- D-S6-01…08 accepted/amended;
- HA map;
- S5-C/ACQ-05 blocker;
- EB-03 blocker;
- readiness-review conclusion;
- env **names** expected later (no values);
- conclusion `accepted` (freeze only) or `blocked` if authorities cannot be inspected.

A successful freeze may still list S6-C+ as blocked. That is expected.

## Stop conditions

Stop and do not pretend S6-C is unblocked if:

- readiness review is missing and an agent wants to deploy anyway;
- ACQ-05 is missing and an agent wants to mark privacy complete;
- unmerged S5-G WIP is proposed as the production/staging SHA;
- a packet proposes restoring `/api/subscribe` or enabling public DOI in S6-A.

## Out of scope

Vercel configuration, OIDC tokens, SendGrid, DNS, Privacy Policy authoring, telemetry provider activation, public DOI, authority transfer, runtime code changes.

## Acceptance checklist

- [ ] S6 start SHA and upstream SHAs recorded
- [ ] D-S6-01…08 accepted or amended with cited authority
- [ ] HA-01…08 mapped to packets and owning repos
- [ ] S5-C / ACQ-05 recorded honestly
- [ ] EB-03 / verifier recorded honestly
- [ ] Restricted-hosting readiness review permitted or blocked
- [ ] Kill switch and disabled-sink defaults recorded
- [ ] No deploy, no secrets, no invented legal values

## Agent prompt

~~~text
Implement only S6-A from docs/tasks/jse-s6/S6-A-baseline-hosted-acceptance-freeze.md.
Freeze inspected SHAs, D-S6 decisions, HA-01…08 ownership, S5-C/ACQ-05 and
EB-03 blockers, and restricted-hosting readiness. Do not deploy, invent privacy
values, enable DOI, or treat unmerged S5-G work as the hosted SHA.
~~~
