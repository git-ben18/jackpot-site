# S5-H — Implementation closeout

| Field | Value |
|---|---|
| Track | S5-H |
| Type | Docs / evidence / handoff |
| Depends on | S5-G accepted |
| Blocks | Future Hosted/Public Acceptance only; provides telemetry-contract input to DB-W4 |
| Estimate | S |
| Repo | git-ben18/jackpot-site |

## Goal

Close JSE-S5 as IMPLEMENTATION COMPLETE with evidence that the first-release public shell, approved Privacy Policy integration, consent enforcement, and bounded telemetry contract are locally accepted.

S5-H must not imply that Vercel, analytics delivery, OIDC, Supabase newsletter mutation, SendGrid, DNS, or public-site authority have been operationally accepted.

DB-W4 may remain in progress. S5-H does not require DB-W4 completion when durable telemetry persistence is explicitly deferred/disabled by the approved S5 design.

## Required closeout statement

Include this distinction prominently:

~~~text
JSE-S5 — Public Shell, Privacy & First-Release Telemetry
STATUS: IMPLEMENTATION COMPLETE

Implemented / locally accepted:
✓ intentional first-release root shell
✓ allowlisted nav/footer/global runtime
✓ approved Privacy Policy integrated at /privacy
✓ approved privacy URL/version linkage
✓ consent decisions govern optional analytics
✓ essential-only/rejected blocks optional beacons
✓ bounded first-release event taxonomy
✓ newsletter requested != newsletter confirmed
✓ token/email/PII payload hygiene
✓ telemetry failure cannot break product UX
✓ no accidental legacy tracker/session imports
✓ no legacy /api/subscribe or email_signups path
✓ no unnecessary service-role dependency
✓ tests / typecheck / production build / runtime audits

Not asserted by S5:
○ DB-W4 telemetry schema/storage decision
○ durable telemetry persistence if deferred
○ hosted analytics/provider delivery acceptance
○ Vercel staging/production deployment
○ real Vercel OIDC acceptance
○ hosted Supabase newsletter mutation acceptance
○ real SendGrid DOI/webhook acceptance
○ Cloudflare/DNS cutover
○ public DOI enablement
○ transfer of public-site authority
~~~

If S5-A selected disabled-by-default/deferred telemetry, state that explicitly. Do not use deferral wording to hide an unresolved required sink.

## Required closeout evidence

Create docs/tasks/jse-s5/_status-S5-H.md containing:

1. exact S5-G tested SHA and final merge SHA when available;
2. S5-A frozen authority baselines;
3. root shell/header/footer/provider inventory;
4. route/link allowlist and excluded globals;
5. authoritative Privacy Policy source, URL, version, and consent linkage;
6. consent state/persistence/no-beacon evidence;
7. frozen telemetry event names/versions/payload restrictions;
8. requested-vs-confirmed mapping;
9. session-identity decision;
10. transport/sink/storage status;
11. legacy tracker/acquisition/service-role/token hygiene searches;
12. S5-G tests/typecheck/build/route evidence;
13. explicit downstream/hosted deferrals.

## Provenance

Complete provenance for every source-derived shell/privacy artifact:

- source repo/path/SHA;
- source disposition;
- target path;
- reimplementation/hardening notes;
- excluded transitive dependencies;
- tests.

Do not describe SessionInit/useTracker/legacy CookieBanner as migrated if the target implemented a new consent/telemetry seam.

## DB-W4 handoff

DB-W4 can run concurrently with S5.

Newsletter migration/schema/RPC/RLS reconciliation does not wait for S5.

Only the DB-W4 telemetry-domain decision should consume accepted S5-E facts:

~~~text
event names/versions
payload schema
consent class
cardinality/dedupe
session identity decision
sink status
retention questions still open
~~~

S5 must not prescribe a Supabase table layout.

## EC-05A handoff

S5 provides frontend evidence that approved Privacy Policy linkage and consent behavior are implementation-ready. EC-05A retains its own cross-repository operational/database/provider acceptance.

## No-authority-transfer statement

S5 completion:

- does not deploy jackpot-site;
- does not make preview/staging production-authoritative;
- does not authorize production newsletter mutations;
- does not prove real OIDC or SendGrid;
- does not activate public DOI;
- does not authorize telemetry DB schema;
- does not prove hosted analytics delivery;
- does not modify DNS/Cloudflare;
- does not deauthorize current production frontend;
- does not transfer public-site authority.

## Blocker rule

S5-H must conclude blocked if:

- approved Privacy Policy URL/version/content is missing;
- rejected/essential-only still sends optional telemetry;
- requested and confirmed semantics remain conflated;
- token/email can enter telemetry;
- required event lacks bounded schema/trigger;
- unintended legacy global tracker/session dependency remains active;
- tests/build fail;
- an implementation defect is mislabeled as hosted/DB deferral.

DB-W4 incompleteness alone is not an S5-H blocker when durable persistence is explicitly deferred by approved S5 policy.

## Out of scope

DB-W4 implementation, EC-05A operational closeout, Vercel deployment, production analytics/provider acceptance, real OIDC/SendGrid, DNS/cutover, and public-site authority transfer.

## Acceptance checklist

- [ ] S5-G accepted at exact tested SHA.
- [ ] S5-A through G evidence linked.
- [ ] Shell/global-runtime inventory complete.
- [ ] Privacy page has approved non-placeholder content/URL/version.
- [ ] Consent no-beacon behavior proven.
- [ ] First-release telemetry contract frozen and locally implemented.
- [ ] Requested-vs-confirmed semantics proven.
- [ ] Email/token/PII/full-URL hygiene proven.
- [ ] Telemetry fail-soft behavior proven.
- [ ] Legacy tracker/session/acquisition guardrails pass.
- [ ] Provenance complete.
- [ ] Tests/typecheck/build evidence recorded.
- [ ] Closeout says IMPLEMENTATION COMPLETE, not production/hosted accepted.
- [ ] DB-W4/provider/hosted/cutover responsibilities explicitly deferred.
- [ ] No production change performed.

## Agent prompt

~~~text
Implement only S5-H from docs/tasks/jse-s5/S5-H-implementation-closeout.md.
Close S5 as IMPLEMENTATION COMPLETE only if S5-A..G evidence proves the public
shell, approved privacy URL/version, no-beacon consent behavior, bounded telemetry,
requested-vs-confirmed semantics, token/PII hygiene, and local tests/build.
Explicitly defer DB-W4 durable storage, hosted provider/OIDC/SendGrid, deployment,
DNS, public DOI, and public-site authority. Do not perform production changes.
~~~