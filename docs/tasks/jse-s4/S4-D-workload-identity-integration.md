# S4-D — Workload identity integration

| Field | Value |
|---|---|
| Track | S4-D |
| Type | Code + security contract tests |
| Depends on | S4-A, S4-C |
| Blocks | S4-G |
| Estimate | M |
| Repo | `git-ben18/jackpot-site` |

## Goal

Implement the **caller-side** workload-identity integration that the `jackpot-site` BFF will use when calling `jackpot-api-newsletter`, without requiring hosted Vercel acceptance to close S4.

ADR-0003/ADR-0004 select Vercel OIDC as the primary production design. S4-D implements the server-only identity acquisition/attachment boundary and proves its local/static security behavior. Actual Vercel-issued identity, project/environment authorization, and hosted end-to-end acceptance are deferred to the future Hosted Acceptance layer and the backend hosted-runtime authority.

## Core distinction

S4-D may conclude:

```text
OIDC caller integration code: IMPLEMENTED
server-only credential boundary: VERIFIED LOCALLY
missing/invalid identity failure path: TESTED
```

S4-D must **not** conclude:

```text
Vercel OIDC: OPERATIONALLY ACCEPTED
production jackpot-site identity: AUTHORIZED
production newsletter routes: PROVEN
```

Those claims require hosted evidence.

## Target boundary

```text
BFF route
  ↓
newsletter-service transport
  ↓
workload identity provider
  ↓
Authorization / identity assertion
  ↓
jackpot-api-newsletter
```

Browser code must never participate in identity acquisition or attachment.

## Implementation requirements

1. Create a narrow server-only workload identity provider/adapter used by the newsletter-service transport.
2. Keep all identity acquisition imports below a server-only module boundary.
3. Ensure browser/client components cannot import the identity provider through shared barrels.
4. Implement the outbound attachment point required by the frozen backend workload-auth contract.
5. Do not accept workload credentials/tokens from browser request bodies, query strings, cookies, or arbitrary headers forwarded from the browser.
6. Fail closed when required workload identity cannot be acquired for a protected newsletter-service call.
7. Separate identity acquisition from canonical newsletter DTO translation so S4-C remains testable independently.
8. Support local contract testing with a fake/test identity provider. A test provider may issue deterministic fake assertions for local tests but must be impossible to enable silently in production.
9. If local development requires an alternate non-production strategy, document it explicitly. Do not introduce a permanent shared bearer credential merely for local convenience.
10. A long-lived shared bearer token remains fallback-only if an upstream accepted decision records an actual Vercel OIDC incompatibility. S4-D must not preemptively add one.
11. No workload identity material may use a `NEXT_PUBLIC_*` environment variable.
12. Never log full assertions/tokens. Diagnostic logs may identify bounded auth state such as `identity_unavailable` without credential contents.

## Production-mode guardrails

Add tests or code assertions that ensure production mode cannot silently use:

- a fake/test identity provider;
- anonymous downstream calls to protected newsletter routes;
- browser-provided authorization material;
- an unapproved fallback shared secret;
- a hard-coded service credential.

If the implementation cannot determine a safe production identity mode without hosted configuration, fail closed rather than permit anonymous mutation calls.

## Environment contract

Document names and purpose only. Do not commit values.

The environment contract should distinguish:

- server-only newsletter-service base URL;
- any Vercel-provided identity metadata/config required by the selected library/runtime;
- local/test-only switches, if any;
- production prohibition on fake identity.

Do not place server secrets or identity material in `.env.example` values; list variable names/placeholders only.

## Required tests

At minimum prove:

1. protected downstream calls request workload identity through the server-only provider;
2. acquired identity is attached only by the server transport;
3. missing identity fails before the transport sends a protected mutation request;
4. browser `Authorization` or identity-like headers are not reused as downstream workload authority;
5. fake/test identity works only in explicit test/local configuration;
6. production mode rejects fake identity configuration;
7. token/assertion material is absent from logs and browser responses;
8. no `NEXT_PUBLIC_*` secret/identity variable is required;
9. no service-role Supabase key is introduced as a substitute for newsletter-service workload auth;
10. no long-lived fallback bearer secret is introduced without an explicit accepted upstream decision.

## Backend coordination note

`jackpot-api-newsletter` owns verification of the Vercel issuer/team/project/environment/audience policy and hosted authorization acceptance. If S4-D discovers that the frozen backend contract is missing or ambiguous, stop and create a bounded backend contract/document task in that repository rather than inventing verification policy in `jackpot-site`.

## Evidence / deliverables

- Server-only workload identity adapter/provider.
- Integration into the S4-C transport seam.
- Local/fake identity test adapter if needed.
- Production-mode guardrails.
- Security-focused tests.
- Environment-variable inventory with names only.
- `_status-S4-D.md` or equivalent evidence distinguishing implemented vs hosted-accepted.

## Hosted Acceptance handoff

Record these as explicit downstream requirements, not S4 exit criteria:

- restricted Vercel staging project/environment exists;
- staging `jackpot-site` receives real Vercel workload identity;
- staging `jackpot-api-newsletter` verifies expected project/environment claims;
- wrong/missing identity is rejected before newsletter side effects;
- preview/staging/production identities remain separated;
- production authorization is not granted merely because S4-D code exists.

## Out of scope

- Provisioning Vercel projects.
- Configuring production or staging authorization policy in the backend.
- Proving real Vercel-issued tokens.
- Production newsletter-service calls.
- Supabase changes.
- SendGrid sends.
- Cloudflare/DNS.
- Public DOI enablement or authority transfer.

## Acceptance checklist

Completed 2026-09-10 on S4-C lineage — see [`_status-S4-D.md`](./_status-S4-D.md):

- [x] Workload identity integration exists only on the server side.
- [x] Protected downstream requests fail closed when identity is unavailable.
- [x] Browser-provided auth material cannot become downstream workload authority.
- [x] Test/fake identity is impossible to use silently in production.
- [x] No permanent fallback bearer token is introduced without accepted upstream approval.
- [x] No identity/token material is logged or returned to browsers.
- [x] No `NEXT_PUBLIC_*` credential dependency exists.
- [x] Integration is locally/static tested.
- [x] Evidence explicitly says operational Vercel OIDC is deferred to Hosted Acceptance.
- [x] No deployment is required/performed.

Status: [_status-S4-D.md](./_status-S4-D.md)

## Agent prompt

```text
Implement only S4-D from docs/tasks/jse-s4/S4-D-workload-identity-integration.md.
Add the server-only caller identity seam and fail-closed transport integration for
Vercel OIDC, with local/fake contract tests only. Do not provision Vercel,
authorize production workloads, add a fallback bearer secret, or claim hosted
OIDC acceptance.
```
