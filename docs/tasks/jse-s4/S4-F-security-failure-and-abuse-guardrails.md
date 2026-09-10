# S4-F — Security, failure, and abuse guardrails

| Field | Value |
|---|---|
| Track | S4-F |
| Type | Code + tests + security evidence |
| Depends on | S4-A, S4-B, S4-C, S4-D, S4-E |
| Blocks | S4-G |
| Estimate | M |
| Repo | `git-ben18/jackpot-site` |

## Goal

Harden the assembled newsletter acquisition implementation so its browser, BFF, identity, and confirmation boundaries fail safely before local integration closeout. S4-F is the explicit security review/remediation slice for the target implementation.

S4-F does not authorize hosted deployment or production access. It prepares a security-reviewable implementation that can later enter a separately approved Hosted Acceptance layer.

## Security boundary to review

```text
Browser
  ↓
DOI / confirmation UI
  ↓
same-origin BFF
  ↓
strict DTO translation + response sanitization
  ↓
server-only workload identity
  ↓
configured newsletter-service transport
```

Review each boundary independently. Do not treat “server-side” as sufficient evidence that a path is safe.

## Required review areas

### 1. Request validation and field allowlisting

- Subscribe, validate, and confirm inputs must be schema validated.
- Reject or ignore fields only according to an explicit policy; do not forward arbitrary browser properties upstream.
- Email normalization, consent evidence, age evidence, signup-source mapping, honeypot/abuse fields, and confirmation tokens must follow the frozen contract.
- Browser input must never select the upstream URL, workload identity, database target, or provider.

### 2. Response validation and enumeration protection

- Validate upstream JSON before mapping it to browser responses.
- Unknown `2xx` payloads must fail closed.
- Subscribe must remain non-enumerating.
- Confirmation states must not expose subscriber history beyond approved product semantics.
- Do not return raw upstream messages, database errors, provider errors, OIDC errors, or stack traces.

### 3. Credential and secret boundary

Verify that browser-reachable code cannot access:

- `SUPABASE_SERVICE_ROLE_KEY`;
- SendGrid secrets;
- newsletter-service workload assertions/tokens;
- fallback service bearer credentials;
- backend-only base URLs when the architecture requires them to remain server-only.

No new secret belongs in `NEXT_PUBLIC_*`.

### 4. Legacy persistence exclusion

Search active runtime imports and routes to prove the newsletter path does not use:

- `POST /api/subscribe`;
- legacy `email_signups` writes;
- reward/access-token minting;
- legacy signup cookies/localStorage as canonical state;
- source-app fallback branches;
- generic Supabase admin/service-role helpers for newsletter acquisition.

### 5. Confirmation-token hygiene

- no token logs;
- no token analytics payloads;
- no raw token UI;
- no token in outbound links;
- bounded URL cleanup where implemented;
- no persistence beyond what the approved flow requires.

### 6. Workload-identity fail-closed behavior

- missing identity prevents protected downstream mutation attempt;
- browser-provided authorization is not reused;
- fake/test identity cannot be active silently in production mode;
- no anonymous downstream fallback;
- no permanent shared bearer fallback unless separately authorized upstream.

### 7. Timeouts and dependency failure

Define and test bounded behavior for:

- newsletter service unavailable;
- DNS/network error;
- timeout;
- malformed JSON;
- backend `401/403`;
- backend `429`/cooldown if part of the contract;
- backend `5xx`;
- missing server configuration.

Failures must not trigger a second persistence path.

### 8. Abuse-control seam

S4 must preserve the server-authoritative abuse-control model without inventing unapproved product/provider behavior.

At minimum:

- retain approved honeypot/bot fields if in contract;
- preserve a clean seam for future/approved Turnstile or equivalent server verification if required;
- ensure browser-only checks are never considered authoritative;
- do not enable public acquisition solely because client validation exists;
- document which abuse controls remain Hosted Acceptance / release prerequisites.

### 9. Kill switch and rollback behavior

Newsletter acquisition should be disableable without restoring a legacy writer. Prove the kill-switch state prevents mutation attempts and fails to a bounded user experience.

Rollback semantics for S4 are code-level only: revert target changes or disable the target acquisition path. Do not create dual canonical subscriber systems for rollback.

## Required searches / evidence

Run repository-wide active-runtime searches for at least these classes of unsafe reference:

```text
/api/subscribe
email_signups
SUPABASE_SERVICE_ROLE_KEY
getSupabaseAdminClient
NEXT_PUBLIC_*NEWSLETTER*SERVICE*
subscriber_email_hash
reward_access_token
access_token
Authorization forwarding from browser input
```

Adapt exact terms to the repository, but record search commands/results or equivalent evidence. Historical docs/provenance references may remain when clearly non-runtime.

## Required tests

Add/retain tests that prove:

1. unsupported request fields cannot cross the BFF boundary;
2. unknown/malformed backend success cannot produce browser success;
3. subscribe success remains non-enumerating;
4. no token/credential appears in logs or browser responses;
5. missing workload identity fails before protected downstream call;
6. fake identity is rejected in production mode;
7. kill switch prevents mutation request;
8. backend unavailable/timeout returns bounded safe failure;
9. no legacy persistence/fallback path is called;
10. direct browser service URL use is absent;
11. server-only modules are not imported by client components;
12. confirmation-token handling remains bounded and private.

## Security evidence output

Create `_status-S4-F.md` (or equivalent) containing:

- reviewed target SHA;
- route inventory;
- client/server boundary inventory;
- secret/env-name inventory (names only, no values);
- active-runtime search results;
- test commands/results;
- known residual risks;
- items explicitly deferred to Hosted Acceptance;
- conclusion: `accepted`, `blocked`, or `accepted-with-documented-deferred-hosted-controls`.

If blocked, do not continue to S4-G until the implementation issue is remediated or an upstream authority explicitly changes the requirement.

## Hosted Acceptance deferrals

The following may be documented as deferred, but not claimed as proven in S4-F:

- real Vercel project/environment claim validation;
- staging/production identity separation in provider configuration;
- hosted newsletter-service network reachability;
- hosted Supabase mutation path;
- real SendGrid delivery/webhook behavior;
- Cloudflare/DNS/perimeter controls;
- production secrets scope in Vercel UI;
- production public exposure.

## Out of scope

- Deploying any workload.
- Changing backend OIDC authorization policy.
- Production Supabase DDL/RLS/grants.
- SendGrid configuration/sending.
- Cloudflare/DNS.
- Product/legal decisions not already frozen.
- Public DOI enablement.

## Acceptance checklist

Completed 2026-09-10 — see [`_status-S4-F.md`](./_status-S4-F.md):

- [x] Request/response schemas and allowlists are enforced.
- [x] Non-enumeration behavior is proven.
- [x] No browser-visible/server-secret crossover exists.
- [x] Legacy newsletter persistence/fallbacks are absent from active runtime.
- [x] Confirmation tokens are handled hygienically.
- [x] Missing identity and dependency failures fail closed.
- [x] Kill switch prevents mutation without fallback.
- [x] Abuse-control boundary/deferred hosted controls are documented.
- [x] Repository security searches are recorded.
- [x] Security-focused tests pass.
- [x] S4-F conclusion is acceptable before S4-G.
- [x] No deployment/production mutation is performed.

Status: [_status-S4-F.md](./_status-S4-F.md)

## Agent prompt

```text
Implement only S4-F from docs/tasks/jse-s4/S4-F-security-failure-and-abuse-guardrails.md.
Audit and harden the complete local newsletter path: strict DTOs, sanitized
responses, secret isolation, token hygiene, fail-closed identity/dependency
behavior, kill switch, abuse seams, and no legacy persistence. Record evidence.
Do not deploy or perform production mutations.
```
