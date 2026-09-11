# S5-E — First-release telemetry contract

| Field | Value |
|---|---|
| Track | S5-E |
| Type | Contract / analysis / tests |
| Depends on | S5-A |
| Blocks | S5-F, S5-G; provides telemetry-contract input to DB-W4 |
| Estimate | M |
| Repo | git-ben18/jackpot-site |

## Goal

Freeze a small, privacy-minimized, consent-aware telemetry contract before writing provider/network implementation.

S5-E defines meaning: event names, triggers, payload allowlists, dedupe semantics, consent class, prohibited data, and failure behavior.

It must not choose a database schema by accident.

DB-W4 may proceed concurrently on newsletter migration/RPC/RLS work. Its telemetry-domain decision should consume the accepted S5-E contract rather than recreate legacy log tables by default.

## Candidate event set

Start from JSE-001:

~~~text
curated_promo_discovery_view
curated_promo_filter_click
curated_promo_card_open
curated_promo_empty_state_view
curated_promo_source_click
newsletter_subscribe_requested
newsletter_subscription_confirmed
~~~

S5-A may narrow the set. Do not expand it without newer product/measurement authority.

## Required contract artifact

Create docs/tasks/jse-s5/s5-telemetry-contract.md.

For every event define:

- fixed event name;
- schema/version;
- business question;
- exact trigger;
- consent class;
- allowed payload keys/types/enums;
- prohibited payload/data;
- dedupe/once semantics;
- source route/component;
- failure behavior;
- sink status: approved, disabled-by-default, or deferred.

## Newsletter semantics

newsletter_subscribe_requested must not mean “submit button clicked.”

Preferred meaning:

~~~text
same-origin subscribe BFF returned the approved browser-safe accepted/requested outcome
~~~

It means the acquisition service accepted a request for processing under its non-enumerating contract. It does not prove insert, eligibility, email delivery, or confirmation.

Never include email or email hash.

newsletter_subscription_confirmed must map only to the approved S4 confirmation terminal state. Inspect the exact S4 vocabulary and decide:

- which status represents new confirmation;
- treatment of already-complete/idempotent outcomes;
- repeated page-visit behavior;
- dedupe/once behavior.

Never include confirmation token.

## Curated-discovery semantics

Define:

- discovery view: exact mount/render condition and once behavior;
- empty-state view: distinguish initial no-data vs filter-empty only with a bounded enum if needed;
- filter click: bounded filter name/value vocabulary;
- card open: minimal public identifier/category fields only;
- source click: bounded action metadata; do not forward arbitrary full URLs/query strings.

Do not serialize entire promo objects into analytics.

## Global prohibited data

Unless newer authority explicitly approves a specific field, prohibit:

~~~text
email
email hash
confirmation token
authorization/workload token
raw URL query or fragment
raw referrer
full backend error body
service/database credentials
arbitrary free-form metadata
legacy reward/access token
~~~

Session identity is omitted by default. Add it only if S5-A recorded a concrete first-release measurement need and privacy treatment.

## Consent and failure requirements

All optional events must obey S5-D. Unknown/rejected consent means no event transport call.

Telemetry failure must never change:

- curated UI behavior;
- source-link behavior;
- DOI request result;
- confirmation result;
- page availability.

## DB-W4 handoff

S5-E provides DB-W4 only application contract facts:

~~~text
event names + versions
payload schemas
consent class
cardinality/dedupe
identity decision
sink status
open retention questions
~~~

S5-E does not define Supabase tables, RPCs, grants, RLS, SECURITY DEFINER functions, retention jobs, or warehouse models.

## Required tests/evidence

Create contract-focused tests or static assertions proving:

- event-name allowlist is closed;
- payload fields are bounded;
- prohibited sensitive fields are absent;
- requested and confirmed meanings are distinct;
- session identity decision matches S5-A;
- no full URL/referrer/raw error field exists in the contract.

## Evidence output

Create docs/tasks/jse-s5/_status-S5-E.md with target SHA, frozen event list, contract artifact path, per-event business question/trigger summary, consent class, prohibited-data policy, identity decision, sink status, DB-W4 handoff, tests, and accepted/blocked conclusion.

## Stop conditions

Stop rather than invent if:

- an event has no concrete business question;
- requested and confirmed semantics cannot be mapped to S4 states;
- a proposed field contains email/token/raw URL/referrer without explicit authority;
- a stable session identity is requested without a measurement requirement;
- implementation pressure is used to justify legacy click/session tables;
- completing the contract appears to require DB schema design.

## Out of scope

Provider implementation, database persistence, provider dashboards, BI/reporting, hosted delivery proof, DB migrations, deployment, and public authority transfer.

## Acceptance checklist

- [ ] Event list is frozen and minimal.
- [ ] Every event has exact trigger and business question.
- [ ] Payload schemas are allowlisted and bounded.
- [ ] Requested != confirmed semantics are explicit.
- [ ] Email/token/raw URL/referrer are prohibited.
- [ ] Session identity decision explicit.
- [ ] Consent class defined per event.
- [ ] Failure behavior is nonblocking.
- [ ] DB-W4 handoff contains contract facts, not schema design.
- [ ] Contract tests/assertions pass.

## Agent prompt

~~~text
Implement only S5-E from docs/tasks/jse-s5/S5-E-first-release-telemetry-contract.md.
Freeze the minimal first-release event taxonomy, triggers, consent classes,
payload allowlists, prohibited data, dedupe semantics, and requested-vs-confirmed
meaning. Produce s5-telemetry-contract.md. Do not design telemetry tables/RPCs/
RLS or copy legacy session/click logging. This contract feeds DB-W4 telemetry design.
~~~