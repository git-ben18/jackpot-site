# S5-G — Local integration acceptance

| Field | Value |
|---|---|
| Track | S5-G |
| Type | Integration tests + build + privacy/security evidence |
| Depends on | S5-B, S5-C, S5-D, S5-E, S5-F accepted |
| Blocks | S5-H |
| Estimate | M |
| Repo | git-ben18/jackpot-site |

## Goal

Prove that the first-release public shell, approved privacy linkage, consent behavior, and telemetry contract operate coherently with the already implemented S3/S4 capabilities under controlled local/test dependencies.

S5-G is a local implementation gate. It does not require hosted analytics, DB-W4 telemetry persistence, or public deployment.

If S5-C remains blocked on policy authority, S5-G cannot conclude accepted.

## Required scenarios

### First visit / unknown consent

Prove:

- shell, DOI hero, and curated discovery render;
- Privacy link is available;
- no optional telemetry call occurs before consent;
- product surfaces remain usable.

### Rejected / essential-only

Prove:

- choice persists as designed;
- no optional event emits;
- curated filters/cards/source links work;
- DOI request works against controlled S4 fixture;
- confirmation works against controlled S4 fixture.

### Accepted analytics

Using controlled telemetry transport, prove exact frozen S5-E behavior for every included event:

- discovery view;
- filter click;
- card open;
- empty state if retained;
- source click;
- newsletter subscribe requested;
- newsletter subscription confirmed.

### Revocation

Prove optional events can emit while accepted, then preference changes to rejected/essential-only and subsequent optional events stop while product functionality remains unchanged.

### Telemetry failure

Force transport failure and prove:

- source link normal action still occurs;
- card/filter interaction still works;
- DOI result follows newsletter contract only;
- confirmation result follows newsletter contract only;
- no provider/internal error is exposed.

### Token hygiene

Use a controlled confirmation token and prove:

- S4 token stripping remains intact;
- token absent from event payload/fake capture;
- token-bearing full URL/referrer not forwarded;
- privacy/analytics code does not persist it.

### Privacy linkage

Prove:

- shell Privacy link resolves;
- DOI Privacy Policy link resolves;
- rendered policy version/content identifier matches S5-C;
- no scaffold/TODO remains.

## Repository guardrail searches

Record active-runtime searches for:

~~~text
SessionInit
ExploreFAB
/api/log-session
/api/log-interaction
/api/log-click
/api/subscribe
email_signups
SUPABASE_SERVICE_ROLE_KEY
getSupabaseAdminClient
subscriber_email_hash
reward_access_token
unapproved navigation routes
token-bearing telemetry
~~~

Avoid false positives from historical docs/tests.

## Build/test evidence

Run authoritative repo commands, at minimum where available:

~~~text
npm test
npm run typecheck
npm run build
~~~

Record exact tested SHA, Node/package manager version, test counts, route inventory, environment variable names only, telemetry transport mode used, and absence of secret values.

## Expected route inventory

Browser pages remain intentionally small:

~~~text
/
/privacy
/newsletter/confirm
~~~

Existing S4 same-origin BFF routes remain:

~~~text
POST /api/newsletter/subscribe
POST /api/newsletter/confirm/validate
POST /api/newsletter/confirm
~~~

Any new S5 network route requires explicit S5-A/E authority. Do not assume a telemetry route is necessary.

## No-hosted / no-DB dependency principle

S5-G must be completable without:

- Vercel deployment;
- real Vercel OIDC;
- production newsletter mutation;
- real SendGrid;
- production analytics-provider delivery;
- new Supabase telemetry schema;
- DB-W4 completion;
- Cloudflare/DNS.

Use controlled newsletter and telemetry fakes.

## Evidence output

Create docs/tasks/jse-s5/_status-S5-G.md with tested SHA, prerequisite references, scenario table, fake event captures with sensitive values absent, privacy version/linkage evidence, guardrail searches, test/typecheck/build results, route inventory, deferred hosted/provider/DB items, and accepted/blocked conclusion.

## Acceptance checklist

- [ ] First visit emits no premature optional telemetry.
- [ ] Rejected analytics emits no optional telemetry.
- [ ] Product UX works with analytics rejected.
- [ ] Accepted analytics emits only S5-E events.
- [ ] Revocation stops future optional events.
- [ ] Telemetry failure is nonblocking.
- [ ] Requested vs confirmed newsletter semantics correct.
- [ ] Confirmation token/full token URL never enter telemetry.
- [ ] Privacy page/link/version approved and non-placeholder.
- [ ] Shell contains only accepted routes/global behavior.
- [ ] Guardrail searches pass.
- [ ] Tests/typecheck/build pass at recorded SHA.
- [ ] DB-W4 or hosted provider work is not required for local acceptance.

## Agent prompt

~~~text
Implement only S5-G from docs/tasks/jse-s5/S5-G-local-integration-acceptance.md.
Exercise the complete local shell/privacy/consent/telemetry path with S3/S4 using
controlled newsletter and telemetry fakes. Prove no-beacon rejection, revocation,
requested-vs-confirmed semantics, token hygiene, fail-soft telemetry, guardrail
searches, tests, typecheck, and build. Do not deploy or call production services.
~~~