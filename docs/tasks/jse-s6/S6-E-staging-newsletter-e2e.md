# S6-E — Staging newsletter E2E

| Field | Value |
|---|---|
| Track | S6-E |
| Type | Restricted staging E2E + evidence |
| Depends on | S6-D (caller proven or verifier companion accepted for this staging pair) |
| Blocks | S6-H newsletter rows; informs S6-G |
| Estimate | L |
| Repo | git-ben18/jackpot-site (BFF + UX evidence) |
| HA | HA-04, HA-05 (handoff), HA-06 |

## Goal

Reuse S4-G / S4-E scenarios against **restricted staging** with real workload identity and the accepted staging newsletter service:

- same-origin BFF → `jackpot-api-newsletter`;
- subscribe remains non-enumerating;
- confirmation token hygiene;
- a real confirmation link can open staging `/newsletter/confirm` and consume once;
- missing/wrong identity cannot mutate.

HA-06 controlled SendGrid DOI is included **only** when operators permit real mail to a controlled inbox. If not permitted, record `blocked-pending-sendgrid-authority` and still prove HA-04 against a staging API if that is allowed without public mail.

HA-05 hosted Supabase **newsletter** mutation path is a newsletter-service + DB-authority proof. This packet cites it; it does not apply DDL from `jackpot-site`.

## Kill-switch rule

Acquisition may be enabled **only** in the restricted staging environment for the test window, using controlled addresses. Restore fail-closed afterwards. Document the window. This is not public DOI enablement.

## Required scenarios

Reuse, do not rewrite, the S4-G matrix as hosted:

- subscribe happy path;
- non-enumeration (distinct internals → same browser accepted);
- validate → ready → consume success;
- already_complete / invalid / unable fail-closed;
- token stripped from URL; token absent from logs/HTML.

Do not use production subscriber data. Do not test against the production newsletter workload unless a later `jackpot-news` packet explicitly authorizes that (default: forbidden).

## Evidence

`docs/tasks/jse-s6/_status-S6-E.md` with scenario table, SHA, env **names**, kill-switch restore confirmation, HA-05/HA-06 status, and no secret/token/email dumps.

## Out of scope

Public hostname, production SendGrid to real users, restoring `/api/subscribe`, inventing ACQ-05 links, GTM.

## Acceptance checklist

- [ ] HA-04 hosted BFF contract proven or blocked with owner
- [ ] Token hygiene holds on staging
- [ ] Identity failure still blocks mutation
- [ ] Kill switch restored fail-closed after tests
- [ ] HA-05 cited as out-of-repo or proven by that authority
- [ ] HA-06 proven or blocked-pending-sendgrid-authority
- [ ] Not public DOI / not production authority

## Agent prompt

~~~text
Implement only S6-E from docs/tasks/jse-s6/S6-E-staging-newsletter-e2e.md.
Run S4-G/S4-E scenarios on restricted staging with real identity. Restore the
kill switch afterwards. Do not mail real users, cut over DNS, dump tokens, or
apply Supabase DDL from this repo.
~~~
