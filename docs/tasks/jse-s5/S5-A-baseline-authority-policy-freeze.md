# S5-A — Baseline, authority, and policy freeze

| Field | Value |
|---|---|
| Track | S5-A |
| Type | Docs / analysis / contract inventory |
| Depends on | S4-H merged; DB-W3-F/G closed or explicit program exception |
| Blocks | S5-B, S5-C, S5-D, S5-E |
| Estimate | M |
| Repo | git-ben18/jackpot-site |

## Goal

Freeze the JSE-S5 starting point before runtime changes. S5-A establishes the accepted target lineage, public-shell allowlist, Privacy Policy authority, consent policy boundary, and first-release telemetry measurement contract inputs.

S5-A must prevent later agents from resolving product, legal, or data-boundary ambiguity through implementation guesses.

JSE-S5 does not depend on DB-W4 completion. DB-W4 may proceed concurrently. Only work that requires durable telemetry database objects is blocked on DB-W4.

## Required authority freeze

Record exact SHAs inspected for:

1. jackpot-site
   - accepted main descendant containing S3-H and merged S4-H;
   - current layout, homepage, privacy route, confirmation route;
   - S3/S4 closeout evidence;
   - current route, dependency, and environment inventory.
2. jackpot-news
   - ADR-0003;
   - ADR-0004;
   - EC-05A signup/confirmation product decisions;
   - current ACQ-05 privacy-linkage guidance;
   - any newer accepted analytics/privacy decision.
3. rewards-maxxing-frontend
   - JSE-001 extraction architecture;
   - JSE-003 source extraction handoff, especially shell/privacy/analytics dispositions.
4. DB-W3 closeout authority
   - only the accepted public-read contract required by S3;
   - do not reopen DB-W3 migration scope.

Historical planning SHAs are not execution-time authority. Re-freeze the current values when this task runs.

## Shell analysis

Inventory every root/global dependency reachable from src/app/layout.tsx:

- header/footer/global providers;
- linked routes;
- cookies/localStorage keys;
- global network calls;
- analytics/session side effects;
- environment names;
- client/server boundary;
- source provenance/disposition.

Classify each dependency as KEEP, REIMPLEMENT, ADD, EXCLUDE, DEFER, or BLOCKED-PENDING-AUTHORITY.

Default first-release route-visible shell unless newer authority overrides it:

~~~text
Primary navigation:
  /
  /privacy

Flow-only:
  /newsletter/confirm

Excluded unless explicitly approved:
  /discover-offers
  /newsletter artifact/history
  /dashboard
  /blog
  /terms
  Explore FAB/drawer
~~~

Do not create dead navigation.

## Footer acquisition decision

JSE-003 leaves footer DOI placement unresolved. Record one approved choice:

~~~text
homepage-only DOI
homepage + footer DOI
~~~

Safe default is homepage-only DOI. Do not infer footer signup from the legacy frontend.

## Privacy authority analysis

Record:

- approved Privacy Policy source;
- final production route/URL;
- immutable privacy-policy version;
- approved operator/business identity when required;
- approved public contact method when required;
- actual first-release data-processing categories;
- provider/cookie/analytics statements that must match S5-D/E;
- whether Terms is required.

Record the ACQ-05 state explicitly:

~~~text
final privacy URL: approved value or BLOCKED
privacy policy version: approved value or BLOCKED
policy content authority: repo/path/SHA or BLOCKED
consent policy version: approved current value
consent -> privacy linkage: approved mechanism or BLOCKED
decision owner: upstream authority, not invented
~~~

Missing required values block S5-C acceptance. Do not substitute placeholders.

## Telemetry analysis

For every proposed event define:

- business question/KPI;
- exact trigger;
- consent class;
- allowed payload fields;
- prohibited payload fields;
- dedupe semantics;
- source component/page;
- session/user identity need;
- sink status: approved, disabled-by-default, or deferred.

Initial candidate set from JSE-001:

~~~text
curated_promo_discovery_view
curated_promo_filter_click
curated_promo_card_open
curated_promo_empty_state_view
curated_promo_source_click
newsletter_subscribe_requested
newsletter_subscription_confirmed
~~~

Do not expand this list merely because legacy telemetry has additional events.

## DB-W4 concurrency rule

S5 owns application event semantics, consent gating, payload allowlisting, a nonblocking emission seam, and local acceptance.

S5 does not automatically own:

- telemetry tables/schemas;
- migration of session_logs, click_logs, or interaction_logs;
- telemetry RPCs;
- grants/RLS;
- SECURITY DEFINER strategy;
- durable retention;
- persistent session/user identity;
- BI/warehouse modeling.

If a production sink requires any of those, mark only that work BLOCKED-DB-W4. S5-E should become an input to DB-W4 telemetry design.

## Evidence output

Create docs/tasks/jse-s5/_status-S5-A.md with:

- frozen SHAs;
- route/global-runtime inventory;
- shell allowlist;
- footer DOI decision;
- ACQ-05 status;
- consent policy decision;
- telemetry candidate decisions;
- DB-W4 boundary;
- unresolved decisions and owners;
- conclusion accepted or blocked.

## Stop conditions

Stop rather than invent if:

- accepted S4-H lineage is unclear;
- privacy URL/version/content authority is missing for S5-C;
- proposed navigation requires unapproved routes;
- an agent proposes copying SessionInit or generic legacy trackers;
- a session identifier is proposed without a measurement requirement;
- telemetry work requires unapproved DB schema/grant/RLS changes;
- hosted deployment/provider configuration is treated as necessary for this task.

## Out of scope

Runtime shell implementation, legal-text invention, consent UI, telemetry transport, Supabase DDL, provider configuration, Vercel deployment, DNS, and production authority transfer.

## Acceptance checklist

- [ ] Accepted S5 start SHA and upstream authority SHAs recorded.
- [ ] Shell/global-runtime inventory complete.
- [ ] First-release route allowlist frozen.
- [ ] Footer DOI placement decided or explicitly blocked.
- [ ] Privacy URL/version/content authority recorded or S5-C blocked.
- [ ] Consent policy boundary recorded.
- [ ] First-release telemetry questions/candidates frozen.
- [ ] Session identity decision explicit.
- [ ] DB-W4 concurrency boundary recorded.
- [ ] No runtime or production changes performed.

## Agent prompt

~~~text
Implement only S5-A from docs/tasks/jse-s5/S5-A-baseline-authority-policy-freeze.md.
Freeze the accepted target/upstream SHAs, root/global runtime inventory, route
allowlist, ACQ-05 privacy authority, consent policy, telemetry measurement
questions, and DB-W4 boundary. Do not invent legal values, copy runtime
components, create telemetry DB objects, deploy, or configure providers.
~~~