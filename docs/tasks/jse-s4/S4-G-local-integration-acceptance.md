# S4-G — Local integration acceptance

| Field | Value |
|---|---|
| Track | S4-G |
| Type | Integration tests + build evidence |
| Depends on | S4-B, S4-C, S4-D, S4-E, S4-F `accepted` |
| Blocks | S4-H |
| Estimate | M |
| Repo | `git-ben18/jackpot-site` |

## Goal

Prove that the complete newsletter acquisition slice works as one coherent `jackpot-site` implementation using local/test-controlled dependencies. S4-G is the implementation-level integration gate before closeout.

Unlike JSE-S3's live homepage integration, S4-G is intentionally **not a hosted/live integration gate**. It must not require public Vercel deployment, real OIDC, production Supabase mutation, or real SendGrid email.

## Integration boundary

Exercise the assembled path:

```text
DOI UI
  ↓
same-origin subscribe BFF
  ↓
server transport + test workload identity
  ↓
controlled fake/fixture canonical newsletter service

confirmation page
  ↓
same-origin validate / confirm BFF
  ↓
server transport + test workload identity
  ↓
controlled fake/fixture canonical newsletter service
```

The fake/fixture service must emulate the **frozen canonical contract**, not a simplified happy-path contract invented by the target repo.

## Preconditions

Before beginning S4-G:

- S4-A contract freeze is accepted.
- S4-B DOI UI is implemented.
- S4-C BFF and sanitizer are implemented.
- S4-D workload identity caller seam is implemented locally.
- S4-E confirmation UX is implemented.
- S4-F security conclusion is `accepted` or the explicitly permitted equivalent with only hosted controls deferred.
- No unresolved issue requires a legacy persistence path or production-only workaround.

## Required integration scenarios

### Subscribe happy path

Prove:

1. visitor submits valid email + required consent/age evidence;
2. browser calls only same-origin target route;
3. BFF emits exactly the canonical backend DTO;
4. test workload identity is attached server-side only;
5. fake canonical service returns the expected non-enumerating response;
6. BFF sanitizes/maps it;
7. browser displays generic accepted/check-email-if-eligible state.

### Subscribe non-enumeration variants

Use backend fixtures representing multiple canonical internal outcomes where the public service contract intentionally returns the same generic result. Prove the browser cannot distinguish them.

### Subscribe failure variants

At minimum exercise:

- invalid browser input;
- missing consent/age evidence;
- upstream timeout;
- network failure;
- backend unauthorized/forbidden;
- rate/cooldown response if in contract;
- malformed JSON;
- unknown successful status;
- backend `5xx`;
- kill switch enabled.

All must fail safely without legacy fallback.

### Confirmation flow

Exercise:

1. confirmation page receives a test token;
2. validation uses same-origin BFF only;
3. ready-to-confirm state renders from known sanitized status;
4. confirm action invokes same-origin confirm route only;
5. success renders approved final state;
6. already-complete renders approved idempotent state;
7. invalid/unusable renders bounded state;
8. unknown/malformed response fails closed;
9. raw token never appears in logs/rendered debug output.

### Workload identity failure

Prove that when the test identity provider cannot supply identity, protected downstream mutation is not attempted and the visitor receives only a sanitized failure state.

## Repository-level guardrails

S4-G must also run active-runtime searches or tests proving:

- no browser code contains the newsletter-service hostname;
- no active target newsletter path calls `/api/subscribe`;
- no active target newsletter path writes legacy subscriber persistence;
- no service-role Supabase credential is introduced;
- no client module imports the server-only identity provider/transport;
- no fake identity can be selected in production mode;
- no real SendGrid/provider code is imported into `jackpot-site`.

Historical documentation references are acceptable when clearly non-runtime.

## Build/test evidence

Run the repository's current authoritative commands. At minimum, where scripts exist:

```text
npm test
npm run typecheck
npm run build
```

If command names differ, record the actual package scripts used. Do not invent a passing command that does not exist.

Also record:

- exact tested commit SHA;
- Node/package-manager version required by the repo;
- route inventory from the production build if available;
- test counts/results;
- expected environment variable **names only**;
- proof that no secret values were committed.

## No-network principle for S4 completion

S4-G should be able to complete with a controlled local/test newsletter-service implementation. It must not make acceptance depend on:

- Vercel project provisioning;
- public preview/staging URLs;
- production `jackpot-api-newsletter`;
- production Supabase;
- real SendGrid;
- Cloudflare DNS;
- public hostname cutover.

If the current implementation cannot be tested without one of those, treat that as a design/testability defect and remediate the seam rather than expanding S4 into Hosted Acceptance.

## Evidence output

Create `_status-S4-G.md` (or equivalent) containing:

- target SHA;
- prerequisite status references;
- integration scenario results;
- build/typecheck/test results;
- active-runtime search results;
- route inventory;
- deferred Hosted Acceptance items;
- conclusion: `accepted` or `blocked`.

## Hosted Acceptance handoff

S4-G acceptance authorizes only S4-H implementation closeout. It does **not** authorize deployment.

The future Hosted Acceptance layer will reuse S4-G scenarios against restricted staging with:

- real Vercel-issued workload identity;
- accepted staging newsletter service;
- approved staging Supabase path;
- controlled SendGrid DOI proof;
- provider/environment security evidence.

## Out of scope

- Any Vercel deployment.
- Real OIDC acceptance.
- Real newsletter subscriber creation/confirmation.
- Production/staging Supabase mutation unless separately authorized by future Hosted Acceptance.
- SendGrid delivery/webhook tests.
- Cloudflare/DNS.
- Public DOI or production authority.

## Acceptance checklist

Completed 2026-09-10 — see [`_status-S4-G.md`](./_status-S4-G.md):

- [x] Full DOI request path passes controlled local integration.
- [x] Subscribe remains non-enumerating across fixture variants.
- [x] Full confirmation validate/consume path passes controlled local integration.
- [x] Workload identity failure prevents protected downstream mutation.
- [x] All required dependency/error scenarios fail safely.
- [x] No legacy writer/fallback is reachable.
- [x] No browser direct-service path exists.
- [x] No server-secret/client boundary regression exists.
- [x] Tests/typecheck/build pass using authoritative repo commands.
- [x] Exact tested SHA and evidence are recorded.
- [x] S4-G concludes `accepted` before S4-H.
- [x] No hosted/public deployment is performed or implied.

Status: [_status-S4-G.md](./_status-S4-G.md)

## Agent prompt

```text
Implement only S4-G from docs/tasks/jse-s4/S4-G-local-integration-acceptance.md.
Exercise the complete DOI + confirmation path against controlled fixtures/fakes,
including server-only test workload identity, failure cases, security searches,
tests, typecheck, and production build. Do not deploy or call real production
newsletter/Supabase/SendGrid services.
```
