# S6-G — Hosted failure, abuse, kill switch, and rollback

| Field | Value |
|---|---|
| Track | S6-G |
| Type | Hosted evidence + runbook |
| Depends on | S6-C |
| Blocks | S6-H HA-07 / rollback rows |
| Estimate | M |
| Repo | git-ben18/jackpot-site |
| HA | HA-07 |

## Goal

Prove that hosted failure does not crash the first-release surface, that the acquisition kill switch still blocks mutation, and that rollback is documented **without** a second canonical subscriber system.

## Requirements

1. Curated reader failure → visitor-safe message (already S3); re-observe on staging.
2. Newsletter/BFF/identity failure → bounded DOI/confirm copy; no stack/upstream body.
3. Telemetry/provider failure (if any sink exists; otherwise N/A) must not change product UX (S5-F).
4. Kill switch unset/false: no protected newsletter mutation from the hosted BFF.
5. Abuse: honeypot remains server-authoritative; Turnstile remains deferred unless S6-A recorded approval and this packet implements it.
6. Rollback runbook (names, not secrets):
   - disable acquisition via kill switch;
   - roll back the Vercel deployment;
   - DNS revert only under an explicit operator procedure **if** DNS was ever changed (S6 default: DNS unchanged);
   - never restore `/api/subscribe` or `email_signups`.
7. Cloudflare/perimeter: record current state; do not cut over production hostname here.

## Evidence

`docs/tasks/jse-s6/_status-S6-G.md` with failure observations, kill-switch proof, Turnstile status, rollback steps, and SHA.

## Out of scope

Executing production DNS cutover, public DOI, production SendGrid to real users, dual-write rollback, GTM.

## Acceptance checklist

- [ ] Fail-soft product UX observed hosted
- [ ] Kill switch blocks mutation
- [ ] Rollback procedure recorded without legacy writer
- [ ] Turnstile deferred or approved-and-proven
- [ ] HA-07 evidence exists
- [ ] Not authority transfer

## Agent prompt

~~~text
Implement only S6-G from docs/tasks/jse-s6/S6-G-failure-rollback-abuse.md.
Prove hosted fail-soft behavior, kill switch, and a rollback runbook that does
not restore /api/subscribe. Do not cut over DNS or enable public DOI.
~~~
