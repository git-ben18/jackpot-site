# S5-F — Telemetry implementation and guardrails

| Field | Value |
|---|---|
| Track | S5-F |
| Type | Code + tests + privacy/security evidence |
| Depends on | S5-D and S5-E accepted |
| Blocks | S5-G |
| Estimate | M |
| Repo | git-ben18/jackpot-site |

## Goal

Implement only the accepted S5-E event contract through the S5-D consent gate using a narrow, fail-soft application telemetry seam.

S5-F is not blocked by DB-W4 merely because durable telemetry storage is undecided. Local implementation and acceptance may use a controlled fake/no-op or other S5-A-approved storage-independent transport.

If a production sink requires new telemetry schema, RPCs, grants, RLS, SECURITY DEFINER functions, retention rules, or persistent identity, stop only that sink work and mark it BLOCKED-DB-W4.

## Architecture requirements

Centralize telemetry behind a typed/validated seam. Equivalent designs are acceptable, but callers should conceptually use one API:

~~~text
emitApprovedEvent(eventName, approvedPayload)
  -> validate event + payload
  -> check S5-D consent
  -> call configured transport
  -> swallow/report bounded transport failure without affecting product action
~~~

Do not let feature components call legacy logging routes directly.

## Transport rules

- fake/no-op transport is acceptable for local S5 acceptance;
- disabled sink must be explicit, not silently misconfigured;
- a provider-specific transport may be implemented only if approved by S5-A/E and it does not invent DB/provider policy;
- no generic “metadata” bag;
- no arbitrary caller-supplied event name;
- no direct browser Supabase service-role;
- no database migration from jackpot-site.

## Required instrumentation

Wire only frozen S5-E events.

Newsletter:

- requested fires only on the S5-E-approved accepted/requested state;
- it must not fire on button click, client validation failure, or BFF failure;
- confirmed fires only on the S5-E-approved confirmation terminal state;
- already-complete behavior follows S5-E;
- no email/hash/token.

Curated discovery:

- respect view once semantics;
- bounded filter payload;
- bounded card-open payload;
- bounded empty-state reason if approved;
- source click contains only approved bounded metadata;
- no entire promo object or full unsafe URL.

## Consent requirements

- unknown/rejected -> zero optional transport calls;
- accepted -> only S5-E events;
- revocation -> future optional calls suppressed;
- do not cache pre-consent token/page context for replay.

## Security/privacy guardrails

Prohibit from payload/logging:

~~~text
email or email hash
confirmation token
OIDC/workload credential
raw authorization header
full token-bearing URL
raw referrer
backend error body
service-role credential
legacy access/reward token
~~~

Telemetry exceptions must not expose those values either.

## Failure behavior

Test transport throw, reject/timeout, disabled sink, invalid event, invalid payload, unknown/rejected consent, and revocation. In every case the primary feature must preserve its own result.

## Legacy exclusion audit

Record active-runtime searches for:

~~~text
SessionInit
/api/log-session
/api/log-interaction
/api/log-click
useTracker
logEmailSignup
session_logs
interaction_logs
click_logs
SUPABASE_SERVICE_ROLE_KEY
/api/subscribe
email_signups
subscriber_email_hash
reward_access_token
~~~

Historical docs references may remain. Active reuse requires explicit S5-A/E authority.

## Required tests

At minimum:

1. rejected/unknown consent -> zero transport calls;
2. accepted -> approved event + approved payload only;
3. revoked -> later event suppressed;
4. unknown event rejected;
5. extra payload fields rejected/stripped according to contract;
6. email/hash/token absent;
7. full URL/referrer absent;
8. requested event trigger correct;
9. confirmed event trigger correct;
10. curated event semantics correct;
11. transport failure never changes product outcome;
12. no legacy tracker/session route active by default;
13. fake/no-op or disabled sink is explicit.

## Evidence output

Create docs/tasks/jse-s5/_status-S5-F.md with target SHA, event/consent contract references, implementation paths, transport/sink status, active-runtime search evidence, prohibited-data audit, tests, any BLOCKED-DB-W4 sink item, hosted/provider residuals, and accepted/blocked conclusion.

Accepted-with-provider-activation-deferred is permissible only when S5-A explicitly allows a disabled/deferred production sink and all application behavior is complete.

## Out of scope

New telemetry DB schema, migration of legacy log tables, provider billing/admin setup, BI/reporting, production deployment, hosted delivery acceptance, ad targeting/session replay, and DNS/cutover.

## Acceptance checklist

- [ ] Typed/validated telemetry seam exists.
- [ ] Optional events gated by S5-D.
- [ ] Only S5-E events can emit.
- [ ] Payloads bounded.
- [ ] Requested/confirmed instrumentation correct.
- [ ] Email/hash/token/full URL/referrer excluded.
- [ ] Telemetry failure nonblocking.
- [ ] Legacy tracker/session implementations absent unless approved.
- [ ] No service-role or telemetry DB migration introduced.
- [ ] Tests/security searches pass.
- [ ] DB-W4-only sink dependencies identified without blocking unrelated S5 work.

## Agent prompt

~~~text
Implement only S5-F from docs/tasks/jse-s5/S5-F-telemetry-implementation-guardrails.md.
Wire only S5-E events through S5-D consent and a narrow fail-soft transport.
Enforce payload allowlists and token/email/URL hygiene and instrument requested
vs confirmed correctly. Use fake/no-op storage-independent transport when needed.
Do not invent DB schema, copy legacy trackers, or deploy.
~~~