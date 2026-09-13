# S6-C — Restricted Vercel topology and isolation

| Field | Value |
|---|---|
| Track | S6-C |
| Type | Restricted hosting configuration + evidence |
| Depends on | S6-A accepted **and** readiness review `permitted`; S6-B accepted or explicitly waived by S6-A |
| Blocks | S6-D, S6-E, S6-F, S6-G |
| Estimate | L |
| Repo | git-ben18/jackpot-site |
| HA | HA-01, HA-02 |

## Goal

Stand up **restricted** Vercel staging for `jackpot-site` with preview/staging/production identity and secret isolation. Prove preview cannot perform production newsletter mutations.

This is configuration and evidence, not public-site cutover. Do not attach a production Cloudflare hostname in this packet.

If S6-A recorded readiness review as blocked, this packet must conclude blocked and must not deploy.

## Requirements

1. Named restricted staging environment (not “whatever preview CI produced”).
2. Staging env names from S6-A/B only; values stay in the provider vault — never in git.
3. `NEWSLETTER_ACQUISITION_ENABLED` fail-closed on this environment except for a documented S6-E test window.
4. Preview deployments must not receive production `NEWSLETTER_SERVICE_BASE_URL` mutation authority or production OIDC trust.
5. `NEWSLETTER_WORKLOAD_IDENTITY_MODE=fake` must be impossible to leave enabled on `VERCEL_ENV=production` (S4-D invariant; re-verify hosted config).
6. No `SUPABASE_SERVICE_ROLE_KEY` on the frontend project for ordinary rendering.
7. Record the staging URL as **restricted** (access control / noindex / non-public hostname as operators require). Do not announce it as the product site.
8. Curated public reader may use publishable/anon class keys already accepted by S3; missing config must fail-soft, not mock.

## Evidence

`docs/tasks/jse-s6/_status-S6-C.md` must include:

- project/environment names (not secrets);
- preview vs staging vs prod isolation statement;
- kill-switch state;
- SHA deployed;
- what was **not** configured (DNS cutover, public DOI, production OIDC authorization).

## Stop conditions

- Using production newsletter credentials on preview “just to test.”
- Enabling public DOI to make the form work.
- Pasting `.env` values into evidence.
- Treating this deploy as ADR-0004 cutover.

## Out of scope

Real OIDC success proof (S6-D), SendGrid E2E (S6-E), Privacy Policy authoring (S5-C), DNS cutover, deauthorizing the current production frontend.

## Acceptance checklist

- [ ] Restricted staging environment exists and is named
- [ ] Preview isolated from production mutation authority
- [ ] Kill switch fail-closed
- [ ] No service-role on the frontend project
- [ ] No secrets in git/evidence
- [ ] Readiness review still permitted at execution time
- [ ] Explicitly not public-site authority

## Agent prompt

~~~text
Implement only S6-C from docs/tasks/jse-s6/S6-C-restricted-vercel-topology.md.
Configure restricted Vercel staging with preview/prod isolation and a fail-closed
kill switch. Do not cut over DNS, enable public DOI, prove OIDC, or paste secrets.
If S6-A readiness review is blocked, conclude blocked without deploying.
~~~
