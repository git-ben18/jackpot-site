# S6-E — Controlled hosted newsletter and provider preflight

| Field | Value |
|---|---|
| Track | S6-E |
| Type | Restricted hosted preflight + cross-repo evidence |
| Depends on | S6-D accepted for the staging pair; EB-05/EB-06 execution permitted |
| Blocks | S6-G/H |
| HA | HA-04, HA-05, HA-06 |

## Goal

Prove the real hosted acquisition path in a controlled acceptance environment before ACQ-06:

```text
browser
→ same-origin jackpot-site BFF
→ accepted workload identity
→ jackpot-api-newsletter
→ accepted Supabase newsletter persistence path
→ controlled SendGrid/provider delivery
→ staging confirmation UX
→ validate / explicit consume
```

This is **not ACQ-06** and must not be described as the final public DOI E2E. It is the production-readiness preflight that ensures ACQ-06 is not discovering basic runtime failures for the first time.

## HA-04 rule

Prove the hosted BFF/newsletter contract with expected success and bounded failure behavior. Browser response remains non-enumerating where required, and upstream bodies/stacks do not leak.

## HA-05 rule

HA-05 cannot be accepted merely because the proof belongs to another repository.

Require an accepted EB-05 or equivalent authoritative record bound to:

- exact newsletter backend SHA;
- acceptance environment;
- existing Supabase project/DB authority;
- bounded begin/validate/consume persistence calls;
- action-limit path;
- transactional ledger/provider event path as applicable;
- failure-path evidence;
- confirmation that no second migration authority was introduced.

The site packet cites that accepted evidence. If it does not exist, HA-05 is `not-satisfied` and S6-H is blocked.

## HA-06 / provider rule

Use real provider delivery only under an authorized controlled window and controlled mailbox/address set.

Record:

- provider authority/window;
- exact environment pair;
- request/correlation identifier where safely available;
- provider message/event identifiers without exposing tokens/PII;
- confirmation-page load;
- validate result;
- explicit consume result;
- provider/webhook outcome where EB-06 requires it.

Do not send to real users.

## Acceptance-data handling

Define before execution:

- controlled test mailbox/address ownership;
- test-record labeling;
- exclusion from campaign/live-send audiences;
- retention/cleanup policy;
- whether test subscriber rows remain for audit evidence;
- prohibition on copying raw email/token values into docs.

## Kill-switch rule

Enable acquisition only for the controlled staging window. Restore fail-closed immediately after. Record start/end and restore proof.

## Required scenarios

At minimum:

- subscribe happy path;
- non-enumeration;
- duplicate/resend behavior applicable to current backend contract;
- validate → ready → consume;
- already-complete / invalid / replay behavior;
- missing/wrong identity denied before mutation;
- backend timeout/unavailable response bounded;
- token stripped from URL after use and absent from logs/telemetry/evidence.

## Evidence output

Create `docs/tasks/jse-s6/_status-S6-E.md` with:

- exact frontend/backend SHAs;
- controlled environment names;
- HA-04 result;
- exact HA-05 authoritative evidence reference;
- HA-06/provider preflight result;
- acceptance-data handling record;
- kill-switch restore proof;
- safe correlation identifiers where available;
- packet execution conclusion + acceptance contributions.

## Acceptance checklist

- [ ] HA-04 positive hosted contract proven
- [ ] HA-04 bounded failure/non-enumeration proven
- [ ] HA-05 backed by accepted EB-05/DB evidence, not citation-only
- [ ] Controlled provider preflight proven
- [ ] Test-data ownership/retention/exclusion defined
- [ ] Confirmation lifecycle proven
- [ ] Identity failure blocks mutation
- [ ] Token/PII hygiene holds
- [ ] Kill switch restored
- [ ] Explicitly distinguished from ACQ-06
